import * as fs from 'fs-extra'
import installDependencies from './install-dependencies'
import templateFolder from '../template-folder'

const targetFile = './.lintstagedrc.json'

interface Config {
  [pattern: string]: string[]
}

type Feature = 'prettier' | 'eslint'

const getBaseConfig = (): Config =>
  fs.existsSync(targetFile) ? fs.readJSONSync(targetFile) : {}

const getTargetConfig = (feature: Feature): Config =>
  fs.readJSONSync(templateFolder(`${feature}.lintstagedrc.json`))

const mergeJSON = async (
  featureConfig: Config,
  baseConfig: Config,
): Promise<void> => {
  const packager = await installDependencies({ skipInstall: true })

  fs.writeJSONSync(
    targetFile,
    { ...baseConfig, ...featureConfig },
    { spaces: 2 },
  )

  await packager.run('prettier --write', targetFile)
}

const mergeFeature = (feature: Feature): Promise<void> =>
  mergeJSON(getTargetConfig(feature), getBaseConfig())

export const addEslint = (): Promise<void> => mergeFeature('eslint')
export const addPrettier = (): Promise<void> => mergeFeature('prettier')
