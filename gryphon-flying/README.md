# Gryphon Flying

Fly a gryphon over an endless world and swoop on toy robots. Built on
[Fly With Me](https://github.com/kunchenguid/fly-with-me) by Kun Chen (MIT);
see [ATTRIBUTION.md](./ATTRIBUTION.md) and [LICENSE](./LICENSE).

## Play

- **PLAY** starts the flight and the sound. The gryphon flies itself.
- **Steer**: drag on touch; right-drag, arrow keys or WASD on desktop. Left-drag
  orbits the camera, the wheel zooms.
- **SWOOP** (the big button, or Space): when a robot ahead is marked with the
  yellow ring, the gryphon dives onto it, breaks it with one strike, pulls up and
  flies on. Every fifth robot gets a cheer.
- **P** or Escape pauses; the pause button too.

## How it is built

No build step. `index.html` loads `src/main.js` as an ES module; Three.js r185.1
comes pinned from jsDelivr via the import map. Serve the repo root and open
`/gryphon-flying/`.

- `src/main.js` is the upstream engine: terrain, streaming scenery, sky, water,
  the flight controller and camera. Our changes are marked `Gryphon Flying:` in
  comments. The main ones: the opening ends after the sunrise turn, the day
  clock holds at mid-morning (`DAY_HOLD`), nothing resumes between visits, held
  arrow keys steer (`steerByKeys`), the player's meshes are the gryphon, and the
  flight step defers to the hunt while a swoop is under way.
- `src/hunt.js` owns the robots, targeting and the swoop. Robots are seeded per
  160 m cell on gentle dry ground in a clearing, capped at ten live, and a broken
  robot's cell is remembered so streaming never brings it back. A swoop is two
  Bezier arcs flown at a fixed speed: down onto the robot, then up and out to the
  altitude the dive started from; while it flies, the engine's floors and limits
  are not applied. The hunt also builds its own screen elements (score, target
  ring, SWOOP button, cheer) and exposes itself as `window.__fly.hunt` for tests.
- `src/characters/gryphon.js` and `robot.js` are the procedural models
  (see [HANDOFF.md](./HANDOFF.md)); both take the engine's lit material so they
  sit in the world's fog and light.
- `upstream-docs/` keeps upstream's engine rules and contributor guide for
  reference. Upstream's `tools/` and `tests/` are not vendored.

## Testing

Play-test with the Playwright MCP per the repo `AGENTS.md`. Useful hooks on
`window.__fly`: `begin()`, `state`, `clearance`, `intro.beat`, and `hunt`
(`robots`, `target`, `phase`, `score`, `attack()`).
