const utils = require('../utils');
const childProcess = require('../../lib/child-process');

const { Command, RepoNames, Logout } = require('../command-types');

module.exports = ({ repos }) => ({
  command: 'exec <command>',
  aliases: ['ex'],
  describe: 'execute terminal command inside repos',
  builder: (yargs) => (
    yargs
      .positional('command', Command())
      .option('repoNames', RepoNames(utils.toDefaultRepoNames(repos)))
      .option('logout', Logout())
  ),
  handler: ({ repoNames, command }) => (
    utils.mapByName(repoNames, repos).reduce((promise, repo) => (
      promise.then(() => childProcess.run(command, {}, { cwd: repo.dir }))
    ), Promise.resolve())
  ),
});
