import { defineBiome } from '../contract.js';

// Hot and wet: palms with radiating fronds under elder oaks, the deepest greens, thick grass.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'jungle',
  name: 'Jungle',
  climate: [0.84, 0.8, 0.5],
  ground: {
    base: 'jungleDeep',
    alt: 'jungle',
    rock: 'rock',
  },
  species: {
    palm: 1,
    elder: 0.6,
  },
  density: 1.2,
  grass: {
    tint: 'white',
    density: 0.8,
  },
  props: {
    boulders: 0.15,
  },
  ruins: 1.3,
});
