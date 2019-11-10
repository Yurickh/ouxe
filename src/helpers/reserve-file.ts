import * as fs from 'fs-extra'
import * as path from 'path'
import sha1 from 'sha1'

function fixturesPath(pathName: string): string {
  return path.join(__dirname, '..', 'fixtures', pathName)
}

export default function reserveFile(path: string): () => void {
  const targetPath = fixturesPath(sha1(path))

  fs.renameSync(path, targetPath)

  return () => fs.renameSync(targetPath, path)
}
