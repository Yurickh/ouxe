#!/usr/bin/env node

import { existsSync } from 'fs'
import * as path from 'path'
import * as inquirer from 'inquirer'
import execa from 'execa'

async function run() {
  const hasYarnLock = existsSync('./yarn.lock')
  const hasPackageLock = existsSync('./package-lock.json')
  const noLock = !hasYarnLock && !hasPackageLock

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
      choices: [{ name: 'prettier' }, { name: 'jest' }, { name: 'eslint' }],
    },
  ])

  const packageManager =
    answers.packageManager ||
    (hasYarnLock && 'yarn') ||
    (hasPackageLock && 'npm')

  if (!existsSync('./package.json')) {
    console.log('📦 Creating package.json')
    execa.shellSync(`${packageManager} init`)
  }

  if (noLock) {
    console.log('📦 Installing base packages')
    await execa(packageManager, ['install']).stdout.pipe(process.stdout)
  }

  if (answers.features.includes('prettier')) {
    console.log('✨ Creating prettier configuration')
    await execa('cp', [
      path.join(__dirname, '..', 'templates', '.prettierrc'),
      path.join(process.cwd(), '.prettierrc'),
    ])
  }
}

run()
