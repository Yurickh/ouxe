import * as fs from 'fs-extra'
import * as path from 'path'

export default function copyTemplate(name) {
  fs.copySync(path.join(__dirname, '..', 'templates', name), `./${name}`)
}
