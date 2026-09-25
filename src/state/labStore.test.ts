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
