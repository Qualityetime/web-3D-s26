import * as THREE from 'three';
import { INTERPOLATION_MS, PLAYER } from '@shared/config.js';

function nameSprite(name) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10231bc9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '600 35px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e4ecdc';
  ctx.fillText(name, 256, 48, 480);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: true, transparent: true }));
  sprite.scale.set(2.8, 0.525, 1);
  sprite.position.y = 2.45;
  return sprite;
}

function createAvatar(player) {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: player.color, roughness: 0.88 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(PLAYER.radius, 0.85, 4, 8), material);
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), new THREE.MeshStandardMaterial({ color: 0xcab58d, roughness: 1 }));
  head.position.y = 1.58;
  head.castShadow = true;
  group.add(head);
  // A dark face mark shows which way the other hunter is looking.
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.075, 0.06), new THREE.MeshStandardMaterial({ color: 0x263a2a }));
  face.position.set(0, 1.63, -0.235);
  group.add(face, nameSprite(player.name));
  return group;
}

export class RemotePlayers {
  constructor(scene) { this.scene = scene; this.players = new Map(); }

  receive(snapshot, selfId, receivedAt = performance.now()) {
    const present = new Set();
    for (const player of snapshot.players) {
      if (player.id === selfId) continue;
      present.add(player.id);
      let remote = this.players.get(player.id);
      if (!remote) {
        remote = { mesh: createAvatar(player), samples: [] };
        remote.mesh.position.set(player.x, player.y, player.z);
        remote.mesh.rotation.y = player.yaw;
        this.scene.add(remote.mesh);
        this.players.set(player.id, remote);
      }
      remote.samples.push({ ...player, receivedAt });
      if (remote.samples.length > 20) remote.samples.shift();
    }
    for (const id of this.players.keys()) if (!present.has(id)) this.remove(id);
  }

  update(now) {
    const target = now - INTERPOLATION_MS;
    for (const remote of this.players.values()) {
      const samples = remote.samples;
      while (samples.length > 2 && samples[1].receivedAt <= target) samples.shift();
      const a = samples[0];
      const b = samples[1] ?? a;
      if (!a) continue;
      const duration = b.receivedAt - a.receivedAt;
      const t = duration > 0 ? THREE.MathUtils.clamp((target - a.receivedAt) / duration, 0, 1) : 1;
      remote.mesh.position.set(
        THREE.MathUtils.lerp(a.x, b.x, t),
        THREE.MathUtils.lerp(a.y, b.y, t),
        THREE.MathUtils.lerp(a.z, b.z, t),
      );
      const yawDelta = Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw));
      remote.mesh.rotation.y = a.yaw + yawDelta * t;
    }
  }

  remove(id) {
    const remote = this.players.get(id);
    if (!remote) return;
    this.scene.remove(remote.mesh);
    remote.mesh.traverse(object => {
      object.geometry?.dispose();
      if (object.material) { object.material.map?.dispose(); object.material.dispose(); }
    });
    this.players.delete(id);
  }
  clear() { for (const id of this.players.keys()) this.remove(id); }
}
