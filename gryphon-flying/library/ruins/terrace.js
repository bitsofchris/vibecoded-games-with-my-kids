import { defineRuin } from '../contract.js';

// Three stepped levels with corners missing, a stair, standing stones.
export default defineRuin({
  id: 'terrace',
  name: 'sunken terrace',
  odds: 1,
  slope: 0.12,
  hill: false,
  footprint: 56,
  build(kit) {
    for (let level = 0; level < 3; level++) {
      const size = 30 - level * 8,
        y = level * 2.1 + 0.6;
      for (let qx = -1; qx <= 1; qx += 2)
        for (let qz = -1; qz <= 1; qz += 2) {
          if (kit.random() < 0.12) continue;
          kit.block(qx * size * 0.25, y, qz * size * 0.25, size * 0.5 - 0.2, 2.1, size * 0.5 - 0.2, 0, 0.03);
        }
    }
    for (let i = 0; i < 4; i++) kit.block(0, 0.7 + i * 0.55, 17 - i * 1.4, 5, 0.6, 1.6, 0, 0.03);
    kit.standing(0, 0, 7.2, 2.4, 2.4, 0.4);
    kit.standing(-9, -8, 4.6, 1.8, 1.4, 0.9);
  },
});
