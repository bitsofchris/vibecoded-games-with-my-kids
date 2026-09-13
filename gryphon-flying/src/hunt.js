// Gryphon Flying: the hunt. Robots stand about the world; the nearest one in
// front of the gryphon becomes the target; one press swoops the gryphon onto
// it, one strike breaks it, and the gryphon pulls up into flight again.
//
// The engine owns cruising flight, terrain and camera. While a swoop is under
// way this module owns the gryphon outright: it flies a scripted arc down onto
// the robot and a second arc back up, writing position, heading, pitch and
// bank straight into the flight state with none of the flight's floors or
// limits, then hands the gryphon back where the pull-up ends. Everything here
// ticks only from the engine's simulation step, so a pause holds it.
import { createRobot } from './characters/robot.js';
import { mulberry32 } from './noise.js';

const ROBOT_CELL = 160; // meters; one seeded chance of a robot per cell
const ROBOT_ODDS = 0.55;
const ROBOT_SCALE = 3; // the model is 2.5 units tall; toy robots 7.5 m tall read from cruise height
const SPAWN_RANGE = 720; // meters around the gryphon that hold robots
const MAX_LIVE = 10;
const CLEARING = 28; // meters of open ground around a robot
const TARGET = { near: 70, far: 540, cone: Math.cos(0.75), keepCone: Math.cos(1.1), keepFar: 640 };
const SWOOP = {
  speed: 64, // m/s along the dive, against a 40 m/s cruise
  pullSpeed: 46, // m/s the pull-up eases down to before the hand-back
  strikeAt: 45, // meters from the robot at which the talons come out
  reach: 10, // meters from the robot's middle that count as the strike
  pullAhead: 110, // meters past the robot where the pull-up hands the gryphon back
  pullRise: 30, // meters over the ground the pull-up ends at; the flight climbs on from there
  clearance: 8, // meters the arcs keep over anything they cross
};
const CELEBRATE_EVERY = 5;

const wrap = (a) => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A quadratic Bezier arc with an arc-length table, so flight along it is at a
// steady speed rather than a steady parameter. Position and tangent are the
// curve's own, evaluated at the parameter the table gives for a distance, so
// the flight is smooth rather than kinked at the table's joints.
function makeArc(p0, c, p1, samples = 64) {
  const point = (u) => {
    const w0 = (1 - u) * (1 - u),
      w1 = 2 * (1 - u) * u,
      w2 = u * u;
    return [w0 * p0[0] + w1 * c[0] + w2 * p1[0], w0 * p0[1] + w1 * c[1] + w2 * p1[1], w0 * p0[2] + w1 * c[2] + w2 * p1[2]];
  };
  const tangent = (u) => {
    const a = 2 * (1 - u),
      b = 2 * u;
    return [a * (c[0] - p0[0]) + b * (p1[0] - c[0]), a * (c[1] - p0[1]) + b * (p1[1] - c[1]), a * (c[2] - p0[2]) + b * (p1[2] - c[2])];
  };
  const pts = [],
    lens = [0];
  for (let i = 0; i <= samples; i++) {
    pts.push(point(i / samples));
    if (i) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  }
  const length = lens[samples];
  const paramAt = (s) => {
    s = clamp(s, 0, length);
    let i = 1;
    while (i < samples && lens[i] < s) i++;
    const seg = lens[i] - lens[i - 1];
    return (i - 1 + (seg > 0 ? (s - lens[i - 1]) / seg : 0)) / samples;
  };
  return {
    length,
    pts,
    at: (s) => point(paramAt(s)),
    tangent: (s) => tangent(paramAt(s)),
  };
}

