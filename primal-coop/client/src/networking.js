import { io } from 'socket.io-client';
import { EVENTS } from '@shared/protocol.js';
import { MAX_INPUT_BATCH } from '@shared/config.js';

export class GameConnection {
  constructor({ onWelcome, onSnapshot, onDisconnect, onError, onLatency }) {
    this.callbacks = { onWelcome, onSnapshot, onDisconnect, onError, onLatency };
    this.socket = null;
    this.pingTimer = null;
  }
  get connected() { return !!this.socket?.connected; }
  connect(name, room) {
    this.disconnect();
    this.socket = io({ auth: { name, room }, autoConnect: false, reconnectionDelay: 500, reconnectionDelayMax: 3000 });
    this.socket.on(EVENTS.welcome, data => this.callbacks.onWelcome(data));
    this.socket.on(EVENTS.snapshot, data => this.callbacks.onSnapshot(data));
    this.socket.on('disconnect', reason => this.callbacks.onDisconnect(reason));
    this.socket.on('connect_error', error => this.callbacks.onError(error.message));
    this.socket.connect();
    this.pingTimer = setInterval(() => {
      if (!this.connected) return;
      const started = performance.now();
      this.socket.timeout(2000).emit(EVENTS.ping, error => {
        if (!error) this.callbacks.onLatency(Math.round(performance.now() - started));
      });
    }, 2000);
  }
  send(commands) {
    if (!this.connected) return;
    for (let offset = 0; offset < commands.length; offset += MAX_INPUT_BATCH) {
      this.socket.emit(EVENTS.input, commands.slice(offset, offset + MAX_INPUT_BATCH));
    }
  }
  disconnect() {
    clearInterval(this.pingTimer);
    this.pingTimer = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
