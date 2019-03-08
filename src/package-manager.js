import runProcess from './run-process'

export default function packageManager(name) {
  const isYarn = name === 'yarn'
  const add = isYarn ? 'add' : 'install'
  const dashDev = isYarn ? '--dev' : '--save-dev'

  return {
    init: () => runProcess(`${name} init`),
    install: () => runProcess(`${name} install`),
    add: ({ dev, dependencies }) =>
      runProcess(`${name} ${add} ${dev ? dashDev : ''}`, ...dependencies),
  }
}
