import { describe, expect, it } from 'vitest'
import { DomainRegistry, toSI } from '@/engine'
import { physicsDomain, PHYSICS_UNITS } from '.'

describe('physics domain', () => {
  it('registers against the domain contract', () => {
    const registry = new DomainRegistry()
    expect(() => {
      registry.register(physicsDomain)
    }).not.toThrow()
    expect(registry.unitsAvailableTo('physics').has('m/s²')).toBe(true)
  })

  it('does not leak its units to other domains', () => {
    const registry = new DomainRegistry()
    registry.register(physicsDomain)
    registry.register({ id: 'chemistry', title: 'Chemistry', description: '', units: [] })
    expect(registry.unitsAvailableTo('chemistry').has('m/s²')).toBe(false)
  })

  it('converts degrees to radians', () => {
    const deg = PHYSICS_UNITS.find((unit) => unit.id === 'deg')
    expect(deg).toBeDefined()
    if (deg) expect(toSI(180, deg)).toBeCloseTo(Math.PI, 12)
  })
})
