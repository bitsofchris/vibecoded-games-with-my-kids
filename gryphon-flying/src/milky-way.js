// The approved star-led Milky Way: one immutable instanced star catalog and
// one original procedural stellar-light atlas. No downloaded sky assets.
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  Fn,
  vec2,
  vec3,
  float,
  dot,
  normalize,
  exp,
  abs,
  smoothstep,
  texture,
  atan,
  asin,
  clamp,
  uv,
  length,
  cross,
  positionLocal,
  cameraPosition,
  attribute,
} from 'three/tsl';
import { mulberry32 } from './noise.js';
import { brightestMatter, makeDust, photographicMatter } from './galaxy-matter.js';

const NORMAL = new THREE.Vector3(0.568, -0.458, -0.683).normalize();
const RIGHT = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), NORMAL).normalize();
const UP = new THREE.Vector3().crossVectors(NORMAL, RIGHT);

// Galactic longitude and latitude to a direction in the world. The galaxy is
// fixed over the world, so a place in the field always has the same bearing.
function galacticDirection(longitude, latitude, out) {
  return out
    .copy(RIGHT)
    .multiplyScalar(Math.cos(longitude) * Math.cos(latitude))
    .addScaledVector(UP, Math.sin(longitude) * Math.cos(latitude))
    .addScaledVector(NORMAL, Math.sin(latitude));
}

function bakeStarlight(dust) {
  const width = 4096,
    height = 512,
    data = new Uint8Array(width * height * 4);
  for (let x = 0; x < width; x++) {
    const longitude = (x / width - 0.5) * Math.PI * 2;
    for (let y = 0; y < height; y++) {
      const latitude = (y / (height - 1) - 0.5) * 0.84;
      const matter = photographicMatter(longitude, latitude, dust);
      const i = (y * width + x) * 4;
      // Linear light with a fixed 2x decode range, not an sRGB photograph.
      for (let c = 0; c < 3; c++) data[i + c] = Math.round(Math.min(1, matter.color[c] / 2) * 255);
      data[i + 3] = 255;
    }
  }
  const map = new THREE.DataTexture(data, width, height);
  map.wrapS = THREE.RepeatWrapping;
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.needsUpdate = true;
  return map;
}

function starCatalog(dust) {
  const random = mulberry32(0x64656570),
    directions = [],
    colors = [],
    radii = [];
  const direction = new THREE.Vector3();
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(random(), 1e-8))) * Math.cos(random() * Math.PI * 2);
  // Fixed work and an independent seed: more flight never grows the catalog,
  // and changing stars cannot change terrain, scenery or the flight's path.
  for (let i = 0; i < 300000; i++) {
    const foreground = i < 100000;
    const longitude = i > 240000 ? 2.96 + gaussian() * 0.26 : random() * Math.PI * 2 - Math.PI;
    const latitude = foreground ? Math.asin(random() * 2 - 1) : gaussian() * (i > 240000 ? 0.08 : 0.13);
    const matter = photographicMatter(longitude, latitude, dust);
    if (!foreground && random() > matter.transmission * 0.86 + 0.04) continue;
    galacticDirection(longitude, latitude, direction);
    const bright = random() ** 9;
    radii.push(6000 * (0.00056 + bright * 0.0009));
    const intensity = (0.52 + bright * 3.3) * (foreground ? 1.15 : 1);
    const warm = random();
    const tint = warm < 0.84 ? [0.24 + warm * 0.75, 0.47 + warm * 0.55, 1] : [1, 0.77, 0.56];
    directions.push(direction.x, direction.y, direction.z);
    colors.push(...tint.map((c) => c * intensity));
  }
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  geometry.setAttribute('starDirection', new THREE.InstancedBufferAttribute(new Float32Array(directions), 3));
  geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 3));
  geometry.setAttribute('starRadius', new THREE.InstancedBufferAttribute(new Float32Array(radii), 1));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.instanceCount = radii.length;
  return geometry;
}

export function createMilkyWay(transmission) {
  const dust = makeDust();
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
  material.fog = false;
  material.blending = THREE.AdditiveBlending;
  const direction = attribute('starDirection', 'vec3');
  material.positionNode = Fn(() => {
    const side = normalize(cross(direction, vec3(NORMAL)));
    const up = cross(side, direction);
    return cameraPosition
      .add(direction.mul(5990))
      .add(side.mul(positionLocal.x).add(up.mul(positionLocal.y)).mul(attribute('starRadius', 'float')));
  })();
  material.colorNode = attribute('color', 'vec3');
  material.opacityNode = smoothstep(0.5, 0.12, length(uv().sub(0.5))).mul(transmission(direction));
  const stars = new THREE.Mesh(starCatalog(dust), material);
  stars.frustumCulled = false;
  stars.renderOrder = 0;
  const map = bakeStarlight(dust);
  // The core: the brightest place in the same field the sky is drawn from, as
  // one fixed bearing over the world, which the flight turns to once a night.
  const core = brightestMatter(dust);
  const brightest = galacticDirection(core.longitude, core.latitude, new THREE.Vector3());
  const radiance = Fn(([dir]) => {
    const longitude = atan(dot(dir, vec3(UP)), dot(dir, vec3(RIGHT)))
      .div(Math.PI * 2)
      .add(0.5);
    const latitude = asin(clamp(dot(dir, vec3(NORMAL)), -1, 1));
    const starlight = texture(map, vec2(longitude, latitude.div(0.84).add(0.5)))
      .rgb.mul(2)
      .mul(float(1).sub(smoothstep(0.35, 0.42, abs(latitude))));
    return starlight.add(vec3(0.016, 0.04, 0.105).mul(exp(latitude.sub(0.14).div(0.43).pow(2).negate())));
  });
  // The temporary extinction field is collectible once both bakes finish.
  // Geometry/material are owned by the scene; the engine also disposes map.
  return { stars, map, radiance, brightest };
}
