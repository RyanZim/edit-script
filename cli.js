#!/usr/bin/env node
'use strict';
const jsonfile = require('jsonfile');
const inquirer = require('inquirer');
const findPkg = require('pkg-up');

// help message:
if (process.argv[2] === '--help') {
  console.log(
    `Edit npm scripts from the command line without worrying about json escaping.

    edit-script
    edit-script <script>`,
  );
  process.exit();
}

const NEW_SCRIPT_SYMBOL = Symbol('Create new script');
const EXIT_SYMBOL = Symbol('Exit');

async function main() {
  const pkgPath = await findPkg();
  if (!pkgPath) throw new Error('No package.json file found!');

  const pkg = await jsonfile.readFile(pkgPath);

  if (!pkg.scripts) pkg.scripts = {};

  const script = await getScriptName(pkg.scripts);
  const answers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'script',
      message: 'Edit your script; an empty script deletes the script',
      default: pkg.scripts[script],
    },
  ]);
  const val = answers.script.trim();
  if (!val) {
    console.log('Deleting script.');
    delete pkg.scripts[script];
  } else pkg.scripts[script] = val;

  await jsonfile.writeFile(pkgPath, pkg, { spaces: 2 });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

async function getScriptName(scripts) {
  const cliScript = process.argv[2];
  if (cliScript) {
    if (!scripts[cliScript]) await confirmCreation(cliScript);
    return cliScript;
  }

  const choices = Object.entries(scripts)
    .map(([key, value]) => {
      return {
        name: pad(key, value),
        value: key,
        short: key,
      };
    })
    .concat([
      new inquirer.Separator(),
      {
        name: 'Create a new script',
        value: NEW_SCRIPT_SYMBOL,
      },
      {
        name: 'Exit edit-script',
        value: EXIT_SYMBOL,
      },
    ]);

  // Prompt for script name:
  const { script } = await inquirer.prompt([
    {
      type: 'list',
      name: 'script',
      message: 'Select a script to edit:',
      choices,
    },
  ]);

  switch (script) {
    case NEW_SCRIPT_SYMBOL:
      // Get script name:
      return (await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Enter the script name:',
          validate: val => !!val || 'Script name must not be empty',
        },
      ])).name;
    case EXIT_SYMBOL:
      return process.exit();
    default:
      return script;
  }
}

async function confirmCreation(script) {
  const { create } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'create',
      message: `The script "${script}" does not exist. Create it?`,
    },
  ]);
  if (!create) {
    console.log('Aborting');
    process.exit();
  }
}

function pad(str1, str2) {
  const desiredWidth = 80;
  return `${str1.padEnd(desiredWidth - str2.length - 1)} ${str2}`;
}
