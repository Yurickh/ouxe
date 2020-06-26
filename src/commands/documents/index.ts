import { Argv, Arguments } from 'yargs'
import inquirer from 'inquirer'
import { getLicense, findLicense } from 'license'
import covgen from 'covgen'

import pkg from '../../../package.json'
import createFile from '../../helpers/create-file'
import { RootArgs } from '../../helpers/root-args'

export interface Args extends RootArgs {
  codeOfConduct: boolean | undefined
  license: boolean | undefined
}

export const command = ['documents', 'd']

export const describe =
  'Basic legal documents, like Code of Conduct and License'

export const builder = (yargs: Argv<RootArgs>): Argv<Args> =>
  yargs
    .options({
      codeOfConduct: {
        alias: 'c',
        type: 'boolean',
        describe: 'Creates a CODE_OF_CONDUCT.md file',
      },
      license: {
        alias: 'l',
        type: 'boolean',
        describe: 'Creates a LICENSE file',
      },
    })
    .group(['c', 'l'], 'Options:')

export const handler = async (argv: Arguments<Args>): Promise<void> => {
  const { documents } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'documents',
      message: '🤔 Which documents do you want to create?',
      default: { coc: true, license: true },
      choices: [
        { name: 'Code of Conduct', value: 'coc' },
        { name: 'License', value: 'license' },
      ],
      when: !argv.codeOfConduct && !argv.license,
    },
  ])

  if (argv.license || documents?.includes('license')) {
    const { selectedLicense, author } = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'selectedLicense',
        message: '📄  Please choose which license you want for your project:',
        source: async (_answers: any, input: string) =>
          findLicense(input || ''),
      },
      {
        type: 'input',
        name: 'author',
        message: "👓  What's the name of the user that'll sign the license",
        default: pkg.author,
      },
    ])

    const year = new Date().getFullYear().toString()

    const licenseText = getLicense(selectedLicense, { author, year })

    createFile('./LICENSE', licenseText)
  }

  if (argv.codeOfConduct || documents?.includes('coc')) {
    const { contact } = await inquirer.prompt([
      {
        type: 'input',
        name: 'contact',
        message: '📞 Please provide an email for contact',
      },
    ])

    await covgen(contact, './CODE_OF_CONDUCT.md').catch(console.log)
  }

  if (!argv.skipCongrats) {
    console.log('🎉  Enjoy your configured workplace!')
  }
}
