import * as path from 'path'

export default function templateFolder(file: string): string {
  return path.join(__dirname, '..', 'templates', file)
}
