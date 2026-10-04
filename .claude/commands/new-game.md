# New Game

Create or import a new browser game into the arcade. Ensures mobile/touch support and adds a tile to the home page.

## Arguments

- `$ARGUMENTS` — Description of the game to create or path/URL to import

## Instructions

You are adding a new game to this arcade hub. Every game MUST work on both desktop and mobile (touch devices). Follow these steps:

### Step 1: Create the game directory

- Create a new directory at the repo root named with the game's slug (lowercase, hyphenated, e.g. `space-runner`)
- The game must be a self-contained web game with at minimum an `index.html` entry point
- If importing an existing game, copy it into the new directory and audit it for the requirements below

### Step 2: Add a home button

Every game MUST include a fixed-position home button that links back to the arcade. Add this as the first element inside `<body>`:

```html
<a href="../" style="position:fixed;top:12px;left:12px;z-index:1000;text-decoration:none;font-size:28px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;touch-action:manipulation;" aria-label="Back to Arcade">🏠</a>
```

### Step 3: Ensure mobile + desktop input support

Every game MUST support both keyboard/mouse AND touch input. Apply these rules:

**Required HTML:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**Required touch event handling:**
- For every `mousemove` listener, add a corresponding `touchmove` listener using `e.touches[0]`
- For every `mousedown` listener, add a corresponding `touchstart` listener
- For every `mouseup` listener, add a corresponding `touchend` listener
- For click-only games, use `pointerdown` (unified API) instead of separate mouse/touch
- For keyboard-controlled movement (arrow keys, WASD), add touch alternatives:
  - Swipe gestures (with `touchstart`/`touchmove`/`touchend` and a swipe threshold)
  - OR tap zones (e.g. tap left/right half of screen)
  - OR on-screen virtual buttons
- All touch listeners that call `preventDefault()` must use `{ passive: false }`

**Required CSS on the game canvas or main interactive element:**
```css
touch-action: none;        /* prevent browser gestures on game area */
-webkit-tap-highlight-color: transparent;  /* clean tap feel on iOS */
user-select: none;         /* prevent text selection during play */
```

**Required CSS on the body:**
```css
overflow: hidden;          /* prevent scroll bounce */
```

**Test checklist (verify mentally):**
- [ ] Can the game be played entirely with touch? (no keyboard required)
- [ ] Does `preventDefault()` block unwanted scrolling/zooming during play?
- [ ] Do buttons/UI elements have adequate tap target size (min 44x44px)?
- [ ] Is there no hover-only functionality that would be invisible on mobile?

### Step 4: Add a tile to the home page

After the game is complete, add a game card to `index.html` inside the `<main class="games-grid">` section. Follow the exact pattern of existing cards:

```html
<!-- ═══ GAME CARD: Game Title ═══ -->
<a href="./game-slug/" class="game-card" style="--accent: #HEX_COLOR; --thumb-bg: linear-gradient(...);">
  <div class="card-thumb" style="background: linear-gradient(...);">
    <div class="thumb-placeholder">EMOJI</div>
    <div class="play-overlay">
      <div class="play-btn-icon" style="background: #HEX_COLOR;">
        <svg viewBox="0 0 24 24"><polygon points="8,5 19,12 8,19"/></svg>
      </div>
    </div>
  </div>
  <div class="card-info">
    <div class="card-title">Game Title</div>
    <div class="card-desc">Short 1-2 sentence description of gameplay.</div>
    <div class="card-tags">
      <span class="tag">Genre</span>
      <span class="tag">Vibe</span>
    </div>
  </div>
</a>
```

- Pick a `--accent` color that fits the game's theme
- Pick a gradient for `--thumb-bg` that matches the game's visual style
- Pick a representative emoji for the placeholder
- Write a short, fun description (match the tone of existing cards)
- Add 2-3 tags describing genre/style
- The game count in the stats bar updates automatically via JS — no manual change needed

### Step 5: Verify

- Confirm the game loads at `./game-slug/index.html`
- Confirm the home page tile links to the correct path
- Confirm the home button is present per Step 2
- Confirm touch controls are implemented per Step 3

### Step 6: Play-test with Playwright (required — do not skip)

```bash
cd /Users/chris/repos/vibecoded-games-with-my-kids && python3 -m http.server 8123
```

Then via the Playwright MCP tools (pre-approved in `.claude/settings.local.json`):

1. `browser_navigate` → `http://localhost:8123/<slug>/`
2. `browser_console_messages` → **zero errors** is the bar
3. Click/keypress through a real round of play
4. `browser_take_screenshot` at start, mid-game, and the win state
5. `browser_resize` to `390 x 844` and play again with **clicks only** (no keyboard)

Kill the server when done.

### Step 7: Deploy

Pushing to `main` IS the deploy — GitHub Pages serves the repo root at
https://sophiaethan.com. No build step, no workflow.

```bash
git add -A && git commit -m "Add <Game Title>" && git push origin main
gh api repos/bitsofchris/vibecoded-games-with-my-kids/pages/builds/latest   # expect "status": "built"
curl -sI https://sophiaethan.com/<slug>/ | head -1                          # expect 200
```

Report back the live `https://sophiaethan.com/<slug>/` link.

---

**Full repo rules — stack, deploy, testing, mobile requirements — live in
`AGENTS.md` at the repo root. Read it before starting.**
