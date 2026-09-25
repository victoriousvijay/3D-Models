/**
 * Lab catalogue: the platform's navigable content — divisions and the labs
 * inside them. Framework-free data plus pure helpers; the engine never
 * depends on it. See LAB_CATALOGUE.md.
 */
export type { DivisionId, LabDivision, LabEntry, LabStatus } from './types'
export { LAB_DIVISIONS, findDivision, isDivisionId } from './divisions'
export { LAB_CATALOGUE } from './labs'
export {
  EXPERIENCE_LABELS,
  findLab,
  groupByChapter,
  labsInDivision,
  validateCatalogue,
  type RegisteredSimulation,
} from './catalogue'
