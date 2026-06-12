// GLSL for the constellation's atmospheric layer. Three passes,
// painted back-to-front each frame:
//
//   1. The dome — a full-screen pass that casts a view ray per pixel
//      through the live navigation camera and paints the firmament
//      in world space: the pole-anchored sky gradient, the domain-
//      warped watercolor wash, the deep micro-starfield, the room
//      quadrants' chromatic atmospheres, the daystar's gathered
//      glow, the cursor's pool of attention, and the paper grain.
//      Because the ray goes through the same pinhole the structural
//      SVG projects through, the backdrop parallaxes honestly when
//      the visitor travels — depth, not decoration.
//
//   2. The star halos — instanced sprites pinned to the structural
//      stars' screen positions. By night they are luminous glows
//      that twinkle (the held twinkle, returned as shader work the
//      way tokens.css's archaeology asked); by day they are
//      watercolor pigment bleeds with wobbled, edge-darkened rims.
//      uNight crossfades the two ontologies through the theme
//      transition.
//
//   3. The motes — small drifting dust on shells just above the
//      sphere, projected through the same camera so they parallax
//      more than the stars beneath them.
//
// All shaders are GLSL ES 1.00 (runs on WebGL1 and WebGL2 alike).
// Simplex noise is the Ashima Arts implementation, public domain.

const PRECISION_HEADER = /* glsl */ `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
`;

const NOISE_LIB = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Simplex 3D noise — Ashima Arts / Stefan Gustavson, public domain.
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.52;
    sum += amp * snoise(p);        p = p * 2.03 + 19.1; amp *= 0.5;
    sum += amp * snoise(p);        p = p * 1.97 + 7.3;  amp *= 0.5;
    sum += amp * snoise(p);        p = p * 2.11 + 3.7;  amp *= 0.5;
    sum += amp * snoise(p);
    return sum;
  }
