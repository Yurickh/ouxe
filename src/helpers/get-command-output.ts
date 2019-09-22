import { Argv } from 'yargs'

export default function getOutput(parser: Argv, args: string): Promise<string> {
  return new Promise((resolve, reject) => {
    parser.parse(args, (err: Error | undefined, _argv, output: string) => {
      if (err) {
        reject(err)
      } else {
        resolve(output)
      }
    })
  })
}
