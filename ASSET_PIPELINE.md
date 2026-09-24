# 3D Asset Pipeline

## Primary Tool

Blender.

## Runtime Format

GLB/GLTF.

## Pipeline

```text
Blender
  |
  +-- clean geometry
  +-- correct scale
  +-- apply transforms
  +-- optimize materials
  +-- create UVs where necessary
  +-- export GLB
  |
  +-- Draco/Meshopt optimization
  |
  +-- runtime loading
```

## Asset Requirements

Every production asset should have:

- meaningful name
- correct scale
- sensible origin
- optimized topology
- optimized textures
- documented license/source
- preview image
- subject/category metadata

## Naming

Prefer:

```text
heart_left_ventricle
heart_aortic_valve
projectile_launcher
projectile_ball
convex_lens
```

Avoid:

```text
Object001
Mesh_23
Cube.004
```

## Runtime Optimization

Use:

- instancing
- LOD
- compressed textures where appropriate
- lazy loading
- asset caching
- optimized GLB files

Avoid loading every model when the application starts.

## Scientific Models

Models must visually communicate relevant structure.

Do not optimize away scientifically important components.
