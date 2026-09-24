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

const measurement = (page: Page, id: string) => page.locator(`[data-measurement="${id}"]`)

test('critical journey: open → configure → run → measure → record (TESTING.md)', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')

  // Open platform → select Physics → select Projectile Motion
  const catalog = page.getByRole('navigation', { name: 'Simulations' })
  await expect(catalog).toContainText('Physics')
  await catalog.getByRole('button', { name: 'Projectile Motion' }).click()
  await expect(measurement(page, 'phase')).toHaveText('Ready')

  // Change velocity: 20 → 25 m/s (step 0.5)
  const speed = page.getByRole('slider', { name: 'Launch speed' })
  await speed.focus()
  for (let i = 0; i < 10; i++) await speed.press('ArrowRight')
  await expect(page.getByRole('region', { name: 'Conditions' })).toContainText('25.0 m/s')

  // Change angle: 45° → 30° (step 1)
  const angle = page.getByRole('slider', { name: 'Launch angle' })
  await angle.focus()
  for (let i = 0; i < 15; i++) await angle.press('ArrowLeft')
  await expect(page.getByRole('region', { name: 'Conditions' })).toContainText('30°')

  // Run simulation
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(measurement(page, 'phase')).toHaveText('Landed', { timeout: 15_000 })

  // Inspect measurement: R = v²·sin 2θ / g = 25²·sin 60° / 9.81 = 55.17 m; T = 2v·sin θ / g = 2.55 s
  await expect(measurement(page, 'horizontalDistance')).toHaveText('55.17 m')
  await expect(measurement(page, 'flightTime')).toHaveText('2.55 s')
  await expect(page.getByRole('button', { name: 'Run again' })).toBeVisible()

  // Record experiment
  await page.getByRole('button', { name: 'Record trial' }).click()
  const trials = page.getByRole('list', { name: 'Recorded trials' })
  await expect(trials).toContainText('Trial 1')
  await expect(trials).toContainText('55.17 m')

  expect(errors).toEqual([])
})

test('comparing complementary angles shows equal range', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Projectile Motion' }).click()

  for (const preset of ['30° launch', '60° launch']) {
    await page.getByRole('button', { name: preset }).click()
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(measurement(page, 'phase')).toHaveText('Landed', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Record trial' }).click()
  }

  await page.getByRole('checkbox', { name: 'Compare Trial 1' }).check()
  await page.getByRole('checkbox', { name: 'Compare Trial 2' }).check()
  const comparison = page.getByLabel('Comparison')
  await expect(comparison).toContainText('Launch angle: 30° → 60°')
  // Same range (difference rounds to zero), much higher peak at 60°.
  await expect(comparison.getByRole('row', { name: /Distance travelled/ })).toContainText(
    /[+-]?(0\.00|\d\.\d\de-\d+) m/,
  )
  await expect(comparison.getByRole('row', { name: /Highest point/ })).toContainText('+10.19 m')

  expect(errors).toEqual([])
})

test('explanations follow what the learner asks about', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Projectile Motion' }).click()
  await expect(page.getByRole('region', { name: 'About this experiment' })).toContainText(
    'Two independent motions',
  )

  await page.getByRole('button', { name: 'Explain Ball mass' }).click()
  await expect(page.getByRole('region', { name: 'Ball mass' })).toContainText('Does mass matter?')
})
