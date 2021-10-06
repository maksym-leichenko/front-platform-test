/* eslint-disable @typescript-eslint/no-var-requires */
const childProcess = require('./child-process');

const show = (repo, packageName) => (
  childProcess.run(`npm show ${packageName} dist-tags --json`, {}, { cwd: repo.dir, hide: true })
    .then((output) => JSON.parse(output))
);

const install = (repo) => (
  childProcess.run('yarn install', {}, { cwd: repo.dir, hide: false })
);

module.exports = {
  show,
  install,
};
