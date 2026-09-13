import { defineBiome } from '../contract.js';

// Hot, dry, region high: terracotta and clay, dead trees, the most boulders, no grass.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'badlands',
  name: 'Red badlands',
  climate: [0.82, 0.2, 0.78],
  ground: {
    base: 'terracotta',
    alt: 'clay',
    rock: 'rockRed',
  },
  species: {
    deadwood: 1,
  },
  density: 0.2,
  grass: {
    tint: 'grassGold',
    density: 0,
  },
  props: {
    boulders: 1,
    cairns: 0.3,
  },
  ruins: 0.8,
});
