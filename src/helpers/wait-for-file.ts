import * as fs from 'fs-extra'

export const waitForFile = async (name: string) => {
  while (!(await fs.pathExists(name)));
}
