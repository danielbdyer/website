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
//      way tokens.css's archaeology asked); by day they are the
//      chart's painted points — watercolor pigment with wobbled,
//      edge-darkened rims. uNight crossfades the two ontologies
//      through the sky's 1.8s dawn.
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
  uniform vec3 uInk;
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
  uniform vec3 uTravel;
  uniform vec3 uPool;
  uniform float uPoolRadius;
  uniform vec2 uDaystar;

  ${NOISE_LIB}

  // Gaussian weight on wrapped angular distance — the compass's
  // chromatic arcs, one per facet pair.
  float sectorWeight(float phi, float center) {
    float d = abs(mod(phi - center + 3.14159265, 6.28318531) - 3.14159265);
    return exp(-d * d * 3.0);
  }

  // One layer of deep stars. Each cell holds at most one candidate,
  // confined away from cell borders so the field never pops while
  // the heavens turn.
  float starLayer(vec2 uv, float sparsity, float time, vec2 streakDir, float stretch) {
    vec2 cell = floor(uv);
    vec2 f = fract(uv);
    float n = hash21(cell);
    vec2 starPos = vec2(hash21(cell + 17.0), hash21(cell + 43.0)) * 0.55 + 0.225;
    // Travel streaks the dust along its own direction: the distance
    // field is compressed along streakDir, so each point elongates
    // into a short trail and dims as it stretches.
    vec2 rel = f - starPos;
    float along = dot(rel, streakDir);
    vec2 perp = rel - streakDir * along;
    float d = length(vec2(along * stretch, length(perp)));
    float tw = 0.7 + 0.3 * sin(time * (0.6 + n * 1.7) + n * 31.4);
    return smoothstep(0.16, 0.0, d) * tw * step(sparsity, n) * (0.4 + 0.6 * fract(n * 9.7))
      * (0.7 + 0.3 * stretch);
  }

  void main() {
    vec2 frag = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y);
    vec2 vb = (frag - uFitOffset) / uFitScale;
    vec2 ndc = vec2((vb.x - 500.0) / 440.0, -(vb.y - 500.0) / 440.0) + uDomeShift;
    vec3 ray = normalize(uCamFwd + uCamRight * ndc.x * uTanHalfFov + uCamUp * ndc.y * uTanHalfFov);

    // Where this pixel's ray meets the latent sphere. The far
    // intersection, not the near: the orbital camera sits at
    // -REST_DISTANCE·s looking through the origin, so the world the
    // structural layer projects — the populated hemisphere around
    // the pole — is the far side. Rays that miss continue smoothly
    // from the closest-approach direction.
    float b = dot(uCamPos, ray);
    float disc = b * b - (dot(uCamPos, uCamPos) - 1.0);
    float hitT = -b + sqrt(max(disc, 0.0));
    vec3 P = normalize(uCamPos + ray * hitT);

    // The heavens' turn rides the camera as a roll, so the world the
    // ray meets already turns with the stars. The deep field is held
    // back a little (-0.38 of the roll → it turns at 0.62× the stars'
    // rate) so the backdrop reads farther than the stars.
    float sp = -uSpin * 0.38;
    mat2 spin = mat2(cos(sp), -sin(sp), sin(sp), cos(sp));
    vec3 Pd = vec3(spin * P.xy, P.z);

    // Base sky — pole-anchored, so traveling moves the heavens.
    // The ramp starts at the silhouette tangent (z = -1/orbit
    // distance = -0.4) so the gradient breathes from the frame's
    // edge to the pole with no flat band reading as a rim.
    float zen = smoothstep(-0.42, 0.95, P.z);
    vec3 sky = mix(uHorizon, uZenith, zen);

    // The dark hour's deep field — vein, nebula, dust — leaves early in
    // the dawn and returns late in the dusk: the faint stars go first
    // as the sky pales, the way they do.
    float nightDeep = smoothstep(0.35, 0.85, uNight);

    // ── Fields: one low-frequency mass + one warped fbm. The mass
    // field shapes cloud banks and warps the wash; the wash carries
    // the watercolor weather, the nebula, and the vein's clumping.
    // Five simplex calls per pixel, total.
    float mass = snoise(Pd * 1.5 + vec3(0.0, 0.0, uTime * 0.004 * uMotion));
    float massN = mass * 0.5 + 0.5;
    float wash = fbm(Pd * 2.4 + mass * 0.55 + vec3(uTime * 0.0045 * uMotion, 0.0, 0.0));
    float washN = wash * 0.5 + 0.5;

    // ── The milky vein — a clustered band of stardust crossing the
    // vault on its own great circle, clumped by the wash so it reads
    // as granular weather rather than a stripe. World-anchored: it
    // turns with the heavens and parallaxes with travel.
    float veinD = dot(Pd, vec3(0.6198, -0.2817, 0.7325));
    float vein = exp(-veinD * veinD * 24.0);
    float veinBody = vein * smoothstep(0.25, 0.85, washN);
    vec3 veinTone = uZenith * 2.2 + uAccentViolet * 0.30 + vec3(0.015, 0.022, 0.05);
    sky += veinTone * veinBody * 0.42 * nightDeep;

    // A whisper of nebula beyond the vein.
    sky += (uZenith * 1.4 + uAccentViolet * 0.12) * max(washN - 0.62, 0.0) * 0.45 * nightDeep;

    // ── Deep starfield — three depths of dust on a stereographic
    // chart, denser inside the vein the way real dust gathers.
    vec2 chart = Pd.xy / (1.0 + max(Pd.z, -0.85));
    // The trench: while the visitor travels, the deep dust streaks
    // along the sky's apparent motion — velocity read as depth, with
    // no change to the camera's distance. uTravel is the world
    // angular velocity; a sky-fixed point moves with its cross
    // product, taken here into the chart's tangent space.
    vec3 w = cross(uTravel, P);
    vec3 wd = vec3(spin * w.xy, w.z);
    float zc = 1.0 + max(Pd.z, -0.85);
    vec2 chartDir = (wd.xy * zc - Pd.xy * wd.z) / (zc * zc);
    float streakMag = clamp(length(uTravel) / 1.1, 0.0, 1.0) * uMotion;
    vec2 streakDir = length(chartDir) > 1e-6 ? normalize(chartDir) : vec2(1.0, 0.0);
    float stretch = 1.0 / (1.0 + 2.6 * streakMag);
    float starGain = (0.45 + 0.55 * zen) * (0.55 + 2.1 * vein * (0.35 + 0.65 * washN));
    float t = uTime * uMotion;
    float deep = starLayer(chart * 96.0, 0.78, t, streakDir, stretch) * 0.30
      + starLayer(chart * 40.0, 0.90, t * 0.9 + 11.0, streakDir, stretch) * 0.62
      + starLayer(chart * 17.0, 0.955, t * 0.8 + 7.0, streakDir, stretch) * 1.05;
    sky += vec3(0.93, 0.94, 1.0) * deep * starGain * nightDeep;

    // ── The chart's gold rings — hairline circles of constant
    // angular distance from the polestar, breathing on the 30s
    // cycle the SVG wash once held. By day they fade to the faint
    // construction lines of a celestial map.
    float polar = acos(clamp(P.z, -1.0, 1.0));
    float breath = 0.8 + 0.2 * sin(uTime * 0.2094 * uMotion);
    float ringDist = abs(fract(polar * 4.4 + 0.5) - 0.5) / 4.4;
    float ring = smoothstep(0.005, 0.0, ringDist);
    float ringMask = smoothstep(1.3, 0.2, polar) * smoothstep(0.05, 0.1, polar);
    // The compass drawn: one meridian per facet bearing, every 45° of
    // azimuth (CONSTELLATION_WALK.md §"The Compass"), arc-length width
    // so they don't thicken toward the pole, faded where they converge
    // on it and beyond the drawn cap. Each carries a breath of its
    // facet pair's hue over the chart's gold — craft and body warm to
    // the east, beauty and language rose to the north, consciousness
    // and becoming violet to the west, leadership and relation gold to
    // the south — so the sky says why each star is where it is. By day
    // they are drawn in ink (below).
    float phi = atan(P.y, P.x);
    float meridianStep = 0.7853982;
    float phiN = mod(phi + 6.28318531, 6.28318531);
    float sector = mod(floor(phiN / meridianStep + 0.5), 8.0);
    float hueSlot = floor(sector / 2.0 + 0.01);
    vec3 facetHue = hueSlot < 0.5 ? uAccentWarm
      : hueSlot < 1.5 ? uAccentRose
      : hueSlot < 2.5 ? uAccentViolet
      : uAccentGold;
    float meridianGap = abs(fract(phi / meridianStep + 0.5) - 0.5) * meridianStep * sin(polar);
    float meridian = smoothstep(0.0035, 0.0, meridianGap)
      * smoothstep(0.07, 0.2, polar) * smoothstep(1.35, 1.05, polar);
    sky += mix(uGlowColor, uHorizon, 0.5) * ring * ringMask * (0.014 + 0.02 * uNight) * breath
      + mix(uGlowColor, facetHue, 0.55) * meridian * 0.032 * uNight * breath;
    // The polestar's own gathered warmth, breathing with the rings.
    sky += mix(uGlowColor, uAccentGold, 0.5) * exp(-polar * polar * 7.0) * breath
      * (0.02 + 0.035 * uNight);

    // The compass in color — each facet pair's arc of the dome carries
    // its hue as a chromatic atmosphere: warm east (craft, body), rose
    // north (beauty, language), violet west (consciousness, becoming),
    // gold south (leadership, relation). Felt near the rim of the
    // populated hemisphere, absent at the pole; atmospheres of the
    // sky, not borders within it. A star sits inside the weather of
    // its own facets, so the placement can be read from the air.
    float roomBand = dot(P.xy, P.xy) * smoothstep(-0.45, 0.1, P.z);
    vec3 roomTint = uAccentWarm * sectorWeight(phi, 0.3927)
      + uAccentRose * sectorWeight(phi, 1.9635)
      + uAccentViolet * sectorWeight(phi, 3.5343)
      + uAccentGold * sectorWeight(phi, 5.1051);
    sky = mix(sky, roomTint, roomBand * (0.12 - 0.03 * uNight));

    // ── The horizon — a luminous gather where the sky meets the
    // ground, hugging the frame's bottom where the Foyer waits
    // beneath. The low-frequency field breathes through it as
    // watercolor weather — variation in the wash, never painted
    // cloud shapes, never lit edges. Light bleeds; it does not edge.
    float hb = exp(-(P.z + 0.06) * (P.z + 0.06) * 11.0);
    float bw = smoothstep(0.35, 1.0, frag.y / uResolution.y);
    vec3 glowTone = mix(uGlowColor, uAccentGold, 0.55);
    float horizonGlow = hb * bw * bw;
    float nearHorizon = smoothstep(0.32, 0.06, abs(P.z + 0.04));
    float weather = smoothstep(0.5, 0.85, massN) * nearHorizon;
    sky += glowTone * horizonGlow * (0.07 + 0.16 * uNight) * (1.0 - weather * 0.6);
    vec3 weatherTone = mix(uHorizon * 0.97, mix(uZenith, uHorizon, 0.45) * 0.85, uNight);
    sky = mix(sky, weatherTone, weather * (0.04 + 0.30 * uNight) * (0.3 + 0.7 * bw));

    // Umber warmth breathing up from the horizon — quieter now that
    // the luminous gather carries most of the hour's warmth.
    float horizonBand = smoothstep(-0.38, -0.02, P.z) * (1.0 - smoothstep(0.02, 0.38, P.z));
    sky = mix(sky, uAccentWarm, horizonBand * 0.035);

    // ── Day: the chart. By night the visitor stands under the
    // firmament; by day they sit with its drawing — the same sky as
    // ink and pigment on the site's paper. No weather, no water: a
    // sheet lit from the daystar's side, the polar rings and meridians
    // of a celestial chart drawn faintly in the page's ink, the room
    // tints as regional watercolor washes near the rim. Still, the way
    // a page is still. CONSTELLATION.md §"Daylight: the chart."
    float day = 1.0 - uNight;
    // Window light on the paper — screen-space, because the sheet is
    // the desk, not the sky: brightest toward the daystar, settling to
    // the ground tone at the foot of the page. It drifts by a hair
    // over minutes — the afternoon moving across the table.
    vec2 lightAt = uDaystar
      + vec2(sin(uTime * 0.011 * uMotion), cos(uTime * 0.008 * uMotion)) * uFitScale * 18.0;
    float ld = distance(frag, lightAt) / max(uFitScale * 980.0, 1.0);
    float pageLight = exp(-ld * ld * 1.4);
    vec3 paper = mix(uHorizon, uZenith, 0.35 + 0.65 * pageLight);
    sky = mix(sky, paper, day * 0.85);
    // The room washes come back over the paper — the chart's regional
    // tints, watercolor near the rim.
    sky = mix(sky, roomTint, roomBand * 0.11 * day);
    // The chart's construction lines, drawn in the page's ink by day:
    // the polar rings as circles of constant altitude, the meridians
    // computed above.
    float chartLines = ring * ringMask * 0.9 + meridian * 0.6;
    sky = mix(sky, uInk, chartLines * 0.2 * day);

    // The daystar's gathered glow — by day a warmth on the page around
    // the gilded sun; by night the moon's silver-rose gathering.
    float gd = distance(frag, uDaystar) / max(uFitScale * 330.0, 1.0);
    sky += uGlowColor * (uGlowStrength * (1.6 + 1.2 * uNight)) * exp(-gd * gd * 1.7);

    // Dawn and dusk. The hour changes over a longer arc than the room's
    // dimming, and the way between paper and night is not the grey a
    // straight blend would give: the sky passes through a dusk that
    // belongs to neither hour — violet overhead, rose-gold toward the
    // foot of the frame, a flush along the horizon — fullest halfway,
    // gone at both ends.
    float dawn = 4.0 * uNight * (1.0 - uNight);
    vec3 duskTint = mix(uAccentViolet, mix(uAccentRose, uAccentGold, 0.5), bw);
    sky = mix(sky, duskTint, dawn * 0.32);
    sky += mix(uAccentRose, uAccentGold, 0.45) * dawn * 0.22 * hb * bw;

    // The pool of attention — brightens and saturates where the
    // visitor's cursor lives on the sphere.
    float pd = distance(frag, uPool.xy) / max(uPoolRadius, 1.0);
    float pool = exp(-pd * pd * 2.1) * uPool.z;
    vec3 poolTone = mix(uGlowColor, mix(vec3(0.72, 0.75, 0.88), uAccentWarm, 0.35), uNight);
    sky += poolTone * pool * (0.05 + 0.06 * uNight);
    float lum = dot(sky, vec3(0.299, 0.587, 0.114));
    sky = mix(vec3(lum), sky, 1.0 + pool * 0.22);

    // ── The oculus. Where a pixel's ray only grazes the sphere (disc → 0)
    // the sky ends and the room's ceiling begins: the page itself, dark
    // umber paper by night and the chart's own sheet by day. The edge is
    // luminous by contrast — the sky gathers a little light toward its
    // limb, the way a real sky brightens toward the horizon — not by a
    // drawn ring. By day the plate's edge is a single line of ink.
    float inside = smoothstep(0.0, 0.03, disc);
    float limbGather = smoothstep(0.32, 0.0, disc) * inside;
    vec3 pageNight = mix(uGround, uHorizon, 0.18) * 0.92;
    vec3 page = mix(paper, pageNight, uNight);
    sky += mix(uGlowColor, uHorizon, 0.35) * limbGather * (0.05 + 0.13 * uNight);
    float rimLine = exp(-abs(disc) * 44.0);
    sky = mix(sky, page, 1.0 - inside);
    sky += uGlowColor * rimLine * 0.07 * uNight;
    sky = mix(sky, uInk, rimLine * 0.3 * day);

    // Paper grain — static, like the sheet itself. Scaled by the
    // local luminance so the dark hour's grain reads as stardust
    // rather than static.
    float grain = (hash21(frag) - 0.5) + (hash21(floor(frag * 0.21)) - 0.5) * 0.6;
    sky += grain * uGrain * (0.35 + lum * 1.6);

    // The frame recedes toward the ground at its edges — gently at
    // the bottom, where the horizon's gather now lives.
    vec2 ec = frag / uResolution - 0.5;
    float edge = smoothstep(0.42, 0.78, length(ec * vec2(1.0, 1.15)));
    sky = mix(sky, uGround, edge * 0.40);
    float bottom = smoothstep(0.72, 1.0, frag.y / uResolution.y);
    sky = mix(sky, uGround, bottom * 0.35);

    // ── The ground. The visitor stands somewhere. A low ridge of the
    // Foyer's umber earth runs along the foot of the frame — screen-
    // anchored, because it is where you stand, not part of the heavens
    // that turn above it — with the horizon's warmth gathering just
    // over its line. By night a near-solid silhouette under a warm
    // gather; by day a pale watercolor band at the foot of the page,
    // the landscape vignette an old atlas keeps at its margin. A place,
    // not a void. Two sines and one smooth value-noise shape the
    // ridge — no simplex on this path.
    float gx = frag.x / uResolution.x;
    float ridgeCell = floor(gx * 9.0);
    float ridgeFrac = smoothstep(0.0, 1.0, fract(gx * 9.0));
    float ridgeVN = mix(hash21(vec2(ridgeCell, 3.7)), hash21(vec2(ridgeCell + 1.0, 3.7)), ridgeFrac);
    float ridgeN = sin(gx * 8.3 + 0.7) * 0.45 + sin(gx * 21.9 + 2.3) * 0.2 + (ridgeVN - 0.5) * 0.7;
    float ridgeH = 0.062 + 0.028 * ridgeN;
    float yUp = 1.0 - frag.y / uResolution.y;
    float ground = smoothstep(ridgeH + 0.014, ridgeH - 0.004, yUp);
    float gather = smoothstep(ridgeH + 0.2, ridgeH, yUp) * (1.0 - ground);
    sky += glowTone * gather * (0.06 + 0.16 * uNight);
    vec3 groundTone = mix(uGround, uAccentWarm, 0.06 + 0.1 * day);
    sky = mix(sky, groundTone, ground * (0.55 + 0.4 * uNight));

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
  attribute float aPresence;
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
  varying float vPresence;
  void main() {
    vQuad = position;
    vActive = aActive;
    vPresence = aPresence;
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
  varying float vPresence;
  void main() {
    float d = length(vQuad);
    // The window takes every profile to zero before the quad edge —
    // without it the aura's exp tail clips into a visible square.
    float window = smoothstep(1.0, 0.72, d);
    float core = exp(-d * d * 14.0) * 1.15;
    float aura = exp(-d * d * 2.0) * 0.36;
    // A four-point sparkle in the illustrated register — the chart's
    // brighter stars catch the eye without turning photographic.
    // Larger halos (vSeed) flare more, the way the hi-fi's do.
    float flare = exp(-abs(vQuad.x) * 11.0 - vQuad.y * vQuad.y * 70.0)
      + exp(-abs(vQuad.y) * 11.0 - vQuad.x * vQuad.x * 70.0);
    float lumin = (core + aura + flare * (0.30 + 0.45 * vSeed)) * window
      * (1.0 + 0.22 * vTwinkle);
    vec3 col = mix(vColor, vec3(1.0, 0.98, 0.94), core * 0.5);
    col = mix(col, uAccentGold, vActive * 0.22);
    // Absent stars (the contextual cap) recede to a tenth of their light.
    gl_FragColor = vec4(col * lumin * uNight * (0.8 + 0.5 * vActive) * mix(0.10, 1.0, vPresence), 0.0);
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
  varying float vPresence;
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
    float a = (body * 0.28 + rimDark * 0.2) * granulation
      * (1.0 + 0.6 * vActive) * (1.0 + 0.08 * vTwinkle) * (1.0 - uNight)
      * mix(0.15, 1.0, vPresence);
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
