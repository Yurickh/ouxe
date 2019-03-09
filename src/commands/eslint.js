import * as inquirer from 'inquirer'

import copyTemplate from '../copy-template'
import * as lintStagedRC from '../lint-staged-rc'

export const command = ['eslint', 'e']

export const describe = 'Opinionated eslint configuration'

export const builder = {}

export const handler = async ({ packager, ...argv }) => {
  const preferences = {
    ...argv,
    ...(await inquirer.prompt([
      {
        type: 'confirm',
        name: 'lintStaged',
        message: '💅  Do you want to run eslint as a precommit lint process?',
        default: true,
        when: !argv.lintStaged,
      },
    ])),
  }

  const dependencies = ['eslint']

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

  console.log('✨  Creating eslint configuration')
  // TODO: create templates
  // copyTemplate('.eslintrc')
  // copyTemplate('.eslintignore')

  if (preferences.lintStaged) {
    copyTemplate('.huskyrc.json')
    // we can't just copy the template because prettier might have added configs to it
    lintStagedRC.addEslint()
  }

  console.log('✅  Your project now has eslint configured!')

  if (!preferences.skipCongrats) {
    console.log('🎉  Enjoy your configured workplace!')
  }
}
