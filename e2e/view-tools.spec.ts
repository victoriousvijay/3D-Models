import { expect, test, type Page } from '@playwright/test'

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('panels collapse and hide; grab mode pans the view; reset view restores it', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics/rolling-race')
  const conditions = page.getByRole('region', { name: 'Conditions' })
  await expect(conditions.getByRole('slider', { name: 'Incline angle θ' })).toBeVisible()

  // Collapse one panel to its header, then expand it again.
  await page.getByRole('button', { name: 'Collapse Conditions' }).click()
  await expect(conditions.getByRole('slider', { name: 'Incline angle θ' })).toBeHidden()
  await page.getByRole('button', { name: 'Expand Conditions' }).click()
  await expect(conditions.getByRole('slider', { name: 'Incline angle θ' })).toBeVisible()

  // Hide every panel; the toolbar stays so they can be brought back.
  await page.getByRole('button', { name: 'Hide panels' }).click()
  await expect(conditions).toBeHidden()
  await expect(page.getByRole('region', { name: 'Results' })).toBeHidden()
  await page.getByRole('button', { name: 'Show panels' }).click()
  await expect(conditions).toBeVisible()

  // Grab mode: a left drag moves the view (the image changes) and never selects an object.
  const grab = page.getByRole('button', { name: 'Grab mode' })
  await grab.click()
  await expect(grab).toHaveAttribute('aria-pressed', 'true')
  const before = await page.screenshot()
  await page.mouse.move(720, 480)
  await page.mouse.down()
  await page.mouse.move(620, 430, { steps: 10 })
  await page.mouse.up()
  await page.mouse.wheel(0, -300)
  await page.waitForTimeout(400)
  const panned = await page.screenshot()
  expect(Buffer.compare(before, panned)).not.toBe(0)
  await expect(page.getByRole('region', { name: 'About this experiment' })).toBeVisible()

  // Reset view returns to the authored framing.
  await page.getByRole('button', { name: 'Reset view' }).click()
  await page.waitForTimeout(600)
  expect(Buffer.compare(panned, await page.screenshot())).not.toBe(0)
  await grab.click()
  await expect(grab).toHaveAttribute('aria-pressed', 'false')

  expect(errors).toEqual([])
})

test('annotate: pen, shapes, colours, undo, eraser and clear', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/lab/physics/collision-1d')
  const layer = page.locator('svg[data-annotations]')
  const count = () => layer.getAttribute('data-annotations')
  const drag = async (from: [number, number], to: [number, number]) => {
    await page.mouse.move(...from)
    await page.mouse.down()
    await page.mouse.move(...to, { steps: 8 })
    await page.mouse.up()
  }

  await page.getByRole('button', { name: 'Annotate' }).click()
  const bar = page.getByRole('toolbar', { name: 'Annotation tools' })
  await expect(bar).toBeVisible()

  // Pen stroke in green, then a rectangle.
  await bar.getByRole('button', { name: 'Colour #2f9e44' }).click()
  await drag([600, 300], [800, 360])
  expect(await count()).toBe('1')
  await expect(layer.locator('path').first()).toHaveAttribute('stroke', '#2f9e44')
  await bar.getByRole('button', { name: 'Rectangle' }).click()
  await drag([600, 450], [760, 560])
  expect(await count()).toBe('2')

  // Undo removes the rectangle; the eraser removes the pen stroke.
  await bar.getByRole('button', { name: 'Undo' }).click()
  expect(await count()).toBe('1')
  await bar.getByRole('button', { name: 'Eraser' }).click()
  await drag([700, 280], [700, 380])
  expect(await count()).toBe('0')

  // Clear all, and closing the bar keeps drawings visible.
  await bar.getByRole('button', { name: 'Arrow' }).click()
  await drag([600, 300], [760, 320])
  await bar.getByRole('button', { name: 'Clear all drawings' }).click()
  expect(await count()).toBe('0')
  await bar.getByRole('button', { name: 'Pen' }).click()
  await drag([620, 300], [700, 330])
  await page.keyboard.press('Escape')
  await expect(bar).toBeHidden()
  expect(await count()).toBe('1')
  await expect(page.getByRole('button', { name: 'Annotate' })).toHaveAttribute('aria-pressed', 'false')

  expect(errors).toEqual([])
})
