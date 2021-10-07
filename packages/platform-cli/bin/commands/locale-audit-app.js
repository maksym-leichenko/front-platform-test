const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const { getLocalesData, getRootDir, showError } = require('../utils');

const {
  AuditRepoName, LocaleFileName,
} = require('../command-types');

const ROOT_DIR = getRootDir();
const DATA_EXCESS_FILENAME = 'data-excess.json';
const DATA_INCLUDED_FILENAME = 'data-included.json';
const LOCALES_MAP_FILENAME = 'locales-map.json';
const FUNC_REG_EXP_TEMPLATE = /(\$[a-z]?)\(([^)]*)\)/gm;
const DESTINATION_DIRECTORY = 'build-locales-audit';

module.exports = ({ logger }) => ({
  command: 'locale-audit-app [repoName] [localeFileName]',
  desc: 'checking an application for using constants from a locale file',
  builder: (yargs) => (
    yargs
      .positional('repoName', AuditRepoName())
      .positional('localeFileName', LocaleFileName())
  ),
  handler: ({
    repoName, localeFileName,
  }) => {
    try {
      const localesConfigFilePath = path.join(ROOT_DIR, 'applications', 'static-server', 'config', 'external', 'locales.json');
      const { localePath } = fs.readJsonSync(localesConfigFilePath);

      const localesMapFilePath = path.join(ROOT_DIR, LOCALES_MAP_FILENAME);

      if (!fs.existsSync(localesMapFilePath)) {
        throw Error(`File "${LOCALES_MAP_FILENAME}" does not exist`);
      }
      const localesMap = fs.readJsonSync(localesMapFilePath);

      logger.info('Start...').newLine();

      const pathToPackage = path.join(ROOT_DIR, 'applications', 'client', 'repos', repoName);

      if (!fs.existsSync(pathToPackage)) {
        throw Error(`Directory "${pathToPackage}" does not exist`);
      }

      const filesList = glob.sync('**/*.js', { cwd: pathToPackage });
      const constantFullNameSet = new Set();

      filesList.forEach((file) => {
        const pathToAppFile = path.join(pathToPackage, file);
        const fileContent = fs.readFileSync(pathToAppFile, 'utf-8');

        let result = null;

        // eslint-disable-next-line no-cond-assign
        while (result = FUNC_REG_EXP_TEMPLATE.exec(fileContent)) {
          // result[1] = translate func ($, $g, $r, $<name>)
          const constantPrefix = localesMap[result[1]];
          // result[2] = translate func argument
          const constantName = result[2].replace(/['"]+/g, '');

          constantFullNameSet.add(`${constantPrefix}${constantName}`);
        }
      });

      (async () => {
        const sourceLocalesMap = await getLocalesData({
          localePath, localeFileName,
        });
        const sourceConstantsList = Object.keys(sourceLocalesMap);

        const includedConstants = sourceConstantsList.filter(
          (name) => constantFullNameSet.has(name),
        );

        const excessConstants = [...constantFullNameSet].filter(
          (name) => !sourceConstantsList.includes(name),
        );

        fs.removeSync(path.join(ROOT_DIR, DESTINATION_DIRECTORY));
        fs.outputJsonSync(
          path.join(ROOT_DIR, DESTINATION_DIRECTORY, DATA_EXCESS_FILENAME),
          { data: excessConstants },
          { spaces: 2 },
        );
        fs.outputJsonSync(
          path.join(ROOT_DIR, DESTINATION_DIRECTORY, DATA_INCLUDED_FILENAME),
          { data: includedConstants },
          { spaces: 2 },
        );

        logger.info(`Done! Check folder "${DESTINATION_DIRECTORY}" to see the result`).newLine();
      })();
    } catch (error) {
      showError(logger)(error);
    }
  },
});
