import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'] })

test('1D collision on a phone: run, see results, record', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/lab/physics/collision-1d')
  const sheet = page.getByRole('region', { name: 'Lab controls' })

  await sheet.getByRole('button', { name: 'Light target' }).click()
  await sheet.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(sheet).toContainText('Finished!', { timeout: 15_000 })
  // 2 kg at 1 m/s hits 0.5 kg at rest: v_A = 0.60 m/s, v_B = 1.60 m/s.
  await expect(sheet.locator('[data-measurement="velocityA"]').first()).toHaveText('0.60 m/s')
  await expect(sheet.locator('[data-measurement="velocityB"]').first()).toHaveText('1.60 m/s')

  await sheet.getByRole('tab', { name: 'Trials' }).click()
  await sheet.getByRole('button', { name: 'Record trial' }).click()
  await expect(sheet.getByRole('list', { name: 'Recorded trials' })).toContainText('Trial 1')

  const canvas = await page.locator('canvas').first().boundingBox()
  expect(canvas?.height ?? 0).toBeGreaterThan(250)
  expect(errors).toEqual([])
})
