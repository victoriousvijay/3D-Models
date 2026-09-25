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

async function race(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByText('Finished!')).toBeVisible({ timeout: 15_000 })
}

test('rolling race: shape decides the winner; size does not', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics')
  await page.getByRole('link', { name: 'Rolling Race' }).click()
  await expect(page).toHaveURL(/\/lab\/physics\/rolling-race$/)

  // Sphere vs cylinder vs ring at 10°, 2 m: t = √(2L(1 + k)/(g sin θ)).
  await race(page)
  await expect(measurement(page, 'time1')).toHaveText('1.81 s')
  await expect(measurement(page, 'time2')).toHaveText('1.88 s')
  await expect(measurement(page, 'time3')).toHaveText('2.17 s')
  await expect(measurement(page, 'winner')).toHaveText('Lane 1')
  await page.getByRole('button', { name: 'Record trial' }).click()

  // Three solid spheres of 30, 60 and 100 mm: a dead heat.
  await page.getByRole('button', { name: 'Big vs small spheres' }).click()
  await race(page)
  for (const id of ['time1', 'time2', 'time3']) await expect(measurement(page, id)).toHaveText('1.81 s')
  await expect(measurement(page, 'winner')).toHaveText('Tie')
  await page.getByRole('button', { name: 'Record trial' }).click()

  await page.getByRole('checkbox', { name: 'Compare Trial 1' }).check()
  await page.getByRole('checkbox', { name: 'Compare Trial 2' }).check()
  const comparison = page.getByLabel('Comparison')
  await expect(comparison).toContainText('Lane 3 body: Ring (I = mr²) → Solid sphere (I = ⅖mr²)')
  await expect(
    comparison.getByRole('row', { name: /^Lane 1 time [+-]?(0\.00|\d\.\d\de-\d+) s$/ }),
  ).toBeVisible()
  await expect(comparison.getByRole('row', { name: /^Lane 3 time -0\.35 s$/ })).toBeVisible()

  expect(errors).toEqual([])
})

test('rolling race: steeper is faster, the order stays; energy columns switch on', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics/rolling-race')

  const angle = page.getByRole('textbox', { name: 'Incline angle θ in °' })
  await angle.fill('30')
  await angle.press('Enter')
  await page.getByRole('button', { name: 'Energy columns' }).click()
  await race(page)
  // t ∝ 1/√(sin θ): 1.81 s × √(sin 10° / sin 30°) = 1.07 s
  await expect(measurement(page, 'time1')).toHaveText('1.07 s')
  await expect(measurement(page, 'time3')).toHaveText('1.28 s')
  await expect(measurement(page, 'winner')).toHaveText('Lane 1')

  expect(errors).toEqual([])
})
