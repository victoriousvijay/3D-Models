import { use, useEffect } from 'react'
import type { AnySimulationRuntime } from '@/engine'
import { SimulationDriver } from '@/rendering'
import type { SimulationPackage } from '@/simulations'
import { useLabStore } from '@/state/labStore'
import { platform } from './platform'

interface SimulationHostProps {
  pkg: SimulationPackage
  runtime: AnySimulationRuntime
}

/** Mounted only once the view has rendered: clears any stale load error. */
function LoadedSignal() {
  const setLoadError = useLabStore((state) => state.setLoadError)
  useEffect(() => {
    setLoadError(null)
  }, [setLoadError])
  return null
}

/**
 * Renders inside the canvas. Suspends until the simulation's domain engine is
 * initialised (e.g. a WASM solver loaded) and its lazy view has downloaded.
 */
export function SimulationHost({ pkg, runtime }: SimulationHostProps) {
  // `initialize` memoises its promise per domain, so this is stable across renders.
  use(platform.domains.initialize(pkg.definition.domain))
  const { View } = pkg

  return (
    <>
      <SimulationDriver runtime={runtime} />
      <View />
      <LoadedSignal />
    </>
  )
}
