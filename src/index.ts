import { build } from 'gluegun'
import type { Options } from 'gluegun/build/types/domain/options'

/**
 * Next steps:
 * - figure out tests
 * - migrate documents and eslint
 * - help text for commands
 */

export const run = async (argv: string | Options) => {
  const cli = build()
    .brand('ouxe')
    .src(__dirname)
    .help()
    .version()
    .checkForUpdates(5)
    .create()

  const toolbox = await cli.run(argv)

  return toolbox
}
