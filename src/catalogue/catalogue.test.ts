import { describe, expect, it } from 'vitest'
import {
  findLab,
  groupByChapter,
  LAB_CATALOGUE,
  labsInDivision,
  validateCatalogue,
  type DivisionId,
  type LabEntry,
} from '.'

const registered = [
  { id: 'projectile-motion', domain: 'physics' },
  { id: 'double-slit', domain: 'physics' },
]

describe('LAB_CATALOGUE', () => {
  it('lists the full catalogue: 16 physics, 30 chemistry, 12 botany, 15 zoology', () => {
    const count = (id: DivisionId) => labsInDivision(LAB_CATALOGUE, id).length
    expect(count('physics')).toBe(16)
    expect(count('chemistry')).toBe(30)
    expect(count('botany')).toBe(12)
    expect(count('zoology')).toBe(15)
  })

  it('is consistent with the registered simulations', () => {
    expect(validateCatalogue(LAB_CATALOGUE, registered)).toEqual([])
  })

  it('makes Projectile Motion the first available Physics lab', () => {
    const lab = findLab(LAB_CATALOGUE, 'physics', 'projectile-motion')
    expect(lab?.status).toBe('available')
    expect(labsInDivision(LAB_CATALOGUE, 'physics')[0]?.id).toBe('projectile-motion')
  })

  it('gives every physics lab a description', () => {
    for (const lab of labsInDivision(LAB_CATALOGUE, 'physics')) expect(lab.description).toBeTruthy()
  })
})

describe('validateCatalogue', () => {
  const base: LabEntry = {
    id: 'demo',
    division: 'physics',
    title: 'Demo',
    chapter: 'Chapter',
    experience: 'static',
    status: 'planned',
  }

  it('reports duplicates, bad ids and broken availability', () => {
    const issues = validateCatalogue(
      [
        base,
        base,
        { ...base, id: 'Bad Id' },
        { ...base, id: 'ghost', status: 'available', simulationId: 'missing' },
        {
          ...base,
          id: 'wrong-domain',
          division: 'chemistry',
          status: 'available',
          simulationId: 'projectile-motion',
        },
        { ...base, id: 'planned-with-sim', simulationId: 'x' },
      ],
      registered,
    ).join('\n')
    expect(issues).toMatch(/Duplicate lab id "demo"/)
    expect(issues).toMatch(/kebab-case/)
    expect(issues).toMatch(/simulation "missing" is not registered/)
    expect(issues).toMatch(/domain "physics" ≠ division domain "chemistry"/)
    expect(issues).toMatch(/planned but names a simulation/)
  })

  it('reports registered simulations that no lab reaches', () => {
    expect(validateCatalogue([base], registered).join('\n')).toMatch(
      /"projectile-motion" is registered but not in the catalogue/,
    )
  })
})

describe('groupByChapter', () => {
  it('keeps catalogue order', () => {
    const groups = groupByChapter(labsInDivision(LAB_CATALOGUE, 'chemistry'))
    expect(groups[0]?.chapter).toBe('Some Basic Concepts of Chemistry')
    expect(groups.find((g) => g.chapter === 'Haloalkanes & Haloarenes')?.labs).toHaveLength(4)
  })
})
