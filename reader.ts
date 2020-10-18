import { EOL } from 'os'
import { EventEmitter } from 'events'
import { Readable } from 'stream'
import { TextDecoder } from 'util'
import { Terminal } from './terminal'
import { EventQueue } from './event-queue'

interface ReaderConfig {
  replacers?: ((chunk: string) => string)[]
  debug?: boolean
}

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

function commonLeadingString(first: string, second: string) {
  return first.slice(
    0,
    first.split('').findIndex((value, index) => value !== second[index]),
  )
}

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

class LineFeedEmitter extends EventEmitter {}

export class Reader {
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

    if (terminalScreen.startsWith(currentScreen)) {
      const diff = terminalScreen.slice(currentScreen.length)
      const [firstLineOfDiff] = diff.split(EOL)

      // We want to skip overriding the whole screen if the client cleans up the screen to
      // prepare the next print. Instead, we rely that the startsWith check will take care
      // of cleaning up if everything is changed.
      if (terminalScreen !== '') {
        this.screen += firstLineOfDiff + EOL
      }

      return firstLineOfDiff
    } else {
      const commonBase = commonLeadingString(currentScreen, terminalScreen)
      const diff = terminalScreen.slice(commonBase.length)
      const [firstLineOfDiff] = diff.split(EOL)

      if (terminalScreen !== '') {
        this.screen = commonBase + firstLineOfDiff + EOL
      }

      return firstLineOfDiff
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
