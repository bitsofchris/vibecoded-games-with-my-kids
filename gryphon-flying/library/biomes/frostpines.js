import { defineBiome } from '../contract.js';

// Cold and wet: snow-dusted ground, dark pines, blue-grey rock. Real snow still comes with altitude.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'frostpines',
  name: 'Frost pines',
  climate: [0.16, 0.6, 0.5],
  ground: {
    base: 'frost',
    alt: 'tundra',
    rock: 'rockCold',
  },
  species: {
    pine: 1,
  },
  density: 0.9,
  grass: {
    tint: 'grassCool',
    density: 0.15,
  },
  props: {
    boulders: 0.5,
    cairns: 0.5,
  },
  ruins: 0.5,
});
