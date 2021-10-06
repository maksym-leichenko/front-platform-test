const { createTerminal } = require('terminal-kit');

const defaultMapOfColors = {
  SUCCESS: 'green',
  ERROR: 'red',
  WARN: 'yellow',
  INFO: 'cyan',
  TEXT: 'white',
};

const defaultOptions = {
  verbose: false,
};

class Logger {
  constructor(
    options = defaultOptions, mapOfColors = defaultMapOfColors, terminal = createTerminal(),
  ) {
    this.options = options;
    this.mapOfColors = mapOfColors;
    this.terminal = terminal;

    this.verboseOnly = false;
    this.fullLog = '';

    this.error = this.error.bind(this);
    this.success = this.success.bind(this);
    this.warn = this.warn.bind(this);
    this.info = this.info.bind(this);
    this.text = this.text.bind(this);
    this.newLine = this.newLine.bind(this);
    this.header = this.header.bind(this);
  }

  verbose(fn) {
    this.verboseOnly = true;
    fn();
    this.verboseOnly = false;
    return this;
  }

  log(style, str) {
    this.fullLog += str;
    if (this.options.verbose || !this.verboseOnly) {
      this.verboseOnly = false;
      this.terminal[style](str);
    }
    return this;
  }

  error(strOrError) {
    this.log(this.mapOfColors.ERROR, strOrError.message || strOrError);
    return this;
  }

  success(str) {
    this.log(this.mapOfColors.SUCCESS, str);
    return this;
  }

  warn(str) {
    this.log(this.mapOfColors.WARN, str);
    return this;
  }

  info(str) {
    this.log(this.mapOfColors.INFO, str);
    return this;
  }

  text(str) {
    this.log(this.mapOfColors.TEXT, str);
    return this;
  }

  newLine() {
    this.log(this.mapOfColors.TEXT, '\n');
    return this;
  }

  header(str) {
    this.newLine();
    this.log('bold', str);
    this.newLine();
    return this;
  }

  table(titles, contents) {
    const table = [titles, ...contents].map(
      (raw) => raw.map((cell) => ` ${cell}`),
    );

    this.terminal.table(table, {
      borderAttr: { color: this.mapOfColors.INFO },
      firstRowTextAttr: { color: this.mapOfColors.WARN },
      width: 100,
      fit: true, // Activate all expand/shrink + wordWrap
    });
    return this;
  }
}

const createLogger = (...args) => new Logger(...args);

module.exports = {
  createLogger,
};
