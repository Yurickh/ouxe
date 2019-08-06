import * as fs from 'fs-extra'
import * as path from 'path'

const targetFile = './.lintstagedrc.json'

interface Config {
  [pattern: string]: string[]
}

type Feature = 'prettier' | 'eslint'

const getBaseConfig = (): Config =>
  fs.existsSync(targetFile) ? fs.readJSONSync(targetFile) : {}

const getTargetConfig = (feature: Feature): Config =>
  fs.readJSONSync(
    path.join(__dirname, '..', 'templates', `${feature}.lintstagedrc.json`),
  )

const mergeJSON = (featureConfig: Config, baseConfig: Config): void =>
  fs.writeJSONSync(
    targetFile,
    { ...baseConfig, ...featureConfig },
    { spaces: 2 },
  )

const mergeFeature = (feature: Feature): void =>
  mergeJSON(getTargetConfig(feature), getBaseConfig())

export const addEslint = (): void => mergeFeature('eslint')
export const addPrettier = (): void => mergeFeature('prettier')
