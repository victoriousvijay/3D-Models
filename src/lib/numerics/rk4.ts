/**
 * Domain-neutral numerical methods. Framework-free; usable by any domain
 * without making one domain depend on another.
 */

/** Right-hand side of a first-order ODE system: dy/dt = f(t, y). */
export type Derivative = (t: number, y: readonly number[]) => readonly number[]

function axpy(y: readonly number[], k: readonly number[], h: number): number[] {
  return y.map((value, i) => value + h * (k[i] ?? 0))
}

/**
 * One classical fourth-order Runge–Kutta step. Local error O(h⁵), global
 * error O(h⁴). Returns a new state vector; the input is not mutated.
 */
export function rk4Step(f: Derivative, t: number, y: readonly number[], h: number): number[] {
  const k1 = f(t, y)
  const k2 = f(t + h / 2, axpy(y, k1, h / 2))
  const k3 = f(t + h / 2, axpy(y, k2, h / 2))
  const k4 = f(t + h, axpy(y, k3, h))
  return y.map(
    (value, i) => value + (h / 6) * ((k1[i] ?? 0) + 2 * (k2[i] ?? 0) + 2 * (k3[i] ?? 0) + (k4[i] ?? 0)),
  )
}
