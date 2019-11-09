import * as fs from 'fs-extra'
import * as path from 'path'

export default function copyTemplate(name: string): void {
  fs.copySync(path.join(__dirname, '..', '..', 'templates', name), `./${name}`)
}
