import { defineBiome } from '../contract.js';

// Temperate and moderate: the open oak hills the page was approved in. The start prefers them when they are within reach.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'wildsong',
  name: 'Wildsong hills',
  climate: [0.5, 0.5, 0.35],
  ground: {
    base: 'meadow',
    alt: 'steppe',
    rock: 'rock',
  },
  species: {
    oak: 1,
  },
  density: 0.75,
  grass: {
    tint: 'white',
    density: 1,
  },
  props: {
    boulders: 0.15,
  },
  ruins: 1,
});
