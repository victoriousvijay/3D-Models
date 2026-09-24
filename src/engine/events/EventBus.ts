type Handler<T> = (payload: T) => void

export type HandlerErrorReporter = (error: unknown, eventType: PropertyKey) => void

/**
 * Re-throws asynchronously so a failing listener is visible in the console
 * without interrupting the emitter (e.g. the simulation loop).
 */
const rethrowAsync: HandlerErrorReporter = (error) => {
  queueMicrotask(() => {
    throw error
  })
}

/**
 * Minimal typed publish/subscribe channel. The engine exposes its state
 * changes through event buses so UI, persistence and the AI tutor can observe
 * a simulation without the engine knowing about any of them.
 */
export class EventBus<TEvents extends object> {
  readonly #handlers: { [K in keyof TEvents]?: Set<Handler<TEvents[K]>> } = {}
  readonly #reportError: HandlerErrorReporter

  constructor(reportError: HandlerErrorReporter = rethrowAsync) {
    this.#reportError = reportError
  }

  /** Subscribes to an event and returns an unsubscribe function. */
  on<K extends keyof TEvents>(type: K, handler: Handler<TEvents[K]>): () => void {
    const handlers = (this.#handlers[type] ??= new Set<Handler<TEvents[K]>>())
    handlers.add(handler)
    return () => {
      handlers.delete(handler)
    }
  }

  emit<K extends keyof TEvents>(type: K, payload: TEvents[K]): void {
    const handlers = this.#handlers[type]
    if (!handlers) return
    // Copy so handlers may unsubscribe while being notified.
    for (const handler of [...handlers]) {
      try {
        handler(payload)
      } catch (error) {
        this.#reportError(error, type)
      }
    }
  }

  clear(): void {
    for (const key of Object.keys(this.#handlers) as (keyof TEvents)[]) {
      this.#handlers[key]?.clear()
    }
  }
}
