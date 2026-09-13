import { defineRuin } from '../contract.js';

// Two rows of pillars on level ground; lintels survive where two neighbors
// still stand, fallen drums lie where they do not.
export default defineRuin({
  id: 'colonnade',
  name: 'broken colonnade',
  odds: 1,
  slope: 0.16,
  hill: false,
  footprint: 46,
  build(kit) {
    const span = 8 + kit.random() * 2.5;
    let previous = [false, false];
    for (let i = 0; i < 7; i++) {
      const z = (i - 3) * 6.4;
      const standing = [kit.random() > 0.32, kit.random() > 0.32];
      standing.forEach((up, side) => {
        const x = (side - 0.5) * span;
        if (up) kit.pillar(x, z, 8.2 + kit.random() * 1.2, 0.82, 0.05);
        else if (kit.random() < 0.6) kit.pillar(x, z, 8.2, 0.82, 0.08, true);
        else kit.fallen(x + (kit.random() - 0.5) * 3, z + 1, 6.5, 0.78);
        if (up && previous[side]) kit.block(x, 8.4, z - 3.2, 1.7, 0.7, 6.9, 0, 0.04);
      });
      previous = standing;
    }
    kit.block(0, 0.1, 0, span + 4, 0.7, 46, 0, 0.02);
  },
});
