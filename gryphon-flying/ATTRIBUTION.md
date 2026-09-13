# Attribution

This game is built on **Fly With Me** by Kun Chen, MIT licensed.

- Upstream: https://github.com/kunchenguid/fly-with-me
- Vendored from commit `38857e6` (`38857e64e1ab684e74361769f842b2e12180e45e`), dated 2026-09-13
- License: see [LICENSE](./LICENSE) (upstream MIT notice, preserved verbatim)
- Three.js r185.1 is loaded from jsDelivr at a pinned version and carries its own MIT license.

Vendored as a snapshot, not a git fork or subtree: the game diverges from upstream
on purpose (player-controlled flight, robots, attacks), so upstream pulls are not expected.
Upstream's engine rules and contributor docs are kept for reference in `upstream-docs/`.
Not vendored: upstream `tools/`, `tests/`, `.github/`, `assets/hero.png`
(upstream itself says tools and tests never ship; we do not use its bundler or Pages workflow).

`src/characters/gryphon.js` and `src/characters/robot.js` are original to this repo
(see [HANDOFF.md](./HANDOFF.md)).
