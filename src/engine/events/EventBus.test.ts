import { describe, expect, it, vi } from 'vitest'
import { EventBus } from './EventBus'

interface TestEvents {
  ping: { n: number }
  other: string
}

describe('EventBus', () => {
  it('delivers payloads to subscribers of the matching event only', () => {
    const bus = new EventBus<TestEvents>()
    const ping = vi.fn()
    const other = vi.fn()
    bus.on('ping', ping)
    bus.on('other', other)

    bus.emit('ping', { n: 1 })

    expect(ping).toHaveBeenCalledWith({ n: 1 })
    expect(other).not.toHaveBeenCalled()
  })

  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus<TestEvents>()
    const handler = vi.fn()
    const off = bus.on('ping', handler)
    off()
    bus.emit('ping', { n: 1 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('isolates a throwing handler so later handlers still run', () => {
    const report = vi.fn()
    const bus = new EventBus<TestEvents>(report)
    const later = vi.fn()
    bus.on('ping', () => {
      throw new Error('boom')
    })
    bus.on('ping', later)

    bus.emit('ping', { n: 2 })

    expect(later).toHaveBeenCalledOnce()
    expect(report).toHaveBeenCalledWith(expect.any(Error), 'ping')
  })

  it('clear() removes every subscription', () => {
    const bus = new EventBus<TestEvents>()
    const handler = vi.fn()
    bus.on('ping', handler)
    bus.clear()
    bus.emit('ping', { n: 3 })
    expect(handler).not.toHaveBeenCalled()
  })
})
