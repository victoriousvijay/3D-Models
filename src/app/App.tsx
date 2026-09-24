import { Suspense, useEffect, useMemo } from 'react'
import { SimulationRuntime } from '@/engine'
import { LabCanvas, LabEnvironment, SimulationRuntimeContext } from '@/rendering'
import { SimulationCatalog } from '@/components/SimulationCatalog'
import { SimulationWorkspace } from '@/components/lab/SimulationWorkspace'
import { useLabStore } from '@/state/labStore'
import { platform } from './platform'
import { SimulationErrorBoundary } from './SimulationErrorBoundary'
import { SimulationHost } from './SimulationHost'

export function App() {
  const activeId = useLabStore((state) => state.activeSimulationId)
  const setStatus = useLabStore((state) => state.setStatus)
  const setLoadError = useLabStore((state) => state.setLoadError)
  const pkg = activeId ? platform.simulations.get(activeId) : undefined

  // One runtime per opened simulation. It holds no external resources, so a
  // replaced runtime is simply garbage-collected once its listeners detach.
  const runtime = useMemo(() => (pkg ? new SimulationRuntime(pkg.definition) : null), [pkg])

  useEffect(() => {
    if (!runtime) return
    setStatus(runtime.status)
    return runtime.events.on('status', ({ current }) => {
      setStatus(current)
    })
  }, [runtime, setStatus])

  return (
    <SimulationRuntimeContext value={runtime}>
      {/* Column layout: the 3D lab fills the space above the mobile bottom sheet; on wide screens
          the sheet is absent and floating panels overlay the lab instead. */}
      <main className="relative flex h-dvh w-full flex-col overflow-hidden bg-lab-bg text-lab-strong">
        <div className="relative min-h-0 flex-1">
          {/* Remount per simulation so camera/projection are re-created and GPU memory is released. */}
          <LabCanvas
            key={pkg?.definition.id ?? 'lab'}
            {...(pkg ? { camera: pkg.definition.scene.camera } : {})}
          >
            <LabEnvironment />
            {pkg && runtime ? (
              <SimulationErrorBoundary onError={setLoadError}>
                <Suspense fallback={null}>
                  <SimulationHost pkg={pkg} runtime={runtime} />
                </Suspense>
              </SimulationErrorBoundary>
            ) : null}
          </LabCanvas>
        </div>
        {pkg && runtime ? (
          <SimulationWorkspace
            key={pkg.definition.id}
            pkg={pkg}
            runtime={runtime}
            experiments={platform.experiments}
          />
        ) : null}
        <SimulationCatalog />
      </main>
    </SimulationRuntimeContext>
  )
}
