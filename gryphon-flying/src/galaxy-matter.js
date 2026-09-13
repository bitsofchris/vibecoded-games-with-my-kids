// Original procedural dark nebulae: a branching extinction field, not a
// photograph. Built once in galactic coordinates, shared by light and stars.
import { fbm, mulberry32, sstep } from './noise.js';

function periodicField(x, y, seed, octaves) {
  const t = sstep(0, 64, x);
  return fbm(x, y, seed, octaves) * (1 - t) + fbm(x - 64, y, seed, octaves) * t;
}

export function makeDust() {
  const width = 4096,
    height = 512,
    data = new Float32Array(width * height);
  const random = mulberry32(0x64757374);
  function segment(ax, ay, bx, by, radius, density) {
    const scale = width / (Math.PI * 2),
      sy = height / 0.84;
    ax = (ax / (Math.PI * 2) + 0.5) * width;
    bx = (bx / (Math.PI * 2) + 0.5) * width;
    ay = (ay / 0.84 + 0.5) * height;
    by = (by / 0.84 + 0.5) * height;
    const r = radius * scale,
      pad = r * 2.7;
    const dx = bx - ax,
      dy = ((by - ay) * scale) / sy;
    const len = dx * dx + dy * dy;
    for (
      let y = Math.max(0, Math.floor(Math.min(ay, by) - pad));
      y <= Math.min(height - 1, Math.ceil(Math.max(ay, by) + pad));
      y++
    ) {
      for (let x = Math.floor(Math.min(ax, bx) - pad); x <= Math.ceil(Math.max(ax, bx) + pad); x++) {
        const px = x - ax,
          py = ((y - ay) * scale) / sy;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / Math.max(len, 1e-8)));
        const distance = (px - dx * t) ** 2 + (py - dy * t) ** 2;
        const i = y * width + (((x % width) + width) % width);
        data[i] = Math.max(data[i], Math.exp(-distance / (r * r)) * density);
      }
    }
  }
  function grow(lon, lat, angle, extent, radius, density, level) {
    const steps = 16,
      dl = extent / steps;
    for (let i = 0; i < steps; i++) {
      angle += (random() - 0.5) * 0.48;
      const nx = lon + Math.cos(angle) * dl,
        ny = lat + Math.sin(angle) * dl;
      const taper = 1 - (i / steps) * 0.65;
      segment(lon, lat, nx, ny, radius * taper * (0.7 + random() * 0.6), density * (0.65 + random() * 0.6));
      if (level > 0 && [3, 7, 11].includes(i)) {
        const side = random() < 0.7 ? 1 : -1;
        grow(
          nx,
          ny,
          angle + side * (0.6 + random() * 0.7),
          extent * (0.2 + random() * 0.13),
          radius * 0.4,
          density * 0.8,
          level - 1,
        );
      }
      lon = nx;
      lat = ny;
    }
  }
  grow(3.06, -0.045, Math.PI + 0.09, 1.15, 0.035, 2.4, 2);
  grow(2.89, -0.1, 3.7, 0.35, 0.028, 2.1, 2);
  grow(2.59, 0.08, 2.2, 0.27, 0.018, 1.8, 2);
  return { width, height, data };
}

