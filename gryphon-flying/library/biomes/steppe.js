import { defineBiome } from '../contract.js';

// Warm and dry: flat acacias on gold grass.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'steppe',
  name: 'Golden steppe',
  climate: [0.68, 0.32, 0.45],
  ground: {
    base: 'gold',
    alt: 'steppe',
    rock: 'rockPale',
  },
  species: {
    acacia: 1,
    cypress: 0.12,
  },
  density: 0.3,
  grass: {
    tint: 'grassGold',
    density: 0.9,
  },
  props: {
    boulders: 0.25,
  },
  ruins: 0.9,
});
