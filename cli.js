#!/usr/bin/env node
'use strict';
const fs = require('fs-extra');
const inquirer = require('inquirer');
const findPkg = require('pkg-up');

let script = process.argv[2];

// help message:
if (process.argv[2] === '--help') {
  console.log(
    `Edit npm scripts from the command line without worrying about json escaping.

    edit-script
    edit-script <script>`,
  );
  process.exit();
}

let pkgPath;
let pkg = {};
let scripts = {};

const NEW_SCRIPT_SYMBOL = Symbol('Create new script');
const EXIT_SYMBOL = Symbol('Exit');

// Find package.json path:
findPkg()
  .then(p => {
    if (!p) throw new Error('No package.json file found!');
    pkgPath = p;
    // Load package.json:
    return fs.readJson(pkgPath);
  })
  .then(data => {
    // Assign global variables:
    pkg = data;
    if (!pkg.scripts) pkg.scripts = {};
    scripts = pkg.scripts;
  })
  .then(getScriptName)
  .then(() => {
    return inquirer
      .prompt([
        {
          type: 'editor',
          name: 'script',
          message: 'Edit your script; an empty script deletes the script',
          default: scripts[script],
        },
      ])
      .then(answers => {
        const val = answers.script.trim();
        if (!val) {
          console.log('Deleting script.');
          delete scripts[script];
        } else scripts[script] = val;
        return fs.writeJson(pkgPath, pkg, { spaces: 2 });
      });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

function getScriptName() {
  if (script) {
    if (!scripts[script]) return confirmCreation();
    return;
  }
  // Else, Get choices:
  const choices = Object.keys(scripts).map(key => {
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
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'script',
        message: 'Select a script to edit:',
        choices,
      },
    ])
    .then(answers => {
      switch (answers.script) {
        case NEW_SCRIPT_SYMBOL:
          // Get script name:
          return inquirer
            .prompt([
              {
                type: 'input',
                name: 'name',
                message: 'Enter the script name:',
                validate(val) {
                  if (!val) return 'Script name must not be empty';
                  return true;
                },
              },
            ])
            .then(answers => {
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

async function confirmCreation() {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'create',
      message: `The script "${script}" does not exist. Create it?`,
    },
  ]);
  if (!answers.create) {
    console.log('Aborting');
    process.exit();
  }
}

function pad(str1, str2) {
  const desiredWidth = 80;
  return `${str1.padEnd(desiredWidth - str2.length - 1)} ${str2}`;
}
