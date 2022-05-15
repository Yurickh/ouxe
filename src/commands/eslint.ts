import { GluegunToolbox } from 'gluegun'
import lintStagedRC from '../templates/eslint.lintstagedrc.json'

export const name = 'eslint'
export const alias = ['e']
export const description = 'Configures eslint for your project'

export const run = async (toolbox: GluegunToolbox) => {
  // If we're skipping congrats, it means we're being run from top-level
  if (toolbox.config.skipCongrats) {
    toolbox.print.divider()
  }
  toolbox.print.info(
    toolbox.print.colors.bold('Configuring your eslint environment'),
  )

  const shouldContinue = await toolbox.prompt.confirm(
    'This option is still under development. You might get to strange places. Are you sure you want to continue?',
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
    toolbox.print.colors.bold('Creating eslint configuration files'),
  )

  // TODO: Create template for .eslintrc
  const filesToGenerate = ['.eslintignore']
  const fileList = toolbox.print.colors.highlight(filesToGenerate.join(', '))
  const spinner = toolbox.print.spin(`Creating ${fileList}`)

  await toolbox.template.generate({ template: '.eslintignore' })

  spinner.succeed(`Created ${fileList}`)

  if (toolbox.parameters.options.lintStaged) {
    toolbox.print.divider()
    toolbox.print.info(
      toolbox.print.colors.bold(
        'Configuring pre-commit hooks to run prettier in changed files',
      ),
    )
    await toolbox.template.generate({ template: '.huskyrc.json' })
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
        )}, updated it to run eslint in ${toolbox.print.colors.highlight(
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
  }

  toolbox.print.success(
    `${toolbox.print.checkmark} Your project now has eslint configured!`,
  )

  if (!toolbox.config.skipCongrats) {
    toolbox.print.info('Enjoy your configured workplace!')
    process.exit(0)
  }
}
