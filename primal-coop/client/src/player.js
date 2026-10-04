import { createPlayerState, stepPlayer } from '@shared/movement.js';

export class PredictedPlayer {
  constructor(world) {
    this.world = world;
    this.state = createPlayerState(world.spawns[0]);
    this.pending = [];
    this.sequence = 0;
    this.correction = { x: 0, y: 0, z: 0 };
  }

  reset(authoritative) {
    this.state = { ...authoritative };
    this.sequence = 0;
    this.pending = [];
    this.correction = { x: 0, y: 0, z: 0 };
  }

  step(input) {
    const command = { ...input, seq: ++this.sequence };
    stepPlayer(this.state, command, this.world);
    this.pending.push(command);
    return command;
  }

  reconcile(authoritative) {
    const before = { ...this.state };
    this.pending = this.pending.filter(command => command.seq > authoritative.ack);
    this.state = { ...authoritative };
    for (const command of this.pending) stepPlayer(this.state, command, this.world);
    const error = Math.hypot(before.x - this.state.x, before.y - this.state.y, before.z - this.state.z);
    if (error > 3) {
      this.correction = { x: 0, y: 0, z: 0 };
    } else {
      for (const axis of ['x', 'y', 'z']) this.correction[axis] += before[axis] - this.state[axis];
    }
  }

  updateVisual(dt) {
    const decay = Math.exp(-18 * dt);
    for (const axis of ['x', 'y', 'z']) this.correction[axis] *= decay;
  }

  get visualPosition() {
    return { x: this.state.x + this.correction.x, y: this.state.y + this.correction.y, z: this.state.z + this.correction.z };
  }
}
