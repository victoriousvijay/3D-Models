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

A character carousel, one division per slide (Physics, Chemistry, Botany, Zoology):

- The division's name stands huge behind its character (Anton display type), on a full-screen colour for that division, with a light film grain.
- The other three characters wait small and blurred: left, right and at the back.
- The ← → buttons, the keyboard arrows or the division switcher (top right) rotate the slides. Background, word, positions, scale, blur and opacity all crossfade over 650 ms, and clicks are ignored while a slide moves.
- **Bottom left:** "Physics Lab", the division's tagline and lab counts. **Bottom right:** "Explore Physics →" opens the division.
- Characters are configured in `src/components/landing/slides.ts`. The current images are **placeholders** hot-linked from a third-party demo; replace them with the platform's own character art before a public launch. The rotation logic is in `carousel.ts`, and it is unit-tested.
- Reduced motion: no crossfade; slides change instantly.

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

## Lab tools (every lab)

These tools live in the toolbar next to the run controls, so every lab gets them without any simulation code.

- **Collapsible panels.** Each floating panel has a chevron that collapses it to its title. The **hide panels** button (desktop) removes them all and leaves the scene and the toolbar.
- **Grab mode** (hand). A left drag or one finger moves the view instead of rotating it, the wheel zooms towards the cursor, and a right drag still rotates. Scene objects ignore the pointer, so a drag never selects or moves anything by accident. **Reset view** returns to the lab's framing.
- **Annotate** (pen). This opens the annotation bar:
  - pen, highlighter, line, arrow, rectangle and circle
  - an eraser that removes whole strokes
  - eight colours plus a colour picker, and three thicknesses
  - undo (Ctrl/⌘+Z), clear all and close (Esc)

  While the bar is open, the pointer draws and the scene does not move. Drawings stay visible after closing and are cleared when you leave the lab. They are screen overlays: they do not follow the camera, so use them on a still view.

- Labels drawn in the 3D scene sit beneath the panels (the canvas is its own stacking context).

The logic is framework-free geometry in `src/lib/annotation.ts` (paths, arrowheads, eraser hit-testing) and store state in `src/state/annotationStore.ts` and `src/state/labStore.ts`, all unit-tested. `e2e/view-tools.spec.ts` covers them in the browser.

## Later (not built yet)

Search and filter across labs; chapter/class filters; progress indicators per lab; recently opened labs.
