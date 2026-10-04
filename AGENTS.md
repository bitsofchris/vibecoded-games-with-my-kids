# AGENTS.md — Sophia & Ethan's Arcade

Authoritative guide for any agent working in this repo. Read this before touching anything.

## What this is

A static browser-game arcade for Chris's kids, live at **https://sophiaethan.com**.
Each game is a folder at the repo root with an `index.html`. The root `index.html`
is the arcade home page that links to them.

## Stack — and why

**Vanilla HTML + CSS + Canvas/DOM + Web Audio, one self-contained file per game.
No build step, no framework, no npm.**

This is a deliberate choice, not laziness:

- GitHub Pages serves the repo root directly — a build step would add a deploy
  pipeline and a failure mode between "idea" and "kid is playing it".
- A game is one file you can open with `file://` or read end-to-end in one pass.
- Zero dependencies means zero supply-chain surface on a site kids use.

**Allowed exceptions**, only when the game genuinely needs them:

- Google Fonts via `@import` / `<link>` (already used on the home page).
- A pinned CDN library for 3D or physics (e.g. `three` from cdnjs at an exact
  version). `easter-cat` does this. Pin the exact version — never `latest`.
- A game may split into `js/`, `styles.css`, and asset folders if it outgrows a
  single file (see `cat-stacker`). Still no build step.

Do **not** introduce: bundlers, TypeScript, React, a package.json, or a CI build.
If a game seems to need one, stop and ask.

## When a game needs a backend

There is no backend today; games save to the device (`localStorage`). When one
is genuinely needed (syncing progress across devices, a shared leaderboard, or
hiding an API key such as a text-to-speech key), the decided approach is:

**One Cloudflare Worker + D1 (Cloudflare's SQLite).**

- The games stay static on GitHub Pages; the browser `fetch()`es the Worker.
- The Worker is a single JS file (`export default { fetch(request, env) {…} }`)
  deployed with `wrangler deploy`, kept in a `backend/` folder of this repo.
  Wrangler is a dev tool for that folder only; the games still have no build.
- Persistent data goes in D1 (bound as `env.DB`). Use KV only for a trivial
  key → JSON blob, R2 only for files/audio.
- Secrets (API keys) live in Worker secrets (`wrangler secret put`), never in
  page code — everything shipped to the browser is public.
- Kids' data stays minimal: a family code instead of accounts, no names or
  emails.
- Not Supabase (free projects pause when idle) and not an in-browser database
  like DuckDB-WASM (it is per-device, so nothing is shared).

Still check with Chris before adding the backend for the first time.

## Deploy

GitHub Pages, `main` branch, `/` root, custom domain via `CNAME` (`sophiaethan.com`).

```bash
git add -A && git commit -m "..." && git push origin main
```

**Pushing to `main` IS the deploy.** There is no workflow file and no build.
Pages usually publishes within ~30–60s.

Verify it actually went out:

```bash
# build status — look for "status": "built" and a recent timestamp
gh api repos/bitsofchris/vibecoded-games-with-my-kids/pages/builds/latest

# then confirm the live URL serves the new game
curl -sI https://sophiaethan.com/<game-slug>/ | head -1   # expect 200
```

**HTTPS is on.** GitHub Pages serves a Let's Encrypt certificate for
`sophiaethan.com` and "Enforce HTTPS" is ticked in Settings → Pages, so
`http://` redirects to `https://`. DNS lives at Namecheap: four `@` A records
to `185.199.108–111.153`. If the cert ever lapses, remove and re-add the custom
domain in Settings → Pages to re-trigger provisioning.

## Test locally before you push

Serve the repo (never test a game only via `file://` — module and audio
behavior differ):

```bash
cd /Users/chris/repos/vibecoded-games-with-my-kids
python3 -m http.server 8123
# http://localhost:8123/<game-slug>/
```

Then **play-test it with the Playwright MCP browser** — this repo pre-approves
those tools in `.claude/settings.local.json`. A real play-test, not a smoke test:

1. `browser_navigate` to `http://localhost:8123/<slug>/`
2. `browser_console_messages` — **zero errors** is the bar, not "it rendered"
3. `browser_click` / `browser_press_key` through an actual round of play
4. `browser_take_screenshot` at start, mid-game, and win/lose state
5. `browser_evaluate` to assert internal state if the game has a score/level
   (e.g. `document.getElementById('score').textContent`)
6. Resize to a phone viewport (`browser_resize 390 844`) and play again with
   clicks only — no keyboard.

Kill the server when done. `.playwright-mcp/` is gitignored; screenshots there
are scratch, not artifacts.

## Non-negotiables for every game

1. **Mobile AND desktop.** The kids play on an iPad. Every game must be fully
   playable with touch alone. Use `pointerdown`/`pointermove`/`pointerup` (one
   unified API) rather than parallel mouse and touch listeners. Any listener
   calling `preventDefault()` needs `{ passive: false }`.
2. **Home button.** First element in `<body>`:
   ```html
   <a href="../" style="position:fixed;top:12px;left:12px;z-index:1000;text-decoration:none;font-size:28px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;" aria-label="Back to Arcade">🏠</a>
   ```
3. **Viewport meta**: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
4. **CSS**: `touch-action:none` and `-webkit-tap-highlight-color:transparent` and
   `user-select:none` on the play area; `overflow:hidden` on `body`.
5. **Tap targets ≥ 44×44px.** No hover-only affordances.
6. **Audio must start behind a user gesture.** iOS Safari blocks `AudioContext`
   and `speechSynthesis` until a real tap. Every game with sound needs a start
   screen with a big PLAY button that calls `audioCtx.resume()`.
7. **Add a tile to the root `index.html`** inside `<main class="games-grid">` —
   copy an existing `<!-- ═══ GAME CARD: ... ═══ -->` block. The game count in
   the stats bar is computed from `.game-card` count, so no manual edit needed.

## Ages

Sophia and Ethan are young (Ethan is 6). Design accordingly: no reading-heavy
instructions, no fail states that feel like punishment, big friendly targets,
immediate audio/visual feedback, and a win screen that celebrates. Educational
games should teach through play, not quizzing.

## Dispatch workflow (how Chris uses this)

Chris sends a game idea from his vault. The agent should:

1. Build it in a new `<slug>/` folder per the rules above.
2. Play-test with Playwright, desktop **and** phone viewport.
3. Add the home-page tile.
4. Commit and push to `main`.
5. Verify live, and report back the `https://sophiaethan.com/<slug>/` link.

`/new-game` in `.claude/commands/` is the slash-command version of this.
