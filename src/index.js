#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as path from 'path'
import * as inquirer from 'inquirer'

import spawn from 'cross-spawn'

async function run() {
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

  if (!fs.existsSync('./package.json')) {
    console.log('📦 Creating package.json')
    try {
      await new Promise((resolve, reject) => {
        const child = spawn(packageManager, ['init'], { stdio: 'inherit' })
        child.on('close', code => {
          if (code !== 0) {
            reject({
              command: `${packageManager} init`,
            })
          } else {
            resolve()
          }
        })
      })
    } catch (exception) {
      console.error('🚨 There was an error while initing package.json')
      process.exit(1)
    }
  }

  if (noLock) {
    console.log('📦 Installing base packages')
    try {
      await new Promise((resolve, reject) => {
        const child = spawn(packageManager, ['install'], { stdio: 'inherit' })
        child.on('close', code => {
          if (code !== 0) {
            reject({ command: `${packageManager} install` })
          } else {
            resolve()
          }
        })
      })
    } catch (exception) {
      console.error('🚨 There was an error while installing dependencies')
      process.exit(1)
    }
  }

  if (answers.features.includes('prettier')) {
    console.log('✨ Creating prettier configuration')
    fs.copySync(
      require.resolve('../templates/.prettierrc'),
      path.join(process.cwd(), '.prettierrc'),
    )
  }
}

run()
