import { defineSpecies } from '../contract.js';

// A cypress, grown by its own generator rather than the tree kit's shapes:
// a tall, slightly twisted column of small cards spiraling up a curved
// trunk. It shows what bake(kit) can do. The kit lays wood with branch() and
// hangs painted cards with card(); the engine builds the near and far crowns,
// the morph between them, the ring shrink, the shadows and the climate tint.
export default defineSpecies({
  id: 'cypress',
  name: 'cypress',
  trunk: { height: 12, radius: 0.35, lean: 0.25, tint: 'barkDark' },
  limbs: { count: 0 },
  leaf: 'needle',
  tint: { cold: 'canopyCold', warm: 'white', dry: 'canopyDry' },
  scale: [0.9, 1.6],
  bake(kit) {
    const { THREE, random, branch, card, spec } = kit;
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const trunk = branch(V(0, -1, 0), V(spec.trunk.lean, spec.trunk.height, spec.trunk.lean * 0.4), spec.trunk.radius, 0.08);
    // 150 small cards, fuller at the waist, closing to a point at the top
    const count = 150;
    for (let k = 0; k < count; k++) {
      const t = 0.12 + 0.88 * (k / count),
        a = k * 2.39996 + random() * 0.4,
        width = 1.25 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.25;
      const center = trunk.getPointAt(Math.min(1, t));
      const p = V(center.x + Math.cos(a) * width, center.y + (random() - 0.5) * 0.4, center.z + Math.sin(a) * width);
      const outward = V(Math.cos(a), 0.35, Math.sin(a)).normalize();
      card(p, outward, new THREE.Euler((random() - 0.5) * 0.8, -a, (random() - 0.5) * 0.6), 1.4 + random() * 0.5);
    }
  },
});
