import { defineProp } from '../contract.js';

// Cairns: a few flat stones stacked on high open ground, the way walkers
// leave them. A small object with an obstacle, so the bird and the camera
// keep clear of it, and a prop that is rare by its own place() rule.
export default defineProp({
  id: 'cairns',
  name: 'cairns',
  budget: { instances: 200, triangles: 300 },
  obstacle: { radius: 1.2, height: 2.4 },
  bake(kit) {
    const random = kit.random('cairns'),
      parts = [];
    for (let i = 0; i < 6; i++) {
      const size = 1.1 - i * 0.13,
        g = new kit.THREE.IcosahedronGeometry(size, 0);
      g.scale(1, 0.32 + random() * 0.1, 0.85);
      parts.push({
        geometry: g,
        matrix: kit.matrix((random() - 0.5) * 0.25, 0.1 + i * 0.36, (random() - 0.5) * 0.25, 1, 1, 1, 0, random() * 6.283, 0),
        color: kit.color(i % 2 ? 'stoneCool' : 'stoneWarm'),
      });
    }
    return kit.merge(parts);
  },
  place(cell) {
    // one cairn in a few cells of the moor and the frost, on a local rise
    if (cell.roll() > cell.mix('cairns') * 0.08) return [];
    const x = cell.corner.x + cell.roll() * cell.size,
      z = cell.corner.z + cell.roll() * cell.size;
    if (!cell.land(x, z) || cell.slope(x, z) > 0.3) return [];
    const h = cell.height(x, z);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      if (cell.height(x + Math.cos(a) * 40, z + Math.sin(a) * 40) > h + 1) return [];
    }
    return [{ x, z, yaw: cell.roll() * 6.283, scale: 0.9 + cell.roll() * 0.4, sink: 0.15 }];
  },
});