export function createHunt(deps) {
  const {
    THREE,
    scene,
    state,
    heightAt,
    slopeAt,
    obstacleFloor,
    seaLevel,
    seed,
    materialFactory,
    camera,
    releaseSunward,
    playerSteering, // () => boolean: the player is holding a steering key or drag
    canHunt, // () => boolean: false while the opening plays or the page is not running
    sound, // { strike(), cheer() } or null
  } = deps;

  // --- robots --------------------------------------------------------------
  const live = new Map(); // cell key -> { key, x, y, z, radius, height, robot }
  const defeated = new Set(); // cell keys whose robot was broken: streaming never brings it back
  let scanTimer = 0;
  const cellRng = (cx, cz) => mulberry32(((cx * 73856093) ^ (cz * 19349663) ^ (seed | 0)) >>> 0);

  // No canopy, ruin or boulder on a ring around the robot, so the dive onto it
  // and the pull-up away from it cross open ground.
  function clearing(x, z, h) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (obstacleFloor(x + Math.cos(a) * CLEARING, z + Math.sin(a) * CLEARING) > h + 6) return false;
    }
    return true;
  }
  function placeIn(cx, cz) {
    const rng = cellRng(cx, cz);
    if (rng() > ROBOT_ODDS) return null;
    for (let attempt = 0; attempt < 4; attempt++) {
      const x = (cx + 0.15 + rng() * 0.7) * ROBOT_CELL,
        z = (cz + 0.15 + rng() * 0.7) * ROBOT_CELL;
      const h = heightAt(x, z);
      if (h < seaLevel + 4 || slopeAt(x, z) > 0.22) continue;
      if (obstacleFloor(x, z) > h + 0.5) continue; // a tree, a ruin or a boulder stands here
      if (!clearing(x, z, h)) continue;
      return { x, y: h, z, yaw: rng() * Math.PI * 2 };
    }
    return null;
  }
  function spawn(key, at) {
    const robot = createRobot(THREE, { materialFactory });
    robot.root.position.set(at.x, at.y, at.z);
    robot.root.rotation.y = at.yaw;
    robot.root.scale.setScalar(ROBOT_SCALE);
    scene.add(robot.root);
    const height = robot.dimensions.height * ROBOT_SCALE;
    live.set(key, { key, x: at.x, y: at.y, z: at.z, radius: robot.dimensions.radius * ROBOT_SCALE, height, robot });
  }
  function stream() {
    const reach = Math.ceil(SPAWN_RANGE / ROBOT_CELL);
    const cx0 = Math.floor(state.x / ROBOT_CELL),
      cz0 = Math.floor(state.z / ROBOT_CELL);
    for (const [key, r] of live) {
      if (r.robot.destroyed || r === target || r === swoop.target) continue;
      if ((r.x - state.x) ** 2 + (r.z - state.z) ** 2 > (SPAWN_RANGE + 140) ** 2) {
        r.robot.dispose();
        live.delete(key);
      }
    }
    for (let cz = cz0 - reach; cz <= cz0 + reach && live.size < MAX_LIVE; cz++)
      for (let cx = cx0 - reach; cx <= cx0 + reach && live.size < MAX_LIVE; cx++) {
        const key = cx + ',' + cz;
        if (live.has(key) || defeated.has(key)) continue;
        const at = placeIn(cx, cz);
        if (!at) continue;
        if ((at.x - state.x) ** 2 + (at.z - state.z) ** 2 > SPAWN_RANGE * SPAWN_RANGE) continue;
        spawn(key, at);
      }
  }

  // --- targeting -----------------------------------------------------------
  let target = null;
  function qualifies(r, cone, far) {
    if (r.robot.destroyed) return false;
    const dx = r.x - state.x,
      dz = r.z - state.z,
      dist = Math.hypot(dx, dz);
    if (dist < TARGET.near || dist > far) return false;
    const forward = (dx * Math.sin(state.heading) + dz * Math.cos(state.heading)) / dist;
    if (forward < cone) return false;
    return state.y > r.y + r.height + 6; // below the gryphon; the swoop flies any angle
  }
  function pickTarget() {
    if (target && live.has(target.key) && qualifies(target, TARGET.keepCone, TARGET.keepFar)) return;
    let best = null,
      bestDist = Infinity;
    for (const r of live.values()) {
      if (!qualifies(r, TARGET.cone, TARGET.far)) continue;
      const d = Math.hypot(r.x - state.x, r.z - state.z);
      if (d < bestDist) {
        best = r;
        bestDist = d;
      }
    }
    setTarget(best);
  }
  function setTarget(r) {
    if (r === target) return;
    if (target) target.robot.setTargeted(false);
    target = r;
    if (target) target.robot.setTargeted(true);
  }

  // --- the swoop -----------------------------------------------------------
  // phases: flying -> diving -> striking (talons out, last meters) -> pulling -> flying
  const swoop = { phase: 'flying', target: null, arc: null, s: 0, speed: 0, hit: false, startY: 0 };
  const pose = { attack: 0, bite: 0 };
  let score = 0;

  // Lift an arc's control point until every sample clears what it crosses,
  // except the last stretch into the robot, which is its clearing.
  function liftClear(p0, c, p1, skipEndMeters = 0) {
    let arc = makeArc(p0, c, p1);
    for (let pass = 0; pass < 3; pass++) {
      let deficit = 0;
      for (const [x, y, z] of arc.pts) {
        if (skipEndMeters && Math.hypot(x - p1[0], z - p1[2]) < skipEndMeters) continue;
        deficit = Math.max(deficit, obstacleFloor(x, z) + SWOOP.clearance - y);
      }
      if (deficit <= 0) break;
      c[1] += deficit * 1.5;
      arc = makeArc(p0, c, p1);
    }
    return arc;
  }
  function startAttack() {
    if (swoop.phase !== 'flying' || !target || !canHunt()) return false;
    const r = target;
    const p0 = [state.x, state.y, state.z],
      p1 = [r.x, r.y + r.height * 0.55, r.z];
    // hold the current line for the first part, then bend down onto the robot
    const fx = Math.sin(state.heading),
      fz = Math.cos(state.heading);
    const dist = Math.hypot(r.x - state.x, r.z - state.z);
    const c = [state.x + fx * dist * 0.5, state.y - (state.y - p1[1]) * 0.15, state.z + fz * dist * 0.5];
    swoop.arc = liftClear(p0, c, p1, CLEARING + 20);
    swoop.s = 0;
    swoop.speed = Math.max(40, Math.hypot(state.vy, 40));
    swoop.phase = 'diving';
    swoop.target = r;
    swoop.hit = false;
    swoop.startY = state.y;
    releaseSunward();
    ui.attackBtn.classList.add('busy');
    return true;
  }
  function startPullUp(r) {
    // a short pull out of the dive, just clear of the ground, and the player
    // has the gryphon back; the flight climbs on toward cruise from there
    const fx = Math.sin(state.heading),
      fz = Math.cos(state.heading);
    const p0 = [state.x, state.y, state.z];
    const groundEnd = heightAt(state.x + fx * SWOOP.pullAhead, state.z + fz * SWOOP.pullAhead);
    const endY = Math.max(groundEnd + SWOOP.pullRise, r.y + r.height + SWOOP.pullRise, state.y + 12);
    const p1 = [state.x + fx * SWOOP.pullAhead, endY, state.z + fz * SWOOP.pullAhead];
    const c = [state.x + fx * 45, state.y + (endY - state.y) * 0.05, state.z + fz * 45];
    swoop.arc = liftClear(p0, c, p1);
    swoop.s = 0;
    swoop.phase = 'pulling';
  }
  function handBack() {
    swoop.phase = 'flying';
    swoop.target = null;
    swoop.arc = null;
    state.aim = 0;
    state.aimHold = 0;
    state.steer = 0;
    state.nudgeYaw = 0;
    state.nudgeAlt = 0;
    state.flapBurst = 0;
    ui.attackBtn.classList.remove('busy');
  }
  function land(hit) {
    if (hit) {
      score++;
      ui.score.textContent = String(score);
      ui.score.classList.remove('bump');
      void ui.score.offsetWidth;
      ui.score.classList.add('bump');
      sound?.strike();
      if (score % CELEBRATE_EVERY === 0) celebrate();
    }
  }
  // Flies the gryphon along the current arc for one step: position from the
  // arc, heading and pitch from the direction of travel, bank from the turn.
  function drive(dt) {
    const arc = swoop.arc;
    if (!arc) return handBack();
    const pulling = swoop.phase === 'pulling';
    const speedTarget = pulling ? SWOOP.pullSpeed : SWOOP.speed;
    swoop.speed += (speedTarget - swoop.speed) * Math.min(1, dt * (pulling ? 0.8 : 2.5));
    const y0 = state.y;
    swoop.s = Math.min(arc.length, swoop.s + swoop.speed * dt);
    const [x, y, z] = arc.at(swoop.s);
    const [dx, dy, dz] = arc.tangent(swoop.s);
    const horiz = Math.hypot(dx, dz);
    const heading = horiz > 1e-6 ? Math.atan2(dx, dz) : state.heading;
    const pitch = Math.atan2(dy, Math.max(horiz, 1e-6)) * 1.15;
    // the turn rate from the curve itself, a little way ahead, so the bank
    // leads the turn and never chatters with the frame rate
    const [ax, , az] = arc.tangent(Math.min(arc.length, swoop.s + swoop.speed * 0.25));
    const headingAhead = Math.hypot(ax, az) > 1e-6 ? Math.atan2(ax, az) : heading;
    const turnRate = wrap(headingAhead - heading) / 0.25;
    state.x = x;
    state.y = y;
    state.z = z;
    state.vy = dt > 0 ? (y - y0) / dt : 0;
    state.heading = heading;
    state.pitch += (pitch - state.pitch) * Math.min(1, dt * 5);
    state.bank += (-clamp(turnRate, -1.4, 1.4) * 1.1 - state.bank) * Math.min(1, dt * 3);
    state.yawRate = 0;
    state.flapping = pulling; // wings beat on the way up, sweep back on the way down
    const r = swoop.target;
    if (!pulling) {
      const remaining = arc.length - swoop.s;
      if (swoop.phase === 'diving' && remaining < SWOOP.strikeAt) swoop.phase = 'striking';
      const near = Math.hypot(r.x - x, r.y + r.height * 0.55 - y, r.z - z);
      if (!swoop.hit && (near < SWOOP.reach || remaining <= 0)) {
        swoop.hit = true;
        if (!r.robot.destroyed) r.robot.hit();
        setTarget(null);
        land(true);
        startPullUp(r);
      }
    } else if (swoop.s >= arc.length || (swoop.s > 20 && playerSteering?.())) {
      // the pull-up is done, or the player took the stick: theirs again
      handBack();
    }
  }
  function cancelSwoop() {
    if (swoop.phase === 'flying') return;
    if (swoop.phase !== 'pulling') startPullUp(swoop.target ?? { y: state.y, height: 0 });
  }

  // --- screen --------------------------------------------------------------
  const ui = buildUi();
  function buildUi() {
    const root = document.createElement('div');
    root.id = 'hunt';
    root.innerHTML = `
      <div id="huntScore" aria-live="polite" title="Robots broken">🤖 <span id="huntCount">0</span></div>
      <div id="huntReticle" aria-hidden="true"><span>🤖</span></div>
      <button id="huntAttack" type="button" aria-label="Swoop and strike the robot">💥<small>SWOOP</small></button>
      <div id="huntCheer" aria-hidden="true"></div>`;
    document.body.appendChild(root);
    const attackBtn = root.querySelector('#huntAttack');
    attackBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startAttack();
    });
    attackBtn.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        startAttack();
      }
    });
    return {
      root,
      attackBtn,
      reticle: root.querySelector('#huntReticle'),
      score: root.querySelector('#huntCount'),
      cheer: root.querySelector('#huntCheer'),
    };
  }
  const _v = new THREE.Vector3();
  function updateScreen() {
    const shown = canHunt();
    ui.root.classList.toggle('on', shown);
    const r = swoop.phase === 'diving' || swoop.phase === 'striking' ? swoop.target : target;
    ui.attackBtn.disabled = !(shown && target && swoop.phase === 'flying');
    if (!shown || !r) {
      ui.reticle.classList.remove('on');
      return;
    }
    _v.set(r.x, r.y + r.height * 0.6, r.z).project(camera);
    const behind = _v.z > 1 || _v.z < -1;
    ui.reticle.classList.toggle('on', !behind);
    if (behind) return;
    const x = (_v.x * 0.5 + 0.5) * window.innerWidth,
      y = (-_v.y * 0.5 + 0.5) * window.innerHeight;
    ui.reticle.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    ui.reticle.classList.toggle('locked', swoop.phase !== 'flying');
  }
  let cheerTimer = 0;
  function celebrate() {
    ui.cheer.textContent = `⭐ ${score} ROBOTS! ⭐`;
    ui.cheer.classList.remove('on');
    void ui.cheer.offsetWidth;
    ui.cheer.classList.add('on');
    cheerTimer = 3;
    sound?.cheer();
  }

  // --- tick ----------------------------------------------------------------
  // Called from the engine's flight step every simulation step. Robots animate,
  // stream in and out, and the target is chosen; the swoop itself is flown by
  // `drive`, which the engine calls instead of its own flight while `driving`.
  function update(dt) {
    for (const [key, r] of live) {
      r.robot.update(dt);
      if (r.robot.finished) {
        r.robot.dispose();
        live.delete(key);
        defeated.add(key);
      }
    }
    if (cheerTimer > 0 && (cheerTimer -= dt) <= 0) ui.cheer.classList.remove('on');
    scanTimer -= dt;
    if (scanTimer <= 0) {
      scanTimer = 0.5;
      stream();
    }
    if (!canHunt()) {
      setTarget(null);
      cancelSwoop();
    } else if (swoop.phase === 'flying') pickTarget();
    else if (swoop.target && !live.has(swoop.target.key) && swoop.phase !== 'pulling') cancelSwoop();
    const talons = swoop.phase === 'striking' ? 1 : swoop.phase === 'diving' ? 0.3 : 0;
    pose.attack += (talons - pose.attack) * Math.min(1, dt * 7);
    pose.bite += ((swoop.phase === 'striking' ? 0.8 : 0) - pose.bite) * Math.min(1, dt * 7);
  }

  function dispose() {
    for (const r of live.values()) r.robot.dispose();
    live.clear();
    ui.root.remove();
  }

  return {
    update,
    drive,
    updateScreen,
    attack: startAttack,
    dispose,
    pose,
    get driving() {
      return swoop.phase !== 'flying';
    },
    get phase() {
      return swoop.phase;
    },
    get target() {
      return target;
    },
    get score() {
      return score;
    },
    get robots() {
      return live.size;
    },
    get defeated() {
      return defeated.size;
    },
    live,
  };
}
