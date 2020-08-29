import * as fs from 'fs-extra'
import * as path from 'path'
import clifford from '../clifford'
import reserveFile from './helpers/reserve-file'

// TODO: consider moving this to clifford
const clearColorMarkers = (string: string | undefined): string =>
  // eslint-disable-next-line no-control-regex
  string?.replace(/\x1b\[\d{0,3}[\w]/g, '').replace(/^\s/g, '')

const rootPath = (pathName: string): string =>
  path.join(__dirname, '..', pathName)

const runOuxe = (args: string[], options: object = {}) =>
  clifford('./src/index.ts', args, options)

describe('ouxe', () => {
  let returnFile: () => void

  beforeEach(() => {
    returnFile = () => undefined
  })

  afterEach(() => {
    returnFile()
  })

  it('runs help', async () => {
    const cli = runOuxe(['--help'])

    expect(await cli.read()).toMatchSnapshot()
  })

  it('prompts for a packager if none is identified', async () => {
    returnFile = reserveFile(rootPath('yarn.lock'))

    const cli = runOuxe(['prettier', '--skip-install'])

    const promptPackager = await cli.readLine()
    expect(promptPackager).toMatch(
      'Which package manager do you intend to use?',
    )
    // press enter for yarn
    await cli.type('')

    const promptWrite = await cli.readUntil(
      /Do you want to immediately run prettier.*/,
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

      const cli = runOuxe(['prettier', '--skip-install'])

      const promptWrite = await cli.readUntil(
        'Do you want to immediately run prettier',
      )
      expect(promptWrite).toMatch(
        'Do you want to immediately run prettier on all files in the project?',
      )
      await cli.type('y')

      const promptPrecommit = await cli.readUntil('precommit')
      expect(clearColorMarkers(promptPrecommit)).toMatchSnapshot()

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

      const cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(
        /Which documents do you want to create(.|\n)*/m,
      )
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      await cli.type('a')

      const promptLicense = await cli.readUntil(/which license(.|\n)*/)
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
      const selectedProject = await cli.readUntil('❯ MIT')

      expect(clearColorMarkers(selectedProject)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: MIT
        ❯ MIT "
      `)

      await cli.type('')

      const promptUsername = await cli.readUntil(/name of the user(\n|.)*/)
      expect(clearColorMarkers(promptUsername)).toMatchInlineSnapshot(`
        "? 👓  What's the name of the user that'll sign the license (Yurick <yurick.hausc
        hild@gmail.com>) "
      `)

      // Press enter to confirm default
      await cli.type('')

      const promptEmail = await cli.readUntil(/provide an email.*/)
      expect(clearColorMarkers(promptEmail)).toMatchInlineSnapshot(
        `"? 📞 Please provide an email for contact "`,
      )

      await cli.type('clifford@yurick.me')
      await cli.type('')

      await cli.readUntil(/Created file/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
      expect(fs.readFileSync(coc).toString()).toMatchSnapshot()
    })

    fit('creates a CODE_OF_CONDUCT.md', async () => {
      const codeOfConduct = rootPath('CODE_OF_CONDUCT.md')
      returnFile = reserveFile(codeOfConduct)

      const cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(/which documents(.|\n)*/i)
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      // Press space to select Code of Conduct
      await cli.type(' ')

      const promptEmail = await cli.readUntil(/provide an email.*/)
      expect(clearColorMarkers(promptEmail)).toMatchInlineSnapshot(
        `"? 📞 Please provide an email for contact "`,
      )

      await cli.type('clifford@yurick.me')
      await cli.readUntil(/Enjoy your configured workplace/)

      expect(fs.readFileSync(codeOfConduct).toString()).toMatchSnapshot()
    })

    it('creates a LICENSE file', async () => {
      const license = rootPath('LICENSE')

      returnFile = reserveFile(license)

      const cli = runOuxe(['documents', '--skip-install'])

      const promptDocument = await cli.readUntil(/which documents/i)
      expect(clearColorMarkers(promptDocument)).toMatchInlineSnapshot(`
        "? 🤔 Which documents do you want to create? (Press <space> to select, <a> to tog
        gle all, <i> to invert selection)
        ❯◯ Code of Conduct
         ◯ License"
      `)

      // spacebar invert will select LICENSE (I'm yet to learn how to press down)
      await cli.type(' i')

      const promptLicense = await cli.readUntil(/which license/)
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
      const selectedProject = await cli.readUntil(/(0BSD|Searching)/)

      expect(clearColorMarkers(selectedProject)).toMatchInlineSnapshot(`
        "? 📄  Please choose which license you want for your project: MIT
        ❯ MIT "
      `)

      await cli.type('')

      const promptUsername = await cli.readUntil(/name of the user/)
      expect(clearColorMarkers(promptUsername)).toMatchInlineSnapshot(`
        "? 👓  What's the name of the user that'll sign the license (Yurick <yurick.hausc
        hild@gmail.com>) "
      `)

      // Press enter to confirm default
      await cli.type('')

      await cli.readUntil(/Enjoy your configured workplace/)

      expect(fs.readFileSync(license).toString()).toMatchSnapshot()
    })
  })
})
