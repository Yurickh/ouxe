import runProcess from './run-process'

export interface PackageManager {
  init: () => Promise<void>
  install: () => Promise<void>
  add: ({
    dev,
    dependencies,
  }: {
    dev: boolean
    dependencies: string[]
  }) => Promise<void>
  run: (proc: string, ...args: string[]) => Promise<void>
}

export default function packageManager(manager): PackageManager {
  const isYarn = manager === packageManager.YARN
  const name = isYarn ? 'yarn' : 'npm'
  const add = isYarn ? 'add' : 'install'
  const dashDev = isYarn ? '--dev' : '--save-dev'
  const run = 'run'

  return {
    init: () => runProcess(`${name} init`),
    install: () => runProcess(`${name} install`),
    add: ({ dev, dependencies }) =>
      runProcess(`${name} ${add} ${dev ? dashDev : ''}`, ...dependencies),
    run: (proc, ...args) => runProcess(`${name} ${run} ${proc}`, ...args),
  }
}

packageManager.YARN = Symbol('yarn')
packageManager.NPM = Symbol('npm')
