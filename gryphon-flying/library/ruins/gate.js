import { defineRuin } from '../contract.js';

// Two pillars, a lintel, and the sun disc: a stone ring standing on the
// lintel, facing the sunrise.
export default defineRuin({
  id: 'gate',
  name: 'sun gate',
  odds: 0.8,
  slope: 0.2,
  hill: true,
  footprint: 26,
  sunward: true,
  build(kit) {
    const half = 4.8;
    kit.pillar(-half, 0, 11, 1.2, 0.03);
    kit.pillar(half, 0, 11, 1.2, 0.03);
    kit.block(0, 11.2, 0, half * 2 + 3.6, 1.2, 2.8, 0, 0.03);
    kit.raw(new kit.THREE.TorusGeometry(3.4, 0.62, 7, 26), 0, 15.4, 0);
    kit.block(0, 0.05, 2.4, 8, 0.8, 5, 0, 0.03);
    kit.standing(-9.5, -1.5, 3.8, 1.9, 1.2, 0.3);
    kit.standing(9.8, -0.9, 3.2, 1.6, 1.2, -0.2);
  },
});
