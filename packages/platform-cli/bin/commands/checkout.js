/* eslint-disable newline-per-chained-call */

const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');

const { default: PQueue } = require('p-queue');

const { showError, getRootDir } = require('../utils');
const {
  Verbose, Concurrency, Logout, Save, Clear,
} = require('../command-types');

const ROOT_DIR = getRootDir();
const REPOS_CONFIG_PATH = '.asp/repos.json';
const REPOS_CONFIG_FULL_PATH = path.join(ROOT_DIR, REPOS_CONFIG_PATH);
const REPOS_FOLDER = path.join(ROOT_DIR, 'repos');

const allClean = (action) => (statuses) => {
  const { length } = statuses.filter((x) => !x.clean);
  const msg = `Cannot ${action}, when repos are not clean.
Commit and push changes of each repository you currently work with.
If you're certain that you won't need your current changes - you can just remove repos folder.
Run "asp status" to see current status.
`;
  return length > 0 ? Promise.reject(msg) : Promise.resolve();
};

const installRepo = ({ git, logger }) => (repo, branch) => (
  Promise
    .resolve()
    .then(() => (repo.exists ? git.checkout(repo, branch) : git.clone(repo, branch)))
    .then(() => logger.success(`"${repo.name}" was checked out to "${branch}"`).newLine())
    .catch(() => {
      fs.remove(repo.dir);
      logger.info(`"${repo.name}" doesn't have branch "${branch}"`).newLine();
    })
);

const checkoutBranch = ({ git, repos, logger }) => ({ branch, concurrency }) => {
  const install = installRepo({ git, logger });

  const tasks = Object.values(repos).map((repo) => () => install(repo, branch));

  return new PQueue({ concurrency }).addAll(tasks);
};

const checkoutSubmodules = ({ git, repos, logger }) => ({ concurrency }) => {
  const install = installRepo({ git, logger });

  try {
    const reposConfig = require(REPOS_CONFIG_FULL_PATH);

    const tasks = Object
      .entries(reposConfig)
      .map(([key, branch]) => () => install(repos[key], branch));

    return new PQueue({ concurrency }).addAll(tasks);
  } catch (ex) {
    return Promise.resolve();
  }
};

const writeRepos = ({ git, repos, logger }) => () => (
  _
    .chain(repos)
    .pickBy((r) => r.exists)
    .reduce((acc, repo) => (
      acc.then(
        (obj) => git.fetchCurrentBranch(repo).then((branch) => _.set(obj, repo.name, branch)),
      )
    ), Promise.resolve({}))
    .value()
    .then((obj) => {
      fs.writeFileSync(REPOS_CONFIG_FULL_PATH, JSON.stringify(obj, null, 2));
      logger.success('Saved!\n\n');
      Object.entries(obj).forEach(([key, value]) => logger.text(key).text(': ').info(value).newLine());
    })
    .then(() => git.add({ dir: ROOT_DIR }, REPOS_CONFIG_PATH))
    .then(() => logger.text('\n"').warn(REPOS_CONFIG_PATH).text('" file was written.\n\n'))
);

const removeRepos = ({ logger }) => () => {
  fs.removeSync(REPOS_CONFIG_FULL_PATH);
  fs.removeSync(REPOS_FOLDER);
  logger.text('Removed "').warn(REPOS_CONFIG_PATH).text('" and "').warn('repos').text('" folder.\n');
};

const inject = (value) => () => value;

module.exports = ({ git, repos, logger }) => ({
  command: 'checkout [branch]',
  aliases: ['ch'],
  desc: 'clone one repo by name or several ones by branch',
  builder: {
    concurrency: Concurrency(),
    verbose: Verbose(),
    logout: Logout(),
    save: Save(),
    clear: Clear(),
  },
  handler: ({
    branch = process.env.SUBMODULE_BRANCH, concurrency, save, clear,
  }) => (
    save ? writeRepos({ git, repos, logger })() : Promise
      .resolve(Object.values(repos).filter(x => x.exists))
      .then(git.fetchFullStatuses)
      .then(allClean(clear ? 'clear repos' : 'perform checkout'))
      .then(inject({ branch, concurrency }))
      .then(
        clear ? removeRepos({ logger }) : (
          branch
            ? checkoutBranch({ git, repos, logger })
            : checkoutSubmodules({ git, repos, logger })
        ),
      )
      .catch(showError(logger))
  ),
});
