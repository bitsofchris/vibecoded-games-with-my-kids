import { defineSpecies } from '../contract.js';

// A flat-topped tree of the steppe: wide limbs, a thin dome of yellow-green cards.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'acacia',
  name: 'acacia',
  trunk: {
    height: 5.5,
    radius: 0.5,
    lean: 0.9,
    tint: 'barkWarm',
  },
  limbs: {
    count: 4,
    spread: 6.5,
    rise: 6.6,
    from: 0.6,
  },
  crown: {
    shape: 'dome',
    cards: 28,
    size: 3.6,
    radius: 5.5,
    height: 1.1,
  },
  leaf: 'acacia',
  tint: {
    cold: 'white',
    warm: 'white',
    dry: 'canopyDry',
  },
  scale: [1.0, 1.8],
});
