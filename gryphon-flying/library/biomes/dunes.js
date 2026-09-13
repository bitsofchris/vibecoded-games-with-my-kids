import { defineBiome } from '../contract.js';

// The hottest and driest: pale sand and ochre hollows where almost nothing grows but a rare palm.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'dunes',
  name: 'Dune sea',
  climate: [0.86, 0.12, 0.3],
  ground: {
    base: 'sandPale',
    alt: 'ochre',
    rock: 'rockPale',
  },
  species: {
    palm: 1,
  },
  density: 0.08,
  grass: {
    tint: 'grassGold',
    density: 0,
  },
  props: {
    boulders: 0.1,
  },
  ruins: 0.7,
});
