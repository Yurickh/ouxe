import * as yargs from 'yargs'
import * as eslintCommand from '.'
import getCommandOutput from '../../helpers/get-command-output'

describe('eslint command', () => {
  let parser

  beforeEach(() => {
    parser = yargs.scriptName('ouxe').command(eslintCommand)
  })

  it('shows help output', async () => {
    expect(await getCommandOutput(parser, 'eslint --help'))
      .toMatchInlineSnapshot(`
      "ouxe eslint

      Opinionated eslint configuration

      Modifiers:
        --lint-staged, -l  Setup eslint to run on every commit               [boolean]

      Options:
        --help     Show help                                                 [boolean]
        --version  Show version number                                       [boolean]"
    `)
  })

  it('shows version', async () => {
    expect(
      await getCommandOutput(parser, 'eslint --version'),
    ).toMatchInlineSnapshot(`"1.0.1"`)
  })
})
