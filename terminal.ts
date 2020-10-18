import AnsiParser from 'node-ansiparser'
import { AnsiTerminal } from 'node-ansiterminal'

export class Terminal {
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
