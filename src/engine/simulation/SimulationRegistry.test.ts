import { describe, expect, it } from 'vitest'
import { decayFixture, fixtureDomain, pointFixture } from '../__fixtures__/fixtures'
import { DomainRegistry } from '../domains/DomainRegistry'
import type { AnySimulationDefinition } from '../types'
import { SimulationRegistry } from './SimulationRegistry'
import { SimulationDefinitionError, validateSimulationDefinition } from './validateDefinition'

const setup = () => {
  const domains = new DomainRegistry()
  domains.register(fixtureDomain)
  return new SimulationRegistry<{ definition: AnySimulationDefinition }>(domains)
}

describe('SimulationRegistry', () => {
  it('registers valid simulations and lists them by domain', () => {
    const registry = setup()
    registry.register({ definition: decayFixture })
    registry.register({ definition: pointFixture })

    expect(registry.get('decay-fixture')?.definition).toBe(decayFixture)
    expect(registry.listByDomain('fixture')).toHaveLength(2)
    expect(registry.listByDomain('physics')).toHaveLength(0)
  })

  it('rejects duplicate ids', () => {
    const registry = setup()
    registry.register({ definition: decayFixture })
    expect(() => {
      registry.register({ definition: decayFixture })
    }).toThrow(/already registered/)
  })

  it('rejects simulations of an unregistered domain', () => {
    const registry = setup()
    expect(() => {
      registry.register({ definition: { ...decayFixture, domain: 'chemistry' } })
    }).toThrow(/domain "chemistry" is not registered/)
  })

  it('rejects units not provided by the simulation domain', () => {
    const registry = setup()
    const borrowsPhysicsUnit: AnySimulationDefinition = {
      ...pointFixture,
      id: 'borrower',
      measurements: [{ kind: 'scalar', id: 'speed', label: 'Speed', unit: 'm/s' }],
    }
    expect(() => {
      registry.register({ definition: borrowsPhysicsUnit })
    }).toThrow(SimulationDefinitionError)
  })
})

describe('validateSimulationDefinition', () => {
  it('accepts the fixtures', () => {
    expect(validateSimulationDefinition(decayFixture)).toEqual([])
    expect(validateSimulationDefinition(pointFixture)).toEqual([])
  })

  it('reports broken references and invalid timing', () => {
    const broken: AnySimulationDefinition = {
      ...decayFixture,
      id: 'Not Kebab',
      objects: [{ id: 'child', label: 'Child', selectable: false, parentId: 'ghost' }],
      interactions: [{ id: 'i', kind: 'drag', targetObjectId: 'nowhere', variableId: 'nothing' }],
      presets: [{ id: 'bad', title: 'Bad', variables: { rate: 999 } }],
      model: { ...decayFixture.model, fixedTimeStep: 0 } as AnySimulationDefinition['model'],
    }
    const issues = validateSimulationDefinition(broken).join('\n')
    expect(issues).toMatch(/kebab-case/)
    expect(issues).toMatch(/unknown parent "ghost"/)
    expect(issues).toMatch(/unknown object "nowhere"/)
    expect(issues).toMatch(/unknown variable "nothing"/)
    expect(issues).toMatch(/preset "bad"/)
    expect(issues).toMatch(/fixedTimeStep/)
  })
})
