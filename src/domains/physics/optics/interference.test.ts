import { describe, expect, it } from 'vitest'
import {
  angularFringeWidth,
  brightFringePosition,
  brightFringesWithin,
  classifyFringe,
  darkFringePosition,
  fringeOrder,
  fringeVisibility,
  fringeWidth,
  intensityAt,
  maxIntensity,
  minIntensity,
  pathDifference,
  pathDifferenceSmallAngle,
  wavelengthInMedium,
  type DoubleSlitSetup,
} from './interference'

/** λ = 600 nm, d = 0.5 mm, D = 1.5 m, air, equal slits (I₀ = 1). */
const standard: DoubleSlitSetup = {
  wavelength: 600e-9,
  slitSeparation: 0.5e-3,
  screenDistance: 1.5,
  refractiveIndex: 1,
  intensity1: 1,
  intensity2: 1,
}
const setup = (changes: Partial<DoubleSlitSetup>): DoubleSlitSetup => ({ ...standard, ...changes })

describe('fringe width β = λD/d', () => {
  it('matches the textbook value', () => {
    expect(fringeWidth(standard)).toBeCloseTo(1.8e-3, 15)
  })

  it('is proportional to λ and D, and inversely proportional to d', () => {
    const beta = fringeWidth(standard)
    expect(fringeWidth(setup({ wavelength: 1200e-9 }))).toBeCloseTo(2 * beta, 15)
    expect(fringeWidth(setup({ screenDistance: 3 }))).toBeCloseTo(2 * beta, 15)
    expect(fringeWidth(setup({ slitSeparation: 1e-3 }))).toBeCloseTo(beta / 2, 15)
  })

  it('shrinks by the refractive index in water (β′ = β/n)', () => {
    expect(fringeWidth(setup({ refractiveIndex: 1.33 }))).toBeCloseTo(fringeWidth(standard) / 1.33, 15)
    expect(wavelengthInMedium(setup({ refractiveIndex: 1.33 }))).toBeCloseTo(600e-9 / 1.33, 18)
  })

  it('angular width θ = λ/d', () => {
    expect(angularFringeWidth(standard)).toBeCloseTo(1.2e-3, 15)
  })
})

describe('path difference', () => {
  it('is zero on the axis and antisymmetric', () => {
    expect(pathDifference(standard, 0)).toBe(0)
    expect(pathDifference(standard, -2e-3)).toBeCloseTo(-pathDifference(standard, 2e-3), 20)
  })

  it('matches a direct high-precision evaluation (no cancellation error)', () => {
    // Direct subtraction evaluated with BigInt-free rearrangement: r₂² − r₁² = 2yd exactly.
    const y = 7.3e-3
    const r1 = Math.hypot(1.5, y - 0.25e-3)
    const r2 = Math.hypot(1.5, y + 0.25e-3)
    expect(pathDifference(standard, y) * (r1 + r2)).toBeCloseTo(2 * y * 0.5e-3, 18)
  })

  it('agrees with the small-angle form within 0.01 % across the ±15 mm screen', () => {
    for (const y of [1e-3, 5e-3, 10e-3, 15e-3]) {
      const exact = pathDifference(standard, y)
      expect(Math.abs(exact - pathDifferenceSmallAngle(standard, y)) / exact).toBeLessThan(1e-4)
    }
  })
})

describe('intensity and fringes', () => {
  it('central maximum is bright: I = 4I₀ for equal slits', () => {
    expect(intensityAt(standard, 0)).toBeCloseTo(4, 12)
    expect(classifyFringe(standard, 0)).toBe('bright')
  })

  it('is bright at y = nβ and dark at y = (n + ½)β', () => {
    for (const n of [-3, -1, 1, 2, 5]) {
      const bright = brightFringePosition(standard, n)
      const dark = darkFringePosition(standard, n)
      expect(intensityAt(standard, bright)).toBeCloseTo(4, 5)
      // nβ is the small-angle position; the exact order there differs from n by
      // n·(y/D)²/2 ≈ 1e-4 at the 5th fringe — well within tolerance 5e-4.
      expect(fringeOrder(standard, bright)).toBeCloseTo(n, 3)
      expect(classifyFringe(standard, bright)).toBe('bright')
      expect(intensityAt(standard, dark)).toBeCloseTo(0, 5)
      expect(classifyFringe(standard, dark)).toBe('dark')
    }
  })

  it('is symmetric about the axis and between fringes in between', () => {
    expect(intensityAt(standard, 1.23e-3)).toBeCloseTo(intensityAt(standard, -1.23e-3), 12)
    expect(classifyFringe(standard, 0.45e-3)).toBe('between')
  })

  it('unequal slits: dark fringes are not fully dark', () => {
    const unequal = setup({ intensity2: 0.25 })
    expect(maxIntensity(unequal)).toBeCloseTo(2.25, 12)
    expect(minIntensity(unequal)).toBeCloseTo(0.25, 12)
    expect(fringeVisibility(unequal)).toBeCloseTo(0.8, 12)
    expect(intensityAt(unequal, darkFringePosition(unequal, 0))).toBeCloseTo(0.25, 5)
    expect(fringeVisibility(standard)).toBe(1)
  })

  it('counts the bright fringes that fit in a window', () => {
    expect(brightFringesWithin(standard, 15e-3)).toBe(2 * 8 + 1) // 15 / 1.8 = 8.33
    expect(
      brightFringesWithin(setup({ wavelength: 750e-9, screenDistance: 3, slitSeparation: 0.1e-3 }), 15e-3),
    ).toBe(1)
  })
})

describe('validation', () => {
  it.each([
    ['zero wavelength', setup({ wavelength: 0 })],
    ['negative separation', setup({ slitSeparation: -1e-3 })],
    ['n < 1', setup({ refractiveIndex: 0.9 })],
    ['negative intensity', setup({ intensity2: -1 })],
    ['NaN', setup({ screenDistance: Number.NaN })],
  ])('rejects %s', (_, s) => {
    expect(() => fringeWidth(s)).toThrow(RangeError)
  })
})
