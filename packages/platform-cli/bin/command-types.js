const Verbose = () => ({
  alias: 'v',
  type: 'boolean',
  describe: 'display verbose log',
  default: true,
});

const Concurrency = () => ({
  alias: 'c',
  type: 'number',
  describe: 'an amount of processes that can run simultaneously',
  default: 3,
});

const RepoName = () => ({
  type: 'string',
  alias: 'r',
  describe: 'a name of the repo to be cloned',
});

const RepoNames = (defaultValue) => ({
  type: 'array',
  alias: 'r',
  default: defaultValue,
});

const Branch = () => ({
  type: 'string',
  describe: 'a branch being checked out',
});

const Command = () => ({
  type: 'string',
  describe: 'a command to be executed',
});

const Logout = () => ({
  type: 'boolean',
  describe: 'save logs to a file',
  default: false,
});

const PublishedTimeAgo = (defaultValue) => ({
  type: 'string',
  describe: 'replace package version only if it was published in specified period of time',
  default: defaultValue,
});

const NoReplace = () => ({
  type: 'boolean',
  describe: 'extract information, but don\'t replace package versions',
  default: false,
});

const Save = () => ({
  alias: 's',
  type: 'boolean',
  describe: 'save checked out repos list, like git submodules',
  default: false,
});

const Clear = () => ({
  type: 'boolean',
  describe: 'remove checked out repos information and repos folder',
  default: false,
});

const LocaleFileName = () => ({
  type: 'string',
  describe: 'a name of the locale file to check for constants in a package',
  default: false,
});

const AuditRepoName = () => ({
  type: 'string',
  describe: 'a name of the repository in which to search for constants',
  default: false,
});

module.exports = {
  Verbose,
  Concurrency,
  RepoName,
  RepoNames,
  Branch,
  Command,
  Logout,
  PublishedTimeAgo,
  NoReplace,
  Save,
  Clear,
  AuditRepoName,
  LocaleFileName,
};
