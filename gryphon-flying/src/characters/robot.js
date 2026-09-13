// Toy-like robot, +Y up, +Z forward. Origin is at its feet.
// hit() is deliberately one-hit destruction; targeting/damage authority is external.
export function createRobot(THREE, options = {}) {
  const root = new THREE.Group();
  root.name = 'Robot';
  const geometries = new Set();
  const materials = new Set();
  const colors = { shell: 0x6faaa7, dark: 0x384650, face: 0xd5e5dc,
    accent: 0xdfb15f, ...options.colors };
  const makeMaterial = options.materialFactory ||
    ((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.15 }));
  const palette = {};
  for (const [key, color] of Object.entries(colors)) {
    palette[key] = makeMaterial(color);
    materials.add(palette[key]);
  }
  const box = new THREE.BoxGeometry(1, 1, 1);
  const sphere = new THREE.SphereGeometry(1, 10, 6);
  geometries.add(box);
  geometries.add(sphere);
  const chunks = [];
  function chunk(name, x, y, z) {
    const part = new THREE.Group();
    part.name = name;
    part.position.set(x, y, z);
    root.add(part);
    chunks.push({ part, rest: part.position.clone(), velocity: new THREE.Vector3(),
      spin: new THREE.Vector3() });
    return part;
  }
  function mesh(parent, shape, color, x, y, z, sx, sy, sz) {
    const part = new THREE.Mesh(shape, palette[color]);
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    part.castShadow = true;
    part.receiveShadow = true;
    parent.add(part);
    return part;
  }
  const torso = chunk('torso', 0, 1.12, 0);
  mesh(torso, box, 'shell', 0, 0, 0, 0.9, 0.8, 0.58);
  mesh(torso, box, 'accent', 0, 0.02, 0.31, 0.3, 0.2, 0.05);
  const head = chunk('head', 0, 1.86, 0);
  mesh(head, box, 'shell', 0, 0, 0, 0.84, 0.57, 0.65);
  mesh(head, box, 'dark', 0, 0, 0.34, 0.65, 0.32, 0.05);
  for (const side of [-1, 1]) {
    mesh(head, sphere, 'face', side * 0.17, 0.035, 0.385, 0.07, 0.09, 0.03);
    const arm = chunk(`arm${side}`, side * 0.65, 1.34, 0);
    mesh(arm, sphere, 'dark', 0, 0, 0, 0.16, 0.16, 0.16);
    mesh(arm, box, 'shell', 0, -0.26, 0, 0.25, 0.4, 0.28);
    mesh(arm, sphere, 'accent', 0, -0.5, 0.03, 0.19, 0.17, 0.2);
    const leg = chunk(`leg${side}`, side * 0.26, 0.57, 0);
    mesh(leg, box, 'dark', 0, -0.12, 0, 0.22, 0.34, 0.25);
    mesh(leg, box, 'shell', 0, -0.42, 0.09, 0.34, 0.3, 0.48);
  }
  mesh(head, box, 'dark', 0, 0.39, 0, 0.06, 0.23, 0.06);
  mesh(head, sphere, 'accent', 0, 0.53, 0, 0.1, 0.1, 0.1);
  // Geometry highlight, without transparent materials or extra lighting passes.
  const ringGeometry = new THREE.TorusGeometry(0.94, 0.045, 6, 32);
  geometries.add(ringGeometry);
  const ring = new THREE.Mesh(ringGeometry, palette.accent);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.055;
  ring.visible = false;
  root.add(ring);
  let age = 0;
  let deathAge = 0;
  let dead = false;
  let disposed = false;
  const lifetime = 1.4;
  function setTargeted(value) { ring.visible = Boolean(value) && !dead && !disposed; }
  function hit() {
    if (dead || disposed) return false;
    dead = true;
    ring.visible = false;
    chunks.forEach((record, i) => {
      const angle = i * 2.399963;
      record.velocity.set(Math.cos(angle) * 2.2, 3.5 + (i % 3) * 0.65, Math.sin(angle) * 2.2);
      record.spin.set((i % 2 ? 1 : -1) * 3, 2 + i * 0.2, 1.5);
    });
    return true;
  }
  function update(dt) {
    if (disposed || !Number.isFinite(dt) || dt < 0) return;
    age += dt;
    if (!dead) {
      chunks.forEach(({ part, rest }, i) => {
        part.position.copy(rest);
        if (part.name === 'head' || part.name === 'torso') part.position.y += Math.sin(age * 2.4) * 0.025;
        if (part.name.startsWith('arm')) part.rotation.x = Math.sin(age * 2.4 + i) * 0.12;
      });
      ring.scale.setScalar(1 + Math.sin(age * 5) * 0.045);
      return;
    }
    // Small steps keep the visual burst stable when a frame stalls.
    let remaining = Math.min(dt, Math.max(0, lifetime - deathAge));
    while (remaining > 0) {
      const step = Math.min(remaining, 1 / 60);
      deathAge += step;
      remaining -= step;
      for (const { part, velocity, spin } of chunks) {
        velocity.y -= 9.8 * step;
        part.position.addScaledVector(velocity, step);
        part.rotation.x += spin.x * step;
        part.rotation.y += spin.y * step;
        part.rotation.z += spin.z * step;
        // Stylized local floor only; the integrator can replace with terrain collision.
        if (part.position.y < 0.25) {
          part.position.y = 0.25;
          velocity.y = Math.abs(velocity.y) * 0.3;
          velocity.x *= 0.8;
          velocity.z *= 0.8;
        }
        part.scale.setScalar(Math.max(0, 1 - Math.max(0, deathAge - 0.85) / 0.55));
      }
    }
    if (deathAge >= lifetime - 1e-8) { deathAge = lifetime; root.visible = false; }
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    root.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    if (!options.materialFactory) for (const material of materials) material.dispose();
  }
  return { root, update, hit, setTargeted, dispose,
    get destroyed() { return dead; },
    get finished() { return dead && deathAge >= lifetime; },
    dimensions: { height: 2.5, radius: 0.9 } };
}
