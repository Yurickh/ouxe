import execa from 'execa'
import { TextDecoder } from 'util'
import { Readable } from 'stream'
import AnsiParser from 'node-ansiparser'
import { AnsiTerminal } from 'node-ansiterminal'
import attachDebugListeners from './attach-debug-listeners'

interface CliffordOptions {
  readTimeout: number | false
  debug: boolean
  useBabelNode: boolean
  replacers: ((chunk: string) => string)[]
}

const defaultConfig = (command: string) => ({
  debug: false,
  readTimeout: 1000,
  useBabelNode: !command.endsWith('.js'),
  replacers: [],
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

function commonLeadingString(first: string, second: string) {
  return first.slice(
    0,
    first.split('').findIndex((value, index) => value !== second[index]),
  )
}

const spawnNode = (command: string, args: string[]) =>
  execa('node', ['--', command, ...args], execaOptions())

const spawnBabelNode = (command: string, args: string[]) =>
  execa(
    'babel-node',
    ['--extensions', '.ts,.js', '--', command, ...args],
    execaOptions(),
  )

/**
 * Normalizes the chunk so its read the same accross platforms. This means:
 * - adding a carriage return after a feed, as AnsiTerminal doesn't properly pick it up
 * - removing the ❯ character, as it seems to be read as > in windows
 * @param chunk A chunk of the readable stream of cli.all
 */
const normalizeChunk = (
  chunk: Uint8Array,
  replacers: ((chunk: string) => string)[],
) => {
  const newBuffer = new Uint8Array(
    Array.from(chunk).reduce((chunk, char) => {
      return [...chunk, ...(char === 10 ? [10, 13] : [char])]
    }, []),
  )

  return replacers.reduce(
    (string, replacer) => replacer(string),
    new TextDecoder().decode(newBuffer),
  )
}

class Reader {
  screen: string
  parser: AnsiParser
  terminal: AnsiTerminal

  constructor(
    private stream: Readable,
    replacers: ((chunk: string) => string)[],
  ) {
    this.screen = ''
    // COMBAK: maybe add options to config these
    this.terminal = new AnsiTerminal(1000, 1000, 1000)
    this.parser = new AnsiParser(this.terminal)
    this.startListening(replacers)
  }

  private startListening(replacers: ((chunk: string) => string)[]) {
    this.stream.on('data', (chunk) => {
      this.parser.parse(normalizeChunk(chunk, replacers))
    })
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

  private updateScreen() {
    const currentScreen = this.screen
    const terminalScreen = this.readScreen()

    // We want to skip overriding the whole screen if the client cleans up the screen to
    // prepare the next print. Instead, we rely that the startsWith check will take care
    // of cleaning up if everything is changed.
    if (terminalScreen !== '') {
      this.screen = terminalScreen
    }

    if (terminalScreen.startsWith(currentScreen)) {
      return terminalScreen.slice(currentScreen.length)
    } else {
      return terminalScreen.slice(
        commonLeadingString(currentScreen, terminalScreen).length,
      )
    }
  }

  public readScreen() {
    return this.terminal.toString().trimRight()
  }

  public async until(matcher: string | RegExp) {
    if (test(matcher, this.readScreen())) {
      return this.updateScreen()
    }

    while (await this.waitForNextChunk()) {
      // We update the screen on every iteration so we get only the final chunk by the end
      const diff = this.updateScreen()
      if (test(matcher, diff)) {
        return diff
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

  const reader = new Reader(cli.all, optionsWithDefault.replacers)

  return {
    // Although we don't need await here, it seems `write` might be async on windows
    type: async (string: string) => cli.stdin.write(`${string}\n`),
    read: () => cli.then(({ all }) => all),
    readScreen: () => reader.readScreen(),
    readLine: () => reader.until('\n'),
    readUntil: (matcher: string | RegExp) => reader.until(matcher),
    kill: () => cli.cancel(),
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
