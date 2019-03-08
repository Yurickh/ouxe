#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as inquirer from 'inquirer'

import packageManager from './package-manager'
import configurePrettier from './configure-prettier'

// REVIEW: How about using ink?
// REVIEW: we can improve our git workflow using https://github.com/okonet/lint-staged/blob/master/src/gitWorkflow.js as reference

async function run() {
  const hasYarnLock = fs.existsSync('./yarn.lock')
  const hasPackageLock = fs.existsSync('./package-lock.json')
  const noLock = !hasYarnLock && !hasPackageLock

  // TODO: add check for feature parameter
  // usage:
  // ouxe prettier --commit --npm
  // ouxe jest --enzyme
  // ouxe eslint --typescript

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you intend to use?',
      choices: [{ name: 'yarn' }, { name: 'npm' }],
      when: noLock,
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select the features you want to configure:',
      choices: [
        { name: 'prettier' },
        // { name: 'jest' },
        // { name: 'eslint' }
      ],
    },
    {
      type: 'confirm',
      name: 'prettierWrite',
      message:
        '💅 Do you want to immediately run prettier on all files in the project?',
      default: false,
      when: ans => ans.features.includes('prettier'),
    },
    {
      type: 'confirm',
      name: 'prettierCommit',
      message: '🐙 And how about making a commit with these changes?',
      default: true,
      when: ans => ans.prettierWrite,
    },
    {
      type: 'confirm',
      name: 'prettierLintStaged',
      message: '💅 Do you want to run prettier as a precommit lint process?',
      default: true,
      when: ans => ans.features.includes('prettier'),
    },
    // TODO: add basic jest
    // TODO: add basic eslint
  ])

  const packager = packageManager(
    answers.packageManager ||
      (hasYarnLock && 'yarn') ||
      (hasPackageLock && 'npm'),
  )

  if (!fs.existsSync('./package.json')) {
    console.log('📦 Creating package.json')
    try {
      await packager.init()
    } catch (exception) {
      console.error('🚨 There was an error while initing package.json')
      process.exit(1)
    }
  }

  if (noLock) {
    console.log('📦 Installing base packages')
    try {
      await packager.install()
    } catch (exception) {
      console.error('🚨 There was an error while installing dependencies')
      process.exit(1)
    }
  }

  const dependencies = []

  if (answers.features.includes('prettier')) {
    dependencies.push('prettier')
  }

  if (answers.husky) {
    dependencies.push('husky')
    dependencies.push('lint-staged')
  }

  if (dependencies.length > 0) {
    console.log('📦  Installing dependencies')
    try {
      await packager.add({ dev: true, dependencies })
    } catch (exception) {
      console.error(
        `🚨  There was an error while installing dependencies during [${
          exception.command
        }]`,
      )
      process.exit(1)
    }
  }

  if (answers.features.includes('prettier')) {
    await configurePrettier({
      write: answers.prettierWrite,
      commit: answers.prettierCommit,
      lintStaged: answers.prettierLintStaged,
    })
  }

  console.log('🎉 Enjoy your configured workplace!')
}

run()
