import { defineSpecies } from '../contract.js';

// A tall leaning trunk with a fan of fronds at the top, each painted from the card's foot outward.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'palm',
  name: 'palm',
  trunk: {
    height: 13,
    radius: 0.5,
    lean: 1.8,
    tint: 'barkWarm',
  },
  limbs: {
    count: 0,
  },
  crown: {
    shape: 'fan',
    cards: 13,
    size: 7.5,
    radius: 4.2,
    height: 1.5,
  },
  leaf: 'frond',
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'canopyDry',
  },
  scale: [1.1, 1.8],
});
