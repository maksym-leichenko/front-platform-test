const _ = require('lodash');
const utils = require('../utils');

const { RepoNames, Logout } = require('../command-types');

const fetchBranches = ({ git }) => (repos) => git.fetchCurrentBranches(repos);

const mapByRepoName = (x) => _.map(x, 'repo.name');

const normalize = (branchAndRepos) => (
  _(branchAndRepos).groupBy('branch').mapValues(mapByRepoName).value()
);

const displayBranches = ({ logger }) => (data) => (
  Object
    .entries(data)
    .forEach(([branch, names]) => {
      logger.header(branch);
      logger.text('  ').info(names.join(', '));
      logger.newLine();
    })
);

module.exports = ({ repos, logger, git }) => ({
  command: 'current-branches',
  describe: 'shows repos branches',
  builder: {
    repoNames: RepoNames(utils.toDefaultRepoNames(repos)),
    logout: Logout(),
  },
  handler: ({ repoNames }) => (
    Promise
      .resolve(utils.mapByName(repoNames, repos))
      .then(fetchBranches({ git }))
      .then(normalize)
      .then(displayBranches({ logger }))
  ),
});
