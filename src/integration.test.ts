import * as fs from 'fs-extra'
import * as path from 'path'
import clifford from '../clifford'
import reserveFile from './helpers/reserve-file'

const rootPath = (pathName: string): string =>
  path.join(__dirname, '..', pathName)

const runOuxe = (args: string[], options: object = {}) =>
  clifford('./src/index.ts', args, {
    ...options,
    replacers: [
      // Inquirer seems to avoid using fancy characters in windows
      (chunk) => chunk.replace(/❯/g, '>'),
      (chunk) => chunk.replace(/◯/g, '( )'),
    ],
  })

describe('ouxe', () => {
  let cli: ReturnType<typeof clifford>
  let returnFile: () => void

  beforeEach(() => {
    returnFile = () => undefined
  })

  afterEach(async () => {
    returnFile()
    cli.kill()
    await cli.untilClose()
  })

  it('runs help', async () => {
    cli = runOuxe(['--help'])

    expect(await cli.read()).toMatchSnapshot()
  })

  it('prompts for a packager if none is identified', async () => {
    returnFile = reserveFile(rootPath('yarn.lock'))

    cli = runOuxe(['prettier', '--skip-install'])

    await cli.findByText('Which package manager do you intend to use?')
    // press enter for yarn
    await cli.type('')

    const promptWrite = await cli.findByText(
      /Do you want to immediately run prettier/,
    )
    expect(promptWrite).toMatch(
      'Do you want to immediately run prettier on all files in the project?',
    )
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
        c;

        [a, b, c].forEach(x =>
         0)
      } 
      `,
      )

      cli = runOuxe(['prettier', '--skip-install'])

      const promptWrite = await cli.readUntil(
        'Do you want to immediately run prettier',
      )
      expect(promptWrite).toMatch(
        'Do you want to immediately run prettier on all files in the project?',
      )
      await cli.type('y')

      const promptPrecommit = await cli.readUntil('precommit')
      expect(promptPrecommit).toMatchInlineSnapshot(`
        "
        ? 💅  Do you want to run prettier as a precommit lint process? (Y/n)"
      `)

      await cli.type('n')

      await cli.readUntil('Enjoy your configured workplace')

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

      cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(
        /Which documents do you want to create/m,
      )
      expect(promptDocument).toMatchInlineSnapshot(
        `"? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog"`,
      )

      await cli.type('a')

      const promptLicense = await cli.readUntil(/which license/)
      expect(promptLicense).toMatchInlineSnapshot(`
        "
        ? 📄  Please choose which license you want for your project: (Use arrow keys or"
      `)

      await cli.type('MIT')
      const selectedProject = await cli.readUntil('> MIT')

      expect(selectedProject).toMatchInlineSnapshot(`
        "
        > MIT"
      `)

      await cli.type('')

      const promptUsername = await cli.readUntil(/name of the user/)
      // Funny enough, inquirer _will_ break the text at 80cols
      expect(promptUsername).toMatchInlineSnapshot(`
        "
        ? 👓  What's the name of the user that'll sign the license (Yurick <ouxe@yurick."
      `)

      // Press enter to confirm default
      await cli.type('')

      await cli.readUntil(/provide an email/)
      expect(cli.readScreen()).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)Code of Conduct, License
        ? 📄  Please choose which license you want for your project: MIT
        ? 👓  What's the name of the user that'll sign the license Yurick <ouxe@yurick.d
        ev>
        ? 📞 Please provide an email for contact"
      `)

      await cli.type('clifford@yurick.me')
      await cli.type('')

      await cli.readUntil(/Created file/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
      expect(fs.readFileSync(coc).toString()).toMatchSnapshot()
    })

    it('creates a CODE_OF_CONDUCT.md', async () => {
      const codeOfConduct = rootPath('CODE_OF_CONDUCT.md')
      returnFile = reserveFile(codeOfConduct)

      cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(/which documents/i)
      expect(promptDocument).toMatchInlineSnapshot(
        `"? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog"`,
      )

      // Press space to select Code of Conduct
      await cli.type(' ')

      const promptEmail = await cli.readUntil(/provide an email/)
      expect(promptEmail).toMatchInlineSnapshot(`
        "
        ? 📞 Please provide an email for contact"
      `)

      await cli.type('clifford@yurick.me')
      await cli.readUntil(/Enjoy your configured workplace/)

      expect(fs.readFileSync(codeOfConduct).toString()).toMatchSnapshot()
    })

    it('creates a LICENSE file', async () => {
      const license = rootPath('LICENSE')

      returnFile = reserveFile(license)

      cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(/which documents/i)
      expect(promptDocument).toMatchInlineSnapshot(
        `"? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog"`,
      )

      // spacebar invert will select LICENSE (I'm yet to learn how to press down)
      await cli.type(' i')

      const promptLicense = await cli.readUntil(/which license/)
      expect(promptLicense).toMatchInlineSnapshot(`
        "
        ? 📄  Please choose which license you want for your project: (Use arrow keys or"
      `)

      await cli.type('MIT')
      const selectedProject = await cli.readUntil('> MIT')

      expect(selectedProject).toMatchInlineSnapshot(`
        "
        > MIT"
      `)

      await cli.type('')

      const promptUsername = await cli.readUntil(/name of the user/)
      expect(promptUsername).toMatchInlineSnapshot(`
        "
        ? 👓  What's the name of the user that'll sign the license (Yurick <ouxe@yurick."
      `)

      // Press enter to confirm default
      await cli.type('')

      await cli.readUntil(/Enjoy your configured workplace/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
    })
  })
})
