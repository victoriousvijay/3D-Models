import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('Landing → Enter 3D Simulation Lab → Hub → Physics → Projectile Motion', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Step inside/ })).toBeVisible()

  // The portal transition runs, then the hub takes over.
  await page.getByRole('button', { name: /Enter 3D Simulation Lab/i }).click()
  await expect(page).toHaveURL(/\/lab$/)
  await expect(page.getByRole('heading', { name: 'Science Simulation Lab' })).toBeVisible()

  // Choosing a division flies the camera to its station, then opens the division lab.
  const divisions = page.getByRole('navigation', { name: 'Divisions' })
  await expect(divisions.getByRole('button')).toHaveCount(4)
  await divisions.getByRole('button', { name: /Physics/ }).click()
  await expect(page).toHaveURL(/\/lab\/physics$/)
  await expect(page.getByRole('heading', { name: 'Physics Lab' })).toBeVisible()
  await expect(page.getByRole('article')).toHaveCount(16)

  await page.getByRole('link', { name: 'Projectile Motion' }).click()
  await expect(page).toHaveURL(/\/lab\/physics\/projectile-motion$/)
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByText('Finished!')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-measurement="horizontalDistance"]')).toHaveText('40.77 m')

  // And back out to the division.
  await page.getByRole('link', { name: 'Back to Physics Lab' }).click()
  await expect(page).toHaveURL(/\/lab\/physics$/)

  expect(errors).toEqual([])
})

test('reduced motion: no transitions, navigation is immediate', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('button', { name: /Enter 3D Simulation Lab/i }).click()
  await expect(page).toHaveURL(/\/lab$/, { timeout: 1_000 })
  await page
    .getByRole('navigation', { name: 'Divisions' })
    .getByRole('button', { name: /Chemistry/ })
    .click()
  await expect(page).toHaveURL(/\/lab\/chemistry$/, { timeout: 1_000 })
  await expect(page.getByRole('article')).toHaveCount(30)
})

test('planned labs, unknown labs and unknown addresses are handled', async ({ page }) => {
  const errors = trackErrors(page)

  await page.goto('/lab/physics/double-slit')
  await expect(page.getByRole('heading', { name: 'Double Slit (YDSE)' })).toBeVisible()
  await expect(page.getByText('This lab is being built.')).toBeVisible()
  await page.getByRole('link', { name: 'Projectile Motion' }).click()
  await expect(page).toHaveURL(/\/lab\/physics\/projectile-motion$/)

  await page.goto('/lab/physics/not-a-lab')
  await expect(page.getByRole('heading', { name: 'This lab does not exist' })).toBeVisible()

  await page.goto('/lab/astrology')
  await expect(page.getByRole('heading', { name: 'This lab does not exist' })).toBeVisible()

  expect(errors).toEqual([])
})
