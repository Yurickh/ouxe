import { Readable } from 'stream'
import execa from 'execa'
import attachDebugListeners, { sanitize } from './attach-debug-listeners'

interface CliffordOptions {
  readTimeout: number | false
  debug: boolean
  useBabelNode: boolean
}

interface ReadUntilOptions {
  stopsAppearing?: boolean
}

const defaultConfig = (command: string) => ({
  debug: false,
  readDelimiter: '\n',
  readTimeout: 1000,
  useBabelNode: !command.endsWith('.js'),
})

const execaOptions = () => ({
  all: true,
  preferLocal: true,
})

function isRegExp(value: unknown): value is RegExp {
  return Object.prototype.toString.call(value) === '[object RegExp]'
}

function test(matcher: string | RegExp, subject: string) {
  if (isRegExp(matcher)) {
    return matcher.test(subject)
  } else {
    return subject.includes(matcher)
  }
}

function indexOf(matcher: string | RegExp, subject: string) {
  if (isRegExp(matcher)) {
    return matcher.exec(subject).index
  } else {
    return subject.indexOf(matcher)
  }
}

const spawnNode = (command: string, args: string[]) =>
  execa('node', ['--', command, ...args], execaOptions())

const spawnBabelNode = (command: string, args: string[]) =>
  execa(
    'babel-node',
    ['--extensions', '.ts,.js', '--', command, ...args],
    execaOptions(),
  )

class Reader {
  data = ''

  constructor(private stream: Readable) {
    this.startListening()
  }

  private readSegment() {
    const data = this.data

    this.data = ''

    return data
  }

  private async startListening() {
    for await (const chunk of this.stream) {
      this.data += chunk
    }
  }

  private waitForNextChunk() {
    return new Promise((resolve, reject) => {
      let resolved = false
      this.stream.once('data', () => {
        if (!resolved) {
          resolved = true
          resolve()
        }
      })

      this.stream.once('close', () => {
        if (!resolved) {
          resolved = true
          reject(
            new Error('[Clifford]: Reached end of input when trying to read.'),
          )
        }
      })
    })
  }

  async while(matcher: string | RegExp) {
    const currentSegment = this.readSegment()

    if (test(matcher, currentSegment)) {
      await this.waitForNextChunk()
      return this.while(matcher)
    }

    return currentSegment
  }

  async until(matcher: string | RegExp) {
    const currentSegment = this.readSegment()
    console.log('Matching \n', matcher, '\n against \n', currentSegment, '--')

    if (test(matcher, currentSegment)) {
      console.log('matched')
      return currentSegment
    }

    console.log('not matched, wait for next chunk')

    await this.waitForNextChunk()
    return this.until(matcher)
  }
}

export default function clifford(
  command: string,
  args: string[] = [],
  options: Partial<CliffordOptions> = {},
) {
  const optionsWithDefault: CliffordOptions = {
    ...defaultConfig(command),
    ...options,
  }

  const spawner = optionsWithDefault.useBabelNode ? spawnBabelNode : spawnNode
  const cli = spawner(command, args)

  if (options.debug) {
    attachDebugListeners(command, cli)
  }

  const stringification = `[Clifford instance: running process for \`${command}\` with args \`${JSON.stringify(
    args,
  )}\` ]`

  const reader = new Reader(cli.all)

  const readUntil = async (
    matcher: string | RegExp,
    options: ReadUntilOptions = {},
  ) => {
    if (options.stopsAppearing) {
      return reader.while(matcher)
    } else {
      return reader.until(matcher)
    }
  }

  return {
    // Although we don't need await here, it seems `write` might be async on windows
    type: async (string: string) => {
      if (optionsWithDefault.debug) {
        console.log(`[stdin]: ${sanitize(string + '\n')}`)
      }

      return cli.stdin.write(`${string}\n`)
    },
    read: () => cli.then(({ all }) => all),
    readLine: () => readUntil('\n'),
    readUntil,
    kill: () => cli.cancel(),
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
