# Performance Strategy

## Targets

The experience should remain responsive on ordinary modern student laptops.

## Rendering

Monitor:

- FPS
- draw calls
- triangles
- texture memory
- shader complexity

## Models

Use:

- GLB/GLTF
- compression
- LOD
- instancing
- lazy loading

## React

Avoid:

- unnecessary re-renders
- storing per-frame values in React state
- expensive calculations during render

Prefer refs and simulation loops for rapidly changing values.

## Simulation

For expensive calculations:

- use optimized algorithms
- consider Web Workers
- avoid unnecessary recalculation

## Assets

Load only what the current simulation needs.

Use progressive loading for large experiences.

## Mobile/Tablet

The application should degrade gracefully.

Disable expensive visual effects when device performance is poor.

## Measurement

Use browser performance tools and Three.js statistics during development.
