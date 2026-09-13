import { defineSpecies } from '../contract.js';

// A cone of needle cards along a tall straight trunk; no limbs.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'pine',
  name: 'pine',
  trunk: {
    height: 14,
    radius: 0.55,
    lean: 0.1,
    tint: 'barkDark',
  },
  limbs: {
    count: 0,
  },
  crown: {
    shape: 'cone',
    cards: 120,
    size: 2.7,
    radius: 3.9,
    height: 11,
    from: 0.2,
  },
  leaf: 'needle',
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'canopyCold',
  },
  scale: [1.1, 2.2],
});
