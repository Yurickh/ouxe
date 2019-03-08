import * as fs from 'fs-extra'
import * as path from 'path'
import gStatus from 'g-status'

import runProcess from './run-process'

function copyTemplate(name) {
  fs.copySync(path.join(__dirname, '..', 'templates', name), `./${name}`)
}

export default async function configurePrettier({ write, commit, lintStaged }) {
  console.log('✨ Creating prettier configuration')
  const currentModified = await gStatus()

  if (write && currentModified.length !== 0) {
    console.log(
      "🐙 Don't worry about your unfinished work, we're storing it in a stash",
    )
    await runProcess('git stash save -u', 'Stash before running prettier')
  }

  copyTemplate('.prettierrc')
  copyTemplate('.prettierignore')

  if (write) {
    try {
      await runProcess(
        'npx prettier --write ./**/*.{ts,js,tsx,jsx,json,md,css}',
      )
    } catch (exception) {
      console.error(
        `🚨  There was an error while running prettier during [${
          exception.command
        }]`,
      )
      process.exit(1)
    }
  }

  if (commit) {
    const afterPrettierModifier = await gStatus()

    if (afterPrettierModifier.length === 0) {
      console.log(
        '💅  We really wanted to commit, but your files are already pretty!',
      )
    } else {
      try {
        await runProcess('git add .')
        await runProcess(
          'git commit -m',
          '💅 Run prettier in all files of the project',
        )
      } catch (exception) {
        console.error(
          `🚨  There was an error while commiting modifications during [${
            exception.command
          }]`,
        )
        process.exit(1)
      }
    }
  }

  if (lintStaged) {
    copyTemplate('.huskyrc')
    copyTemplate('.lintstagedrc')
  }

  console.log('✅ Your project now has prettier configured!')
}
