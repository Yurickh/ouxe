import * as fs from 'fs-extra'
import templateFolder from '../template-folder'

export default function copyTemplate(name: string): void {
  fs.copySync(templateFolder(name), `${process.cwd()}/${name}`)
}
