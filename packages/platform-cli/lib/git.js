/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */

const _ = require('lodash');
const chileProcess = require('./child-process');

const statusFromAbbr = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  '??': 'untracked',
  unknown: 'unknown',
};

const clone = (repo, branch) => chileProcess.run(`git clone ${repo.sshUrl} ${repo.dir}`, { branch });

const checkout = (repo, branch) => chileProcess.run(`git checkout ${branch}`, {}, { cwd: repo.dir, hide: true });

const fetchFileStatus = (repo) => (
  chileProcess
    .run('git status --porcelain', {}, { cwd: repo.dir, hide: true })
    .then((output) => (
      (output.match(/^\s?(\w|\?\?)\s+.+/gm) || [])
        .map((str) => str.trim().split(/\s+/))
        .map(([statusAbbr, path]) => ({
          status: statusFromAbbr[statusAbbr], path,
        }))
    ))
);

const fetchUnpushedCommits = (repo) => (
  chileProcess
    .run('git cherry -v', {}, { cwd: repo.dir, hide: true })
    .then((output) => output.split('\n').filter(Boolean))
    .catch(() => [])
);

const fetchFullStatus = (repo) => (
  Promise
    .all([fetchFileStatus(repo), fetchUnpushedCommits(repo)])
    .then(([files, commits]) => ({
      files, commits, repo, clean: _.isEmpty(files) && _.isEmpty(commits),
    }))
);

const fetchFullStatuses = (repos) => (
  repos.reduce((promise, repo, index) => (
    promise.then((result) => fetchFullStatus(repo).then((status) => _.set(result, index, status)))
  ), Promise.resolve([]))
);

const fetchCurrentBranch = (repo) => (
  chileProcess
    .run('git rev-parse --abbrev-ref HEAD', {}, { cwd: repo.dir, hide: true })
    .then((output) => output.trim())
);

const fetchCurrentBranches = (repos) => (
  repos.reduce((promise, repo, index) => (
    promise.then((result) => (
      fetchCurrentBranch(repo)
        .then((branch) => ({ branch, repo }))
        .then((data) => _.set(result, index, data))
    ))
  ), Promise.resolve([]))
);

const add = (repo, file) => chileProcess.run(`git add ${file}`, {}, { cwd: repo.dir, hide: true });

module.exports = {
  clone,
  checkout,
  fetchFileStatus,
  fetchUnpushedCommits,
  fetchFullStatus,
  fetchFullStatuses,
  fetchCurrentBranch,
  fetchCurrentBranches,
  add,
};
