import * as fs from 'fs-extra'
import * as path from 'path'
import clifford from 'clifford'

interface CLIRunnerOptions {
  readDelimiter?: string | RegExp
  debug?: boolean
}

interface CLIInstance {
  type(string: string | Buffer | Uint8Array): Promise<void>
  read(): Promise<string>
  readLine(): Promise<string>
}

const OUXE = require.resolve('.')

describe('ouxe', () => {
  it('runs help', async () => {
    const cli = clifford(OUXE, ['--help'])

    const output = await cli.read()

    expect(output).toMatchSnapshot()
  })

  describe('running prettier', () => {
    fit('writes all files', async () => {
      const writableFile = path.join(__dirname, 'fixtures/write-prettier.js')

      fs.writeFileSync(
        writableFile,
        `
      export default function potato  () {
        let a,
        b,
        c

        [a, b, c].forEach(x =>
         0)
      } 
      `,
      )

      const cli = clifford(OUXE, ['prettier', '--skip-install'], {
        readDelimiter: /\(y\/n\)/i,
      })

      const promptWrite = await cli.readLine()
      expect(promptWrite).toMatch(
        'Do you want to immediately run prettier on all files in the project?',
      )
      await cli.type('y')
      // We need to readline again after typing as inquirer will print out what we type
      await cli.readLine()

      const promptPrecommit = await cli.readLine()
      expect(promptPrecommit).toMatch('precommit')

      await cli.type('n')
      await cli.readLine()

      await cli.readLine()

      expect(fs.readFileSync(writableFile).toString()).toMatchSnapshot()
      fs.removeSync(writableFile)
    })
  })
})
