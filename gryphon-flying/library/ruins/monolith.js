import { defineRuin } from '../contract.js';

// One tapered stone, fourteen meters, leaning a little, two small stones at
// its foot. Built from raw geometry to show that a builder may.
export default defineRuin({
  id: 'monolith',
  name: 'lone monolith',
  odds: 1.1,
  slope: 0.3,
  hill: true,
  footprint: 12,
  build(kit) {
    const g = new kit.THREE.BoxGeometry(3, 14, 1.9);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) + 7) / 14;
      p.setX(i, p.getX(i) * (1 - 0.55 * t));
      p.setZ(i, p.getZ(i) * (1 - 0.35 * t));
    }
    g.computeVertexNormals();
    g.translate(0, 6.2, 0);
    const lean = 0.05 + kit.random() * 0.08;
    kit.raw(g, 0, 0, 0, 0.4, lean, -lean * 0.6);
    kit.block(0, -0.2, 0, 6, 1.1, 5, 0.3, 0.1);
    kit.standing(4.6, 2.2, 2, 1.5, 1.2, 0.7);
    kit.standing(-3.9, -3, 1.6, 1.8, 1.1, -0.5);
  },
});
