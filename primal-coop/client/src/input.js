export class InputController {
  constructor(canvas, onLockChange) {
    this.canvas = canvas;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.jumpQueued = false;
    this.onLockChange = onLockChange;
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    document.addEventListener('keydown', event => {
      if (!this.locked) return;
      if (event.code === 'Escape') {
        this.clear();
        document.exitPointerLock();
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.jumpQueued = true;
    }, options);
    document.addEventListener('keyup', event => this.keys.delete(event.code), options);
    document.addEventListener('mousemove', event => {
      if (!this.locked) return;
      this.yaw -= event.movementX * 0.0022;
      this.yaw = Math.atan2(Math.sin(this.yaw), Math.cos(this.yaw));
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - event.movementY * 0.0022));
    }, options);
    document.addEventListener('pointerlockchange', () => {
      this.clear();
      this.onLockChange(this.locked);
    }, options);
    window.addEventListener('blur', () => {
      this.clear();
      if (this.locked) document.exitPointerLock();
    }, options);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clear();
        if (this.locked) document.exitPointerLock();
      }
    }, options);
  }

  get locked() { return document.pointerLockElement === this.canvas; }
  async lock() { await this.canvas.requestPointerLock(); }
  clear() { this.keys.clear(); this.jumpQueued = false; }
  read() {
    const input = {
      forward: this.locked ? Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS')) : 0,
      strafe: this.locked ? Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')) : 0,
      sprint: this.locked && (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')),
      jump: this.locked && this.jumpQueued,
      yaw: this.yaw, pitch: this.pitch,
    };
    this.jumpQueued = false;
    return input;
  }
  destroy() { this.abort.abort(); this.clear(); }
}
