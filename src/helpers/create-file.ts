import * as fs from 'fs-extra'

export default function createFile(name: string, content: string): void {
  fs.writeFileSync(name, content)
}
