const childProcess = require('child_process');

const serializeOptions = (options = {}) => (
  Object
    .entries(options)
    .filter(([, value]) => Boolean(value))
    .map((entry) => entry.filter((x) => x !== true).join('='))
    .map((str) => `--${str}`)
    .join(' ')
);

const run = (command, commandOptions, execOptions = {}) => (
  new Promise((resolve, reject) => {
    const { hide, ...nativeOptions } = execOptions;

    const processInstance = childProcess.exec(`${command} ${serializeOptions(commandOptions)}`, nativeOptions, (err, res) => (
      err ? reject(err) : resolve(res)
    ));

    if (!execOptions.hide) {
      processInstance.stdout.pipe(process.stdout);
    }
  })
);

module.exports = {
  serializeOptions, run,
};
