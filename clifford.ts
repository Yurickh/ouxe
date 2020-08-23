import execa from 'execa'
import { streamWrite, readableToString } from '@rauschma/stringio'
import readLineGenerator from './read-line-generator'
import attachDebugListeners from './attach-debug-listeners'

interface CliffordOptions {
  readDelimiter: string | RegExp
  readTimeout: number | false
  debug: boolean
  useBabelNode: boolean
}

interface ReadUntilOptions {
  stopsAppearing?: boolean
}

interface CliffordInstance {
  type(string: string | Buffer | Uint8Array): Promise<void>
  read(): Promise<string>
  readLine(): Promise<string>
  readUntil(
    regex: RegExp,
    options?: ReadUntilOptions,
  ): Promise<string | undefined>
  kill(): void
  toString(): string
  toJSON(): string
}

const defaultConfig = (command: string) => ({
  debug: false,
  readDelimiter: '\n',
  readTimeout: 1000,
  useBabelNode: !command.endsWith('.js'),
})

const runWithTimeout = <T>(
  promise: Promise<T>,
  timeout: number,
): Promise<T | undefined> =>
  Promise.race<Promise<T | undefined>>([
    promise,
    new Promise((_resolve, reject) =>
      setTimeout(
        () => reject(new Error(`Promised timed out: ${promise}`)),
        timeout,
      ),
    ),
  ])

const spawnNode = (command: string, args: string[]) =>
  execa('node', ['--', command, ...args], {
    stdio: 'pipe',
    cwd: process.cwd(),
  })

const spawnBabelNode = (command: string, args: string[]) =>
  execa('babel-node', ['--extensions', '.ts,.js', '--', command, ...args], {
    stdio: 'pipe',
    cwd: process.cwd(),
  })

export default function clifford(
  command: string,
  args: string[] = [],
  options: Partial<CliffordOptions> = {},
): CliffordInstance {
  const optionsWithDefault: CliffordOptions = {
    ...defaultConfig(command),
    ...options,
  }

  const spawner = optionsWithDefault.useBabelNode ? spawnBabelNode : spawnNode
  const cli = spawner(command, args)

  if (options.debug) {
    attachDebugListeners(cli)
  }

  const { stdin, stdout } = cli

  if (stdout === null || stdin === null) {
    // This is null only when `stdio` is configured otherwise
    throw new Error('[Clifford]: stdio of execa has been misconfigured')
  }

  const outputIterator = readLineGenerator(
    stdout,
    optionsWithDefault.readDelimiter,
  )[Symbol.asyncIterator]()

  const stringification = `[Clifford instance: running process at \`${command}\` with args \`${JSON.stringify(
    args,
  )}\` ]`

  return {
    type: async (string: string | Buffer | Uint8Array) =>
      streamWrite(stdin, `${string}\n`),
    read: () => cli.then(({ stdout }) => stdout),
    readLine: () => {
      const line = outputIterator.next().then(({ value }) => value)

      if (optionsWithDefault.readTimeout) {
        return runWithTimeout(line, optionsWithDefault.readTimeout)
      } else {
        return line
      }
    },
    readUntil: async (matcher, options = {}) => {
      let line: string
      let appears = false

      do {
        line = (await outputIterator.next()).value
        appears = matcher.test(line)
      } while (options.stopsAppearing ? appears : !appears)

      return line
    },
    kill: () => cli.kill(),
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
