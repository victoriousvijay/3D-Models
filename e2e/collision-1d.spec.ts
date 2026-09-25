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

async function runToEnd(page: Page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByText('Finished!')).toBeVisible({ timeout: 15_000 })
}

test('1D collision: elastic vs sticky — momentum kept, kinetic energy not', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics')
  await page.getByRole('link', { name: '1D Collision' }).click()
  await expect(page).toHaveURL(/\/lab\/physics\/collision-1d$/)

  // Equal masses, elastic, B at rest: A stops and B leaves with A's velocity.
  await runToEnd(page)
  await expect(measurement(page, 'velocityA')).toHaveText('0.00 m/s')
  await expect(measurement(page, 'velocityB')).toHaveText('1.00 m/s')
  await expect(measurement(page, 'totalMomentum')).toHaveText('0.50 kg·m/s')
  await page.getByRole('button', { name: 'Record trial' }).click()

  // Same start, sticky bumpers: both move at 0.50 m/s; half the kinetic energy is lost.
  await page.getByRole('button', { name: 'Sticky' }).click()
  await runToEnd(page)
  await expect(measurement(page, 'velocityA')).toHaveText('0.50 m/s')
  await expect(measurement(page, 'velocityB')).toHaveText('0.50 m/s')
  await expect(measurement(page, 'totalMomentum')).toHaveText('0.50 kg·m/s')
  await page.getByRole('button', { name: 'Record trial' }).click()

  await page.getByRole('checkbox', { name: 'Compare Trial 1' }).check()
  await page.getByRole('checkbox', { name: 'Compare Trial 2' }).check()
  const comparison = page.getByLabel('Comparison')
  await expect(comparison).toContainText('Elastic (spring bumpers) → Perfectly inelastic (sticky)')
  await expect(
    comparison.getByRole('row', { name: /^Total momentum [+-]?(0\.00|\d\.\d\de-\d+) kg·m\/s$/ }),
  ).toBeVisible()
  await expect(comparison.getByRole('row', { name: /^Total kinetic energy -0\.1[23] J$/ })).toBeVisible()

  expect(errors).toEqual([])
})

test('1D collision: typed velocities, head-on and a light glider bouncing back', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics/collision-1d')

  // Heavy target: A (0.5 kg) bounces back off B (2 kg).
  await page.getByRole('button', { name: 'Heavy target' }).click()
  await runToEnd(page)
  await expect(measurement(page, 'velocityA')).toHaveText('-0.60 m/s')
  await expect(measurement(page, 'velocityB')).toHaveText('0.40 m/s')

  // Head-on with typed velocities: total momentum is zero; the velocities swap.
  await page.getByRole('button', { name: 'Equal masses' }).click()
  const vB = page.getByRole('textbox', { name: 'Initial velocity of B in m/s' })
  await vB.fill('-1')
  await vB.press('Enter')
  await expect(measurement(page, 'totalMomentum')).toHaveText('0.00 kg·m/s')
  await runToEnd(page)
  await expect(measurement(page, 'velocityA')).toHaveText('-1.00 m/s')
  await expect(measurement(page, 'velocityB')).toHaveText('1.00 m/s')

  expect(errors).toEqual([])
})
