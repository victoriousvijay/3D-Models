import { describe, expect, it } from 'vitest'
import { rk4Step } from './rk4'

const integrate = (f: Parameters<typeof rk4Step>[0], y0: number[], tEnd: number, steps: number) => {
  const h = tEnd / steps
  let y = y0
  for (let i = 0; i < steps; i++) y = rk4Step(f, i * h, y, h)
  return y
}

describe('rk4Step', () => {
  it('solves exponential decay dy/dt = −y to high accuracy', () => {
    const [y] = integrate((_, [value = 0]) => [-value], [1], 1, 100)
    expect(y).toBeCloseTo(Math.exp(-1), 10)
  })

  it('solves the harmonic oscillator and conserves its amplitude', () => {
    // y = [x, v], x'' = −x; exact x(t) = cos t
    const [x, v] = integrate((_, [pos = 0, vel = 0]) => [vel, -pos], [1, 0], 2 * Math.PI, 1000)
    expect(x).toBeCloseTo(1, 9)
    expect(v).toBeCloseTo(0, 9)
  })

  it('shows fourth-order convergence (halving h cuts error ≈16×)', () => {
    const exact = Math.exp(-2)
    const error = (steps: number) =>
      Math.abs((integrate((_, [y = 0]) => [-y], [1], 2, steps)[0] ?? 0) - exact)
    const ratio = error(20) / error(40)
    expect(ratio).toBeGreaterThan(14)
    expect(ratio).toBeLessThan(18)
  })

  it('does not mutate its input', () => {
    const y = [1, 2]
    rk4Step(() => [1, 1], 0, y, 0.1)
    expect(y).toEqual([1, 2])
  })
})
