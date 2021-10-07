const path = require('path');
const _ = require('lodash');
const fs = require('fs');

const reposPath = path.join('applications', 'client');
const defaultRepoDir = path.join(reposPath, 'repos');
const configDir = '.asp';

const generalConfigFileName = 'general.json';

const readConfigFile = (...pathParts) => {
  const configPath = path.join(...pathParts);
  try {
    return require(configPath);
  } catch {
    return {};
  }
};

const getReposInfo = (rootDir = process.cwd()) => {
  const {
    dependencies = {}, repoDir = defaultRepoDir,
  } = readConfigFile(rootDir, configDir, generalConfigFileName);

  return Object.values(dependencies).reduce((result, { sshUrl, packageName }) => {
    const name = sshUrl.match(/\/(.+)\.git/)[1];
    const dir = path.join(rootDir, reposPath, repoDir, name);
    const exists = fs.existsSync(dir);

    const value = { name, sshUrl, dir, exists, packageName };

    return _.set(result, name, value);
  }, {});
};

module.exports = {
  getReposInfo,
};
