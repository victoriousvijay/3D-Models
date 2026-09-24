import { describe, expect, it, vi } from 'vitest'
import type { DomainEngine } from '../types'
import { DomainRegistrationError, DomainRegistry } from './DomainRegistry'

const domain = (overrides: Partial<DomainEngine> & Pick<DomainEngine, 'id'>): DomainEngine => ({
  title: overrides.id,
  description: '',
  units: [],
  ...overrides,
})

// Unit ids below are declared in the core catalog or by the physics domain's
// UnitCatalog augmentation; the registry validates scoping at runtime.
describe('DomainRegistry', () => {
  it('provides core SI units to every domain', () => {
    const registry = new DomainRegistry()
    registry.register(domain({ id: 'alpha' }))
    const units = registry.unitsAvailableTo('alpha')
    expect(units.has('m')).toBe(true)
    expect(units.has('mol')).toBe(true)
    expect(units.has('s⁻¹')).toBe(true)
  })

  it('scopes domain units to the domain and its dependents', () => {
    const registry = new DomainRegistry()
    registry.register(
      domain({ id: 'base', units: [{ id: 'm/s', name: 'metre per second', quantity: 'velocity' }] }),
    )
    registry.register(domain({ id: 'dependent', dependsOn: ['base'] }))
    registry.register(domain({ id: 'independent' }))

    expect(registry.unitsAvailableTo('base').has('m/s')).toBe(true)
    expect(registry.unitsAvailableTo('dependent').has('m/s')).toBe(true)
    expect(registry.unitsAvailableTo('independent').has('m/s')).toBe(false)
  })

  it('allows two domains to declare an identical unit', () => {
    const registry = new DomainRegistry()
    const deg = {
      id: 'deg',
      name: 'degree',
      quantity: 'plane angle',
      toSI: { factor: Math.PI / 180 },
    } as const
    registry.register(domain({ id: 'one', units: [deg] }))
    expect(() => {
      registry.register(domain({ id: 'two', units: [deg] }))
    }).not.toThrow()
  })

  it('rejects a conflicting redefinition of an existing unit', () => {
    const registry = new DomainRegistry()
    const register = () => {
      registry.register(
        domain({
          id: 'rogue',
          units: [{ id: 'm', name: 'mile', quantity: 'length', toSI: { factor: 1609.344 } }],
        }),
      )
    }
    expect(register).toThrow(DomainRegistrationError)
  })

  it('rejects unregistered dependencies, duplicates and malformed ids', () => {
    const registry = new DomainRegistry()
    registry.register(domain({ id: 'alpha' }))
    expect(() => {
      registry.register(domain({ id: 'beta', dependsOn: ['missing'] }))
    }).toThrow(/unregistered domain "missing"/)
    expect(() => {
      registry.register(domain({ id: 'alpha' }))
    }).toThrow(/already registered/)
    expect(() => {
      registry.register(domain({ id: 'Earth Science' }))
    }).toThrow(/kebab-case/)
  })

  it('initialises dependencies first and only once', async () => {
    const registry = new DomainRegistry()
    const order: string[] = []
    registry.register(
      domain({ id: 'base', initialize: vi.fn(() => Promise.resolve(void order.push('base'))) }),
    )
    registry.register(
      domain({
        id: 'top',
        dependsOn: ['base'],
        initialize: vi.fn(() => Promise.resolve(void order.push('top'))),
      }),
    )

    await Promise.all([registry.initialize('top'), registry.initialize('top'), registry.initialize('base')])

    expect(order).toEqual(['base', 'top'])
  })

  it('allows retrying a failed initialisation', async () => {
    const registry = new DomainRegistry()
    const initialize = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
    registry.register(domain({ id: 'flaky', initialize }))

    await expect(registry.initialize('flaky')).rejects.toThrow('offline')
    await expect(registry.initialize('flaky')).resolves.toBeUndefined()
    expect(initialize).toHaveBeenCalledTimes(2)
  })
})
