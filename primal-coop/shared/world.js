// Deterministic primitives: identical trees, rocks and collision data everywhere.
export const WORLD_SIZE = 72;
export const WORLD_SEED = 71931;
export const SPAWNS = [
  { x: -2, y: 0, z: 5, yaw: 0 },
  { x: 2, y: 0, z: 5, yaw: 0 },
];

function randomFromSeed(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(seed = WORLD_SEED) {
  const random = randomFromSeed(seed);
  const trees = [];
  const rocks = [];
  const obstacles = [];
  const occupied = [];
  const halfSize = WORLD_SIZE / 2;

  function place(radius, clearance) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = (random() - 0.5) * (WORLD_SIZE - 8);
      const z = (random() - 0.5) * (WORLD_SIZE - 8);
      if (Math.hypot(x, z) < 10) continue; // Spawn clearing.
      if (occupied.some(p => Math.hypot(x - p.x, z - p.z) < p.radius + clearance)) continue;
      occupied.push({ x, z, radius });
      return { x, z };
    }
    return null;
  }

  for (let i = 0; i < 64; i++) {
    const radius = 0.24 + random() * 0.16;
    const position = place(radius, 2.4);
    if (!position) continue;
    trees.push({ ...position, radius, height: 5.5 + random() * 4.5, shade: random() });
    obstacles.push({ ...position, radius });
  }
  for (let i = 0; i < 16; i++) {
    const radius = 0.65 + random() * 0.65;
    const position = place(radius, 2.0);
    if (!position) continue;
    rocks.push({ ...position, radius, height: 0.9 + random() * 1.1, rotation: random() * Math.PI });
    obstacles.push({ ...position, radius });
  }

  // Three stone markers in the clearing make distance and collisions easy to test.
  const markers = [
    { x: -6, z: -6, radius: 0.8, height: 2.8 },
    { x: 0, z: -9, radius: 0.8, height: 3.8 },
    { x: 6, z: -6, radius: 0.8, height: 2.8 },
  ];
  obstacles.push(...markers.map(({ x, z, radius }) => ({ x, z, radius })));
  return { seed, halfSize, trees, rocks, markers, obstacles, spawns: SPAWNS };
}
