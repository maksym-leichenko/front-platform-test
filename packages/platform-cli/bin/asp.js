#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

const rootDir = require('./utils').getRootDir();

const logger = require('../lib/logger').createLogger({ verbose: yargs.argv.verbose });
const repos = require('../lib/repos').getReposInfo(rootDir);
const git = require('../lib/git');
const npm = require('../lib/npm');

// noinspection JSUnresolvedFunction
const { argv } = yargs
  .commandDir('commands', {
    visit: (creator) => creator({ logger, repos, git, npm }),
  })
  .demandCommand()
  .help();

process.on('beforeExit', (code) => {
  if (argv.logout) {
    fs.writeFileSync(
      path.join(rootDir, `asp-logs--${Date.now()}.txt`),
      process.argv.join(' ').concat(`\n\n${logger.fullLog}\nexit ${code}`),
    );
  }
});
