import * as yargs from 'yargs'
import * as prettierCommand from '.'
import getCommandOutput from '../../helpers/get-command-output'

describe('prettier command', () => {
  let parser

  beforeEach(() => {
    parser = yargs.scriptName('ouxe').command(prettierCommand)
  })

  it('shows the help', async () => {
    expect(await getCommandOutput(parser, 'prettier --help'))
      .toMatchInlineSnapshot(`
      "ouxe prettier

      Opinionated prettier configuration

      Modifiers:
        --write, -w        Run prettier on all files of the project          [boolean]
        --lint-staged, -l  Setup prettier to run on every commit             [boolean]

      Options:
        --help     Show help                                                 [boolean]
        --version  Show version number                                       [boolean]"
    `)
  })
})
