import { GluegunToolbox } from 'gluegun'
import * as prettier from './prettier'
import * as eslint from './eslint'
import * as documents from './documents'

export const run = async (toolbox: GluegunToolbox) => {
  toolbox.print.info(toolbox.print.colors.bold('Hello 👋  Welcome to ouxe!'))

  const { features } = await toolbox.prompt.ask([
    {
      type: 'multiselect',
      name: 'features',
      message: `Select the features you want to configure: ${toolbox.print.colors.muted(
        '(Press SPACE to select)',
      )}`,
      choices: ['prettier', 'eslint', 'documents'],
    },
  ])

  toolbox.config.skipCongrats = true

  if (features.includes('prettier')) {
    await prettier.run(toolbox)
  }
  if (features.includes('eslint')) {
    await eslint.run(toolbox)
  }
  if (features.includes('documents')) {
    await documents.run(toolbox)
  }

  toolbox.print.divider()
  toolbox.print.info('Enjoy your configured workplace!')
  process.exit(0)
}
