import * as fs from 'fs-extra'
import * as path from 'path'
import clifford from 'clifford'
import reserveFile from './helpers/reserve-file'

const OUXE = require.resolve('.')

const rootPath = (pathName: string): string =>
  path.join(__dirname, '..', pathName)

describe('ouxe', () => {
  let returnFile

  beforeEach(() => {
    returnFile = () => {}
  })

  afterEach(() => {
    returnFile()
  })

  it('runs help', async () => {
    const cli = clifford(OUXE, ['--help'])

    const output = await cli.read()

    expect(output).toMatchSnapshot()
  })

  it('prompts for a packager if none is identified', async () => {
    returnFile = reserveFile(rootPath('yarn.lock'))

    const cli = clifford(OUXE, ['prettier', '--skip-install'], {
      readDelimiter: /\?/,
    })

    const promptPackager = await cli.readLine()
    expect(promptPackager).toMatch(
      'Which package manager do you intend to use?',
    )
    // press enter for yarn
    await cli.type('')
    await cli.readLine()

    const promptWrite = await cli.readLine()
    expect(promptWrite).toMatch(
      'Do you want to immediately run prettier on all files in the project?',
    )

    cli.kill()
  })

  describe('running prettier', () => {
    it('writes all files', async () => {
      const writableFile = path.join(__dirname, 'fixtures/write-prettier.js')
      returnFile = () => fs.removeSync(writableFile)

      fs.writeFileSync(
        writableFile,
        `
      export default function potato  () {
        let a,
        b,
        c

        [a, b, c].forEach(x =>
         0)
      } 
      `,
      )

      const cli = clifford(OUXE, ['prettier', '--skip-install'], {
        readDelimiter: /\(y\/n\)/i,
      })

      const promptWrite = await cli.readLine()
      expect(promptWrite).toMatch(
        'Do you want to immediately run prettier on all files in the project?',
      )
      await cli.type('y')
      // We need to readline again after typing as inquirer will print out what we type
      await cli.readLine()

      const promptPrecommit = await cli.readLine()
      expect(promptPrecommit).toMatch('precommit')

      await cli.type('n')
      await cli.readLine()

      // read until prettier is done running
      await cli.readLine()

      expect(fs.readFileSync(writableFile).toString()).toMatchSnapshot()
    })
  })
})
