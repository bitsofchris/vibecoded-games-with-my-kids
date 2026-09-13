// Three.js namespace is injected: pass the game's existing THREE import.
// Local axes: +Y up, +Z forward. Root position/rotation belong to the game.
export function createGryphon(THREE, options = {}) {
  const root = new THREE.Group();
  root.name = 'Gryphon';
  root.rotation.order = 'YXZ';

  const geometries = new Set();
  const materials = new Set();

  const colors = {
    fur: 0xb98948,
    belly: 0xe3c589,
    feather: 0xede7d5,
    wing: 0xc9bda0,
    tip: 0x726653,
    beak: 0xe5ad42,
    claw: 0x454047,
    eye: 0x26313b,
    ...options.colors,
  };

  const makeMaterial =
    options.materialFactory ||
    ((color) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.85,
      }));

  const palette = {};

  for (const [key, color] of Object.entries(colors)) {
    palette[key] = makeMaterial(color);
    materials.add(palette[key]);
  }

  function joint(parent, name, x, y, z) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(x, y, z);
    parent.add(group);
    return group;
  }

  function mesh(
    parent,
    geometry,
    material,
    x,
    y,
    z,
    sx = 1,
    sy = 1,
    sz = 1,
  ) {
    geometries.add(geometry);

    const part = new THREE.Mesh(geometry, palette[material]);
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    part.castShadow = true;
    part.receiveShadow = true;

    parent.add(part);
    return part;
  }

  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const cone = new THREE.ConeGeometry(1, 1, 6);

  const ball = (parent, color, x, y, z, sx, sy, sz) =>
    mesh(parent, sphere, color, x, y, z, sx, sy, sz);

  const body = joint(root, 'body', 0, 0, 0);

  ball(body, 'fur', 0, 0, -0.25, 0.69, 0.68, 1.35);
  ball(body, 'belly', 0, -0.29, 0.12, 0.55, 0.4, 0.93);
  ball(body, 'feather', 0, 0.24, 0.75, 0.74, 0.8, 0.77);

  // Layered neck ruff gives the eagle/lion transition a clear silhouette.
  for (let i = 0; i < 9; i++) {
    const angle = (i * Math.PI * 2) / 9;

    const feather = ball(
      body,
      'feather',
      Math.sin(angle) * 0.56,
      0.22 + Math.cos(angle) * 0.6,
      0.38,
      0.17,
      0.2,
      0.52,
    );

    feather.rotation.z = -angle;
  }

  const head = joint(body, 'head', 0, 0.71, 1.02);

  ball(head, 'feather', 0, 0.11, 0.19, 0.46, 0.46, 0.57);
  ball(head, 'beak', 0, -0.04, 0.69, 0.28, 0.19, 0.36);

  mesh(
    head,
    cone,
    'beak',
    0,
    -0.17,
    0.9,
    0.14,
    0.32,
    0.18,
  ).rotation.x = Math.PI;

  const jaw = joint(head, 'jaw', 0, -0.15, 0.4);
  ball(jaw, 'beak', 0, -0.055, 0.27, 0.21, 0.075, 0.31);

  for (const side of [-1, 1]) {
    ball(
      head,
      'eye',
      side * 0.39,
      0.2,
      0.43,
      0.075,
      0.09,
      0.085,
    );

    ball(
      head,
      'feather',
      side * 0.32,
      0.49,
      -0.06,
      0.12,
      0.29,
      0.17,
    ).rotation.z = side * -0.35;
  }

  const legs = [];

  for (const front of [true, false]) {
    for (const side of [-1, 1]) {
      const leg = joint(
        body,
        `${front ? 'front' : 'hind'}Leg${side}`,
        side * 0.47,
        -0.4,
        front ? 0.67 : -1.02,
      );

      ball(
        leg,
        front ? 'feather' : 'fur',
        0,
        -0.28,
        0,
        0.22,
        0.43,
        0.25,
      );

      ball(
        leg,
        front ? 'beak' : 'fur',
        0,
        -0.64,
        0.08,
        0.14,
        0.27,
        0.17,
      );

      ball(
        leg,
        front ? 'beak' : 'belly',
        0,
        -0.82,
        0.22,
        0.24,
        0.13,
        0.33,
      );

      for (let toe = -1; toe <= 1; toe++) {
        mesh(
          leg,
          cone,
          'claw',
          toe * 0.14,
          -0.85,
          0.51,
          0.06,
          0.24,
          0.06,
        ).rotation.x = Math.PI / 2;
      }

      legs.push({ joint: leg, front });
    }
  }

  const tail = joint(body, 'tail', 0, -0.04, -1.37);
  ball(tail, 'fur', 0, 0.03, -0.48, 0.1, 0.11, 0.59);

  const tailTip = joint(tail, 'tailTip', 0, 0.05, -0.97);
  ball(tailTip, 'fur', 0, 0.1, -0.29, 0.09, 0.1, 0.4);
  ball(tailTip, 'tip', 0, 0.12, -0.65, 0.2, 0.18, 0.3);

  const wings = [];

  for (const side of [-1, 1]) {
    const shoulder = joint(
      body,
      `wing${side}`,
      side * 0.52,
      0.46,
      0.33,
    );

    const elbow = joint(
      shoulder,
      'elbow',
      side * 1.25,
      0,
      -0.08,
    );

    const wrist = joint(
      elbow,
      'wrist',
      side * 1.05,
      0,
      -0.12,
    );

    const pivots = [shoulder, elbow, wrist];

    for (let segment = 0; segment < 3; segment++) {
      const length = [1.25, 1.05, 0.95][segment];

      ball(
        pivots[segment],
        'feather',
        side * length * 0.48,
        0,
        0,
        length * 0.61,
        0.12,
        0.35,
      );

      for (let featherIndex = 0; featherIndex < 6; featherIndex++) {
        const feather = ball(
          pivots[segment],
          segment === 2 ? 'tip' : 'wing',
          side * (0.12 + (featherIndex * length) / 6),
          -0.035,
          -0.37 - segment * 0.1,
          0.14,
          0.045,
          0.49 + segment * 0.13 - featherIndex * 0.024,
        );

        feather.rotation.y =
          side * (0.08 + featherIndex * 0.07);
      }
    }

    wings.push({ side, pivots });
  }

  let phase = 0;
  let disposed = false;

  const clamp = (value) => Math.max(0, Math.min(1, value));

  function update(dt, pose = {}) {
    if (disposed || !Number.isFinite(dt) || dt < 0) {
      return;
    }

    // These pose values can be blended during an assisted attack timeline.
    const flap = clamp(pose.flap ?? 0.65);
    const dive = clamp(pose.dive ?? 0);
    const attack = clamp(pose.attack ?? 0);
    const grounded = clamp(pose.grounded ?? 0);
    const bite = clamp(pose.bite ?? 0);

    phase += dt * (2 + flap * 7);

    for (const { side, pivots } of wings) {
      for (let i = 0; i < pivots.length; i++) {
        const wave =
          Math.sin(phase - i * 0.65) *
          (0.035 + flap * 0.48) *
          (1 - grounded);

        pivots[i].rotation.z =
          side *
          (
            0.08 +
            wave * (1 - dive) +
            grounded * (0.4 + i * 0.2)
          );

        pivots[i].rotation.y =
          side *
          (
            dive * (0.4 + i * 0.25) +
            grounded * 0.5
          );
      }
    }

    for (const leg of legs) {
      // During attack all four legs swing forward, talons leading, the way a
      // raptor's do in the last moment of a strike.
      leg.joint.rotation.x =
        (1 - grounded) *
        (
          leg.front
            ? 0.65 - attack * 2.1
            : 0.95 - attack * 1.5
        );
    }

    // The strike rears the body up around the root, so the talons lead the
    // way in and the wings brake behind them; the root's own pitch is the
    // flight's.
    body.rotation.x = -attack * 0.5;

    jaw.rotation.x = bite * 0.65;
    head.rotation.x = -dive * 0.15 + bite * 0.08 + attack * 0.35;

    tail.rotation.y = Math.sin(phase * 0.3) * 0.16;

    tailTip.rotation.x =
      -0.25 + Math.sin(phase * 0.3 + 0.7) * 0.14;
  }

  function dispose() {
    if (disposed) {
      return;
    }

    disposed = true;
    root.removeFromParent();

    for (const geometry of geometries) {
      geometry.dispose();
    }

    // Injected materials belong to the caller.
    if (!options.materialFactory) {
      for (const material of materials) {
        material.dispose();
      }
    }
  }

  update(0);

  return {
    root,
    update,
    dispose,

    joints: {
      body,
      head,
      jaw,
      legs,
      wings,
      tail,
    },

    dimensions: {
      wingspan: 8,
      standingHeight: 2.9,
      footOffset: 1.4,
    },
  };
}