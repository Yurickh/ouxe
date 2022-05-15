import { GluegunToolbox } from 'gluegun'

interface EslintArguments {
  lintStaged: boolean
  skipInstall: boolean
  skipCongrats: boolean
}

export const name = 'eslint'
export const alias = ['e']

export const description = 'Opinionated eslint configuration'

// export const builder = (yargs: Argv): Argv =>
//   yargs
//     .options({
//       'lint-staged': {
//         alias: 'l',
//         type: 'boolean',
//         describe: 'Setup eslint to run on every commit',
//       },
//     })
//     .group(['l'], 'Modifiers:')

export const run = async (toolbox: GluegunToolbox) => {
  const shouldContinue = toolbox.prompt.confirm(
    '⚠️  This option is still under development. You might get to strange places. Are you sure you want to continue?',
    false,
  )

  if (!shouldContinue) {
    return
  }

  const lintStaged =
    toolbox.parameters.options.lintStaged
    ?? (await toolbox.prompt.confirm(
      'Do you want to run eslint as a precommit lint process?',
      true,
    ))

  const dependencies = ['eslint']

  if (lintStaged) {
    dependencies.push('husky')
    dependencies.push('lint-staged')
  }
}
// export const handler = async (
//   argv: Arguments<EslintArguments>,
// ): Promise<void> => {
//   const packager = await installDependencies(argv)
//   const devOptions = await inquirer.prompt([

//   ])

//   if (!devOptions.continue) {
//     process.exit(1)
//   }

//   const preferences = {
//     ...argv,
//     ...(await inquirer.prompt([
//       {
//         type: 'confirm',
//         name: 'lintStaged',
//         message: '💅  Do you want to run eslint as a precommit lint process?',
//         default: true,
//         when: !argv.lintStaged,
//       },
//     ])),
//   }

//   const dependencies = ['eslint']

//   if (preferences.lintStaged) {
//     dependencies.push('husky')
//     dependencies.push('lint-staged')
//   }

//   if (!preferences.skipInstall) {
//     console.log('📦  Installing dependencies')
//     try {
//       await packager.add({ dev: true, dependencies })
//     } catch (exception) {
//       console.error(
//         `🚨  There was an error while installing dependencies during [${exception.command}]`,
//       )
//       process.exit(1)
//     }
//   }

//   console.log('✨  Creating eslint configuration')
//   // TODO: create templates
//   // copyTemplate('.eslintrc')
//   copyTemplate('.eslintignore')

//   if (preferences.lintStaged) {
//     copyTemplate('.huskyrc.json')
//     // we can't just copy the template because prettier might have added configs to it
//     await lintStagedRC.addEslint()
//   }

//   console.log('✅  Your project now has eslint configured!')

//   if (!preferences.skipCongrats) {
//     console.log('🎉  Enjoy your configured workplace!')
//   }
// }
