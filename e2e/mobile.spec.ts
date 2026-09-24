import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'] })

test('phone: open → adjust → run → see results → record, with nothing overlapping', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await page.getByRole('button', { name: 'Projectile Motion' }).click()

  const sheet = page.getByRole('region', { name: 'Lab controls' })
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('Set the conditions, then press Start.')

  // Presets are reachable and change the conditions.
  await sheet.getByRole('button', { name: '30° launch' }).click()
  await expect(sheet.getByRole('region', { name: 'Conditions' })).toContainText('30°')

  // Start is tappable (not covered by another panel) and the run completes.
  await sheet.getByRole('button', { name: 'Start' }).click()
  await expect(sheet).toContainText('Finished!', { timeout: 15_000 })
  // R = 20²·sin 60° / 9.81 = 35.31 m
  await expect(sheet.locator('[data-measurement="horizontalDistance"]')).toHaveText('35.31 m')

  // Record in the Trials tab.
  await sheet.getByRole('tab', { name: 'Trials' }).click()
  await sheet.getByRole('button', { name: 'Record trial' }).click()
  await expect(sheet.getByRole('list', { name: 'Recorded trials' })).toContainText('Trial 1')

  // Learn tab offers investigations; the sheet collapses to give the scene room.
  await sheet.getByRole('tab', { name: 'Learn' }).click()
  await expect(sheet.getByRole('region', { name: 'Try this' })).toBeVisible()
  await sheet.getByRole('tab', { name: 'Learn' }).click()
  await expect(sheet.getByRole('tabpanel')).toHaveCount(0)

  // The 3D canvas keeps a usable share of the screen.
  const canvas = await page.locator('canvas').first().boundingBox()
  expect(canvas?.height ?? 0).toBeGreaterThan(250)

  expect(errors).toEqual([])
})
