const fs = require('fs-extra');
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

function mergeJson(originalPath, overridesPath) {
  if (!fs.existsSync(originalPath)) {
    fs.createFileSync(originalPath);
  }

  const originalSource =
    fs.readFileSync(originalPath, { encoding: 'utf-8' }) || '{}';
  const originalJson = JSON.parse(stripJsonComments(originalSource));
  const overridesJson = fs.readJsonSync(overridesPath);

  fs.writeJsonSync(originalPath, mergeWith(originalJson, overridesJson), {
    spaces: 2
  });
}

module.exports = {
  mergeJson
};
