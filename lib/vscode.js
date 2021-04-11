const fs = require('fs-extra');
const path = require('path');
const merge = require('lodash.mergewith');

function customizer(originalValue, overrideValue) {
  if (Array.isArray(originalValue)) {
    const merged = originalValue.concat(overrideValue);
    return [...new Set(merged)];
  }
}

function mergeWith(original, override) {
  return merge(original, override, customizer);
}

function stripJsonComments(data) {
  return data.replace(/\/\/(.*)/g, '');
}

function modifySettingsFile(fileName) {
  const settingsPath = path.join(process.cwd(), '.vscode', fileName);
  if (!fs.existsSync(settingsPath)) {
    fs.createFileSync(settingsPath);
  }

  const settings = fs.readFileSync(settingsPath, { encoding: 'utf-8' }) || '{}';
  const settingsJson = JSON.parse(stripJsonComments(settings));
  const settingsOverridesJson = fs.readJsonSync(
    path.resolve(__dirname, '../config/prettier/.vscode', fileName)
  );
  fs.writeJsonSync(
    settingsPath,
    mergeWith(settingsJson, settingsOverridesJson),
    {
      spaces: 2
    }
  );
}

module.exports = {
  modifySettingsFile
};
