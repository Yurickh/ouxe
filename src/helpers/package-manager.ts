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

export enum PackagerName {
  NPM,
  YARN,
}

const packagerConfig = {
  [PackagerName.NPM]: {
    name: 'npm',
    add: 'install',
    dashDev: '--save-dev',
    run: 'run',
  },
  [PackagerName.YARN]: {
    name: 'yarn',
    add: 'add',
    dashDev: '--dev',
    run: 'run',
  },
}

export default function packageManager(manager: PackagerName): PackageManager {
  const { name, add, dashDev, run } = packagerConfig[manager]

  return {
    init: () => runProcess(`${name} init`),
    install: () => runProcess(`${name} install`),
    add: ({ dev, dependencies }) =>
      runProcess(`${name} ${add} ${dev ? dashDev : ''}`, ...dependencies),
    run: (proc, ...args) => runProcess(`${name} ${run} ${proc}`, ...args),
  }
}
