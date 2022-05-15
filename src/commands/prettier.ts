import { GluegunToolbox } from 'gluegun'
import lintStagedRC from '../templates/prettier.lintstagedrc.json'

export const name = 'prettier'
export const alias = ['p']
export const description = 'Configures prettier for your project'

export const run = async (toolbox: GluegunToolbox) => {
  // If we're skipping congrats, it means we're being run from top-level
  if (toolbox.config.skipCongrats) {
    toolbox.print.divider()
  }
  toolbox.print.info(
    toolbox.print.colors.bold('Configuring your prettier environment'),
  )

  const filesToClean = []
  const lintStaged =
    toolbox.parameters.options.lintStaged
    ?? (await toolbox.prompt.confirm(
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
    const dependencyList = toolbox.print.colors.highlight(
      dependencies.join(', '),
    )

    const spinner = toolbox.print.spin(
      `Installing dependencies: ${dependencyList}`,
    )
    const result = await toolbox.packageManager.add(dependencies, {
      dev: true,
    })

    if (!result.success) {
      spinner.fail(
        `There was an error while installing dependencies during \`${toolbox.print.highlight(
          result.command,
        )}\``,
      )
      toolbox.print.debug(result.stdout)
      process.exit(1)
    } else {
      spinner.succeed(`Installed dependencies: ${dependencyList}`)
    }
  }

  toolbox.print.divider()
  toolbox.print.info(
    toolbox.print.colors.bold('Creating prettier configuration files'),
  )

  const filesToGenerate = ['.prettierrc.json', '.prettierignore']
  const fileList = toolbox.print.colors.highlight(filesToGenerate.join(', '))
  const spinner = toolbox.print.spin(`Creating ${fileList}`)

  for (const file of filesToGenerate) {
    await toolbox.template.generate({
      template: file,
    })

    if (file.endsWith('json')) {
      filesToClean.push(file)
    }
  }

  spinner.succeed(`Created ${fileList}`)

  const write =
    toolbox.parameters.options.write
    ?? (await toolbox.prompt.confirm(
      'Do you want to immediately run prettier on all files in the project?',
    ))

  if (write) {
    const spinner = toolbox.print.spin('Running prettier in your project')
    try {
      const stdout = await toolbox.system.run(
        './node_modules/.bin/prettier --write "./**/*.{ts,js,tsx,jsx,json,md,css}"',
      )
      spinner.succeed()
      toolbox.print.muted(stdout)
    } catch (exception) {
      spinner.fail(
        `There was an error while running prettier during \`${toolbox.print.colors.highlight(
          './node_modules/bin/prettier --write ./**/*.{ts,js,tsx,jsx,json,md,css}',
        )}\``,
      )
      toolbox.print.debug(exception)
      process.exit(1)
    }
  }

  if (lintStaged) {
    toolbox.print.divider()
    toolbox.print.info(
      toolbox.print.colors.bold(
        'Configuring pre-commit hooks to run prettier in changed files',
      ),
    )

    await toolbox.template.generate({
      template: '.huskyrc.json',
    })
    filesToClean.push('.huskyrc.json')
    toolbox.print.info(
      `${toolbox.print.checkmark} Created ${toolbox.print.colors.highlight(
        '.huskyrc.json',
      )}`,
    )

    if (toolbox.filesystem.exists('.lintstagedrc.json')) {
      // Consider moving to an extension
      await toolbox.patching.update('.lintstagedrc.json', (config) => {
        for (const key in lintStagedRC) {
          if (
            config[key]
            && lintStagedRC[key].every((command: string) =>
              config[key].includes(command),
            )
          ) {
            // If the config already has all commands, skip including it
            continue
          }
          config[key] = [...(config[key] ?? []), ...lintStagedRC[key]]
        }
        return config
      })
      toolbox.print.info(
        `Found an existing ${toolbox.print.colors.highlight(
          '.lintstagedrc.json',
        )}, updated it to run prettier in ${toolbox.print.colors.highlight(
          Object.keys(lintStagedRC).join('; '),
        )} files.`,
      )
    } else {
      await toolbox.template.generate({
        template: 'prettier.lintstagedrc.json',
        target: '.lintstagedrc.json',
      })
      toolbox.print.info(
        `${toolbox.print.checkmark} Created ${toolbox.print.colors.highlight(
          '.lintstagedrc.json',
        )}`,
      )
    }
    filesToClean.push('.lintstagedrc.json')
  }

  toolbox.print.divider()
  toolbox.print.info(
    toolbox.print.colors.bold('Running prettier in the freshly created files'),
  )
  const stdout = await toolbox.system.run(
    `./node_modules/.bin/prettier --write ${filesToClean.join(' ')}`,
  )
  toolbox.print.muted(stdout)
  toolbox.print.success(
    `${toolbox.print.checkmark} Your project now has prettier configured!`,
  )

  if (!toolbox.config.skipCongrats) {
    toolbox.print.info('Enjoy your configured workplace!')
    process.exit(0)
  }
}
