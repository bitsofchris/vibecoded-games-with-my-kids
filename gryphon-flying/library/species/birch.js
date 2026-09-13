import { defineSpecies } from '../contract.js';

// A slim pale trunk and an upright crown in autumn colors.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'birch',
  name: 'autumn birch',
  trunk: {
    height: 7.5,
    radius: 0.45,
    lean: 0.3,
    tint: 'barkPale',
  },
  limbs: {
    count: 4,
    spread: 3.2,
    rise: 10,
    from: 0.5,
  },
  crown: {
    shape: 'dome',
    cards: 30,
    size: 3.2,
    radius: 3.4,
    height: 3.6,
  },
  leaf: 'autumn',
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'white',
  },
  scale: [1.0, 2.0],
});
