import * as inquirer from 'inquirer'
import gStatus from 'g-status'

import runProcess from '../run-process'
import copyTemplate from '../copy-template'

export const command = ['prettier', 'p']

export const describe = 'Opinionated prettier configuration'

export const builder = yargs =>
  yargs
    .options({
      write: {
        alias: 'w',
        type: 'boolean',
        describe: 'Run prettier on all files of the project',
      },
      commit: {
        alias: 'c',
        type: 'boolean',
        requiresArg: 'write',
        describe: 'Commit written changes. Depends on --write',
      },
      'lint-staged': {
        alias: 'l',
        type: 'boolean',
        describe: 'Setup prettier to run on every commit',
      },
    })
    .group(['w', 'c', 'l'], 'Modifiers:')

export const handler = async ({ packager, ...argv }) => {
  const preferences = {
    ...argv,
    ...(await inquirer.prompt([
      {
        type: 'confirm',
        name: 'write',
        message:
          '💅  Do you want to immediately run prettier on all files in the project?',
        default: false,
        when: !argv.write,
      },
      {
        type: 'confirm',
        name: 'commit',
        message: '🐙  And how about making a commit with these changes?',
        default: true,
        when: ans => !argv.commit && ans.write,
      },
      {
        type: 'confirm',
        name: 'lintStaged',
        message: '💅  Do you want to run prettier as a precommit lint process?',
        default: true,
        when: !argv.lintStaged,
      },
    ])),
  }

  const dependencies = ['prettier']

  if (preferences.lintStaged) {
    dependencies.push('husky')
    dependencies.push('lint-staged')
  }

  if (!preferences.skipInstall) {
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

  console.log('✨  Creating prettier configuration')
  const currentModified = await gStatus()

  if (preferences.commit && currentModified.length !== 0) {
    console.log(
      "🐙  Don't worry about your unfinished work, we're storing it in a stash",
    )
    await runProcess('git stash save -u', 'Stash before running prettier')
  }

  copyTemplate('.prettierrc')
  copyTemplate('.prettierignore')

  if (preferences.write) {
    try {
      await packager.run(
        'prettier --write',
        './**/*.{ts,js,tsx,jsx,json,md,css}',
      )
    } catch (exception) {
      console.error(
        `🚨  There was an error while running prettier during [${
          exception.command
        }]`,
      )
      process.exit(1)
    }
  }

  if (preferences.commit) {
    const afterPrettierModifier = await gStatus()

    if (afterPrettierModifier.length === 0) {
      console.log(
        '💅  We really wanted to commit, but your files are already pretty!',
      )
    } else {
      try {
        await runProcess('git add .')
        await runProcess(
          'git commit -m',
          '💅  Run prettier in all files of the project',
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
  }

  if (preferences.lintStaged) {
    copyTemplate('.huskyrc')
    copyTemplate('.lintstagedrc')
  }

  console.log('✅  Your project now has prettier configured!')
  console.log('🎉  Enjoy your configured workplace!')
}
