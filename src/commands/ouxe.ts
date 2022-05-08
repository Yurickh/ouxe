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

  if (features.includes('prettier')) {
    await prettier.run(toolbox, true)
  }

  // WHY??
  process.exit(0)
}
