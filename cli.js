#!/usr/bin/env node
'use strict';
var fs = require('fs-promise');
var inquirer = require('inquirer');
var findPkg = require('pkg-up');

var script = process.argv[2];

// help message:
if (process.argv[2] === '--help') {
  console.log(
    `Edit npm scripts from the command line without worrying about json escaping.

    edit-script
    edit-script <script>`
  );
  process.exit();
}

var pkgPath;
var pkg = {};
var scripts = {};

const NEW_SCRIPT_SYMBOL = Symbol('Create new script');
const EXIT_SYMBOL = Symbol('Exit');

// Find package.json path:
findPkg()
.then(function (p) {
  if (!p) throw new Error('No package.json file found!');
  pkgPath = p;
  // Load package.json:
  return fs.readJson(pkgPath);
})
.then(function (data) {
  // Assign global variables:
  pkg = data;
  if (!pkg.scripts) pkg.scripts = {};
  scripts = pkg.scripts;
})
.then(getScriptName)
.then(function editScript() {
  return inquirer.prompt([
    {
      type: 'editor',
      name: 'script',
      message: 'Edit your script; an empty script deletes the script',
      default: scripts[script],
    },
  ])
  .then(function (answers) {
    var val = answers.script.trim();
    if (!val) {
      console.log('Deleting script.');
      delete scripts[script];
    } else scripts[script] = val;
    return fs.writeJson(pkgPath, pkg);
  });
})
.catch(function (err) {
  console.error(err);
  process.exit(1);
});

function getScriptName() {
  if (script && !scripts[script]) return confirmCreation();
  else {
    // Get choices:
    var choices = Object.keys(scripts).map(function (key) {
      return {
        name: pad(key, scripts[key]),
        value: key,
        short: key,
      };
    });
    // Add aditional choices:
    choices.push(new inquirer.Separator());
    choices.push({
      name: 'Create a new script',
      value: NEW_SCRIPT_SYMBOL,
    });
    choices.push({
      name: 'Exit edit-script',
      value: EXIT_SYMBOL,
    });
    // Prompt for script name:
    return inquirer.prompt([
      {
        type: 'list',
        name: 'script',
        message: 'Select a script to edit:',
        choices: choices,
      },
    ])
    .then(function (answers) {
      switch (answers.script) {
      case NEW_SCRIPT_SYMBOL:
          // Get script name:
        return inquirer.prompt([{
          type: 'input',
          name: 'name',
          message: 'Enter the script name:',
          validate: function (val) {
            if (!val) return 'Script name must not be empty';
            else return true;
          },
        }])
          .then(function (answers) {
            // Set it:
            script = answers.name;
          });
      case EXIT_SYMBOL:
        return process.exit();
      default:
        script = answers.script;
      }
    });
  }
}

function confirmCreation() {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'create',
      message: `The script "${script}" does not exist. Create it?`,
    },
  ])
  .then(function (answers) {
    if (!answers.create) {
      console.log('Aborting');
      process.exit();
    }
  });
}

function pad(str1, str2) {
  var padLen = 60 - (str1.length + str2.length);
  // Ensure at least one space:
  var pad = ' ';
  for (var i = 1; i < padLen; i++) pad += ' ';
  return str1 + pad + str2;
}
