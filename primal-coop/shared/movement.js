import { FIXED_DT, PLAYER } from './config.js';

export function createPlayerState(spawn) {
  return { x: spawn.x, y: spawn.y, z: spawn.z, vy: 0, yaw: spawn.yaw, pitch: 0, grounded: true };
}

export function neutralInput(yaw = 0, pitch = 0) {
  return { forward: 0, strafe: 0, yaw, pitch, sprint: false, jump: false };
}

function resolveObstacles(state, world) {
  const limit = world.halfSize - PLAYER.radius;
  for (let iteration = 0; iteration < 3; iteration++) {
    state.x = Math.max(-limit, Math.min(limit, state.x));
    state.z = Math.max(-limit, Math.min(limit, state.z));
    for (const obstacle of world.obstacles) {
      const dx = state.x - obstacle.x;
      const dz = state.z - obstacle.z;
      const distance = Math.hypot(dx, dz);
      const minimum = PLAYER.radius + obstacle.radius;
      if (distance >= minimum) continue;
      if (distance < 0.00001) {
        state.x = obstacle.x + minimum;
      } else {
        const overlap = minimum - distance;
        state.x += (dx / distance) * overlap;
        state.z += (dz / distance) * overlap;
      }
    }
  }
  state.x = Math.max(-limit, Math.min(limit, state.x));
  state.z = Math.max(-limit, Math.min(limit, state.z));
}

// Fixed timestep; a packet cannot supply its own duration or position.
// y is the player's feet. Static obstacles block horizontally at all heights.
export function stepPlayer(state, input, world, dt = FIXED_DT) {
  state.yaw = input.yaw;
  state.pitch = input.pitch;
  const magnitude = Math.hypot(input.forward, input.strafe);
  const forward = input.forward / Math.max(1, magnitude);
  const strafe = input.strafe / Math.max(1, magnitude);
  const speed = input.sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
  const dx = (-Math.sin(input.yaw) * forward + Math.cos(input.yaw) * strafe) * speed * dt;
  const dz = (-Math.cos(input.yaw) * forward - Math.sin(input.yaw) * strafe) * speed * dt;

  // Substeps prevent fast movement from tunnelling through thin tree trunks.
  const substeps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / (PLAYER.radius * 0.5)));
  for (let i = 0; i < substeps; i++) {
    state.x += dx / substeps;
    state.z += dz / substeps;
    resolveObstacles(state, world);
  }
  if (input.jump && state.grounded) {
    state.vy = PLAYER.jumpSpeed;
    state.grounded = false;
  }
  if (!state.grounded) {
    state.vy -= PLAYER.gravity * dt;
    state.y += state.vy * dt;
    if (state.y <= 0) {
      state.y = 0;
      state.vy = 0;
      state.grounded = true;
    }
  }
  return state;
}
