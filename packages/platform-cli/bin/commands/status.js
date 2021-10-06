const _ = require('lodash');
const utils = require('../utils');

const { RepoNames, Logout } = require('../command-types');

const colorFromGitStatus = {
  added: 'success',
  modified: 'info',
  deleted: 'warn',
  untracked: 'error',
};

const displayHeader = ({ logger }) => (repo) => (
  logger.header(repo.name)
);

const displayFileStatus = ({ logger }) => (files) => (
  files.forEach(({ status, path }) => {
    logger[colorFromGitStatus[status] || 'text'](`  [${status}]`.padEnd(14))
      .text(' ')
      .text(path)
      .newLine();
  })
);

const displayCommits = ({ logger }) => (commits) => (
  commits.forEach((commit) => logger.info(commit).newLine())
);

const displayStatus = ({ logger }) => ({ repo, files, commits }) => {
  displayHeader({ logger })(repo);
  displayFileStatus({ logger })(files);
  displayCommits({ logger })(commits);
};

const displayStatuses = ({ logger }) => (statuses) => statuses.forEach(displayStatus({ logger }));

const fetchAllFullStatuses = ({ git }) => (repos) => git.fetchFullStatuses(repos);

const filterDirtyStatuses = (statuses) => _.filter(statuses, ['clean', false]);

module.exports = ({ repos, logger, git }) => ({
  command: 'status',
  aliases: ['st'],
  describe: 'shows repos status',
  builder: {
    repoNames: RepoNames(utils.toDefaultRepoNames(repos)),
    logout: Logout(),
  },
  handler: ({ repoNames }) => (
    Promise
      .resolve(utils.mapByName(repoNames, repos))
      .then(fetchAllFullStatuses({ git }))
      .then(filterDirtyStatuses)
      .then(displayStatuses({ logger }))
  ),
});