`;

export const DOME_VERTEX = /* glsl */ `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const DOME_FRAGMENT = /* glsl */ `
  ${PRECISION_HEADER}
  uniform vec2 uResolution;
  uniform float uFitScale;
  uniform vec2 uFitOffset;
  uniform float uTime;
  uniform float uMotion;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGround;
  uniform vec3 uGlowColor;
  uniform float uGlowStrength;
  uniform vec3 uAccentWarm;
  uniform vec3 uAccentRose;
  uniform vec3 uAccentViolet;
  uniform vec3 uAccentGold;
  uniform float uGrain;
  uniform float uNight;
  uniform vec3 uCamPos;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
  uniform vec3 uCamFwd;
  uniform float uTanHalfFov;
  uniform vec2 uDomeShift;
  uniform float uSpin;
  uniform vec3 uPool;
  uniform float uPoolRadius;
  uniform vec2 uDaystar;

  ${NOISE_LIB}

  // Gaussian weight on wrapped angular distance — the room
  // quadrants' chromatic neighborhoods.
  float sectorWeight(float phi, float center) {
    float d = abs(mod(phi - center + 3.14159265, 6.28318531) - 3.14159265);
    return exp(-d * d * 2.1);
  }

  // One layer of deep stars. Each cell holds at most one candidate,
  // confined away from cell borders so the field never pops while
  // the heavens turn.
  float starLayer(vec2 uv, float sparsity, float time) {
    vec2 cell = floor(uv);
    vec2 f = fract(uv);
    float n = hash21(cell);
    vec2 starPos = vec2(hash21(cell + 17.0), hash21(cell + 43.0)) * 0.55 + 0.225;
    float d = length(f - starPos);
    float tw = 0.7 + 0.3 * sin(time * (0.6 + n * 1.7) + n * 31.4);
    return smoothstep(0.16, 0.0, d) * tw * step(sparsity, n) * (0.4 + 0.6 * fract(n * 9.7));
  }

  void main() {
    vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 vb = (frag - uFitOffset) / uFitScale;
    vec2 ndc = vec2((vb.x - 500.0) / 440.0, -(vb.y - 500.0) / 440.0) + uDomeShift;
    vec3 ray = normalize(uCamFwd + uCamRight * ndc.x * uTanHalfFov + uCamUp * ndc.y * uTanHalfFov);

    // Where this pixel's ray meets the latent sphere. The far
    // intersection, not the near: the orbital camera sits at
    // -2.5·s looking through the origin, so the world the
    // structural layer projects — the populated hemisphere around
    // the pole — is the far side. Rays that miss continue smoothly
    // from the closest-approach direction.
    float b = dot(uCamPos, ray);
    float disc = b * b - (dot(uCamPos, uCamPos) - 1.0);
    float hitT = -b + sqrt(max(disc, 0.0));
    vec3 P = normalize(uCamPos + ray * hitT);

    // The heavens' slow turn, applied to the deep field at a
    // reduced rate so the backdrop reads farther than the stars.
    float sp = uSpin * 0.62;
    mat2 spin = mat2(cos(sp), -sin(sp), sin(sp), cos(sp));
    vec3 Pd = vec3(spin * P.xy, P.z);

    // Base sky — pole-anchored, so traveling moves the heavens.
    // The ramp starts at the silhouette tangent (z = -1/orbit
    // distance = -0.4) so the gradient breathes from the frame's
    // edge to the pole with no flat band reading as a rim.
    float zen = smoothstep(-0.42, 0.95, P.z);
    vec3 sky = mix(uHorizon, uZenith, zen);

    // Umber warmth breathing up from the horizon — a band hugging
    // the equator, not a wash over everything below the pole, so
    // the sky never reads as a lit planet edge.
    float horizonBand = smoothstep(-0.38, -0.02, P.z) * (1.0 - smoothstep(0.02, 0.38, P.z));
    sky = mix(sky, uAccentWarm, horizonBand * (0.04 + 0.035 * uNight));

    // Room atmospheres — Studio NW warm, Garden SW rose,
    // Study SE violet, Salon NE gold. Felt near the rim of the
    // populated hemisphere, absent at the pole and below the
    // horizon; atmospheres of the sky, not borders within it.
    float phi = atan(P.y, P.x);
    float roomBand = dot(P.xy, P.xy) * smoothstep(-0.45, 0.1, P.z);
    vec3 roomTint = uAccentWarm * sectorWeight(phi, 3.9270)
      + uAccentRose * sectorWeight(phi, 2.3562)
      + uAccentViolet * sectorWeight(phi, 0.7854)
      + uAccentGold * sectorWeight(phi, 5.4978);
    sky = mix(sky, roomTint, roomBand * (0.075 - 0.035 * uNight));

    // Watercolor wash — domain-warped fbm sampled on the sphere,
    // drifting at a felt-not-seen rate.
    vec3 q = Pd * 2.3 + vec3(0.0, 0.0, uTime * 0.0045 * uMotion);
    float warp = fbm(q + 3.7);
    float wash = fbm(q * 1.55 + warp * 0.85 + vec3(uTime * 0.006 * uMotion, 0.0, 0.0));
    float washN = wash * 0.5 + 0.5;

    // Day: pigment pooling on wet paper. Night: a whisper of nebula.
    vec3 dayWashTone = mix(uHorizon * 0.985, uGlowColor, 0.45);
    sky = mix(sky, dayWashTone, smoothstep(0.38, 0.95, washN) * 0.24 * (1.0 - uNight));
    vec3 nightNebTone = uZenith * 1.4 + uAccentViolet * 0.12 + vec3(0.008, 0.012, 0.024);
    sky += nightNebTone * max(washN - 0.60, 0.0) * 0.7 * uNight;

    // Deep starfield — stereographic chart of the rotated sphere,
    // two depths of dust. Almost nothing by day.
    vec2 chart = Pd.xy / (1.0 + max(Pd.z, -0.85));
    float deepFine = starLayer(chart * 52.0, 0.93, uTime * uMotion) * 0.5;
    float deepBright = starLayer(chart * 21.0, 0.955, uTime * uMotion * 0.8 + 7.0);
    vec3 starlight = vec3(0.92, 0.93, 1.0);
    sky += starlight * (deepFine + deepBright) * uNight * (0.3 + 0.7 * zen) * 0.6;

    // The daystar's gathered glow.
    float gd = distance(frag, uDaystar) / max(uFitScale * 330.0, 1.0);
    sky += uGlowColor * (uGlowStrength * 2.6) * exp(-gd * gd * 1.7);

    // The pool of attention — brightens and saturates where the
    // visitor's cursor lives on the sphere.
    float pd = distance(frag, uPool.xy) / max(uPoolRadius, 1.0);
    float pool = exp(-pd * pd * 2.1) * uPool.z;
    vec3 poolTone = mix(uGlowColor, mix(vec3(0.72, 0.75, 0.88), uAccentWarm, 0.35), uNight);
    sky += poolTone * pool * (0.05 + 0.06 * uNight);
    float lum = dot(sky, vec3(0.299, 0.587, 0.114));
    sky = mix(vec3(lum), sky, 1.0 + pool * 0.22);

    // Paper grain — static, like the sheet itself. Scaled by the
    // local luminance so the dark hour's grain reads as stardust
    // rather than static.
    float grain = (hash21(frag) - 0.5) + (hash21(floor(frag * 0.21)) - 0.5) * 0.6;
    sky += grain * uGrain * (0.35 + lum * 1.6);

    // The frame recedes toward the ground at its edges, strongest
    // along the bottom where the sky meets the Foyer.
    vec2 ec = frag / uResolution - 0.5;
    float edge = smoothstep(0.42, 0.78, length(ec * vec2(1.0, 1.15)));
    sky = mix(sky, uGround, edge * 0.45);
    float bottom = smoothstep(0.70, 1.0, frag.y / uResolution.y);
    sky = mix(sky, uGround, bottom * 0.55);

    gl_FragColor = vec4(sky, 1.0);
  }
`;

