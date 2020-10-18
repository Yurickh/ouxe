// TODO: change these to use the ansi parser as well

import { ExecaChildProcess } from 'execa'
import { Transform } from 'stream'

export function sanitize(input: string) {
  return JSON.stringify(
    input
      .toString()
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[\d{0,3}[\w]/g, '')
      .replace(/^\s/g, ''),
  )
}

class PrefixStream extends Transform {
  prefix: string

  constructor(prefix: string) {
    super()

    this.prefix = prefix
  }

  _transform(
    chunk: string,
    _encoding: 'utf8',
    done: (error: Error | null, data: string) => void,
  ) {
    done(null, `[${this.prefix}]: ${sanitize(chunk)}\n`)
  }
}

export default function attachDebugListeners(
  command: string,
  cli: ExecaChildProcess,
) {
  cli.all.pipe(new PrefixStream(command)).pipe(process.stdout)
}
