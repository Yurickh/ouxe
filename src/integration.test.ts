import * as fs from 'fs-extra'
import * as path from 'path'
import clifford from 'clifford'
import reserveFile from './helpers/reserve-file'

const OUXE = require.resolve('.')

// TODO: consider moving these to clifford
const clearColorMarkers = (string: string): string =>
  // eslint-disable-next-line no-control-regex
  string.replace(/\x1b\[\d{0,3}[\w]/g, '').replace(/^\s/g, '')

type Clifford = any

type ReadUntilOptions = {
  stopAppearing?: boolean
  log?: boolean
}

const readUntil = async (
  cli: Clifford,
  regex: RegExp,
  options: ReadUntilOptions = {},
): Promise<string> => {
  let waiting: string
  let appears = false

  do {
    waiting = await cli.readLine()
    appears = regex.test(waiting)

    if (options.log) {
      console.log({
        waiting,
        appears,
      })
    }
  } while (options.stopAppearing ? appears : !appears)

  return waiting
}

const rootPath = (pathName: string): string =>
  path.join(__dirname, '..', pathName)

describe('ouxe', () => {
  let returnFile: () => void

  beforeEach(() => {
    returnFile = () => undefined
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

  describe('running documents', () => {
    it('creates both files', async () => {
      const coc = rootPath('CODE_OF_CONDUCT.md')
      const license = rootPath('LICENSE')
      const returnLicense = reserveFile(license)
      const returnCOC = reserveFile(coc)

      returnFile = () => {
        returnLicense()
        returnCOC()
      }

      const cli = clifford(OUXE, ['documents', '--skip-install'], {
        readDelimiter: /\[32m\?/,
      })

      const promptDocument = await cli.readLine()
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      await cli.type('a')

      const promptLicense = await readUntil(cli, /which license/)
      expect(clearColorMarkers(promptLicense)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: (Use arrow keys or 
        type to search)
        ❯ 0BSD 
          AAL 
          AFL-1.1 
          AFL-1.2 
          AFL-2.0 
          AFL-2.1 
          AFL-3.0 
        (Move up and down to reveal more choices)"
      `)

      await cli.type('MIT')
      const selectedProject = await readUntil(cli, /(0BSD|Searching)/, {
        stopAppearing: true,
      })

      expect(clearColorMarkers(selectedProject)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: MIT
        ❯ MIT "
      `)

      await cli.type('')

      const promptUsername = await readUntil(cli, /name of the user/)
      expect(clearColorMarkers(promptUsername)).toMatchInlineSnapshot(`
        "? 👓  What's the name of the user that'll sign the license (Yurick <yurick.hausc
        hild@gmail.com>) "
      `)

      // Press enter to confirm default
      await cli.type('')

      const promptEmail = await readUntil(cli, /provide an email/)
      expect(clearColorMarkers(promptEmail)).toMatchInlineSnapshot(
        `"? 📞 Please provide an email for contact "`,
      )

      await cli.type('clifford@yurick.me')
      await cli.type('')

      await readUntil(cli, /Created file/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
      expect(fs.readFileSync(coc).toString()).toMatchSnapshot()
    })

    it('creates a CODE_OF_CONDUCT.md', async () => {
      const writableFile = rootPath('CODE_OF_CONDUCT.md')
      returnFile = reserveFile(writableFile)

      const cli = clifford(OUXE, ['documents', '--skip-install'], {
        readDelimiter: /\[32m\?/,
      })

      const promptDocument = await cli.readLine()
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      // Press space to select Code of Conduct
      cli.type(' ')

      const promptEmail = await readUntil(cli, /provide an email/)
      expect(clearColorMarkers(promptEmail)).toMatchInlineSnapshot(
        `"? 📞 Please provide an email for contact "`,
      )

      await cli.type('clifford@yurick.me')
      await cli.type('')

      await readUntil(cli, /Enjoy your configured workplace/)

      expect(fs.readFileSync(writableFile).toString()).toMatchSnapshot()
    })

    it('creates a LICENSE file', async () => {
      const license = rootPath('LICENSE')

      returnFile = reserveFile(license)

      const cli = clifford(OUXE, ['documents', '--skip-install'], {
        readDelimiter: /\[32m\?/,
      })

      const promptDocument = await cli.readLine()
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      // spacebar invert will select LICENSE (I'm yet to learn how to press down)
      await cli.type(' i')

      const promptLicense = await readUntil(cli, /which license/)
      expect(clearColorMarkers(promptLicense)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: (Use arrow keys or 
        type to search)
        ❯ 0BSD 
          AAL 
          AFL-1.1 
          AFL-1.2 
          AFL-2.0 
          AFL-2.1 
          AFL-3.0 
        (Move up and down to reveal more choices)"
      `)

      await cli.type('MIT')
      const selectedProject = await readUntil(cli, /(0BSD|Searching)/, {
        stopAppearing: true,
      })

      expect(clearColorMarkers(selectedProject)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: MIT
        ❯ MIT "
      `)

      await cli.type('')

      const promptUsername = await readUntil(cli, /name of the user/)
      expect(clearColorMarkers(promptUsername)).toMatchInlineSnapshot(`
        "? 👓  What's the name of the user that'll sign the license (Yurick <yurick.hausc
        hild@gmail.com>) "
      `)

      // Press enter to confirm default
      await cli.type('')

      await readUntil(cli, /Enjoy your configured workplace/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
    })
  })
})
