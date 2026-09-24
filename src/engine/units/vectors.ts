import type { Vec2, Vec3 } from '../types'

/** Builds a typed 2D vector (e.g. for a `vector` measurement with `dimensions: 2`). */
export const vec2 = (x: number, y: number): Vec2 => [x, y]

/** Builds a typed 3D vector (e.g. for a `vector` measurement with `dimensions: 3`). */
export const vec3 = (x: number, y: number, z: number): Vec3 => [x, y, z]
