import { GluegunToolbox } from 'gluegun'
import * as prettier from './prettier'

export const run = async (toolbox: GluegunToolbox) => {
  toolbox.print.info('Hello 👋  Welcome to ouxe!')

  const { features } = await toolbox.prompt.ask([
    {
      type: 'multiselect',
      name: 'features',
      message: 'Select the features you want to configure:',
      choices: ['prettier', 'eslint', 'documents'],
    },
  ])

  toolbox.config.skipCongrats = true

  if (features.includes('prettier')) {
    await prettier.run(toolbox)
  }

  toolbox.print.info('🎉  Enjoy your configured workplace!')
  process.exit(0)
}
