import { describe, expect, it } from 'vitest'
import { DomainRegistry, SimulationRuntime, validateSimulationDefinition } from '@/engine'
import { physicsDomain } from '@/domains/physics'
import { wavelengthToRgb } from './color'
import { doubleSlit } from './definition'
import { timeToScreen } from './scale'

type Overrides = Parameters<SimulationRuntime<typeof doubleSlit>['setVariables']>[0]

/** Switches the light on and runs until the pattern has formed. */
function formed(overrides: Overrides = {}) {
  const runtime = new SimulationRuntime(doubleSlit, { initialVariables: overrides })
  runtime.start()
  for (let i = 0; i < 2000 && runtime.status === 'running'; i++) runtime.update(1 / 60)
  expect(runtime.status).toBe('completed')
  return runtime
}

describe('double-slit definition', () => {
  it('is valid and uses only units available to the physics domain', () => {
    const domains = new DomainRegistry()
    domains.register(physicsDomain)
    expect(validateSimulationDefinition(doubleSlit, domains.unitsAvailableTo('physics'))).toEqual([])
  })
})

describe('double-slit lifecycle', () => {
  it('starts with the light off: setup known, no light at the detector', () => {
    const { measurements } = new SimulationRuntime(doubleSlit)
    expect(measurements.phase).toBe('off')
    expect(measurements.fringeWidth).toBeCloseTo(1.8, 12) // 600 nm × 1.5 m / 0.5 mm
    expect(measurements.detectorIntensity).toBe(0)
    expect(measurements.detectorFringe).toBe('none')
  })

  it('light travels, then the pattern forms and the run completes', () => {
    const runtime = new SimulationRuntime(doubleSlit)
    runtime.start()
    runtime.update(0.05)
    expect(runtime.measurements.phase).toBe('travelling')
    const runtime2 = formed()
    expect(runtime2.measurements.phase).toBe('formed')
    expect(runtime2.state.arrivedAt).toBeGreaterThanOrEqual(timeToScreen(1.5))
  })

  it('central maximum: the detector at y = 0 reads bright with I = 4I₀', () => {
    const { measurements } = formed()
    expect(measurements.detectorFringe).toBe('bright')
    expect(measurements.detectorIntensity).toBeCloseTo(4, 10)
    expect(measurements.pathDifference).toBe(0)
  })

  it('reset turns the light off and restores the start', () => {
    const runtime = formed()
    runtime.reset()
    expect(runtime.status).toBe('ready')
    expect(runtime.measurements.phase).toBe('off')
    expect(runtime.state.arrivedAt).toBeNull()
  })
})

describe('double-slit science through the runtime', () => {
  it('detector at y = nβ is bright with Δ ≈ nλ; at (n + ½)β it is dark', () => {
    const runtime = formed()
    const beta = runtime.measurements.fringeWidth
    for (const n of [1, 2, -3]) {
      runtime.setVariables({ detectorPosition: Number((n * beta).toFixed(2)) })
      expect(runtime.measurements.detectorFringe).toBe('bright')
      expect(runtime.measurements.fringeOrder).toBeCloseTo(n, 1)
      runtime.setVariables({ detectorPosition: Number(((n + 0.5) * beta).toFixed(2)) })
      expect(runtime.measurements.detectorFringe).toBe('dark')
      expect(runtime.measurements.detectorIntensity).toBeLessThan(0.05)
    }
  })

  it('β is proportional to λ and D, and inversely proportional to d', () => {
    const base = formed().measurements.fringeWidth
    expect(formed({ wavelength: 300 * 2 }).measurements.fringeWidth).toBeCloseTo(base, 12)
    expect(formed({ screenDistance: 3 }).measurements.fringeWidth).toBeCloseTo(2 * base, 12)
    expect(formed({ slitSeparation: 1 }).measurements.fringeWidth).toBeCloseTo(base / 2, 12)
    expect(formed({ wavelength: 400 }).measurements.fringeWidth).toBeCloseTo((base * 400) / 600, 12)
  })

  it('in water the fringes shrink by n = 1.33', () => {
    const air = formed().measurements
    const water = formed({ medium: 'water' }).measurements
    expect(water.fringeWidth).toBeCloseTo(air.fringeWidth / 1.33, 12)
    expect(water.wavelengthInMedium).toBeCloseTo(600 / 1.33, 10)
  })

  it('a dimmed slit 2 lifts the dark fringes: I_min = (√I₁ − √I₂)²', () => {
    const { measurements } = formed({ slit2Intensity: 0.25 })
    expect(measurements.maxIntensity).toBeCloseTo(2.25, 12)
    expect(measurements.minIntensity).toBeCloseTo(0.25, 12)
    expect(measurements.visibility).toBeCloseTo(0.8, 12)
  })

  it('source brightness scales intensity but not fringe positions', () => {
    const dim = formed({ sourceIntensity: 0.5 }).measurements
    expect(dim.detectorIntensity).toBeCloseTo(2, 10)
    expect(dim.fringeWidth).toBeCloseTo(1.8, 12)
  })
})

