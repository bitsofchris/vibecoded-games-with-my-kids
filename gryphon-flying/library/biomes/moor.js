import { defineBiome } from '../contract.js';

// Cool, region low: olive ground and heather, few trees, many boulders, and the most welcoming ground for the old builders.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'moor',
  name: 'Highland moor',
  climate: [0.3, 0.42, 0.22],
  ground: {
    base: 'moor',
    alt: 'heather',
    rock: 'rockCold',
  },
  species: {
    pine: 1,
    deadwood: 0.3,
  },
  density: 0.12,
  grass: {
    tint: 'grassCool',
    density: 0.4,
  },
  props: {
    boulders: 0.8,
    cairns: 1,
  },
  ruins: 1.4,
});
