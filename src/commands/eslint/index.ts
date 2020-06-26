import * as inquirer from 'inquirer'
import { Argv, Arguments } from 'yargs'

import copyTemplate from '../../helpers/copy-template'
import * as lintStagedRC from '../../helpers/lint-staged-rc'
import installDependencies from '../../helpers/install-dependencies'
import { RootArgs } from '../../helpers/root-args'

export interface Args extends RootArgs {
  lintStaged: boolean | undefined
}

export const command = ['eslint', 'e']

export const describe = 'Opinionated eslint configuration'

export const builder = (yargs: Argv<RootArgs>): Argv<Args> =>
  yargs
    .options({
      lintStaged: {
        alias: 'l',
        type: 'boolean',
        describe: 'Setup eslint to run on every commit',
      },
    })
    .group(['l'], 'Modifiers:')

export const handler = async (argv: Arguments<Args>): Promise<void> => {
  const packager = await installDependencies(argv)
  const devOptions = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message:
        '⚠️  This option is still under development. You might get to strange places. Are you sure you want to continue?',
      default: false,
    },
  ])

  if (!devOptions.continue) {
    process.exit(1)
  }

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
        `🚨  There was an error while installing dependencies during [${exception.command}]`,
      )
      process.exit(1)
    }
  }

  console.log('✨  Creating eslint configuration')
  // TODO: create templates
  // copyTemplate('.eslintrc')
  copyTemplate('.eslintignore')

  if (preferences.lintStaged) {
    copyTemplate('.huskyrc.json')
    // we can't just copy the template because prettier might have added configs to it
    await lintStagedRC.addEslint()
  }

  console.log('✅  Your project now has eslint configured!')

  if (!preferences.skipCongrats) {
    console.log('🎉  Enjoy your configured workplace!')
  }
}
