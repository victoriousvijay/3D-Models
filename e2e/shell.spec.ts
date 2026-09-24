import { expect, test } from '@playwright/test'

test('application shell loads the 3D lab without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Simulation Lab' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Simulations' })).toContainText('Physics')
  await expect(page.locator('canvas')).toBeVisible()

  expect(errors).toEqual([])
})
