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

function copyTemplate(name) {
  fs.copySync(path.join(__dirname, '..', 'templates', name), `./${name}`)
}

// REVIEW: How about using ink?
// REVIEW: we can improve our git workflow using https://github.com/okonet/lint-staged/blob/master/src/gitWorkflow.js as reference

async function run() {
  // TODO: add some kind of helper
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
      name: 'commit',
      message:
        '💅 Do you want to immediately prettier write and commit all files in the project?',
      default: false,
      when: ans => ans.features.includes('prettier'),
    },
    {
      type: 'confirm',
      name: 'husky',
      message: '💅 Do you want to run prettier as a precommit lint process?',
      default: true,
      when: ans => ans.features.includes('prettier'),
    },
    // TODO: add basic jest
    // TODO: add basic eslint
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
      await runProcess('yarn add --dev', ...dependencies)
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
    console.log('✨ Creating prettier configuration')

    if (answers.commit) {
      console.log(
        "🐙 Don't worry about your unfinished work, we're storing it in a stash",
      )
      await runProcess('git stash save -u', 'Stash before running prettier')
    }

    copyTemplate('.prettierrc')
    copyTemplate('.prettierignore')

    if (answers.commit) {
      try {
        await runProcess(
          'npx prettier --write ./**/*.{ts,js,tsx,jsx,json,md,css}',
        )
        // TODO: check if any files have been written before commiting
        await runProcess('git add .')
        await runProcess(
          'git commit -m',
          '💅 Run prettier in all files of the project',
        )
      } catch (exception) {
        console.error(
          `🚨  There was an error while commiting modifications during [${
            exception.command
          }]`,
        )
        process.exit(1)
      }
    }

    if (answers.husky) {
      copyTemplate('.huskyrc')
      copyTemplate('.lintstagedrc')
    }

    console.log('✅ Your project now has prettier configured!')
  }

  console.log('🎉 Enjoy your configured workplace!')
}

run()
