import * as THREE from 'three';
import './styles.css';
import { createWorld } from '@shared/world.js';
import { FIXED_DT, INPUT_SEND_RATE, PLAYER } from '@shared/config.js';
import { buildWorld } from './world.js';
import { InputController } from './input.js';
import { PredictedPlayer } from './player.js';
import { RemotePlayers } from './avatars.js';
import { GameConnection } from './networking.js';
import { GameUI } from './ui.js';

const canvas = document.getElementById('world');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch {
  document.getElementById('join-error').textContent = 'This prototype needs a desktop browser with WebGL 2 and hardware acceleration enabled.';
  document.getElementById('join-error').hidden = false;
  document.getElementById('join-button').disabled = true;
  throw new Error('WebGL 2 unavailable.');
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const world = createWorld();
buildWorld(scene, world);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.06, 240);
camera.rotation.order = 'YXZ';
camera.position.set(17, 10, 19);
camera.lookAt(0, 0, -5);
const localPlayer = new PredictedPlayer(world);
const remotes = new RemotePlayers(scene);
let selfId = null;
let joined = false;
let accumulator = 0;
let sendAccumulator = 0;
let outbox = [];

async function lockMouse() {
  try { await input.lock(); }
  catch { if (joined) { ui.paused(true); ui.toast('Click Continue to capture your mouse.'); } }
}

const ui = new GameUI({
  onJoin(name, room) {
    ui.joining();
    connection.connect(name, room);
    // Request inside this click gesture; browsers may reject a request after the network handshake.
    lockMouse();
  },
  onResume() { if (connection.connected) lockMouse(); },
  onLeave() {
    connection.disconnect();
    joined = false;
    selfId = null;
    remotes.clear();
    input.clear();
    if (input.locked) document.exitPointerLock();
    outbox = [];
    accumulator = 0;
    ui.lobby();
    camera.position.set(17, 10, 19);
    camera.lookAt(0, 0, -5);
  },
});
const input = new InputController(canvas, locked => { if (joined) ui.paused(!locked); });
const connection = new GameConnection({
  onWelcome(data) {
    const self = data.snapshot.players.find(player => player.id === data.id);
    if (!self || data.seed !== world.seed) {
      connection.disconnect();
      ui.error('The client and server world differ. Reload the page.');
      if (input.locked) document.exitPointerLock();
      return;
    }
    selfId = data.id;
    joined = true;
    accumulator = 0;
    sendAccumulator = 0;
    outbox = [];
    localPlayer.reset(self);
    input.clear();
    input.yaw = self.yaw;
    input.pitch = self.pitch;
    remotes.clear();
    remotes.receive(data.snapshot, selfId);
    ui.joined(data.room);
    ui.snapshot(data.snapshot, selfId);
    ui.paused(!input.locked);
  },
  onSnapshot(snapshot) {
    if (!joined) return;
    const self = snapshot.players.find(player => player.id === selfId);
    if (self) localPlayer.reconcile(self);
    remotes.receive(snapshot, selfId);
    ui.snapshot(snapshot, selfId);
  },
  onDisconnect() {
    outbox = [];
    remotes.clear();
    input.clear();
    if (input.locked) document.exitPointerLock();
    ui.connection(false);
    if (joined) ui.paused(true);
  },
  onError(message) {
    if (joined) { ui.connection(false); ui.toast(message); }
    else { ui.error(message); if (input.locked) document.exitPointerLock(); }
  },
  onLatency(latency) { ui.metrics(undefined, latency); },
});

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
let lastFrame = performance.now();
let fpsStarted = lastFrame;
let frames = 0;
renderer.setAnimationLoop(now => {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  frames++;
  if (now - fpsStarted > 1000) {
    ui.metrics(Math.round(frames * 1000 / (now - fpsStarted)));
    fpsStarted = now;
    frames = 0;
  }
  if (joined && connection.connected) {
    accumulator += dt;
    sendAccumulator += dt;
    let latestInput;
    while (accumulator >= FIXED_DT) {
      latestInput = input.read();
      outbox.push(localPlayer.step(latestInput));
      accumulator -= FIXED_DT;
    }
    if (sendAccumulator >= 1 / INPUT_SEND_RATE) {
      connection.send(outbox);
      outbox = [];
      sendAccumulator %= 1 / INPUT_SEND_RATE;
    }
    // A prolonged network stall gets a fresh spawn and input history on reconnect.
    if (localPlayer.pending.length > 240) {
      connection.socket.disconnect();
      connection.socket.connect();
    }
    localPlayer.updateVisual(dt);
    const position = localPlayer.visualPosition;
    camera.position.set(position.x, position.y + PLAYER.eyeHeight, position.z);
    camera.rotation.set(input.pitch, input.yaw, 0, 'YXZ');
    if (latestInput) ui.movement(localPlayer.state, latestInput.sprint && (latestInput.forward !== 0 || latestInput.strafe !== 0));
  }
  remotes.update(now);
  renderer.render(scene, camera);
});

if (import.meta.hot) import.meta.hot.dispose(() => {
  connection.disconnect();
  input.destroy();
  remotes.clear();
  renderer.setAnimationLoop(null);
  renderer.dispose();
  window.removeEventListener('resize', resize);
  location.reload();
});
