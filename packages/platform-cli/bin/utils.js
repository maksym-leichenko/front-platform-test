const _ = require('lodash');
const path = require('path');
const findUp = require('find-up');
const fs = require('fs');
const fetch = require('node-fetch');

const REPOS_WORKSPACE = 'repos/*';
const NODE_MODULES = 'node_modules';
const PACKAGE_JSON = 'package.json';

const mapByName = (names, repos) => names.map((name) => repos[name]);

const toDefaultRepoNames = (repos) => _(repos).filter('exists').map('name').value();

const getRootDir = () => {
  const dir = findUp.sync('.asp', { type: 'directory' });
  return path.resolve(dir, '..');
};

const showError = (logger) => (err) => (
  logger.error(err).newLine()
);

const getAllWorkspaceEntries = (rootDir, dirPattern) => {
  const pathPattern = path.join(rootDir, dirPattern);

  try {
    if (pathPattern.endsWith('*')) {
      const dirPath = pathPattern.slice(0, -1);
      return fs
        .readdirSync(dirPath)
        .map((name) => path.join(dirPath, name));
    }

    return [pathPattern];
  } catch (ex) {
    // If a path does not exist then return nothing.
    return [];
  }
};

const getAllWorkspaces = (rootDir) => {
  const rootPackageJson = require(path.join(rootDir, PACKAGE_JSON));
  return _
    .chain(rootPackageJson.workspaces.concat('').concat(REPOS_WORKSPACE))
    .map((dirPattern) => getAllWorkspaceEntries(rootDir, dirPattern))
    .flatten()
    .value();
};

const getAllNodeModules = (workspaces) => (
  workspaces
    .map((workspace) => path.join(workspace, NODE_MODULES))
    .filter((loc) => fs.existsSync(loc))
);

const getAllPackageJsons = (workspaces) => (
  workspaces
    .map((workspace) => path.join(workspace, PACKAGE_JSON))
    .filter((loc) => fs.existsSync(loc))
);

const getLocalesData = async ({ localePath, localeFileName }) => {
  const response = await fetch(`${localePath}/en/${localeFileName}.json`);

  if (!response.ok) {
    throw Error('Error: Something went wrong with request for locale file.');
  }

  const { data } = await response.json();
  return data;
};

const removeLocalePrefix = (prefixList, constantFullName) => {
  const prefix = prefixList.find((p) => constantFullName.startsWith(p));
  return prefix ? constantFullName.replace(prefix, '') : constantFullName;
};

module.exports = {
  getLocalesData,
  removeLocalePrefix,
  mapByName,
  toDefaultRepoNames,
  getRootDir,
  showError,
  getAllWorkspaces,
  getAllNodeModules,
  getAllPackageJsons,
};
