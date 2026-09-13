# Gryphon Flying — build plan

Status: **Phases 0–5 shipped** (baseline, arcade chrome, gryphon, arrow/WASD steering, robots, swoop, score, sounds, cheer). Next: iPad play-test, tune, then bite/stomp variants and a ground mode (Chris wants to walk around eventually).
Design change during Phase 4 (Chris): the swoop does not steer through the engine's flight controller; `src/hunt.js` flies the gryphon itself along two arcs with no floors or limits, then hands back.
Decisions (2026-09-13, Chris): snapshot vendoring; assisted flight with auto-swoop on an acquired target; daytime held; no pause between phases, gryphon in before anything goes live.
Source brief: [`gryphon-flying/HANDOFF.md`](../../gryphon-flying/HANDOFF.md).
Upstream: [kunchenguid/fly-with-me](https://github.com/kunchenguid/fly-with-me), MIT, vendored at `38857e6` (2026-09-13).

## 1. What was verified (2026-09-13, M-series Mac, Chrome)

| Check | Result |
|---|---|
| Runs with no build step | Yes. Plain ES modules + import map. Upstream's bundler is only for its own Pages workflow. |
| Runs from a subpath (`/gryphon-flying/`) | Yes. Every path is relative by upstream rule. |
| Console errors | 0 on WebGPU and WebGL2 (8 harmless Canvas2D warnings). |
| Load to first frame, WebGL2, fresh seed | 13.2 s |
| Frame cost after Begin | ~8.3 ms/frame, ~70 draw calls, 1.4–2.0 M triangles (both backends) |
| Phone viewport 390×844 | Renders and flies. Upstream HUD text is tiny; must be replaced. |
| Touch input | Upstream already steers by touch drag via unified `pointer*` events. |

Not verified: **iPad load time and frame rate.** This is the biggest unknown and
the reason Phase 1 ships the baseline before any gameplay work.

## 2. Constraints that shape the plan

- **Live site is HTTP-only**, so it will always take the WebGL2 path (WebGPU needs a secure context). WebGL2 works fine. Fixing HTTPS in repo Settings → Pages is worth doing in parallel (iPadOS 26 has WebGPU) but is not a blocker.
- **Repo rule: no build step.** We serve `src/` and `library/` directly. Upstream's `tools/`, `tests/`, `.github/`, `dist/` are not vendored. HANDOFF step 6's "verify the bundle" is dropped.
- **Three.js r185.1 from jsDelivr**, pinned by exact version in the import map. Our AGENTS.md names cdnjs, but cdnjs does not carry the `three.webgpu.js` / `three.tsl.js` module builds this engine needs. jsDelivr at a pinned version is the same supply-chain posture.
- **Engine is one 4,192-line file**, `src/main.js`. Relevant anchors: `state` (2582), `updateFlight` (2804), `terrainAhead` (2663), `climbAhead` (2694), `updateSunward` (2508), `updateNightward` (2541), `updateIntro` (2739), `obstacleFloor` (3042), `updateCamera` (3073), pointer handlers (2970–3009), `makeBird` (2400), `advance` (3800), test hooks `window.__fly` (4059). Upstream's engine rules are in `gryphon-flying/upstream-docs/AGENTS.md`.

## 3. Decisions needed from Chris

1. **Vendor snapshot (recommended, done) vs git subtree vs GitHub fork.** The game will diverge hard from upstream, so upstream pulls are unlikely to merge; a snapshot with the SHA recorded in `ATTRIBUTION.md` is simplest.
2. **Assisted flight (recommended) vs full manual flight.** Upstream's bird flies itself and the kid steers by dragging. For a 6-year-old that is the right control scheme: keep it, add *tap robot / press ATTACK → auto swoop → strike → auto pull-up*. HANDOFF step 3 asks to separate player flight from auto-cruise; the recommendation is to only *suspend* the auto systems during an attack, not replace them. Full manual flight can come later if the kids want it.
3. **Day/night cycle.** Upstream runs a full day with a dark night and a scripted sunrise intro. Recommend holding daytime (or a slow day with no night) so the world stays readable and robots stay visible.
4. **Ship the baseline first?** Recommend yes: Phase 1 puts a flying bird on sophiaethan.com within a day and gives a real iPad performance number before the gameplay investment.

## 4. Phases

Each phase is a separate commit (or a few), play-tested with Playwright at desktop and 390×844 per AGENTS.md, then pushed.

**Phase 0 — Baseline (done, uncommitted)**
Upstream source in `gryphon-flying/`, `LICENSE` + `ATTRIBUTION.md`, starter models in `src/characters/`, upstream docs in `upstream-docs/`.

**Phase 1 — Arcade-ify and ship**
- Home button first in `<body>`, our viewport meta, `touch-action:none` already present on the canvas.
- Replace upstream chrome: remove perch (bird picker), share link, volume slider, backend label, "presents" title card. Keep the Begin gate as the big PLAY button (it already gates audio). Keep pause.
- Fixed seed list instead of remembered world; clear resume-on-load so every visit starts fresh over land.
- Add home-page tile. Commit, push, verify live, **then measure on the iPad** (load time, feel). If the iPad is too slow, tune here: lower the 1.5 device-pixel cap, shorten the streamed ring, drop shadows. This decides how ambitious Phases 2–5 can be.

**Phase 2 — Gryphon**
- Swap the player's `makeBird()` with `createGryphon(THREE, { materialFactory })`, using the engine's `litMaterial` so it takes fog and the color grade like everything else.
- Drive `gryphon.update(dt, pose)` from flight state: `flap` from climb/flap burst, `dive` from negative pitch. Keep `gryphon.root` positioned by the engine.
- Push the camera back for the 8-unit wingspan. Keep the flock as upstream birds or drop it.
- Visual review of silhouette and materials (HANDOFF says the model has never been rendered).

**Phase 3 — Robots**
- Dynamic entity pool, cap ~6. Spawn on land, gentle slope, ahead of the bird using `heightAt` / `slopeAt` and the biome's water mask; despawn well behind. Seeded per world cell with a per-cell defeated set so streaming does not resurrect them.
- Tick `robot.update(dt)` inside `advance` only while running. Dispose on `finished` or unload.

**Phase 4 — Target and attack**
- Nearest robot inside a forward cone and range gets `setTargeted(true)` and a screen marker.
- One big ATTACK button (bottom-right, ≥ 64 px) plus tap-on-robot; space bar on desktop.
- State machine `flying → approaching → striking → recovering → flying`. While not `flying`: suspend sunward, nightward, intro, cloud schedule and the clearance clamp; drive heading and `state.aim` toward the robot along a terrain-checked path; extend talons (`attack` pose) near contact; swept-sphere contact test; `robot.hit()` once; pull-up via `aim` back to cruise altitude. Cancel cleanly if the robot despawns or terrain blocks.
- Reject new attacks until recovery ends.

**Phase 5 — Feedback and celebration**
- Web Audio whoosh + clank on strike, using the engine's existing audio graph behind the PLAY gate.
- Big score number, sparkle burst on hit, celebration every 5 robots. No fail state.
- Later variants per HANDOFF: bite and stomp as pose changes on the same interaction.

## 5. Testing approach

- Playwright MCP per AGENTS.md: zero console errors, screenshots at start / mid / celebration, phone viewport with clicks only.
- Assert via `window.__fly` (extend it with `robots`, `attack.phase`, `score`) rather than reading pixels.
- Keep a short manual iPad checklist in this file after Phase 1 with the measured numbers.
