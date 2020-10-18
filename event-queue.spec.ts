import { EventEmitter } from 'events'
import { EventQueue } from './event-queue'

describe('EventQueue', () => {
  it('reads from lag', async () => {
    const emitter = new EventEmitter()
    const queue = new EventQueue(emitter, 'potato')

    emitter.emit('potato')
    emitter.emit('potato')
    emitter.emit('potato')

    expect((queue as any).readPointer).toBe(0)
    expect((queue as any).writePointer).toBe(3)
  })
})
