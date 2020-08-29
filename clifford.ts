import { Readable } from 'stream'
import execa from 'execa'
import attachDebugListeners, { sanitize } from './attach-debug-listeners'

interface CliffordOptions {
  readTimeout: number | false
  debug: boolean
  useBabelNode: boolean
}

const defaultConfig = (command: string) => ({
  debug: false,
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

function test(matcher: string | RegExp): (subject: string) => boolean
function test(matcher: string | RegExp, subject: string): boolean
function test(matcher: string | RegExp, subject?: string) {
  const applyMatcher = (subject: string) => {
    if (isRegExp(matcher)) {
      return matcher.test(subject)
    } else {
      return subject.includes(matcher)
    }
  }

  if (subject === undefined) {
    return applyMatcher
  }

  return applyMatcher(subject)
}

function match(matcher: string | RegExp, subject: string) {
  if (isRegExp(matcher)) {
    return matcher.exec(subject)
  } else {
    const matches = [subject] as RegExpExecArray
    matches.index = subject.indexOf(matcher)
    matches.input = subject
    return matches
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
  chunks: string[] = []

  constructor(private stream: Readable) {
    this.startListening()
  }

  private async startListening() {
    for await (const chunk of this.stream) {
      this.chunks.push(chunk.toString())
    }
  }

  private waitForNextChunk() {
    return new Promise<string>((resolve, reject) => {
      let resolved = false
      this.stream.once('data', (chunk) => {
        if (!resolved) {
          resolved = true
          resolve(chunk.toString())
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

  private matches(matcher: string | RegExp, subject: string) {
    if (!test(matcher, subject)) {
      return null
    }

    const result = match(matcher, subject)

    return {
      stringUntilMatch: subject.slice(0, result.index + result[0].length),
      stringFromMatch: subject.slice(result.index + result[0].length),
    }
  }

  async until(matcher: string | RegExp) {
    // Check if the concatenated string contains the match
    // We need this check for the case where the match is split in mutiple chunks
    const appearanceWithJoin = this.matches(matcher, this.chunks.join(''))
    if (appearanceWithJoin !== null) {
      // console.log(matcher, 'appearanceWithJoin')
      this.chunks = [appearanceWithJoin.stringFromMatch]
      return appearanceWithJoin.stringUntilMatch
    }

    // Check if any of the individual chunks contains the match
    // We need this check because a chunk can override previous chunks by using special chars
    const appearanceWithinChunks = this.chunks.map((chunk) =>
      this.matches(matcher, chunk),
    )
    if (appearanceWithinChunks.some(Boolean)) {
      const index = appearanceWithinChunks.findIndex(Boolean)
      const stringUntilMatch =
        this.chunks.slice(0, index).join('')
        + appearanceWithinChunks[index].stringUntilMatch

      this.chunks = [stringUntilMatch, ...this.chunks.slice(index + 1)]

      // console.log(matcher, 'appearanceWithinChunks')
      return stringUntilMatch
    }

    // From this point forward we know `this.chunks` doesn't contain the match,
    // so we can check for incoming chunks

    let incomingChunk: string
    while ((incomingChunk = await this.waitForNextChunk())) {
      const appearanceInChunk = this.matches(matcher, incomingChunk)

      if (appearanceInChunk !== null) {
        this.chunks = [appearanceInChunk.stringFromMatch]
        // console.log(matcher, 'appearanceInChunk')
        return appearanceInChunk.stringUntilMatch
      }

      // this.chunks should now contain the new chunk
      const appearanceWithNewJoin = this.matches(matcher, this.chunks.join(''))

      if (appearanceWithNewJoin !== null) {
        this.chunks = [appearanceWithNewJoin.stringFromMatch]
        // console.log(matcher, 'appearanceWithNewJoin')
        return appearanceWithNewJoin.stringUntilMatch
      }
    }
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

  return {
    // Although we don't need await here, it seems `write` might be async on windows
    type: async (string: string) => {
      if (optionsWithDefault.debug) {
        // console.log(`[stdin]: ${sanitize(string + '\n')}`)
      }

      return cli.stdin.write(`${string}\n`)
    },
    read: () => cli.then(({ all }) => all),
    readLine: () => reader.until('\n'),
    readUntil: (matcher: string | RegExp) => reader.until(matcher),
    kill: () => cli.cancel(),
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
