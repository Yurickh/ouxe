import spawn from 'cross-spawn'

export default function runProcess(process, ...moreArgs) {
  const [base, ...args] = process.split(' ')
  const allArgs = [...args, ...moreArgs]

  return new Promise((resolve, reject) => {
    const child = spawn(base, allArgs, { stdio: 'inherit' })
    child.on('close', code => {
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
