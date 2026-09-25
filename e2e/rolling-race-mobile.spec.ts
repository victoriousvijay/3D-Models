import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'] })

test('rolling race on a phone: heavy and light rings tie', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/lab/physics/rolling-race')
  const sheet = page.getByRole('region', { name: 'Lab controls' })

  await sheet.getByRole('button', { name: 'Heavy vs light rings' }).click()
  await sheet.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(sheet).toContainText('Finished!', { timeout: 15_000 })
  for (const id of ['time1', 'time2', 'time3']) {
    await expect(sheet.locator(`[data-measurement="${id}"]`).first()).toHaveText('2.17 s')
  }

  await sheet.getByRole('tab', { name: 'Trials' }).click()
  await sheet.getByRole('button', { name: 'Record trial' }).click()
  await expect(sheet.getByRole('list', { name: 'Recorded trials' })).toContainText('Trial 1')

  const canvas = await page.locator('canvas').first().boundingBox()
  expect(canvas?.height ?? 0).toBeGreaterThan(250)
  expect(errors).toEqual([])
})
