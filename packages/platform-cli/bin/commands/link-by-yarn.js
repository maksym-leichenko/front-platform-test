const PACKAGE_JSON = 'package.json';
const BACKUP = '.asp-backup';
const YARN_LOCK = 'yarn.lock';
const REPOS_WORKSPACE = 'repos/*';

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');

const {
  getRootDir, getAllWorkspaces, getAllNodeModules, getAllPackageJsons,
} = require('../utils');

const { run } = require('../../lib/child-process');
const { Logout } = require('../command-types');

const rootDir = getRootDir();

const rootPackageJsonPath = path.join(rootDir, PACKAGE_JSON);
const rootPackageJson = require(rootPackageJsonPath);

const allWorkspaces = getAllWorkspaces(rootDir);
const allNodeModules = getAllNodeModules(allWorkspaces);
const allPackageJsons = getAllPackageJsons(allWorkspaces);

const removePackageFromNodeModules = (pckg) => {
  allNodeModules.forEach((nodeModuleDir) => {
    const pckgPath = path.join(nodeModuleDir, pckg.name);
    if (fs.existsSync(pckgPath)) {
      const stats = fs.lstatSync(pckgPath);

      return stats.isSymbolicLink() ? fs.unlinkSync(pckgPath) : fs.removeSync(pckgPath);
    }
    return undefined;
  });

  return pckg;
};

const repoToPackage = ({ dir }) => {
  try {
    const { name, version } = require(path.join(dir, PACKAGE_JSON));
    return { name, dir, version };
  } catch (ex) {
    return undefined;
  }
};

const makeBackups = (filePath) => {
  fs.copySync(filePath, filePath + BACKUP);

  return filePath;
};

const writeJSON = (filePath, obj) => fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));

const prepareYarn = () => {
  makeBackups(path.join(rootDir, YARN_LOCK));
  writeJSON(rootPackageJsonPath, {
    ...rootPackageJson,
    workspaces: [
      ...rootPackageJson.workspaces,
      REPOS_WORKSPACE,
    ],
  });
};

const revertBackup = (loc) => {
  const backupLoc = loc + BACKUP;
  if (fs.existsSync(backupLoc)) {
    fs.removeSync(loc);
    fs.renameSync(backupLoc, loc);
  }
};

module.exports = ({ repos }) => ({
  command: 'link-by-yarn',
  desc: 'make preparations for proper linking of local repos',
  builder: {
    logout: Logout(),
  },
  handler: async () => {
    const deps = _
      .chain(repos)
      .filter('exists')
      .map(repoToPackage)
      .filter(Boolean)
      .map(removePackageFromNodeModules)
      .value();

    if (deps.length === 0) {
      return;
    }

    allPackageJsons
      .map(makeBackups)
      .map((loc) => [
        loc, JSON.parse(fs.readFileSync(loc)),
      ])
      .map(([loc, json]) => [
        loc,
        deps.reduce((acc, { name, version }) => {
          if (json.dependencies && json.dependencies[name]) {
            return _.set(acc, `dependencies.${name}`, version);
          }
          if (json.peerDependencies && json.peerDependencies[name]) {
            return _.set(acc, `peerDependencies.${name}`, version);
          }
          if (json.devDependencies && json.devDependencies[name]) {
            return _.set(acc, `devDependencies.${name}`, version);
          }
          return json;
        }, json),
      ])
      .forEach(([loc, json]) => writeJSON(loc, json));

    prepareYarn();

    await run('yarn --ignore-scripts');

    allPackageJsons.forEach(revertBackup);
    revertBackup(path.join(rootDir, YARN_LOCK));
  },
});

// module.exports = ({ logger }) => ({
//   command: 'link-by-yarn',
//   desc: '[deprecated] make preparations for proper linking of local repos',
//   handler: () => {
//     logger.warn(`
// 'asp link-by-yarn' was deprecated. Use 'asp link' instead.
// eslint-disable-next-line max-len
// If for some reason you still want to run this command, go to 'packages/platform-cli/bin/commands/link-by-yarn.js' and uncomment the code.
//     `).newLine();
//   },
// });
