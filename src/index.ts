import * as inquirer from 'inquirer'
import * as yargs from 'yargs'

import * as prettier from './commands/prettier'
import * as eslint from './commands/eslint'

async function routeFeatures(argv): Promise<void> {
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select the features you want to configure:',
      choices: [{ name: 'prettier' }, { name: 'eslint' }],
    },
  ])

  // We want to congrat only once
  argv.skipCongrats = true

  if (features.includes('prettier')) {
    await prettier.handler(argv)
  }

  if (features.includes('eslint')) {
    await eslint.handler(argv)
  }

  console.log('🎉  Enjoy your configured workplace!')
}

// TODO: add some colors to the help page
async function run(): Promise<yargs.Arguments> {
  // If we don't store the result, this will get tree-shaked!
  const argv = yargs
    .scriptName('ouxe')
    .usage('Usage: $0 [configuration] [args]')
    .command('*', 'Choose from some configuration options', {}, routeFeatures)
    .command(prettier)
    .command(eslint)
    .options({
      'skip-install': {
        type: 'boolean',
        describe: 'Skip installation steps. Ideal for the unconnected.',
      },
    })
    .demandCommand()
    .recommendCommands()
    .help().argv

  return argv
}

run()
