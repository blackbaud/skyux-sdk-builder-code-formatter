const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const prettier = require('prettier');
const vscode = require('./lib/vscode');

async function getPrettierConfig() {
  const configFilePath = path.join(
    __dirname,
    'config/prettier/.prettierrc.json'
  );
  const config = await prettier.resolveConfig(configFilePath);
  return config;
}

function getProjectFiles() {
  const files = glob.sync(path.join(process.cwd(), '**/*+(.js|.ts|.json)'), {
    nodir: true,
    ignore: ['**/node_modules/**']
  });
  return files;
}

function getFileInfo(file) {
  const ignorePath = path.join(__dirname, 'config/prettier/.prettierignore');
  return prettier.getFileInfo(file, {
    ignorePath
  });
}

function processFiles(config, callback) {
  const files = getProjectFiles();
  const promises = files.map(async (file) => {
    const info = await getFileInfo(file);
    if (info.ignored) {
      return;
    }

    config.parser = info.inferredParser;

    const contents = fs.readFileSync(file, { encoding: 'utf-8' });

    return callback(file, contents);
  });

  return Promise.all(promises);
}

function setupAutosaveFunctionality() {
  console.log(
    'Modifying local .vcode settings to setup autosave functionality.'
  );
  vscode.modifySettingsFile('settings.json');
  vscode.modifySettingsFile('extensions.json');
  console.log('Autosave functionality setup successfully.');
}

async function checkFiles(config) {
  console.log('Checking for unformatted files...');
  try {
    const unformatted = [];
    await processFiles(config, (file, contents) => {
      const isFormatted = prettier.check(contents, config);
      if (!isFormatted) {
        unformatted.push(file.replace(process.cwd(), ''));
      }
    });
    if (unformatted.length) {
      throw new Error(`
*========================================*
| Found ${unformatted.length} unformatted file(s):
*========================================*
  --> ${unformatted.join('\n  --> ')}\n

  Found ${
    unformatted.length
  } unformatted file(s). Run \`skyux format\` to format these files.
`);
    } else {
      console.log('All files are formatted correctly.');
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

async function formatFiles(config) {
  let numFailed = 0;
  let numIgnored = 0;
  let numSucceeded = 0;

  await processFiles(config, (file, contents) => {
    try {
      const formatted = prettier.format(contents, config);

      if (contents !== formatted) {
        fs.writeFileSync(file, formatted, { encoding: 'utf-8' });
        console.log(`Successfully formatted file ${file}`);
        numSucceeded++;
      } else {
        numIgnored++;
        console.log(`File already formatted ${file}`);
      }
    } catch (err) {
      numFailed++;
      console.error(`Failed to format file: ${file}`);
      console.error(err);
    }
  });

  console.log(`
*========================================*
| Format results                         |
*========================================*
  Num. failed:    ${numFailed}
  Num. ignored:   ${numIgnored}
  Num. succeeded: ${numSucceeded}
*----------------------------------------*
`);
}

function logHelpInfo() {
  console.log(`
*=====================================================================*
| SKY UX Format                                                       |
| Usage: skyux format [options]                                       |
*=====================================================================*

  Formats local source code.

  --check
    Throws an error if any source file is not formatted correctly.

  --setup
    Adds the appropriate configuration to automatically format code when a file is saved.
`);
}

module.exports = {
  runCommand: async (command, argv) => {
    if (command === 'format') {
      const config = await getPrettierConfig();

      if (argv.check) {
        await checkFiles(config);
        return;
      }

      if (argv.setup) {
        setupAutosaveFunctionality();
        return;
      }

      if (argv['help']) {
        logHelpInfo();
        return;
      }

      await formatFiles(config);
    }
  }
};
