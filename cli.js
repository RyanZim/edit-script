#!/usr/bin/env node
'use strict';
var fs = require('fs-promise');
var inquirer = require('inquirer');
var findPkg = require('pkg-up');

var script = process.argv[2];

var pkgPath;
var pkg = {}
var scripts = {};

if (!script) {
  console.error('Error: Must pass a script name');
  process.exit(1);
}

findPkg()
.then(function (p) {
  pkgPath = p;
  return fs.readJson(pkgPath);
})
.then(function (data) {
  pkg = data;
  scripts = pkg.scripts;

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'create',
      message: `The script "${script}" does not exist. Create it?`,
      when: !scripts[script],
    },
  ]);
})
.then(function (answers) {
  if (!scripts[script] && !answers.create) {
    console.log('Aborting');
    process.exit();
  }
})
.then(function () {
  return inquirer.prompt([
    {
      type: 'editor',
      name: 'script',
      message: 'Edit your script; an empty script deletes the script',
      default: scripts[script],
    },
  ])
})
.then(function (answers) {
  var val = answers.script.trim();
  if (!val) {
    console.log('Deleting script.');
    delete scripts[script];
  } else {
    scripts[script] = val;
  }
  return fs.writeJson(pkgPath, pkg)
});
