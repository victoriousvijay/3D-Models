import type { DivisionId, LabDivision } from './types'

export const LAB_DIVISIONS: readonly LabDivision[] = [
  {
    id: 'physics',
    title: 'Physics',
    tagline: 'Motion, forces, fields, waves and light.',
    domain: 'physics',
    accent: '#1d6fe0',
    accentSoft: '#e6f0fd',
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    tagline: 'Atoms, bonds, reactions and molecular shape.',
    domain: 'chemistry',
    accent: '#7048e8',
    accentSoft: '#efeafd',
  },
  {
    id: 'botany',
    title: 'Botany',
    tagline: 'Plant cells, photosynthesis and plant reproduction.',
    domain: 'biology',
    accent: '#2f9e44',
    accentSoft: '#e7f6ea',
  },
  {
    id: 'zoology',
    title: 'Zoology',
    tagline: 'Animal structure, physiology and the human body.',
    domain: 'biology',
    accent: '#e8590c',
    accentSoft: '#fdeee4',
  },
]

export function findDivision(id: string): LabDivision | undefined {
  return LAB_DIVISIONS.find((division) => division.id === id)
}

export const isDivisionId = (id: string): id is DivisionId => findDivision(id) !== undefined
