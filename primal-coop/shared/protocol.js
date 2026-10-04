import { MAX_INPUT_BATCH } from './config.js';

export const EVENTS = Object.freeze({
  welcome: 'world:welcome',
  input: 'player:input',
  snapshot: 'world:snapshot',
  ping: 'world:ping',
});

export function validateJoin(auth) {
  if (!auth || typeof auth.room !== 'string' || typeof auth.name !== 'string') {
    throw new Error('Enter a hunter name and room code.');
  }
  const room = auth.room.trim().toUpperCase();
  const name = auth.name.trim();
  if (!/^[A-Z0-9-]{3,12}$/.test(room)) throw new Error('Room codes need 3–12 letters, numbers or hyphens.');
  if (name.length < 1 || name.length > 20 || /[\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Hunter names need 1–20 visible characters.');
  }
  return { room, name };
}

export function sanitizeBatch(batch, lastSequence) {
  if (!Array.isArray(batch) || batch.length < 1 || batch.length > MAX_INPUT_BATCH) return null;
  const commands = [];
  for (const raw of batch) {
    if (!raw || !Number.isSafeInteger(raw.seq) || raw.seq <= lastSequence) return null;
    if (raw.seq > lastSequence + 120) return null;
    if (!Number.isFinite(raw.yaw) || !Number.isFinite(raw.pitch)) return null;
    if (raw.forward !== -1 && raw.forward !== 0 && raw.forward !== 1) return null;
    if (raw.strafe !== -1 && raw.strafe !== 0 && raw.strafe !== 1) return null;
    if (typeof raw.sprint !== 'boolean' || typeof raw.jump !== 'boolean') return null;
    commands.push({
      seq: raw.seq,
      forward: raw.forward,
      strafe: raw.strafe,
      yaw: Math.atan2(Math.sin(raw.yaw), Math.cos(raw.yaw)),
      pitch: Math.max(-1.45, Math.min(1.45, raw.pitch)),
      sprint: raw.sprint,
      jump: raw.jump,
    });
    lastSequence = raw.seq;
  }
  return commands;
}
