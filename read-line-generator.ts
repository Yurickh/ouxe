import { Readable } from 'stream'

export default async function* readLineGenerator(
  chunks: Readable,
  delimiter: string | RegExp,
): AsyncGenerator<string> {
  let output = ''

  for await (const chunk of chunks) {
    output += chunk.toString()

    const delimiterRegex = new RegExp(delimiter)
    if (delimiterRegex.test(output)) {
      if (output[output.length - 1] === '\n') {
        output = output.slice(0, -1)
      }

      yield output
      output = ''
    }
  }

  yield output
}
