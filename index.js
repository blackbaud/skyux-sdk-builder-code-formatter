const { cliPluginEntry } = require('./src/main');

module.exports = {
  runCommand: async (command) => {
    await cliPluginEntry(command);
  }
};
