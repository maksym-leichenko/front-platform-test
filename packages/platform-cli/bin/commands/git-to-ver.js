const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const ago = require('s-ago');
const parseDuration = require('parse-duration').default;

const { getAllPackageJsons, getAllWorkspaces, getRootDir } = require('../utils');
const { PublishedTimeAgo, NoReplace } = require('../command-types');

const childProcess = require('../../lib/child-process');

const isGitLink = (str) => str.includes('#');

const getBranchedDeps = ({ dependencies }) => (
  Object
    .keys(dependencies || {})
    .filter((key) => isGitLink(dependencies[key]))
);

const rootDir = getRootDir();
const allWorkspaces = getAllWorkspaces(rootDir);
const allPackageJsonsEntries = getAllPackageJsons(allWorkspaces);

const reposConfigPath = path.join(rootDir, '.asp/repos.json');
const generalConfigPath = path.join(rootDir, '.asp/general.json');

const general = require(generalConfigPath);

const allPackageJsons = allPackageJsonsEntries.map(require);

const reposConfig = fs.existsSync(reposConfigPath) ? fs.readJSONSync(reposConfigPath) : {};
const reposDeps = Object.keys(reposConfig).map((r) => general.dependencies[r]);

const delay = (ms) => (
  new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  })
);

const randomDelay = () => delay(Math.floor(Math.random() * 100));

const getLatestVersion = async (packageName) => {
  const { data } = await childProcess
    .run(`yarn info ${packageName} --json`, {}, { hide: true })
    .then(JSON.parse);

  const { 'dist-tags': distTags, time } = data;

  return {
    version: distTags.latest,
    name: packageName,
    date: new Date(time[distTags.latest]),
  };
};

const replacePackageVersion = (packageJson, { name, version }) => {
  const { dependencies } = packageJson;

  if (dependencies && dependencies[name]) {
    return _.merge({}, packageJson, {
      dependencies: { [name]: version },
    });
  }
  return packageJson;
};

const displayLatestPackages = (latestPackages, logger) => {
  const contents = latestPackages.map(({
    name, version, date, shouldReplace,
  }) => (
    [name, version, ago(date), shouldReplace ? 'yes' : 'no']
  ));

  return logger.table(['Name', 'Version', 'Published', 'Replaces Branch'], contents);
};

module.exports = ({ logger }) => ({
  command: 'git-to-ver [timeAgo]',
  describe: 'replaces packages git branches with latest NPM version',
  builder: (yargs) => (
    yargs
      .positional('timeAgo', PublishedTimeAgo('10m'))
      .option('noReplace', NoReplace())
  ),
  handler: async ({ timeAgo, noReplace }) => {
    const packageNames = _
      .chain(allPackageJsons)
      .map(getBranchedDeps)
      .flatten()
      .concat(reposDeps.map((d) => d.packageName))
      .value();

    if (packageNames.length === 0) {
      logger.text('No branched packages were found.').newLine();
      return;
    }

    logger.text('\nExtracting packages info that use branches...\n\n');

    const now = Date.now();
    const earliestTime = now - parseDuration(timeAgo);

    const promises = packageNames.map(async (packageName) => {
      await randomDelay();
      return getLatestVersion(packageName);
    });

    const latestPackages = await Promise
      .all(promises)
      .then((pckgs) => (
        pckgs.map(
          (p) => ({ ...p, shouldReplace: p.date.getTime() - earliestTime > 0 }),
        )
      ));

    displayLatestPackages(latestPackages, logger);

    if (noReplace) {
      logger.newLine();
      return;
    }

    const filteredPackages = latestPackages.filter((pckg) => pckg.shouldReplace);

    if (filteredPackages.length === 0) {
      logger.text('\nNothing to replace.\n\n');
      return;
    }

    // Write new package versions into "package.json" files.
    allPackageJsons
      .map((packageJson) => (
        filteredPackages.reduce((acc, pckg) => replacePackageVersion(acc, pckg), packageJson)
      ))
      .forEach((packageJson, index) => {
        if (allPackageJsons[index] !== packageJson) {
          fs.writeJSONSync(allPackageJsonsEntries[index], packageJson, { spaces: 2 });
        }
      });

    // Remove updated packages from "repos.json" file.
    const nextReposConfig = filteredPackages
      .map((pckg) => reposDeps.find((dep) => dep.packageName === pckg.name))
      .map((repoDep) => repoDep && repoDep.sshUrl.match(/\/(.+)\.git/)[1]) // Convert SSH URL to repository name.
      .reduce((acc, repoName) => {
        delete acc[repoName];
        return acc;
      }, { ...reposConfig });

    if (_.isEmpty(nextReposConfig)) {
      if (fs.existsSync(reposConfigPath)) {
        fs.removeSync(reposConfigPath);
        logger.info('\n".asp/repos.json" file was removed, since all "repos.json" packages were replaced.\n');
      }
    } else if (!_.isEqual(reposConfig, nextReposConfig)) {
      fs.writeJSONSync(reposConfigPath, nextReposConfig, { spaces: 2 });
      logger.info('\n".asp/repos.json" was updated.\n');
    }

    logger.success('\nGit branches were replaced.\n\n');
  },
});
