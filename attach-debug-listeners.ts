import { ChildProcess } from 'child_process'

export default function attachDebugListeners(cli: ChildProcess): void {
  if (cli.stdin === null || cli.stdout === null || cli.stderr === null) {
    throw new Error(
      '[Clifford]: While attaching listeners, stdio seems to be misconfigured',
    )
  }

  cli.stdin.on('data', (data) => {
    console.log('[stdin]: ', data.toString(), '[/stdin]')
  })

  cli.stdout.on('data', (data) => {
    console.log('[stdout]: ', data.toString(), '[/stdout]')
  })

  cli.stderr.on('data', (data) => {
    console.log('[stderr]: ', data.toString(), '[/stderr]')
  })
}
