import * as fs from 'fs-extra'
import * as inquirer from 'inquirer'

import packageManager, { PackageManager, PackagerName } from './package-manager'

interface Argv {
  skipInstall?: boolean
}

export default async function installDependencies(
  argv: Argv,
): Promise<PackageManager> {
  const hasYarnLock = fs.existsSync('./yarn.lock')
  const hasPackageLock = fs.existsSync('./package-lock.json')
  const noLock = !hasYarnLock && !hasPackageLock

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'packageManager',
      message: 'Which package manager do you intend to use?',
      choices: [
        { name: 'yarn', value: PackagerName.YARN },
        { name: 'npm', value: PackagerName.NPM },
      ],
      when: noLock,
    },
  ])

  const packager = packageManager(
    answers.packageManager
      || (hasYarnLock && PackagerName.YARN)
      || (hasPackageLock && PackagerName.NPM),
  )

  if (!fs.existsSync('./package.json')) {
    console.log('📦  Creating package.json')
    try {
      await packager.init()
    } catch (exception) {
      console.error('🚨  There was an error while initing package.json')
      process.exit(1)
    }
  }

  if (noLock && !argv.skipInstall) {
    console.log('📦  Installing base packages')
    try {
      await packager.install()
    } catch (exception) {
      console.error('🚨  There was an error while installing dependencies')
      process.exit(1)
    }
  }

  return packager
}
