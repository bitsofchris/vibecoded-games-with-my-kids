import { defineSpecies } from '../contract.js';

// A small tree in flower: petal cards in pink.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'blossom',
  name: 'blossom',
  trunk: {
    height: 4.6,
    radius: 0.55,
    lean: 0.7,
    tint: 'barkDark',
  },
  limbs: {
    count: 5,
    spread: 5,
    rise: 6.4,
    from: 0.5,
  },
  crown: {
    shape: 'dome',
    cards: 32,
    size: 3.2,
    radius: 4.2,
    height: 2.6,
  },
  leaf: 'blossom',
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'white',
  },
  scale: [1.0, 1.7],
});
