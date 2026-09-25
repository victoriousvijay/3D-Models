# Lab Spec — Double Slit (YDSE)

|                   |                                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| Lab id            | `double-slit` (`/lab/physics/double-slit`)                                   |
| Division / domain | Physics / `physics`                                                          |
| Chapter           | Wave Optics (NCERT Class 12, Ch. 10)                                         |
| Model kind        | `continuous` (light switched on → propagation → steady interference pattern) |
| Status            | In development → available when the completion checklist is met              |

## 1. Scientific concept

Monochromatic, coherent light illuminates two narrow parallel slits S₁ and S₂ separated by _d_. Each slit acts as a new source of waves (Huygens' principle), and the two sources are always in phase. On a screen at distance _D_, the waves from S₁ and S₂ meet after travelling different distances. Where the **path difference** Δ = S₂P − S₁P is a whole number of wavelengths, crests meet crests and the light is bright (**constructive interference**). Where it is an odd number of half-wavelengths, crests meet troughs and the light cancels (**destructive interference**). The result is a pattern of equally spaced bright and dark **fringes**, with a bright **central maximum** where Δ = 0.

## 2. NCERT relevance

Class 12 Physics, Chapter 10 _Wave Optics_: 10.5 Coherent and incoherent addition of waves; 10.6 Interference of light waves and Young's experiment (fringe width β = λD/d, positions of bright and dark fringes); effect of immersing the apparatus in a liquid (β′ = β/n); I = 4I₀cos²(φ/2); I_max and I_min for unequal intensities. It is a frequent NEET topic.

## 3. Learning objectives

1. Explain the fringes using path difference: bright where Δ = nλ, dark where Δ = (n + ½)λ.
2. Use β = λD/d to predict how fringe width changes with wavelength, slit separation and screen distance, and verify it by measurement.
3. Describe how the fringe pattern changes when the apparatus is immersed in water, or when one slit is dimmer than the other.

## 4. Equations (SI)

| Quantity                             | Relation                                                      | Notes                                                    |
| ------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- |
| Wavelength in medium                 | λₘ = λ / n                                                    | n = refractive index of the medium filling the apparatus |
| Path difference at screen position y | Δ = √(D² + (y + d/2)²) − √(D² + (y − d/2)²) = 2yd / (r₁ + r₂) | Exact. Computed in the cancellation-free form.           |
| Small-angle path difference          | Δ ≈ yd / D                                                    | Valid for D ≫ d and                                      | y   | ≪ D |
| Phase difference                     | φ = 2πΔ / λₘ                                                  |                                                          |
| Intensity                            | I = I₁ + I₂ + 2√(I₁I₂) cos φ                                  | Equal slits: I = 4I₀ cos²(φ/2)                           |
| Bright fringes                       | Δ = nλₘ ⇒ yₙ = nλₘD/d                                         | n = 0, ±1, ±2, … (n = 0 is the central maximum)          |
| Dark fringes                         | Δ = (n + ½)λₘ ⇒ yₙ = (n + ½)λₘD/d                             |                                                          |
| Fringe width                         | β = λₘD/d                                                     | Spacing between adjacent bright (or dark) fringes        |
| Angular fringe width                 | θ = λₘ/d                                                      |                                                          |
| Extremes                             | I_max = (√I₁ + √I₂)², I_min = (√I₁ − √I₂)²                    |                                                          |
| Fringe visibility                    | V = (I_max − I_min)/(I_max + I_min)                           | 1 for equal slits                                        |

## 5. Variables

| Id                 | Label                                  | Unit         | Range                            | Default | Step | Live? |
| ------------------ | -------------------------------------- | ------------ | -------------------------------- | ------- | ---- | ----- |
| `wavelength`       | Wavelength λ                           | nm           | 380–750                          | 600     | 1    | yes   |
| `slitSeparation`   | Slit separation d                      | mm           | 0.10–2.00                        | 0.50    | 0.01 | yes   |
| `screenDistance`   | Screen distance D                      | m            | 1.00–3.00                        | 1.50    | 0.05 | yes   |
| `sourceIntensity`  | Source brightness                      | 1 (relative) | 0.20–1.00                        | 1.00    | 0.05 | yes   |
| `slit2Intensity`   | Slit 2 brightness (relative to slit 1) | 1            | 0.10–1.00                        | 1.00    | 0.05 | yes   |
| `medium`           | Medium                                 | choice       | air (n = 1.00), water (n = 1.33) | air     | —    | yes   |
| `detectorPosition` | Detector position y                    | mm           | −15.00 to 15.00                  | 0.00    | 0.01 | yes   |

**Live variables** (a small engine extension, see §16) describe steady conditions, not initial conditions. Changing them updates the pattern immediately, without restarting the run. That's how a real YDSE behaves when you move the screen, and it's what lets the learner see the pattern respond as they turn a knob.

Invalid values (out of range, non-numeric) are rejected with the variable's message, as in every lab.

## 6. Units

λ in nm and d in mm are entered in their conventional units and converted to metres before any calculation. D is in m, and y in mm (converted to m). Intensity is relative, in units of the intensity I₀ that one slit alone produces at the screen. Physics adds the units `nm` and `mm` to its catalogue.

## 7. Assumptions (shown to the learner)

1. The light is monochromatic and coherent (a laser). Both slits are lit in phase.
2. The slits are very narrow, so each spreads light evenly across the screen. The single-slit diffraction envelope is ignored, so all bright fringes are equally bright. In a real experiment they fade away from the centre.
3. Intensities are relative to I₀, the intensity from one slit alone. The small fall-off of intensity across the screen is ignored.
4. The fringe width uses β = λD/d (D ≫ d, small angles). Intensity uses the exact path difference. Within the ±15 mm screen the two agree to better than 0.01 %.
5. The medium fills the whole apparatus: λ in the medium = λ/n; n(air) ≈ 1.00, n(water) = 1.33.
6. **The drawing is not to scale.**
   - Distances along the bench are shortened, and the slit separation is drawn enlarged.
   - The sideways direction of the wave map and the screen is magnified about 133× so the fringes can be seen.
   - The ripples leaving each slit are drawn with the wavelength greatly enlarged, and the light is shown in extreme slow motion; real light crosses the bench in about 10 ns.
   - The bright/dark bands between the slits and the screen, and the screen itself, use the true path difference, so they line up exactly.
7. Colours approximate how each wavelength looks.

## 8. 3D environment: optics darkroom

A dim, deep-navy darkroom (light fringes need darkness), with an optical bench along the beam axis. There is no ground grid or orientation gizmo (unlike the projectile range). Instead there's an optical-axis line, a ruler on the screen and mm ticks. The scene tone is dark, so the lab header switches to light text.

Layout (scene units, beam along +x, fringes along z, stripes vertical in y):

| Element             | Position                                                        |
| ------------------- | --------------------------------------------------------------- |
| Laser source        | x ≈ −2.4 … −1.4                                                 |
| Double-slit barrier | x = 0, slits at z = ±s/2 (s drawn from d, enlarged)             |
| Screen              | x = 2.5·D (m) → 2.5 … 7.5; spans z ∈ [−2, 2] ↔ y ∈ [−15, 15] mm |
| Wave field          | horizontal plane at the beam height, from source to screen      |

## 9. Scientific objects (selectable, each with an explanation)

| Object               | Represents                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Laser                | Coherent, monochromatic source; beam colour follows λ                                        |
| Double slit (S₁, S₂) | Barrier with two narrow slits; labels S₁/S₂; separation follows d                            |
| Screen               | Shows the live interference pattern, a mm ruler, fringe-order labels and the β bracket       |
| Detector             | A small light meter on the screen; drag it to measure intensity and path difference at any y |

## 10. Interactions

| Interaction                              | Purpose                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Select laser / slits / screen / detector | Opens the object's explanation (why it matters)                          |
| Drag the detector along the screen       | Measure I, Δ and the fringe order at any point (sets `detectorPosition`) |
| Sliders + exact entry for every variable | Investigate β = λD/d                                                     |
| Start / pause / step / reset / run again | Switch the light on and watch the pattern form; replay it                |
| Orbit, zoom, pan                         | Inspect the apparatus from any angle                                     |

## 11. Measurements

| Id                              | Label                                 | Unit                                                                   | Emphasis |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- | -------- |
| `fringeWidth`                   | Fringe width β                        | mm                                                                     | primary  |
| `detectorIntensity`             | Intensity at detector (I/I₀)          | 1                                                                      | primary  |
| `detectorFringe`                | At detector                           | category: Bright fringe / Dark fringe / Between fringes / No light yet | primary  |
| `pathDifference`                | Path difference at detector Δ         | nm                                                                     | detail   |
| `fringeOrder`                   | Δ/λ at detector                       | 1                                                                      | detail   |
| `phaseDifference`               | Phase difference φ                    | rad                                                                    | detail   |
| `wavelengthInMedium`            | Wavelength in medium λₘ               | nm                                                                     | detail   |
| `angularFringeWidth`            | Angular fringe width θ = λ/d          | rad                                                                    | detail   |
| `maxIntensity` / `minIntensity` | I_max / I₀, I_min / I₀                | 1                                                                      | detail   |
| `visibility`                    | Fringe visibility                     | 1                                                                      | detail   |
| `brightFringesOnScreen`         | Bright fringes on the screen (±15 mm) | 1                                                                      | detail   |
| `phase`                         | Light                                 | category: Off / Travelling / Pattern formed                            | detail   |

The setup properties (β, λₘ, θ, I_max, I_min, V) show at all times. Detector readings are zero or "No light yet" until light reaches the screen.

## 12. Visualisations (overlays; each can be toggled)

| Overlay           | What it shows                                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interference map  | Time-averaged intensity between the slits and the screen, computed from the true path difference: a fan of bright (constructive) and dark (destructive) bands that meets the screen exactly at the fringes |
| Wavefronts        | Conceptual crests: plane fronts from the laser, and circular ripples from S₁ and S₂ (two tints) that fade with distance. They show each slit acting as a source. Wavelength enlarged.                      |
| Fringe lines      | Lines of constructive (n = 0, ±1, …) and destructive interference from between the slits to the screen, labelled with n                                                                                    |
| Intensity profile | A graph of I(y) above the screen: the cos² shape                                                                                                                                                           |
| Screen markers    | Central maximum label, fringe-width bracket β, mm ruler                                                                                                                                                    |

The screen shader and the wave-map shader share one formula and are box-filtered in phase (a sinc factor from `fwidth`). Fringes too fine to resolve at the current zoom fade honestly to the average intensity instead of aliasing into moiré.

## 13. Experiments (investigations; recorded as trials and compared)

1. **Effect of wavelength:** keep d and D fixed; record β for red, green and violet light; compare.
2. **Effect of slit separation:** keep λ and D fixed; halve d; compare β.
3. **Effect of screen distance:** keep λ and d fixed; double D; compare β.
4. **Immersion in water:** record in air, then in water; compare β.
5. **Unequal slits:** dim slit 2; do the dark fringes stay completely dark?
6. **Detector:** move the detector to the first dark fringe; what is the path difference there?

Each gives the steps as a hint and never states the result.

## 14. Expected observations (the tests assert these)

- β = λD/d exactly (e.g. λ = 600 nm, D = 1.5 m, d = 0.5 mm → β = 1.800 mm).
- β ∝ λ, β ∝ D, β ∝ 1/d; in water β is 1.33 times smaller.
- The central maximum (y = 0) is bright: I = I_max = 4I₀ for equal slits.
- At y = nβ, the detector reads bright with Δ ≈ nλ; at y = (n + ½)β, it reads dark with I ≈ I_min.
- Equal slits: I_min = 0, V = 1. Slit 2 at 0.25: I_max = 2.25 I₀, I_min = 0.25 I₀, V = 0.8.
- Pattern symmetric about y = 0.

## 15. Edge cases

| Case                                                                  | Behaviour                                                                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Very large β (λ 750 nm, D 3 m, d 0.1 mm → 22.5 mm)                    | Only the central maximum fits on the screen; the count reads 1; the β bracket is hidden (off-screen)           |
| Very small β (λ 380 nm, D 1 m, d 2 mm → 0.19 mm)                      | About 160 fringes; filtered shading fades to the average where they can't be resolved; measurements stay exact |
| Detector at ±15 mm                                                    | Valid; readings correct                                                                                        |
| Changing variables while the light travels or after the pattern forms | Pattern updates live; the run is not restarted                                                                 |
| Out-of-range or non-numeric input                                     | Rejected inline; value unchanged                                                                               |
| Reduced motion                                                        | No ripple animation; the pattern and map show statically                                                       |

## 16. Platform changes required (small, generic)

1. **`liveVariables`** on a simulation definition. Changes to only these variables update the run in place (new values, re-measured, events emitted) instead of resetting it. They stay adjustable while running. Validated: the ids must exist. Projectile Motion declares none, so its behaviour is unchanged.
2. **`sceneTone: 'light' | 'dark'`** on a simulation package, so shared chrome (the header) stays legible over a dark environment. Default is `'light'`.
3. Physics units `nm` and `mm`.
4. The render driver redraws on `variables` events, so live changes show while paused or finished.

## 17. Performance

- Two shader-driven planes (wave field, screen): the physics runs per pixel on the GPU. No per-wave React components or meshes.
- The intensity profile is one line of 400 points, recomputed only when variables change.
- A handful of Html labels (≤ 15).
- Uniforms update in `useFrame` from the runtime, with no React renders per frame.
- Ripple animation continues after the pattern forms only while it is visible, and not under reduced motion.
- Target: under 30 draw calls; 60 fps on an integrated-GPU laptop; smooth on a mid-range phone.

## 18. Assets

All procedural (primitives and shaders), with no downloads. A GLB optical bench and laser housing can replace the primitives later (ASSET_PIPELINE.md) without changing the science.

## 19. Tests

- **Unit (domain):** every relation in §4, the cancellation-free Δ against a high-precision reference, the small-angle agreement, the extremes and visibility, validation of invalid inputs.
- **Unit (lab):** definition valid for the physics domain; runtime journey (start → pattern formed); detector at nβ is bright and at (n + ½)β is dark; live changes don't reset; β proportionalities; water; reset; extreme valid values; invalid values rejected.
- **Engine:** `liveVariables` semantics and validation.
- **Colour:** the wavelength→RGB mapping gives the expected hue family.
- **e2e:** open from the Physics Lab → start → pattern formed → β reads 1.80 mm → change λ via exact entry → β updates live → record two trials → compare; phone layout; no console errors; Projectile Motion suites still pass.
