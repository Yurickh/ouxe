import * as fs from 'fs-extra'
import * as path from 'path'
import spawn from 'cross-spawn'
import { streamWrite, readableToString } from '@rauschma/stringio'

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

function runOuxe(
  args = [],
  options: CLIRunnerOptions = { debug: false, readDelimiter: '\n' },
): CLIInstance {
  const cli = spawn(
    'babel-node',
    ['--extensions', '.ts', '--', OUXE, ...args],
    {
      stdio: 'pipe',
    },
  )

  cli.stdin.on('data', data => {
    if (options.debug) {
      console.log('[stdin]: ', data.toString(), '[/stdin]')
    }
  })

  cli.stdout.on('data', data => {
    if (options.debug) {
      console.log('[stdout]: ', data.toString(), '[/stdout]')
    }
  })

  cli.stderr.on('data', data => {
    if (options.debug) {
      console.log('[stderr]: ', data.toString(), '[/stderr]')
    }
  })

  async function* readLine(): AsyncGenerator<string> {
    let output = ''

    for await (const chunk of cli.stdout) {
      output += chunk.toString()

      const delimiter = new RegExp(options.readDelimiter)
      if (delimiter.test(output)) {
        yield output
        output = ''
      }
    }

    yield output
  }

  const outputIterator = readLine()[Symbol.asyncIterator]()

  return {
    type: async (string: string | Buffer | Uint8Array) =>
      streamWrite(cli.stdin, `${string}\n`),
    read: () => readableToString(cli.stdout),
    readLine: () => outputIterator.next().then(({ value }) => value),
  }
}

describe('ouxe', () => {
  it('runs help', async () => {
    const cli = runOuxe(['--help'])

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

      const cli = runOuxe(['prettier', '--skip-install'], {
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
