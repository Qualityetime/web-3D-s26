import test from 'node:test';
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { createGameServer } from '../server/app.js';
import { EVENTS } from '../shared/protocol.js';
import { neutralInput } from '../shared/movement.js';

async function join(url, name, room = 'BONES') {
  const socket = io(url, { auth: { name, room }, autoConnect: false, reconnection: false, forceNew: true, transports: ['websocket'] });
  const welcome = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.disconnect(); reject(new Error('Join timed out')); }, 4000);
    socket.once(EVENTS.welcome, data => { clearTimeout(timer); resolve(data); });
    socket.once('connect_error', error => { clearTimeout(timer); socket.disconnect(); reject(error); });
    socket.connect();
  });
  return { socket, welcome };
}

function waitForSnapshot(socket, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(EVENTS.snapshot, listener); reject(new Error('Snapshot timed out')); }, 4000);
    function listener(snapshot) {
      if (!predicate(snapshot)) return;
      clearTimeout(timer);
      socket.off(EVENTS.snapshot, listener);
      resolve(snapshot);
    }
    socket.on(EVENTS.snapshot, listener);
  });
}

test('two real clients synchronize, rooms isolate players, and leaving frees a slot', async t => {
  const server = await createGameServer({ serveClient: false });
  const address = await server.listen(0, '127.0.0.1');
  const url = `http://127.0.0.1:${address.port}`;
  const sockets = [];
  t.after(async () => { for (const socket of sockets) socket.disconnect(); await server.close(); });
  const health = await (await fetch(`${url}/health`)).json();
  assert.equal(health.ok, true);
  const alice = await join(url, 'Hunter A');
  sockets.push(alice.socket);
  const bob = await join(url, 'Hunter B');
  sockets.push(bob.socket);
  assert.equal(bob.welcome.snapshot.players.length, 2);
  assert.notEqual(alice.welcome.id, bob.welcome.id);
  assert.notEqual(alice.welcome.snapshot.players[0].x, bob.welcome.snapshot.players.find(p => p.id === bob.welcome.id).x);
  await assert.rejects(join(url, 'Third Hunter'), /room is full/);
  const outsider = await join(url, 'Other World', 'STONE');
  sockets.push(outsider.socket);
  assert.equal(outsider.welcome.snapshot.players.length, 1);

  const movement = waitForSnapshot(bob.socket, snapshot => snapshot.players.some(p => p.id === alice.welcome.id && p.ack >= 8));
  alice.socket.emit(EVENTS.input, Array.from({ length: 8 }, (_, i) => ({ ...neutralInput(), forward: 1, seq: i + 1 })));
  const afterMovement = await movement;
  const moved = afterMovement.players.find(p => p.id === alice.welcome.id);
  assert.ok(moved.z < 5, 'second client must see first client move');
  assert.ok(afterMovement.players.every(p => p.name !== 'Other World'));
  const isolated = await waitForSnapshot(outsider.socket, snapshot => snapshot.players.length === 1);
  assert.equal(isolated.players[0].id, outsider.welcome.id);

  const leaving = waitForSnapshot(bob.socket, snapshot => snapshot.players.length === 1);
  alice.socket.disconnect();
  await leaving;
  const replacement = await join(url, 'Replacement');
  sockets.push(replacement.socket);
  assert.equal(replacement.welcome.snapshot.players.length, 2);
  assert.equal(replacement.welcome.snapshot.players.find(p => p.id === replacement.welcome.id).slot, 0);
});

test('invalid handshakes cannot create a room, and empty rooms are cleaned up', async t => {
  const server = await createGameServer({ serveClient: false });
  const address = await server.listen(0, '127.0.0.1');
  const url = `http://127.0.0.1:${address.port}`;
  t.after(async () => { await server.close(); });
  await assert.rejects(join(url, 'Hunter', '../../oops'), /Room codes/);
  assert.equal(server.game.rooms.size, 0);
  const hunter = await join(url, 'Hunter');
  hunter.socket.disconnect();
  await new Promise(resolve => setTimeout(resolve, 80));
  assert.equal(server.game.rooms.size, 0);
});
