import runProcess from './run-process'

export default function packageManager(manager) {
  const isYarn = manager === packageManager.YARN
  const name = isYarn ? 'yarn' : 'npm'
  const add = isYarn ? 'add' : 'install'
  const dashDev = isYarn ? '--dev' : '--save-dev'

  return {
    init: () => runProcess(`${name} init`),
    install: () => runProcess(`${name} install`),
    add: ({ dev, dependencies }) =>
      runProcess(`${name} ${add} ${dev ? dashDev : ''}`, ...dependencies),
  }
}

packageManager.YARN = Symbol('yarn')
packageManager.NPM = Symbol('npm')
