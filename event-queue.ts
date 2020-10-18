import { EventEmitter } from 'events'

export class EventQueue {
  private readPointer: number
  private writePointer: number

  constructor(private emitter: EventEmitter, private event: string) {
    this.readPointer = 0
    this.writePointer = 0

    this.emitter.on(this.event, () => this.write())
  }

  private write() {
    ++this.writePointer
  }

  private isLagging() {
    return this.readPointer < this.writePointer
  }

  public dispose() {
    this.emitter.off(this.event, this.write)
  }

  public async next() {
    return new Promise<true>((resolve) => {
      if (this.isLagging()) {
        ++this.readPointer
        resolve(true)
      } else {
        this.emitter.once(this.event, () => {
          ++this.readPointer
          resolve(true)
        })
      }
    })
  }
}