describe('double-slit live variables', () => {
  it('changing λ, d, D or the detector after the pattern forms updates it in place', () => {
    const runtime = formed()
    runtime.setVariables({ wavelength: 450 })
    expect(runtime.status).toBe('completed')
    expect(runtime.measurements.fringeWidth).toBeCloseTo(1.35, 12)
    runtime.setVariables({ screenDistance: 3 }) // screen moved further away after arrival
    expect(runtime.measurements.phase).toBe('formed')
    expect(runtime.measurements.fringeWidth).toBeCloseTo(2.7, 12)
  })

  it('stays adjustable while the light is travelling', () => {
    const runtime = new SimulationRuntime(doubleSlit)
    runtime.start()
    runtime.update(0.1)
    expect(runtime.setVariables({ slitSeparation: 1 }).ok).toBe(true)
    expect(runtime.status).toBe('running')
    expect(runtime.isLiveVariable('slitSeparation')).toBe(true)
  })
})

describe('double-slit extremes and invalid input', () => {
  it('largest β (750 nm, 3 m, 0.1 mm): 22.5 mm, only the central maximum on screen', () => {
    const { measurements } = formed({ wavelength: 750, screenDistance: 3, slitSeparation: 0.1 })
    expect(measurements.fringeWidth).toBeCloseTo(22.5, 10)
    expect(measurements.brightFringesOnScreen).toBe(1)
  })

  it('smallest β (380 nm, 1 m, 2 mm, water): still exact', () => {
    const { measurements } = formed({
      wavelength: 380,
      screenDistance: 1,
      slitSeparation: 2,
      medium: 'water',
    })
    expect(measurements.fringeWidth).toBeCloseTo(((380e-9 * 1) / 2e-3 / 1.33) * 1e3, 10)
    expect(measurements.brightFringesOnScreen).toBeGreaterThan(100)
  })

  it.each([
    [{ wavelength: 200 }],
    [{ wavelength: 900 }],
    [{ slitSeparation: 0 }],
    [{ screenDistance: 10 }],
    [{ detectorPosition: 20 }],
    [{ medium: 'glass' }],
    [{ slit2Intensity: Number.NaN }],
  ])('rejects %o and keeps the run', (change) => {
    const runtime = formed()
    expect(runtime.setVariables(change).ok).toBe(false)
    expect(runtime.status).toBe('completed')
    expect(runtime.variables.wavelength).toBe(600)
  })
})

describe('wavelength colour', () => {
  it('maps the spectrum to the expected hue families', () => {
    const [r650, g650, b650] = wavelengthToRgb(650)
    expect(r650).toBeGreaterThan(0.9)
    expect(g650).toBeLessThan(0.1)
    expect(b650).toBe(0)
    const [, g532] = wavelengthToRgb(532)
    expect(g532).toBe(1)
    const [r405, , b405] = wavelengthToRgb(405)
    expect(b405).toBeGreaterThan(r405)
    for (const nm of [380, 750]) expect(Math.max(...wavelengthToRgb(nm))).toBeGreaterThan(0.3)
  })
})
