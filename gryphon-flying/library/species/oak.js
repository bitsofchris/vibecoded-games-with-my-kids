import { defineSpecies } from '../contract.js';

// The broad oak of the approved hills: a leaning trunk, five limbs, a cloud of broad cards on each.
// This entry is data for the built-in tree kit: a trunk, limbs, and a crown
// shape (dome, cone, fan or bare) of painted cards. A species may instead
// give bake(kit) and grow its wood parts and cards any way it likes; see
// CONTRIBUTING.md.
export default defineSpecies({
  id: 'oak',
  name: 'oak',
  trunk: {
    height: 6.4,
    radius: 0.9,
    lean: 0.65,
    tint: 'white',
  },
  limbs: {
    count: 5,
    spread: 6,
    rise: 8.8,
    from: 0.55,
  },
  crown: {
    shape: 'dome',
    cards: 35,
    size: 3.8,
    radius: 5,
    height: 2.8,
  },
  leaf: 'broad',
  tint: {
    cold: 'canopyCold',
    warm: 'white',
    dry: 'canopyDry',
  },
  scale: [1.15, 2.4],
});
