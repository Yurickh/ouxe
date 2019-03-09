import runProcess from './run-process'

export default function packageManager(manager) {
  const isYarn = manager === packageManager.YARN
  const name = isYarn ? 'yarn' : 'npm'
  const add = isYarn ? 'add' : 'install'
  const dashDev = isYarn ? '--dev' : '--save-dev'
  const run = isYarn ? '' : 'run'

  return {
    init: () => runProcess(`${name} init`),
    install: () => runProcess(`${name} install`),
    add: ({ dev, dependencies }) =>
      runProcess(`${name} ${add} ${dev ? dashDev : ''}`, ...dependencies),
    run: (proc, ...args) => runProcess(`${name} ${run} ${proc}`, args),
  }
}

packageManager.YARN = Symbol('yarn')
packageManager.NPM = Symbol('npm')
