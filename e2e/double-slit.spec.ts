import { expect, test, type Page } from '@playwright/test'

/** Collects console errors and uncaught exceptions for the whole test. */
function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const measurement = (page: Page, id: string) => page.locator(`[data-measurement="${id}"]`).first()

test('YDSE journey: open → light on → β = λD/d → live change → detector → record → compare', async ({
  page,
}) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics')
  await page.getByRole('link', { name: 'Double Slit (YDSE)' }).click()
  await expect(page).toHaveURL(/\/lab\/physics\/double-slit$/)
  await expect(measurement(page, 'detectorFringe')).toHaveText('No light yet')

  // Red laser: β = 650 nm × 1.5 m / 0.5 mm = 1.95 mm.
  await page.getByRole('button', { name: 'Red laser (650 nm)' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText('Finished!')).toBeVisible({ timeout: 15_000 })
  await expect(measurement(page, 'fringeWidth')).toHaveText('1.95 mm')
  await expect(measurement(page, 'detectorFringe')).toHaveText('Bright fringe') // central maximum
  await page.getByRole('button', { name: 'Record trial' }).click()

  // Live: a new wavelength updates the pattern without restarting (532 nm → 1.60 mm).
  const wavelength = page.getByRole('textbox', { name: 'Wavelength λ in nm' })
  await wavelength.fill('532')
  await wavelength.press('Enter')
  await expect(measurement(page, 'fringeWidth')).toHaveText('1.60 mm')
  await expect(page.getByRole('button', { name: 'Run again' })).toBeVisible()

  // Detector half a fringe from the centre sits on the first dark fringe.
  const detector = page.getByRole('textbox', { name: 'Detector position in mm' })
  await detector.fill('0.80')
  await detector.press('Enter')
  await expect(measurement(page, 'detectorFringe')).toHaveText('Dark fringe')
  await detector.fill('0')
  await detector.press('Enter')
  await page.getByRole('button', { name: 'Record trial' }).click()

  const trials = page.getByRole('list', { name: 'Recorded trials' })
  await expect(trials).toContainText('Trial 2')
  await page.getByRole('checkbox', { name: 'Compare Trial 1' }).check()
  await page.getByRole('checkbox', { name: 'Compare Trial 2' }).check()
  const comparison = page.getByLabel('Comparison')
  await expect(comparison).toContainText('650 nm → 532 nm')
  await expect(comparison.getByRole('row', { name: /Fringe width β/ })).toContainText('-0.35 mm')

  expect(errors).toEqual([])
})
