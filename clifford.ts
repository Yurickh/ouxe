import { EOL } from 'os'
import execa from 'execa'
import { TextDecoder } from 'util'
import { Readable } from 'stream'
import { EventEmitter } from 'events'
import AnsiParser from 'node-ansiparser'
import { AnsiTerminal } from 'node-ansiterminal'

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
 * Normalizes the chunk so its read the same accross platforms.
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

interface ReaderConfig {
  replacers?: ((chunk: string) => string)[]
  debug?: boolean
}

class EventQueue {
  private readPointer: number
  private writePointer: number

  constructor(private emitter: EventEmitter, private event: string) {
    this.readPointer = 0
    this.writePointer = 0

    this.emitter.on(this.event, this.write)
  }

  private write() {
    ++this.writePointer
  }

  private isLagging() {
    return this.readPointer < this.writePointer
  }

  public dispose() {
    this.emitter.off(this.event, this.write)
  }

  public async next() {
    return new Promise<true>((resolve) => {
      if (this.isLagging()) {
        ++this.readPointer
        resolve(true)
      }

      this.emitter.once(this.event, () => {
        ++this.readPointer
        resolve(true)
      })
    })
  }
}

class Terminal {
  parser: AnsiParser
  terminal: AnsiTerminal

  constructor() {
    this.terminal = new AnsiTerminal(1000, 1000, Infinity)
    this.parser = new AnsiParser(this.terminal)
  }

  public read(): string {
    return this.terminal.toString()
  }

  public write(chunk: string): void {
    return this.parser.parse(chunk)
  }
}

class LineFeedEmitter extends EventEmitter {}

class Reader {
  screen: string
  terminal: Terminal
  debug: boolean
  lineFeedEmitter: LineFeedEmitter

  constructor(private stream: Readable, config: ReaderConfig) {
    this.screen = ''
    this.terminal = new Terminal()
    this.debug = config.debug ?? false
    // Turns out o que a gente quer aqui não é um emitter, e sim uma stream mesmo,
    // porque o emitter só vai notificar o pessoal que já está subscrito, mas a gente
    // quer _esperar_ o próximo evento, mesmo se ele já aconteceu
    this.lineFeedEmitter = new LineFeedEmitter()

    this.startListening(config.replacers)
  }

  private startListening(replacers: ((chunk: string) => string)[]) {
    this.stream.on('data', (chunk) => {
      normalizeChunk(chunk, replacers)
        .split(EOL)
        .forEach((chunkLine, index, array) => {
          // We want to setImmediate so each line feed is reacted to independently
          setImmediate(() => {
            this.terminal.write(
              chunkLine + (index + 1 === array.length ? '' : EOL),
            )
            this.lineFeedEmitter.emit('line')

            if (this.debug) {
              console.info('[current screen]\n', this.readScreen())
            }
          })
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

  // TODO: this doesn't seem to work :T
  public untilClose() {
    return new Promise((resolve) => {
      this.stream.once('close', () => {
        resolve()
      })
    })
  }

  public readScreen() {
    // TODO: add types to terminal
    return this.terminal.read().trimRight()
  }

  /**
   * Method to wait until a line is printed with a given string.
   * @param matcher The string you're looking for, or a regex expression to match.
   */
  public async until(matcher: string | RegExp) {
    const eventQueue = new EventQueue(this.lineFeedEmitter, 'line')
    do {
      // We update the screen on every iteration so we get only the final chunk by the end
      const diff = this.updateScreen()
      if (test(matcher, diff)) {
        eventQueue.dispose()
        return diff
      }
    } while (await eventQueue.next())
  }

  /**
   * Method to find a line in the screen that matches the matcher.
   * Will search from bottom to top and return the first line that matches.
   * @param matcher The screen you're looking for, or a regex expression to match.
   */
  public async findByText(matcher: string | RegExp) {
    const screen = this.readScreen()

    if (!test(matcher, screen)) {
      return this.until(matcher)
    }

    return screen.split(EOL).reverse().find(test(matcher))
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

  const stringification = `[Clifford instance: running process for \`${command}\` with args \`${JSON.stringify(
    args,
  )}\` ]`

  const reader = new Reader(cli.all, {
    debug: optionsWithDefault.debug,
    replacers: optionsWithDefault.replacers,
  })

  return {
    // Although we don't need await here, it seems `write` might be async on windows
    type: async (string: string) => cli.stdin.write(`${string}\n`),
    read: () => cli.then(({ all }) => all),
    findByText: (matcher: string | RegExp) => reader.findByText(matcher),
    readScreen: () => reader.readScreen(),
    readUntil: (matcher: string | RegExp) => reader.until(matcher),
    untilClose: () =>
      Promise.race([
        reader.untilClose(),
        new Promise((resolve) => {
          cli.once('close', resolve)
        }),
      ]),
    kill: () => cli.cancel(),
    toString: () => stringification,
    toJSON: () => stringification,
  }
}
/**
 * Hey there Yurick from the future! I hope you're having a good time :)~
 * The last thing you noticed you needed to do here was to make so the read methods do it by
 * a per-line basis. That means you'll have to add some logic on the until method so it returns
 * the line that matched, and we skip adding the lines that came after that to the internal screen
 * representation.
 * This is the best solution because sometimes inquirer will yield two chunks or one chunk for the
 *  same strings, which makes it super hard to do snapshot testing.
 * Good luck! :hug:
 */
