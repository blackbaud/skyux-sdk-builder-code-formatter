/* jshint node: true */

'use strict';

const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const rimraf = require('rimraf');

const rootPath = path.join(__dirname, '..');
const distPath = path.join(rootPath, 'dist');

function copyFiles() {
  fs.ensureDirSync(distPath);
  const files = glob.sync(
    path.join(rootPath, '{index.js,package.json,README.md,src/**/*}'),
    {
      nodir: true,
      ignore: ['**/*.spec.js'],
      dot: true
    }
  );
  files.forEach((file) => {
    const copyDest = path.join(
      distPath,
      path.join(file).replace(process.cwd(), '')
    );
    fs.ensureFileSync(copyDest);
    fs.copyFileSync(path.join(file), copyDest);
  });
}

function createDist() {
  return new Promise((resolve) => {
    rimraf(distPath, () => {
      copyFiles();
      resolve();
    });
  });
}

createDist();
