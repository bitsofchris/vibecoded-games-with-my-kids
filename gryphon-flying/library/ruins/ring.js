import { defineRuin } from '../contract.js';

// A ring of standing stones on a hilltop, some fallen, some gone. Faces the
// sunrise: the engine turns sun-facing sites so +z points at the dawn.
export default defineRuin({
  id: 'ring',
  name: 'standing ring',
  odds: 1.2,
  slope: 0.25,
  hill: true,
  footprint: 40,
  sunward: true,
  build(kit) {
    const count = 11 + Math.floor(kit.random() * 3),
      radius = 15 + kit.random() * 4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.2,
        x = Math.sin(a) * radius,
        z = Math.cos(a) * radius,
        fate = kit.random();
      if (fate < 0.14) continue;
      if (fate < 0.3) kit.fallen(x, z, 6 + kit.random() * 2.5, 1.3);
      else kit.standing(x, z, 5.5 + kit.random() * 3.5, 2.4 + kit.random() * 1, 1.4, a + Math.PI / 2);
    }
    kit.block(0, 0.1, 0, 5, 0.9, 5, 0.2, 0.12);
  },
});
