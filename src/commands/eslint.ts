import { GluegunToolbox } from 'gluegun'
import lintStagedRC from '../templates/eslint.lintstagedrc.json'

export const name = 'eslint'
export const alias = ['e']
export const description = 'Configures eslint for your project'

export const run = async (toolbox: GluegunToolbox) => {
  const shouldContinue = toolbox.prompt.confirm(
    '⚠️  This option is still under development. You might get to strange places. Are you sure you want to continue?',
    false,
  )

  if (!shouldContinue) {
    return
  }

  const lintStaged =
    toolbox.parameters.options.lintStaged
    ?? (await toolbox.prompt.confirm(
      'Do you want to run eslint as a precommit lint process?',
      true,
    ))

  const dependencies = ['eslint']

  if (lintStaged) {
    dependencies.push('husky')
    dependencies.push('lint-staged')
  }

  if (!toolbox.parameters.options.skipInstall) {
    const spinner = toolbox.print.spin(
      `Installing dependencies: ${dependencies.join(', ')}`,
    )
    const result = await toolbox.packageManager.add(dependencies, {
      dev: true,
    })

    if (!result.success) {
      spinner.fail(
        `There was an error while installing dependencies during \`${result.command}\``,
      )
      toolbox.print.debug(result.stdout)
      process.exit(1)
    } else {
      spinner.succeed(`Installed dependencies: ${dependencies.join(', ')}`)
    }
  }

  toolbox.print.info('✨  Creating eslint configuration')
  // TODO: create eslint template
  // copyTemplate('.eslintrc')
  toolbox.template.generate({ template: '.eslintignore' })

  if (toolbox.parameters.options.lintStaged) {
    toolbox.template.generate({ template: '.huskyrc.json' })
    if (toolbox.filesystem.exists('.lintstagedrc.json')) {
      // Consider moving to an extension
      await toolbox.patching.update('.lintstagedrc.json', (config) => {
        for (const key in lintStagedRC) {
          config[key] = lintStagedRC[key]
        }
        return config
      })
    } else {
      const stdout = await toolbox.template.generate({
        template: 'prettier.lintstagedrc.json',
        target: '.lintstagedrc.json',
      })
      toolbox.print.info(stdout)
    }
  }

  toolbox.print.success('✅  Your project now has eslint configured!')

  if (!toolbox.config.skipCongrats) {
    toolbox.print.info('🎉  Enjoy your configured workplace!')
  }
}
