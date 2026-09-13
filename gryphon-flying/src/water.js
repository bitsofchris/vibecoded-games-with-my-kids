// Approved jade water: one opaque draw on the engine's existing bounded grid.
// The CPU heightfield owns the shore. No reflection camera, depth pass, new
// textures or CPU animation; the rough sky uses the world's own day palette.
import {
  Fn, positionLocal, positionWorld, cameraPosition, vec2, vec3, float,
  mix, smoothstep, max, sin, pow, dot, normalize, fract, step,
  length, fwidth, mx_noise_float, transformNormalToView,
} from 'three/tsl';

export function createWaterMaterial({
  time, origin, seaLevel, cellSize, loadCell, palette, litMaterial,
  horizonTint, azimuthAlign, sky,
}) {
  const { zenith, upper, upperWarm, sunDir, sunColor, moonDir, moonLight, lowSun, glow } = sky;
  const worldVertex = positionLocal.xz.add(origin);
  const wave = sin(worldVertex.x.mul(0.021).add(time.mul(0.55)))
    .mul(0.7)
    .add(sin(worldVertex.y.mul(0.017).sub(time.mul(0.42))).mul(0.6))
    .add(sin(worldVertex.x.add(worldVertex.y).mul(0.009).add(time.mul(0.3))).mul(0.5));
  const view = normalize(cameraPosition.sub(positionWorld));

  // Barycentric height on the exact terrain triangle, also at negative world
  // coordinates. Bilinear interpolation would draw a different shoreline.
  const groundAt = Fn(([p]) => {
    const cell = p.div(cellSize), base = cell.floor(), f = fract(cell);
    const upperTriangle = step(1, f.x.add(f.y));
    const a = loadCell(base.x.add(upperTriangle), base.y.add(upperTriangle)).x;
    const b = loadCell(base.x.add(1), base.y).x;
    const c = loadCell(base.x, base.y.add(1)).x;
    return a.add(b.sub(a).mul(mix(f.x, float(1).sub(f.y), upperTriangle)))
      .add(c.sub(a).mul(mix(f.y, float(1).sub(f.x), upperTriangle)));
  });
  const depth = max(float(seaLevel).sub(groundAt(positionWorld.xz)), 0);
  const p = positionWorld.xz;

  // Two scales of advected slopes. Stretch the smaller ripples into painted
  // strokes, and filter each scale by its pixel footprint. Broad folds remain
  // when the small ones become subpixel, with no ripple-to-mirror boundary.
  const n = Fn(() => {
    const q = vec2(p.x.mul(0.94).add(p.y.mul(0.34)), p.y.mul(0.94).sub(p.x.mul(0.34)))
      .mul(vec2(0.055, 0.19));
    const drift = vec2(time.mul(0.055), time.mul(-0.04));
    const sx = mx_noise_float(q.add(drift));
    const sz = mx_noise_float(q.mul(0.83).add(vec2(17.8, 9.2)).sub(drift));
    const visible = float(1).sub(smoothstep(0.45, 1.8, length(fwidth(q))));
    const coarseQ = p.mul(vec2(0.018, 0.026));
    const coarseVisible = float(1).sub(smoothstep(0.45, 1.8, length(fwidth(coarseQ))));
    const broadX = mx_noise_float(coarseQ.add(drift.mul(0.35)));
    const broadZ = mx_noise_float(coarseQ.mul(0.87).add(23).sub(drift.mul(0.3)));
    const slope = vec2(sx, sz).mul(visible).mul(0.75)
      .add(vec2(broadX, broadZ).mul(coarseVisible).mul(0.55)).mul(0.07);
    return normalize(vec3(slope.x, 1, slope.y));
  })();

  // Rough painted reflection, not another complete sky shader per water pixel:
  // no star layers or moon craters, and only two octaves of the sky's clouds.
  const reflectedSky = Fn(([r]) => {
    const alignment = pow(azimuthAlign(r, sunDir), 3.5);
    const warm = mix(upper, upperWarm, alignment.mul(0.8));
    const top = mix(warm, zenith, smoothstep(0.1, 0.85, r.y));
    const color = mix(horizonTint(r), top, smoothstep(0, 0.4, r.y)).toVar();
    const q = r.xz.div(r.y.max(0.025).add(0.19)).mul(vec2(2.8, 6)).add(vec2(time.mul(0.001), 0));
    const mass = mx_noise_float(q.mul(0.3).add(vec2(3, 12))).mul(0.28)
      .add(mx_noise_float(q).mul(0.6));
    const cloud = smoothstep(-0.14, 0.34, mass).mul(smoothstep(0.014, 0.15, r.y));
    color.assign(mix(color, mix(upper, horizonTint(r), 0.65), cloud.mul(0.32)));
    return color;
  });
  const reflected = normalize(n.mul(dot(n, view).mul(2)).sub(view));
  const fresnel = pow(float(1).sub(dot(n, view).max(0)), 5).mul(0.75).add(0.055);
  const reflection = reflectedSky(reflected);
  const halfSun = normalize(view.add(sunDir));
  const halfMoon = normalize(view.add(moonDir));
  const sunlight = smoothstep(-0.015, 0.04, sunDir.y);
  const glint = pow(max(dot(n, halfSun), 0), 220).mul(sunlight);
  const moonGlint = pow(max(dot(n, halfMoon), 0), 300).mul(moonLight);
  const lightColor = mix(sunColor, glow, lowSun.mul(0.6));

  // Mint shelves deepen into turquoise. The narrow shore wash is diffuse, so
  // it takes the day's light and never becomes a glowing outline at night.
  const shallow = palette.waterShallow, deep = palette.waterDeep;
  const body = mix(shallow, deep, smoothstep(0.5, 34, depth));
  const shore = mix(mix(palette.sand, shallow, 0.7), body, smoothstep(0, 3, depth));
  const shorePulse = sin(time.mul(0.65).add(p.x.mul(0.014)).add(p.y.mul(0.018))).mul(0.45).add(1.05);
  const wash = smoothstep(0.05, 0.35, depth)
    .mul(float(1).sub(smoothstep(shorePulse, shorePulse.add(0.65), depth)))
    .mul(float(1).sub(smoothstep(1, 4, fwidth(depth))));
  const base = mix(shore, palette.snow, wash.mul(0.48));
  // A few elongated highlights, not a carpet of specular flecks. Subpixel
  // strokes fade to their coverage instead of aliasing or losing the light.
  const strokePhase = p.y.mul(0.48).add(p.x.mul(0.14)).add(n.x.mul(95)).sub(time.mul(0.55));
  const strokeVisible = float(1).sub(smoothstep(0.8, 2.8, fwidth(strokePhase)));
  const strokes = mix(0.38, smoothstep(0.1, 0.8, sin(strokePhase)), strokeVisible);
  const sheen = smoothstep(0.28, 0.88, glint).mul(strokes).mul(0.32).add(glint.mul(0.065));
  const material = litMaterial(base);
  material.positionNode = vec3(positionLocal.x, wave.mul(0.18).add(seaLevel), positionLocal.z);
  material.normalNode = transformNormalToView(n);
  material.emissiveNode = reflection.mul(fresnel.mul(0.42).add(0.02))
    .add(lightColor.mul(sheen))
    .add(vec3(0.55, 0.65, 0.85).mul(moonGlint).mul(0.24));
  return material;
}
