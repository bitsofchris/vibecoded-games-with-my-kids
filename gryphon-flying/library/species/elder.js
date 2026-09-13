import { defineSpecies } from '../contract.js';

// A taller, darker oak for the deep woods.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'elder',
  name: 'elder oak',
  trunk: {
    height: 9,
    radius: 1.1,
    lean: 0.4,
    tint: 'barkDark',
  },
  limbs: {
    count: 6,
    spread: 7,
    rise: 13,
    from: 0.5,
  },
  crown: {
    shape: 'dome',
    cards: 32,
    size: 4.4,
    radius: 5.5,
    height: 3.4,
  },
  leaf: 'elder',
  tint: {
    cold: 'canopyDusk',
    warm: 'white',
    dry: 'canopyDusk',
  },
  scale: [1.3, 2.1],
});
