const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const {
  getLocalesData,
  removeLocalePrefix,
  getRootDir,
  showError,
} = require('../utils');

const {
  AuditRepoName, LocaleFileName,
} = require('../command-types');

const ROOT_DIR = getRootDir();
const DATA_EXCESS_FILENAME = 'data-excess.json';
const LOCALES_MAP_FILENAME = 'locales-map.json';
const DESTINATION_DIRECTORY = 'build-locales-audit';

module.exports = ({ logger }) => ({
  command: 'locale-audit-file [repoName] [localeFileName]',
  desc: 'checking for redundancy of constants in a locale file',
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
      const pathToPackage = path.join(ROOT_DIR, 'applications', 'client', 'repos', repoName);

      if (!fs.existsSync(pathToPackage)) {
        throw Error(`Path "${pathToPackage}" does not exist`);
      }

      const packageFileList = glob.sync('**/*.js', { cwd: pathToPackage });
      const localesMapFilePath = path.join(ROOT_DIR, LOCALES_MAP_FILENAME);

      if (!fs.existsSync(localesMapFilePath)) {
        throw Error(`File "${LOCALES_MAP_FILENAME}" does not exist`);
      }

      const localesMap = fs.readJsonSync(path.join(ROOT_DIR, LOCALES_MAP_FILENAME));

      (async () => {
        logger.info('Start...').newLine();

        const sourceLocalesMap = await getLocalesData({
          localePath, localeFileName,
        });

        const localeKeysSet = new Set(Object.keys(sourceLocalesMap));
        const sizeBeforeExclude = localeKeysSet.size;

        packageFileList.forEach((file) => {
          const pathToFile = path.join(pathToPackage, file);
          const fileContent = fs.readFileSync(pathToFile, 'utf-8');

          localeKeysSet.forEach((constantFullName) => {
            const constantName = removeLocalePrefix(Object.values(localesMap), constantFullName);

            if (fileContent.includes(constantName)) {
              localeKeysSet.delete(constantFullName);
            }
          });
        });

        const sizeAfterExclude = localeKeysSet.size;

        fs.removeSync(path.join(ROOT_DIR, DESTINATION_DIRECTORY));
        fs.outputJsonSync(
          path.join(ROOT_DIR, DESTINATION_DIRECTORY, DATA_EXCESS_FILENAME),
          { data: [...localeKeysSet] }, { spaces: 2 },
        );

        logger.info(`Done! Check folder "${DESTINATION_DIRECTORY}" to see the result`).newLine().newLine();
        logger.info(`Number of constants in the file - ${sizeBeforeExclude}`).newLine();
        logger.info(`Used - ${sizeAfterExclude}`).newLine();
        logger.info(`Unused - ${sizeBeforeExclude - sizeAfterExclude}`).newLine();
      })();
    } catch (error) {
      showError(logger)(error);
    }
  },
});
