# Science Lab UX

The product should feel like entering a scientific facility. It should not feel like a website with 3D on it.

## Experience principles

1. **Cinematic but calm.** Motion guides attention: an entrance, a portal, a camera flight. Motion never decorates for its own sake, and it all disappears under `prefers-reduced-motion`.
2. **The science is the visual focus.** Emblems, previews and scenes show scientific objects, not stock art.
3. **Light laboratory.** A white and blue palette, with each division adding one accent colour.
4. **One interaction language.** Every lab shares the same controls, results, trials and learning panels.
5. **Honest content.** The landing page says how many labs are ready (1), not just how many exist (73). Planned labs say "In development", and draft explanations are labelled.

## Screens

### Landing (`/`)

- **Hero:** a full-bleed WebGL constellation, with three orbital particle shells and a crystalline core, turning slowly and following the pointer. The copy sits on a soft white veil over a faint lab grid.
- **Primary action:** "ENTER 3D SIMULATION LAB". It has a rotating light ring, a blue glow, and lift on hover and press. Clicking starts the portal transition.
- **Division chips** link directly to each division lab.
- **"How every lab works":** Explore → Experiment → Measure → Understand.

### Science Lab Hub (`/lab`)

- A circular facility floor. Each division has a station: a white pedestal, a light ring and a light pool in its accent colour, and a floating 3D emblem.
  - **Physics:** an atom with orbiting electrons.
  - **Chemistry:** a tetrahedral molecule.
  - **Botany:** a sprout.
  - **Zoology:** a cell with nucleus and mitochondria.
- Hover or focus lifts and brightens a station. Choosing one flies the camera to it.
- **Layouts:** an arc of four on wide screens, and a 2×2 block with a steeper camera on portrait screens (the list sits below the scene).

### Division Lab (`/lab/:division`)

- An identity header: accent gradient, the 3D emblem, and counts (labs, chapters, ready now).
- Labs grouped by NCERT chapter. Each row has:
  - a line-art concept preview in the accent colour
  - the title and a status badge (Ready or In development)
  - a one-line description
  - the simulation type
  - the action: Launch lab or Details

### Lab (`/lab/:division/:labId`)

- Available labs open their own world (MODEL_ECOSYSTEM_GUIDELINES.md) with the shared instrument layer (GOLD_STANDARD_LAB.md).
- Planned labs show a "coming soon" page with the concept, chapter, planned simulation type, and links to the labs that are ready.

## Later (not built yet)

Search and filter across labs; chapter/class filters; progress indicators per lab; recently opened labs.
