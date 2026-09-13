import { defineBiome } from '../contract.js';

// Cool and wet: tall elder oaks and a few pines over moss-dark ground, the heaviest canopy in the world.
// climate is temperature, moisture, region, each 0..1; colors are swatch
// names or hex values inside the swatch envelope; species and props are
// relative weights by id; ruins is how welcome the old builders were here.
export default defineBiome({
  id: 'elderwood',
  name: 'Elderwood',
  climate: [0.42, 0.74, 0.5],
  ground: {
    base: 'mossDeep',
    alt: 'forest',
    rock: 'rockCold',
  },
  species: {
    elder: 1,
    pine: 0.25,
  },
  density: 1.15,
  grass: {
    tint: 'grassCool',
    density: 0.5,
  },
  props: {
    boulders: 0.3,
  },
  ruins: 1.2,
});
