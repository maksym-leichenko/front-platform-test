/* eslint-disable newline-per-chained-call */

const NODE_MODULES = 'node_modules';
const PACKAGE_JSON = 'package.json';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const findDown = require('finddown-sync');

const rootDir = require('../utils').getRootDir();

const { Logout } = require('../command-types');

const rootPackageJson = require(path.join(rootDir, PACKAGE_JSON));

const toRelativePath = (dir) => dir.slice(rootDir.length);

const getAllNodeModulesEntries = (dirPattern) => {
  const pathPattern = path.join(rootDir, dirPattern);

  try {
    if (pathPattern.endsWith('*')) {
      const dirPath = pathPattern.slice(0, -1);
      return fs
        .readdirSync(dirPath)
        .map((name) => path.join(dirPath, name, NODE_MODULES));
    }

    return [path.join(pathPattern, NODE_MODULES)];
  } catch (ex) {
    // If a path does not exist then return nothing.
    return [];
  }
};

// List of all node_modules in workspaces plus the root one (last item).
const allNodeModules = _
  .chain(rootPackageJson.workspaces.concat('')) // '' stands for the root "node_modules" dir.
  .map(getAllNodeModulesEntries)
  .flatten()
  .value();

const rootNodeModules = allNodeModules[allNodeModules.length - 1];

const repoToPackage = ({ dir, packageName }) => {
  const { name, workspaces } = fs.readJsonSync(path.join(dir, PACKAGE_JSON));

  // If current package is a monorepo.
  if (Array.isArray(workspaces) && workspaces.length > 0) {
    return workspaces
      .map((workspace) => {
        const wDir = path.resolve(dir, workspace);

        if (wDir.endsWith('*')) {
          return wDir
            .split(path.sep)
            .filter((value, index, arr) => index < arr.length - 1)
            .join(path.sep);
        }

        return wDir;
      })
      .flatMap((wDir) => {
        const pckgDirNames = fs.readdirSync(wDir);
        return pckgDirNames.map((pckgDirName) => path.join(wDir, pckgDirName));
      })
      .map((pckgDir) => {
        try {
          const wPckg = fs.readJsonSync(path.join(pckgDir, PACKAGE_JSON));
          return {
            name: wPckg.name,
            dir: pckgDir,
          };
        } catch (ex) {
          return null;
        }
      })
      .filter(Boolean);
  }

  return { name, dir };
};

const link = (nodeModuleDir, pckg) => {
  fs[process.env.CI_ENV ? 'copySync' : 'symlinkSync'](pckg.dir, path.join(nodeModuleDir, pckg.name));
};

module.exports = ({ repos, logger }) => ({
  command: 'link',
  desc: 'link cloned repos',
  builder: {
    logout: Logout(),
  },
  handler: () => {
    logger.verbose(() => {
      logger
        .header('"node_module" folders that were found:')
        .newLine()
        .text(allNodeModules.map(toRelativePath).join('\n'))
        .newLine()
        .newLine();
    });

    _(repos)
      .filter('exists')
      .flatMap((repo) => {
        try {
          return repoToPackage(repo);
        } catch (ex) {
          return null;
        }
      })
      .filter(Boolean)
      .forEach((pckg) => {
        const rootPath = path.join(rootNodeModules, pckg.name);
        fs.removeSync(rootPath);
        link(rootNodeModules, pckg);
        logger.info(`linked ${pckg.name}`).newLine();

        allNodeModules.forEach((nodeModuleDir) => {
          const pckgPath = path.join(nodeModuleDir, pckg.name);
          const relativePckgPath = toRelativePath(pckgPath);
          const exists = fs.existsSync(pckgPath);
          if (!exists) {
            return logger.verbose(() => {
              logger.text('Couldn\'t find ').text(relativePckgPath).newLine();
            });
          }
          const stats = fs.lstatSync(pckgPath);
          if (stats.isSymbolicLink()) {
            fs.unlinkSync(pckgPath);
            logger.verbose(() => {
              logger
                .text('Removed previous symlink ')
                .text(relativePckgPath)
                .newLine();
            });
            link(nodeModuleDir, pckg);
            logger.info(`linked ${pckg.name}`).newLine();
          } else {
            fs.removeSync(pckgPath);
            logger.verbose(() => {
              logger
                .text('Removed folder ')
                .text(relativePckgPath)
                .newLine();
            });
            link(nodeModuleDir, pckg);
            logger.info(`linked ${pckg.name}`).newLine();
          }

          return undefined;
        });
      });
  },
});
