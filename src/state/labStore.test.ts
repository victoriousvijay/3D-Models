import { beforeEach, describe, expect, it } from 'vitest'
import { useLabStore } from './labStore'

describe('lab store overlays', () => {
  beforeEach(() => {
    useLabStore.getState().closeSimulation()
  })

  it('opens a simulation with every overlay visible by default', () => {
    useLabStore.getState().openSimulation('a')
    expect(useLabStore.getState().hiddenOverlays).toEqual([])
  })

  it('opens with the given overlays hidden, and they can be toggled on', () => {
    useLabStore.getState().openSimulation('a', ['energy'])
    expect(useLabStore.getState().hiddenOverlays).toEqual(['energy'])
    useLabStore.getState().toggleOverlay('energy')
    expect(useLabStore.getState().hiddenOverlays).toEqual([])
  })

  it('opening another simulation resets overlay visibility', () => {
    useLabStore.getState().openSimulation('a', ['energy'])
    useLabStore.getState().toggleOverlay('velocity')
    useLabStore.getState().openSimulation('b')
    expect(useLabStore.getState().hiddenOverlays).toEqual([])
  })
})

describe('lab store view tools', () => {
  beforeEach(() => {
    useLabStore.getState().closeSimulation()
  })

  it('grab mode and hidden panels toggle, and reset when another simulation opens', () => {
    const store = useLabStore.getState()
    store.openSimulation('a')
    expect(useLabStore.getState().grabMode).toBe(false)
    store.toggleGrabMode()
    store.togglePanels()
    expect(useLabStore.getState().grabMode).toBe(true)
    expect(useLabStore.getState().panelsHidden).toBe(true)
    store.openSimulation('b')
    expect(useLabStore.getState().grabMode).toBe(false)
    expect(useLabStore.getState().panelsHidden).toBe(false)
  })

  it('reset view bumps a token the canvas listens to', () => {
    const before = useLabStore.getState().viewResetToken
    useLabStore.getState().resetView()
    expect(useLabStore.getState().viewResetToken).toBe(before + 1)
  })
})
