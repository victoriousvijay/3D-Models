import { Suspense, useEffect, useMemo } from 'react'
import { useParams } from 'react-router'
import { SimulationRuntime } from '@/engine'
import { LabCanvas, SimulationRuntimeContext } from '@/rendering'
import { findDivision, findLab, type LabDivision, type LabEntry } from '@/catalogue'
import { SimulationHeader } from '@/components/SimulationHeader'
import { SimulationWorkspace } from '@/components/lab/SimulationWorkspace'
import type { SimulationPackage } from '@/simulations'
import { useLabStore } from '@/state/labStore'
import { platform } from '@/app/platform'
import { SimulationErrorBoundary } from '@/app/SimulationErrorBoundary'
import { SimulationHost } from '@/app/SimulationHost'
import { LabComingSoon } from './LabComingSoon'
import NotFoundPage from './NotFoundPage'

/**
 * The model-specific scientific environment for one lab. The package supplies
 * the world (its Environment and View); the platform supplies the shared
 * interaction language (canvas, controls, measurements, experiments, learning).
 */
function SimulationExperience({
  pkg,
  lab,
  division,
}: {
  pkg: SimulationPackage
  lab: LabEntry
  division: LabDivision
}) {
  const setStatus = useLabStore((state) => state.setStatus)
  const setLoadError = useLabStore((state) => state.setLoadError)
  const openSimulation = useLabStore((state) => state.openSimulation)
  const closeSimulation = useLabStore((state) => state.closeSimulation)
  const { Environment } = pkg

  useEffect(() => {
    openSimulation(pkg.definition.id)
    return closeSimulation
  }, [pkg, openSimulation, closeSimulation])

  // One runtime per opened simulation. It holds no external resources, so a
  // replaced runtime is simply garbage-collected once its listeners detach.
  const runtime = useMemo(() => new SimulationRuntime(pkg.definition), [pkg])

  useEffect(() => {
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
          <LabCanvas camera={pkg.definition.scene.camera}>
            <Environment />
            <SimulationErrorBoundary onError={setLoadError}>
              <Suspense fallback={null}>
                <SimulationHost pkg={pkg} runtime={runtime} />
              </Suspense>
            </SimulationErrorBoundary>
          </LabCanvas>
        </div>
        <SimulationWorkspace pkg={pkg} runtime={runtime} experiments={platform.experiments} />
        <SimulationHeader title={lab.title} division={division} />
      </main>
    </SimulationRuntimeContext>
  )
}

/** Route `/lab/:division/:labId`: an available lab's simulation, or a "coming soon" page. */
export default function SimulationPage() {
  const params = useParams()
  const division = findDivision(params['division'] ?? '')
  const lab = division ? findLab(platform.catalogue, division.id, params['labId'] ?? '') : undefined
  if (!division || !lab) return <NotFoundPage />

  const pkg = lab.simulationId ? platform.simulations.get(lab.simulationId) : undefined
  if (lab.status !== 'available' || !pkg) return <LabComingSoon lab={lab} division={division} />

  // Keyed so switching labs remounts the canvas: camera re-created, GPU memory released.
  return <SimulationExperience key={pkg.definition.id} pkg={pkg} lab={lab} division={division} />
}