export function sampleDust(dust, longitude, latitude) {
  const x = ((((longitude / (Math.PI * 2) + 0.5) % 1) + 1) % 1) * dust.width;
  const y = (latitude / 0.84 + 0.5) * dust.height;
  if (y < 0 || y >= dust.height - 1) return 0;
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const a = dust.data[iy * dust.width + ix],
    b = dust.data[iy * dust.width + ((ix + 1) % dust.width)];
  const c = dust.data[(iy + 1) * dust.width + ix],
    d = dust.data[(iy + 1) * dust.width + ((ix + 1) % dust.width)];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

export function photographicMatter(longitude, latitude, dust) {
  const x = ((((longitude / (Math.PI * 2) + 0.5) % 1) + 1) % 1) * 64;
  const y = latitude * 13;
  const wrap = (a) => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
  const along = wrap(longitude - 2.98);
  const core = Math.exp(-((along / 0.145) ** 2));
  const coarse = periodicField(x, y, 320, 3);
  const medium = periodicField((x * 3) % 64, y * 3, 911, 3);
  const fine = periodicField((x * 13) % 64, y * 13, 117, 2);
  const branches =
    sampleDust(dust, longitude + medium * 0.055, latitude + coarse * 0.065 + medium * 0.034 + fine * 0.008) *
    Math.max(0.15, 0.85 + coarse * 1.6 + medium * 0.7);
  const darkClouds = Math.max(0, coarse + medium * 0.42 + fine * 0.12 + 0.06);
  // The inner galaxy is not a uniform ribbon: a compact lower bulge, two
  // separated star-cloud windows above it, and the rift on their dark flank.
  const rightCloud = Math.exp(-(((along + 0.13) / 0.19) ** 2) - ((latitude + 0.08 + medium * 0.028) / 0.08) ** 2);
  const notch = Math.exp(-((wrap(longitude - 2.73) / 0.06) ** 2) - ((latitude + 0.014 + medium * 0.016) / 0.054) ** 2);
  const transmission = Math.exp(-branches - darkClouds * 2.7 - rightCloud * 2.1 - notch * 1.65);
  const curve = Math.sin(longitude * 5) * 0.012;
  const body = Math.exp(-(((latitude - curve - 0.014) / (0.036 + core * 0.036)) ** 2));
  const bulge = core * Math.exp(-(((latitude - 0.005 + along * 0.12) / 0.101) ** 2));
  const windowUpper = Math.exp(-((wrap(longitude - 2.48) / 0.072) ** 2) - ((latitude - 0.025) / 0.044) ** 2);
  const windowLower = Math.exp(-((wrap(longitude - 2.79) / 0.058) ** 2) - ((latitude - 0.035) / 0.052) ** 2);
  const texture = 0.6 + sstep(-0.5, 0.6, medium + fine * 0.5) * 0.6;
  const light = (body * 0.16 + bulge * 2.3 + windowUpper * 0.56 + windowLower * 0.68) * transmission * texture;
  const cyan = Math.exp(-((wrap(longitude - 2.58) / 0.19) ** 2)) * Math.exp(-(((latitude - 0.065) / 0.145) ** 2));
  const violet = (0.5 + 0.5 * Math.sin(longitude * 11 + coarse * 3)) * (1 - core * 0.75);
  const warm = core * (0.72 + sstep(-0.2, 0.35, medium) * 0.28);
  const scatter = Math.exp(-branches * 0.7 - darkClouds * 1.2);
  const dustTint = Math.min(1, branches) * (body * 0.3 + bulge * 0.5);
  return {
    transmission,
    body,
    core,
    color: [
      light * (0.42 + warm * 0.58 + violet * 0.12) + cyan * scatter * 0.025 + dustTint * 0.15,
      light * (0.4 + warm * 0.4 - violet * 0.1) + cyan * scatter * 0.16 + dustTint * 0.055,
      light * (0.78 + warm * 0.04) + cyan * scatter * 0.34 + dustTint * 0.065,
    ],
  };
}

// The brightest place in the galaxy, found in the same field the sky is drawn
// from rather than written down beside it: the peak of the stellar light, then
// the luminance-weighted center of everything within a little of that peak, so
// the answer is the core's middle and not one speckle of texture. A coarse grid
// is enough; the region is hundreds of texels wide in the bake.
export function brightestMatter(dust) {
  const width = 256,
    height = 96,
    light = new Float32Array(width * height);
  const longitudeOf = (x) => (x / width - 0.5) * Math.PI * 2,
    latitudeOf = (y) => (y / (height - 1) - 0.5) * 0.84;
  let peak = 0;
  for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++) {
      const color = photographicMatter(longitudeOf(x), latitudeOf(y), dust).color;
      const luminance = color[0] * 0.2126 + color[1] * 0.7152 + color[2] * 0.0722;
      light[y * width + x] = luminance;
      peak = Math.max(peak, luminance);
    }
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++) {
      const luminance = light[y * width + x];
      if (luminance < peak * 0.6) continue;
      const longitude = longitudeOf(x),
        latitude = latitudeOf(y);
      cx += luminance * Math.cos(longitude) * Math.cos(latitude);
      cy += luminance * Math.sin(longitude) * Math.cos(latitude);
      cz += luminance * Math.sin(latitude);
    }
  const length = Math.hypot(cx, cy, cz) || 1;
  return { longitude: Math.atan2(cy, cx), latitude: Math.asin(cz / length), peak };
}
