import * as inquirer from 'inquirer'

import copyTemplate from '../copy-template'
import * as lintStagedRC from '../lint-staged-rc'

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

  copyTemplate('.prettierrc.json')
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

  if (preferences.lintStaged) {
    copyTemplate('.huskyrc.json')
    // we can't just copy the template because eslint might need to add new configs to it
    lintStagedRC.addPrettier()
  }

  console.log('✅  Your project now has prettier configured!')

  if (!preferences.skipCongrats) {
    console.log('🎉  Enjoy your configured workplace!')
  }
}
