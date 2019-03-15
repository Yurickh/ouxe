#!/usr/bin/env node

import * as inquirer from 'inquirer'
import * as fs from 'fs-extra'
import * as yargs from 'yargs'

import * as prettier from './commands/prettier'
import * as eslint from './commands/eslint'

import packageManager from './package-manager'

async function installDependencies(argv) {
  const hasYarnLock = fs.existsSync('./yarn.lock')
  const hasPackageLock = fs.existsSync('./package-lock.json')
  const noLock = !hasYarnLock && !hasPackageLock

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you intend to use?',
      choices: [{ name: 'yarn' }, { name: 'npm' }],
      when: noLock,
    },
  ])

  const packager = packageManager(
    answers.packageManager ||
      (hasYarnLock && packageManager.YARN) ||
      (hasPackageLock && packageManager.NPM),
  )

  if (!fs.existsSync('./package.json')) {
    console.log('📦  Creating package.json')
    try {
      await packager.init()
    } catch (exception) {
      console.error('🚨  There was an error while initing package.json')
      process.exit(1)
    }
  }

  if (noLock && !argv.skipInstall) {
    console.log('📦  Installing base packages')
    try {
      await packager.install()
    } catch (exception) {
      console.error('🚨  There was an error while installing dependencies')
      process.exit(1)
    }
  }

  // store packager instance on argv for later use
  argv.packager = packager
}

async function routeFeatures(argv) {
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select the features you want to configure:',
      choices: [
        { name: 'prettier' },
        { name: 'eslint' },
        // { name: 'jest' },
      ],
    },
  ])

  // We want to congrat only once
  argv.skipCongrats = true

  if (features.includes('prettier')) {
    await prettier.handler(argv)
  }

  if (features.includes('eslint')) {
    await eslint.handler(argv)
  }

  // this is the time of our lives
  console.log('🎉  Enjoy your configured workplace!')
}

// TODO: add some colors to the help page
async function run() {
  // If we don't store the result, this will get tree-shaked!
  const argv = yargs
    .scriptName('ouxe')
    .usage('Usage: $0 [configuration] [args]')
    .middleware([installDependencies])
    .command('*', 'Choose from some configuration options', {}, routeFeatures)
    .command(prettier)
    .command(eslint)
    .options({
      'skip-install': {
        type: 'boolean',
        describe: 'Skip installation steps. Ideal for the unconnected.',
      },
    })
    .demandCommand()
    .recommendCommands()
    .help().argv

  return argv
}

run()
