/**
 * GLSL for the YDSE lab. The physics lives in one shared function so the
 * interference map and the screen can never disagree.
 *
 * `ydseIntensity(X, Z)` evaluates I = I₁ + I₂ + 2√(I₁I₂) cos φ at a real point
 * (X metres along the beam from the slits, Z metres across), with the
 * cancellation-free path difference Δ = 2Zd/(r₁ + r₂). The cos term is
 * box-filtered over the pixel's phase footprint — the exact average of cos
 * over [φ − w/2, φ + w/2] is cos φ · sin(w/2)/(w/2) — so fringes too fine for
 * the display fade to the true average instead of aliasing into moiré.
 */
const INTENSITY_GLSL = /* glsl */ `
  uniform float uLambdaM;   // wavelength in the medium (m)
  uniform float uSlitSep;   // slit separation d (m)
  uniform float uI1;        // slit 1 intensity (units of I0)
  uniform float uI2;        // slit 2 intensity (units of I0)

  float ydseIntensity(float X, float Z) {
    float h = 0.5 * uSlitSep;
    float r1 = sqrt(X * X + (Z - h) * (Z - h));
    float r2 = sqrt(X * X + (Z + h) * (Z + h));
    float delta = 2.0 * Z * uSlitSep / (r1 + r2);
    float phi = 6.28318530718 * delta / uLambdaM;
    float w = fwidth(phi);
    float filt = w < 1e-3 ? 1.0 : clamp(sin(0.5 * w) / (0.5 * w), 0.0, 1.0);
    return max(0.0, uI1 + uI2 + 2.0 * sqrt(uI1 * uI2) * cos(phi) * filt);
  }
`

export const SCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const SCREEN_FRAGMENT = /* glsl */ `
  ${INTENSITY_GLSL}
  uniform float uDistance;   // D (m)
  uniform float uHalfWidth;  // real half-width of the screen (m)
  uniform float uReveal;     // 0 → 1 as the light arrives
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float Z = (vUv.x * 2.0 - 1.0) * uHalfWidth;
    // 4 I0 is the brightest possible fringe (equal slits, full source).
    float I = ydseIntensity(uDistance, Z) / 4.0;
    vec3 lit = uColor * I * 1.2 * uReveal;
    vec3 base = vec3(0.06, 0.07, 0.09);
    gl_FragColor = vec4(base + lit, 1.0);
  }
`

export const FIELD_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const FIELD_FRAGMENT = /* glsl */ `
  ${INTENSITY_GLSL}
  uniform float uBenchScale;    // scene units per metre along the beam
  uniform float uLateralScale;  // scene units per metre across the beam
  uniform float uScreenX;       // screen position (scene x)
  uniform float uSourceX;       // laser aperture (scene x)
  uniform float uSlitHalf;      // drawn half-separation of the slits (scene units)
  uniform float uBeamHalf;      // half-width of the incoming beam (scene units)
  uniform float uRippleLambda;  // drawn (conceptual) wavelength (scene units)
  uniform float uTravelled;     // how far the light has travelled from the source (scene units)
  uniform float uArrived;       // 1 once the light has reached the screen
  uniform float uSource;        // source brightness (0–1)
  uniform float uSlit2Amp;      // amplitude of slit 2's ripples relative to slit 1
  uniform float uShowMap;
  uniform float uShowRipples;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  varying vec3 vWorld;

  float crest(float phase) {
    return pow(0.5 + 0.5 * cos(6.28318530718 * phase), 10.0);
  }

  void main() {
    float x = vWorld.x;
    float z = vWorld.z;
    vec3 col = vec3(0.0);

    if (x < 0.0) {
      // Incoming plane waves from the laser to the slits.
      float front = uSourceX + uTravelled;
      if (x < uSourceX || x > front || abs(z) > uBeamHalf) discard;
      float edge = smoothstep(uBeamHalf, uBeamHalf - 0.1, abs(z));
      float fronts = crest((x - front) / uRippleLambda) * uShowRipples;
      col = uColor * uSource * (0.16 + 0.6 * fronts) * edge;
    } else {
      if (x > uScreenX) discard;
      float beyond = uTravelled + uSourceX;  // distance travelled past the slits
      if (beyond <= 0.0) discard;
      float d1 = distance(vec2(x, z), vec2(0.0, uSlitHalf));   // S1
      float d2 = distance(vec2(x, z), vec2(0.0, -uSlitHalf));  // S2
      float reach = uArrived > 0.5 ? 1.0 : smoothstep(beyond, beyond - 0.2, min(d1, d2));
      if (reach <= 0.0) discard;

      // True interference: time-averaged intensity from the real path difference.
      float I = ydseIntensity(x / uBenchScale, z / uLateralScale) / 4.0;
      vec3 map = uColor * I * 0.7 * uShowMap;

      // Conceptual ripples: each slit is a new source (drawn wavelength enlarged).
      float r1 = crest((d1 - beyond) / uRippleLambda) * exp(-d1 / 1.3);
      float r2 = crest((d2 - beyond) / uRippleLambda) * exp(-d2 / 1.3) * uSlit2Amp;
      vec3 ripples = (uColor * r1 + uColor2 * r2) * uSource * 0.55 * uShowRipples;

      col = (map + ripples) * reach;
    }
    gl_FragColor = vec4(col, 1.0);
  }
`
