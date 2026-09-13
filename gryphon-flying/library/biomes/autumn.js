import { defineBiome } from '../contract.js';

// Temperate, region high: amber ground, pale-trunked birches in orange, an oak here and there.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'autumn',
  name: 'Autumn vale',
  climate: [0.45, 0.5, 0.82],
  ground: {
    base: 'amber',
    alt: 'leafLitter',
    rock: 'rock',
  },
  species: {
    birch: 1,
    oak: 0.3,
  },
  density: 0.85,
  grass: {
    tint: 'grassGold',
    density: 0.7,
  },
  props: {
    boulders: 0.2,
  },
  ruins: 1,
});
