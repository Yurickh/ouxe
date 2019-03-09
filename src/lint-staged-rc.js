import * as fs from 'fs-extra'
import * as path from 'path'

const targetFile = './.lintstagedrc.json'

// getBaseConfig := void -> config
const getBaseConfig = () =>
  fs.existsSync(targetFile) ? fs.readJSONSync(targetFile) : {}

// getTargetConfig := feature -> config
const getTargetConfig = feature =>
  fs.readJSONSync(
    path.join(__dirname, '..', 'templates', `${feature}.lintstagedrc.json`),
  )

// mergeJSON := config -> config -> void
const mergeJSON = (featureConfig, baseConfig) =>
  fs.writeJSONSync(targetFile, { ...baseConfig, ...featureConfig })

// mergeFeature := feature -> void
const mergeFeature = feature =>
  mergeJSON(getTargetConfig(feature), getBaseConfig())

export const addEslint = () => mergeFeature('eslint')
export const addPrettier = () => mergeFeature('prettier')
