#!/usr/bin/env node

import * as fs from 'fs-extra'
import * as path from 'path'
import * as inquirer from 'inquirer'

import spawn from 'cross-spawn'

function runProcess(process, ...moreArgs) {
  const [base, ...args] = process.split(' ')
  const allArgs = [...args, ...moreArgs]

  return new Promise((resolve, reject) => {
    const child = spawn(base, allArgs, { stdio: 'inherit' })
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${base} ${allArgs.join(' ')}`,
        })
      } else {
        resolve()
      }
    })
  })
}

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
    {
      type: 'confirm',
      name: 'commit',
      message:
        '💅 Do you want to immediately prettier write and commit all files in the project?',
      default: false,
      when: ans => ans.features.includes('prettier'),
    },
  ])

  const packageManager =
    answers.packageManager ||
    (hasYarnLock && 'yarn') ||
    (hasPackageLock && 'npm')

  if (!fs.existsSync('./package.json')) {
    console.log('📦 Creating package.json')
    try {
      await runProcess(`${packageManager} init`)
    } catch (exception) {
      console.error('🚨 There was an error while initing package.json')
      process.exit(1)
    }
  }

  if (noLock) {
    console.log('📦 Installing base packages')
    try {
      await runProcess(`${packageManager} install`)
    } catch (exception) {
      console.error('🚨 There was an error while installing dependencies')
      process.exit(1)
    }
  }

  if (answers.features.includes('prettier')) {
    console.log('✨ Creating prettier configuration')

    if (answers.commit) {
      await runProcess('git stash -u')
    }

    fs.copySync(
      path.join(__dirname, '..', 'templates', '.prettierrc'),
      './.prettierrc',
    )
    fs.copySync(
      path.join(__dirname, '..', 'templates', '.prettierignore'),
      './.prettierignore',
    )

    try {
      if (answers.commit) {
        await runProcess(
          'npx prettier --write ./**/*.{ts,js,tsx,jsx,json,md,css}',
        )
        await runProcess(
          'git commit -am',
          '💅 Run prettier in all files of the project',
        )
        await runProcess('git stash pop')
      }
    } catch (exception) {
      console.error(
        `🚨  There was an error while commiting modifications during [${
          exception.command
        }]`,
      )
      process.exit(1)
    }
  }
}

run()
