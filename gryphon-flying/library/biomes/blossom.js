import { defineBiome } from '../contract.js';

// Warm, region highest, and rare: pink crowns on pale green.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'blossom',
  name: 'Blossom grove',
  climate: [0.62, 0.56, 0.92],
  ground: {
    base: 'paleGreen',
    alt: 'meadow',
    rock: 'rockPale',
  },
  species: {
    blossom: 1,
    oak: 0.2,
    cypress: 0.15,
  },
  density: 0.7,
  grass: {
    tint: 'white',
    density: 1,
  },
  props: {
    boulders: 0.1,
  },
  ruins: 0.8,
});
