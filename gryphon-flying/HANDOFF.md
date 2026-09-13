# Gryphon flying game — integration handoff

## TL;DR
Fork [kunchenguid/fly-with-me](https://github.com/kunchenguid/fly-with-me). Keep its generated landscape, scenery streaming, sky, water, and lighting. Turn it into a child-friendly gryphon flying game: **select a robot, press one attack button, automatically swoop in, destroy it with one hit, and pull up into flight.** Start with a claw strike; bite and stomp are later variations of the same one-hit interaction.

## Built in this handoff
- `gryphon.js`: procedural 3D eagle/lion character with feathered articulated wings, four legs, talons, beak/jaw, and lion tail. Includes flap, dive, attack, bite, and grounded pose controls.
- `robot.js`: procedural toy robot with idle movement, selectable target ring, and a one-shot breakup animation. `hit()` immediately marks it destroyed; pieces disappear after 1.4 simulation seconds.
- Standalone ES modules, no textures or model downloads. Both accept the game's existing Three.js namespace and optional material factory. No game files were changed.

## Integration instructions for the next agent
1. Copy both JS files into `src/characters/`. Preserve the upstream MIT notice. Keep the existing Three.js r185.1 import map and rendering pipeline.
2. Replace the player `makeBird()` instance with `createGryphon(THREE)`. The original bird constructor may still be used for background companions. Replace player wing updates with `gryphon.update(dt, pose)`; keep the game's player position/rotation applied to `gryphon.root`. Adjust camera distance for the wider wings.
3. Separate player-controlled flight from the original auto-cruise, scheduled climbs, sunward steering, and clearance controller. Those systems must not fight the assisted dive. Implement `flying → approaching → striking → recovering → flying`, with a safe cancellation path if a target disappears.
4. Spawn a small capped pool of robots on dry, gentle terrain using seeded world-cell placement and `heightAt(x, z)`. Robots are dynamic entities, not static scenery instances. Keep defeated IDs per cell so streaming does not instantly resurrect them; persistent saving can follow later.
5. Select a nearby visible robot, display its target ring, and accept one attack press. Guide the gryphon along a terrain/obstacle-checked swoop; extend talons at contact, call `robot.hit()` once, then follow a safe pull-up. Reject further attacks until recovery ends. Keep the selected robot loaded until the attack resolves. Use a swept contact test so a fast swoop cannot skip the target between frames.
6. Tick models only while simulation runs. Remove destroyed robots from targeting immediately, continue their animation until `finished`, then dispose them. Dispose characters when unloading the world. Verify the source and bundle in both existing rendering backends.

## Minimal wiring
```js
import { createGryphon } from './characters/gryphon.js';
import { createRobot } from './characters/robot.js';

// THREE is the namespace already imported by src/main.js.
const gryphon = createGryphon(THREE);
scene.add(gryphon.root);
const robot = createRobot(THREE);
robot.root.position.set(x, heightAt(x, z), z);
scene.add(robot.root);

// Within the simulation tick; position and orientation remain game-owned:
gryphon.root.position.set(state.x, state.y, state.z);
gryphon.root.rotation.set(-state.pitch, state.heading, state.bank);
gryphon.update(dt, { flap: 0.7, dive: 0, attack: 0, bite: 0, grounded: 0 });
robot.update(dt);

// Selection / confirmed contact / completed visual effect:
robot.setTargeted(true);
// At actual strike contact only: robot.hit();
if (robot.finished) robot.dispose(); // Also remove from the entity collection.
```

## API and conventions
- `createGryphon(THREE, options?)` → `{ root, update(dt, pose), dispose(), joints, dimensions }`. Pose weights are 0–1; time is seconds. Increase `dive` to sweep wings back, `attack` to extend talons, and `bite` to open the jaw. `grounded` is a standing pose, not a walking controller. Root is body-centered; standing feet sit about 1.4 units below it.
- `createRobot(THREE, options?)` → `{ root, update(dt), setTargeted(bool), hit(), destroyed, finished, dispose(), dimensions }`. `hit()` returns true only on the first hit. Root is at the feet. Height is about 2.5 units. Spawn a new instance to respawn.
- Both use +Y up, +Z forward. Scale the roots to tune relative size. Robot debris moves in root-local space: keep its root fixed during destruction. Its simple debris floor is visual approximation, not terrain physics.
- Options: `colors` overrides named palette colors; `materialFactory(color)` can provide materials compatible with the existing fog/lighting system. Defaults use `MeshStandardMaterial`. Factory-provided materials are caller-owned and must be disposed by the integrator; default materials and model geometry are cleaned up by `dispose()`.

## Validation and remaining work
Checked against Three.js r185.1: model construction, finite animation transforms, preservation of root position, single-hit behavior, breakup completion, and repeat-safe resource cleanup. **Not yet browser-rendered or visually reviewed.** The next agent should inspect silhouettes, material integration, camera framing, and device performance. These files provide models and visual animations; targeting, flight paths, collision, robot spawning, input, and sound still need game integration. Keep the first robot population small: these prototypes use individual meshes, not instancing.
