import spawn from 'cross-spawn'

export default function runProcess(
  process: string,
  ...moreArgs: string[]
): Promise<void> {
  const [base, ...args] = process.split(' ')
  const allArgs = [...args, ...moreArgs]

  return new Promise((resolve, reject): void => {
    const child = spawn(base, allArgs, { stdio: 'inherit' })
    child.on('close', (code): void => {
      if (code !== 0) {
        reject({
          command: `${base} ${allArgs.join(' ')}`,
        })
      } else {
        resolve()
      }
    })
  })
}
