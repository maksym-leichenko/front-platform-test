const { default: PQueue } = require('p-queue');
const {
  RepoName, Branch, Logout, Concurrency,
} = require('../command-types');

const success = ({ logger }) => () => (
  logger
    .info(`
Successfully cloned specified repository.
You can find them in 'applications/client/repos' folder.
    `)
    .warn(`
Make sure to run 'asp link' command before building the project.
    `)
    .newLine()
);

module.exports = ({ git, repos, logger }) => ({
  command: 'clone [repoName] [branch]',
  aliases: ['cl'],
  desc: 'clone one repo by name or several ones by branch',
  builder: (yargs) => (
    yargs
      .positional('repoName', RepoName())
      .positional('branch', Branch())
      .option('logout', Logout())
      .option('concurrency', Concurrency())
  ),
  handler: ({
    repoName, branch, concurrency,
  }) => {
    const promise = (() => {
      if (repoName === 'ALL') {
        const tasks = Object.values(repos).map((r) => () => git.clone(r));
        return new PQueue({ concurrency }).addAll(tasks);
      }
      return git.clone(repos[repoName], branch);
    })();

    return promise
      .then(success({ logger }))
      .catch(logger.error);
  },
});
