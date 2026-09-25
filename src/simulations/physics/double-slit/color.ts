/**
 * Approximate sRGB colour of monochromatic light (380–750 nm).
 *
 * A piecewise-linear approximation of the visible spectrum (after Bruton),
 * with brightness tapering towards the ends where the eye is less sensitive;
 * a floor keeps the extreme wavelengths visible on screen. Perceptual colour
 * is an approximation: see the lab's assumptions.
 */
export function wavelengthToRgb(nm: number): [number, number, number] {
  let r = 0
  let g = 0
  let b = 0
  if (nm < 440) {
    r = -(nm - 440) / (440 - 380)
    b = 1
  } else if (nm < 490) {
    g = (nm - 440) / (490 - 440)
    b = 1
  } else if (nm < 510) {
    g = 1
    b = -(nm - 510) / (510 - 490)
  } else if (nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1
  } else if (nm < 645) {
    r = 1
    g = -(nm - 645) / (645 - 580)
  } else {
    r = 1
  }

  let factor = 1
  if (nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380)
  else if (nm > 700) factor = 0.3 + (0.7 * (750 - nm)) / (750 - 700)
  factor = Math.max(factor, 0.45)

  const clamp = (v: number) => Math.min(1, Math.max(0, v * factor))
  return [clamp(r), clamp(g), clamp(b)]
}

export function wavelengthToHex(nm: number): string {
  const hex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
  const [r, g, b] = wavelengthToRgb(nm)
  return `#${hex(r)}${hex(g)}${hex(b)}`
}
