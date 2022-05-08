import { GluegunToolbox } from 'gluegun'
import lintStagedRC from '../templates/prettier.lintstagedrc.json'

export const name = 'prettier'
export const alias = ['p']

export const description = 'Opinionated prettier configuration'

export const run = async (toolbox: GluegunToolbox, skipCongrats = false) => {
  const filesToClean = []
  const lintStaged =
    toolbox.parameters.options.lintStaged
    || (await toolbox.prompt.confirm(
      'Do you want to run prettier as a precommit lint process?',
      true,
    ))

  // Using better version of prettier
  const dependencies = ['prettier@npm:@btmills/prettier']

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

  toolbox.print.info('✨  Creating prettier configuration')

  let spinner = toolbox.print.spin(' Creating .prettierrc.json')
  await toolbox.template.generate({
    template: '.prettierrc.json',
  })
  filesToClean.push('.prettierrc.json')
  spinner.succeed('Created .prettierrc.json')

  spinner = toolbox.print.spin(' Creating .prettierignore')
  await toolbox.template.generate({
    template: '.prettierignore',
  })
  spinner.succeed('Created .prettierignore')

  const write =
    toolbox.parameters.options.write
    || (await toolbox.prompt.confirm(
      'Do you want to immediately run prettier on all files in the project?',
    ))

  if (write) {
    try {
      await toolbox.system.run(
        './node_modules/.bin/prettier --write "./**/*.{ts,js,tsx,jsx,json,md,css}"',
      )
    } catch (exception) {
      toolbox.print.debug(exception)
      toolbox.print.error(
        `There was an error while running prettier during \`./node_modules/bin/prettier --write ./**/*.{ts,js,tsx,jsx,json,md,css}\``,
      )
      process.exit(1)
    }
  }

  if (lintStaged) {
    toolbox.print.info(
      '✨  Configuring pre-commit hooks to run prettier in changed files',
    )

    await toolbox.template.generate({
      template: '.huskyrc.json',
    })
    filesToClean.push('.huskyrc.json')

    if (toolbox.filesystem.exists('.lintstagedrc.json')) {
      // Consider moving to an extension
      await toolbox.patching.update('.lintstagedrc.json', (config) => {
        for (const key in lintStagedRC) {
          config[key] = lintStagedRC[key]
        }
        return config
      })
    } else {
      await toolbox.template.generate({
        template: 'prettier.lintstagedrc.json',
        target: '.lintstagedrc.json',
      })
    }
    filesToClean.push('.lintstagedrc.json')
  }

  toolbox.print.info('✨  Running prettier in the freshly created files')
  await toolbox.system.run(
    `./node_modules/.bin/prettier --write ${filesToClean.join(' ')}`,
  )

  toolbox.print.success('✅  Your project now has prettier configured!')

  if (!skipCongrats) {
    toolbox.print.info('🎉  Enjoy your configured workplace!')
    // why do we need this?
    process.exit(0)
  }
}
