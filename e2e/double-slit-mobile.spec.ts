import { devices, expect, test } from '@playwright/test'

test.use({ ...devices['Pixel 7'] })

test('YDSE on a phone: start, pattern forms, change d live', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/lab/physics/double-slit')
  const sheet = page.getByRole('region', { name: 'Lab controls' })
  await sheet.getByRole('button', { name: 'Start' }).click()
  await expect(sheet).toContainText('Finished!', { timeout: 15_000 })
  await expect(sheet.locator('[data-measurement="fringeWidth"]').first()).toHaveText('1.80 mm')

  const separation = sheet.getByRole('textbox', { name: 'Slit separation d in mm' })
  await separation.fill('1.00')
  await separation.press('Enter')
  await expect(sheet.locator('[data-measurement="fringeWidth"]').first()).toHaveText('0.90 mm')

  const canvas = await page.locator('canvas').first().boundingBox()
  expect(canvas?.height ?? 0).toBeGreaterThan(250)
  expect(errors).toEqual([])
})
