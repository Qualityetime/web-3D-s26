import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER } from '../shared/config.js';
import { createPlayerState, neutralInput, stepPlayer } from '../shared/movement.js';
import { createWorld } from '../shared/world.js';
import { GameState } from '../server/gameState.js';

const openWorld = { halfSize: 100, obstacles: [] };
const command = changes => ({ ...neutralInput(), seq: 1, ...changes });

test('walking, sprinting and diagonal movement use the intended speeds', () => {
  for (const [input, speed] of [
    [command({ forward: 1 }), PLAYER.walkSpeed],
    [command({ forward: 1, sprint: true }), PLAYER.sprintSpeed],
    [command({ forward: 1, strafe: 1 }), PLAYER.walkSpeed],
  ]) {
    const state = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
    for (let i = 0; i < 60; i++) stepPlayer(state, input, openWorld);
    assert.ok(Math.abs(Math.hypot(state.x, state.z) - speed) < 1e-8);
  }
});

test('jumping leaves the ground, rejects an air jump and lands', () => {
  const state = createPlayerState({ x: 0, y: 0, z: 0, yaw: 0 });
  stepPlayer(state, command({ jump: true }), openWorld);
  assert.ok(state.y > 0);
  assert.equal(state.grounded, false);
  const initialVelocity = state.vy;
  stepPlayer(state, command({ jump: true }), openWorld);
  assert.ok(state.vy < initialVelocity, 'air jump must not reset velocity');
  for (let i = 0; i < 100; i++) stepPlayer(state, neutralInput(), openWorld);
  assert.equal(state.y, 0);
  assert.equal(state.vy, 0);
  assert.equal(state.grounded, true);
});

test('tree collision and world limits stop sprinting players', () => {
  const world = { halfSize: 10, obstacles: [{ x: 0, z: 0, radius: 0.8 }] };
  const state = createPlayerState({ x: 0, y: 0, z: 3, yaw: 0 });
  for (let i = 0; i < 120; i++) stepPlayer(state, command({ forward: 1, sprint: true }), world);
  assert.ok(Math.hypot(state.x, state.z) >= 0.8 + PLAYER.radius - 1e-8);
  assert.ok(state.z > 0, 'player must not pass through the obstacle');
  const boundary = createPlayerState({ x: 9, y: 0, z: 4, yaw: 0 });
  for (let i = 0; i < 120; i++) stepPlayer(boundary, command({ strafe: 1, sprint: true }), world);
  assert.ok(boundary.x <= world.halfSize - PLAYER.radius);
});

test('world generation is identical for client and server and clears the spawns', () => {
  const world = createWorld();
  assert.deepEqual(createWorld(world.seed), world);
  assert.ok(world.trees.length > 50);
  for (const spawn of world.spawns) {
    for (const obstacle of world.obstacles) {
      assert.ok(Math.hypot(spawn.x - obstacle.x, spawn.z - obstacle.z) > obstacle.radius + PLAYER.radius);
    }
  }
});

test('input flooding cannot simulate more than one movement step per server tick', () => {
  const game = new GameState();
  const player = game.addPlayer('hunter', { room: 'BONES', name: 'Hunter' });
  const origin = { ...player.state };
  let seq = 0;
  for (let batch = 0; batch < 12; batch++) {
    game.receiveInput('hunter', 'BONES', Array.from({ length: 8 }, () => command({ seq: ++seq, forward: 1, sprint: true, x: 999, dt: 99 })), 100);
  }
  assert.ok(player.queue.length <= 30);
  game.step(100);
  const distance = Math.hypot(player.state.x - origin.x, player.state.z - origin.z);
  assert.ok(distance <= PLAYER.sprintSpeed / 60 + 1e-8);
  assert.ok(player.state.x !== 999);
});

test('stale input stops moving a player, while gravity still runs', () => {
  const game = new GameState();
  const player = game.addPlayer('hunter', { room: 'BONES', name: 'Hunter' });
  game.receiveInput('hunter', 'BONES', [command({ jump: true, forward: 1 })], 100);
  game.step(100);
  const z = player.state.z;
  for (let i = 0; i < 100; i++) game.step(1000);
  assert.equal(player.state.z, z);
  assert.equal(player.state.grounded, true);
});
