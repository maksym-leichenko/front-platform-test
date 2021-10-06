/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const { getRootDir } = require('../utils');

const ROOT_DIR = getRootDir();

const getJsonFile = (filePath) => {
  let file = {};
  try {
    file = JSON.parse(fs.readFileSync(path.resolve(ROOT_DIR, filePath), { encoding: 'utf8' }));
  } catch (e) {
    console.log(e.message);
  }
  return file;
};

const getActionsPackageJsonPath = () => (
  fs.readdirSync(path.resolve(ROOT_DIR, '.github/actions')).map((action) => `.github/actions/${action}/package.json`)
);

const writePackageJsonFile = (filePath, file) => (
  fs.writeFileSync(path.resolve(ROOT_DIR, filePath), JSON.stringify(file, null, 2))
);

const getTags = (npm, releaseBranchName) => {
  const { dependencies } = getJsonFile('.asp/general.json');
  return Promise.all(
    _.map(dependencies, ({ packageName }) => (
      npm.show({ dir: ROOT_DIR }, packageName)
        .then((tags) => {
          const tag = tags[releaseBranchName];
          return tag ? ({ version: tag, name: packageName }) : undefined;
        })
    )),
  ).then((res) => res.filter(Boolean));
};

const updatePackageJson = ({ file, dep, package }) => {
  let isChanged = false;
  const newFile = { ...file };
  const oldDepVersion = _.get(newFile.dependencies, dep.name);
  const oldDevDepVersion = _.get(newFile.devDependencies, dep.name);

  if (oldDepVersion && oldDepVersion !== dep.version) {
    console.log(`${dep.name} from ${oldDepVersion} to ${dep.version} in ${package}`);
    newFile.dependencies[dep.name] = dep.version;
    isChanged = true;
  }

  if (oldDevDepVersion && oldDevDepVersion !== dep.version) {
    console.log(`${dep.name} from ${oldDevDepVersion} to ${dep.version} in ${package}`);
    newFile.devDependencies[dep.name] = dep.version;
    isChanged = true;
  }

  return isChanged ? newFile : null;
};

module.exports = ({ npm }) => ({
  command: 'update [release-branch-name]',
  alias: ['up'],
  desc: '',
  handler: async ({ releaseBranchName }) => {
    if (releaseBranchName) {
      const depsToUpdate = await getTags(npm, releaseBranchName);

      if (depsToUpdate.length) {
        const listOfPackageJson = ['package.json', ...getActionsPackageJsonPath()];

        listOfPackageJson.forEach((package) => {
          const file = getJsonFile(package);
          let newFile = null;
          depsToUpdate.forEach((dep) => {
            newFile = updatePackageJson({ file, dep, package });
          });
          if (newFile) writePackageJsonFile(package, file);
        });
        await npm.install({ dir: ROOT_DIR });
      }
    }
  },
});
