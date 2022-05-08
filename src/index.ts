import { build } from 'gluegun'
import type { Options } from 'gluegun/build/types/domain/options'
import * as prettier from './commands/prettier'
import * as eslint from './commands/eslint'
import * as documents from './commands/documents'
import * as ouxe from './commands/ouxe'

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
    .defaultCommand(ouxe)
    .command(prettier)
    .command(eslint)
    .command(documents)
    .checkForUpdates(5)
    .create()

  const toolbox = await cli.run(argv)

  return toolbox
}