const SPRITE_VERTEX_BODY = /* glsl */ `
  attribute vec2 position;
  attribute vec2 aCenter;
  attribute float aHueIndex;
  attribute float aPhase;
  attribute float aSeed;
  attribute float aActive;
  attribute float aSize;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uMotion;
  uniform float uRadiusPx;
  uniform vec3 uAccentWarm;
  uniform vec3 uAccentRose;
  uniform vec3 uAccentViolet;
  uniform vec3 uAccentGold;
  varying vec2 vQuad;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vActive;
  varying float vSeed;
  void main() {
    vQuad = position;
    vActive = aActive;
    vSeed = aSeed;
    // 4.5s cycle — the same beat the structural twinkle kept.
    vTwinkle = sin((uTime + aPhase) * 1.39626 + aSeed * 6.28318) * uMotion;
    float radius = uRadiusPx * aSize * (1.0 + 0.05 * vTwinkle) * (1.0 + 0.22 * aActive);
    vec2 px = aCenter + position * radius;
    vColor = aHueIndex < 0.5 ? uAccentWarm
      : aHueIndex < 1.5 ? uAccentRose
      : aHueIndex < 2.5 ? uAccentViolet
      : uAccentGold;
    gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
  }
`;

export const SPRITE_VERTEX = SPRITE_VERTEX_BODY;

/** Night ontology — luminous halos, additive. Each star a small
 *  bright point with a soft halo, tuned to its own luminance. */
export const GLOW_FRAGMENT = /* glsl */ `
  ${PRECISION_HEADER}
  uniform float uNight;
  uniform vec3 uAccentGold;
  varying vec2 vQuad;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vActive;
  varying float vSeed;
  void main() {
    float d = length(vQuad);
    // The window takes every profile to zero before the quad edge —
    // without it the aura's exp tail clips into a visible square.
    float window = smoothstep(1.0, 0.72, d);
    float core = exp(-d * d * 14.0) * 1.15;
    float aura = exp(-d * d * 2.0) * 0.36;
    float lumin = (core + aura) * window * (1.0 + 0.22 * vTwinkle);
    vec3 col = mix(vColor, vec3(1.0, 0.98, 0.94), core * 0.5);
    col = mix(col, uAccentGold, vActive * 0.22);
    gl_FragColor = vec4(col * lumin * uNight * (0.8 + 0.5 * vActive), 0.0);
  }
`;

/** Day ontology — watercolor pigment bleeds, src-over. A wobbled,
 *  granular blot with the edge-darkened rim real pigment leaves as
 *  it dries. */
export const PIGMENT_FRAGMENT = /* glsl */ `
  ${PRECISION_HEADER}
  uniform float uNight;
  varying vec2 vQuad;
  varying vec3 vColor;
  varying float vTwinkle;
  varying float vActive;
  varying float vSeed;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    float d = length(vQuad);
    float angle = atan(vQuad.y, vQuad.x);
    float wobble = sin(angle * 3.0 + vSeed * 41.0) * 0.09
      + sin(angle * 5.0 + vSeed * 73.0) * 0.06;
    float r = d * (1.0 + wobble);
    float body = smoothstep(0.9, 0.18, r);
    float rimDark = smoothstep(0.45, 0.82, r) * smoothstep(1.0, 0.82, r);
    float granulation = 0.7 + 0.3 * hash21(vQuad * 19.0 + vSeed * 87.0);
    float a = (body * 0.22 + rimDark * 0.17) * granulation
      * (1.0 + 0.6 * vActive) * (1.0 + 0.08 * vTwinkle) * (1.0 - uNight);
    gl_FragColor = vec4(vColor * a, a);
  }
`;

export const MOTE_VERTEX = /* glsl */ `
  attribute vec2 position;
  attribute vec2 aCenter;
  attribute float aSeed;
  attribute float aSize;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uMotion;
  uniform float uRadiusPx;
  varying vec2 vQuad;
  varying float vPulse;
  void main() {
    vQuad = position;
    vPulse = 0.75 + 0.25 * sin(uTime * (0.4 + aSeed) + aSeed * 40.0) * uMotion;
    vec2 px = aCenter + position * (uRadiusPx * aSize);
    gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
  }
`;

export const MOTE_FRAGMENT = /* glsl */ `
  ${PRECISION_HEADER}
  uniform float uNight;
  uniform vec3 uAccentWarm;
  varying vec2 vQuad;
  varying float vPulse;
  void main() {
    float d = length(vQuad);
    float body = exp(-d * d * 7.0);
    vec3 col = mix(uAccentWarm, vec3(0.82, 0.83, 0.92), uNight * 0.7);
    float strength = mix(0.05, 0.30, uNight) * vPulse;
    gl_FragColor = vec4(col * body * strength, 0.0);
  }
`;
