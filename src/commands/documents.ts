import { GluegunToolbox } from 'gluegun'
import getLicense, { findLicense } from 'license'
import covgen from 'covgen'

export const name = 'documents'
export const alias = ['d']
export const description =
  'Basic legal documents, like Code of Conduct and License'

const selectDocuments = async (toolbox: GluegunToolbox) => {
  if (!toolbox.parameters.options.license && !toolbox.parameters.options.coc) {
    const { documents } = await toolbox.prompt.ask([
      {
        type: 'multiselect',
        name: 'documents',
        message: `Which documents do you want to create? ${toolbox.print.colors.muted(
          '(Press SPACE to deselect)',
        )}`,
        choices: ['Code of Conduct', 'License'],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore Gluegun types are off here
        initial: [0, 1],
      },
    ])
    return documents
  }
  const documents: string[] = []

  if (toolbox.parameters.options.license) {
    documents.push('License')
  }

  if (toolbox.parameters.options.coc) {
    documents.push('Code of Conduct')
  }

  return documents
}

export const run = async (toolbox: GluegunToolbox) => {
  // If we're skipping congrats, it means we're being run from top-level
  if (toolbox.config.skipCongrats) {
    toolbox.print.divider()
  }
  toolbox.print.info(toolbox.print.colors.bold('Configuring your documents'))

  const documents = await selectDocuments(toolbox)

  if (documents.includes('License')) {
    toolbox.print.divider()
    toolbox.print.info(toolbox.print.colors.bold('Creating License document'))

    const { selectedLicense, author } = await toolbox.prompt.ask([
      {
        type: 'autocomplete',
        name: 'selectedLicense',
        message: 'Choose which license you want for your project:',
        choices: [],
        suggest: (input) =>
          input
            ? findLicense(input)
                .map((name) => ({ name, message: name, value: name }))
                .slice(0, 10)
            : [],
      },
      {
        type: 'input',
        name: 'author',
        message: "What's the name of the user that will sign the license",
        initial: toolbox.filesystem.read('package.json', 'json')?.author,
      },
    ])

    const year = new Date().getFullYear().toString()
    const licenseText = getLicense(selectedLicense, { author, year })

    toolbox.filesystem.write('./LICENSE', licenseText)
    toolbox.print.info(
      `${toolbox.print.checkmark} Created ${toolbox.print.colors.highlight(
        'LICENSE',
      )} file`,
    )
  }

  if (documents.includes('Code of Conduct')) {
    toolbox.print.divider()
    toolbox.print.info(
      toolbox.print.colors.bold('Creating Code of Conduct document'),
    )

    const { contact } = await toolbox.prompt.ask([
      {
        type: 'input',
        name: 'contact',
        message: 'Provide an email for contact',
      },
    ])

    await covgen(contact, './CODE_OF_CONDUCT.md').catch((error: unknown) => {
      toolbox.print.error(
        'There was a problem while creating the CODE_OF_CONDUCT.md file.',
      )
      toolbox.print.debug(error)
    })

    toolbox.print.info(
      `${toolbox.print.checkmark} Created ${toolbox.print.colors.highlight(
        'CODE_OF_CONDUCT.md',
      )} file`,
    )
  }

  toolbox.print.success(
    `${toolbox.print.checkmark} Your project now has nice documents!`,
  )

  if (!toolbox.config.skipCongrats) {
    toolbox.print.info('Enjoy your configured workplace!')
    process.exit(0)
  }
}
