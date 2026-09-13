import { defineSpecies } from '../contract.js';

// Wood only: a bare trunk and limbs for the badlands and the moor.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'deadwood',
  name: 'dead tree',
  trunk: {
    height: 6,
    radius: 0.5,
    lean: 0.9,
    tint: 'rockPale',
  },
  limbs: {
    count: 5,
    spread: 4,
    rise: 8.5,
    from: 0.45,
  },
  crown: {
    shape: 'bare',
  },
  leaf: null,
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'white',
  },
  scale: [0.9, 1.6],
});
