import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { Server } from 'socket.io';
import { GameState } from './gameState.js';
import { EVENTS, validateJoin } from '../shared/protocol.js';
import { TICK_RATE, SNAPSHOT_RATE, MAX_PLAYERS } from '../shared/config.js';

export async function createGameServer({ dev = false, serveClient = true } = {}) {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, { maxHttpBufferSize: 8192, serveClient: false });
  const game = new GameState();
  let vite;
  app.disable('x-powered-by');
  app.get('/health', (_req, res) => res.json({ ok: true, version: '0.1.0', rooms: game.rooms.size }));

  io.use((socket, next) => {
    try {
      socket.data.join = validateJoin(socket.handshake.auth);
      game.addPlayer(socket.id, socket.data.join);
      next();
    } catch (error) {
      next(new Error(error.message));
    }
  });

  io.on('connection', socket => {
    const { room } = socket.data.join;
    const channel = `game:${room}`;
    socket.join(channel);
    socket.emit(EVENTS.welcome, {
      id: socket.id, room, seed: game.world.seed, maxPlayers: MAX_PLAYERS,
      snapshot: game.snapshot(room),
    });
    socket.on(EVENTS.input, batch => game.receiveInput(socket.id, room, batch, performance.now()));
    socket.on(EVENTS.ping, callback => { if (typeof callback === 'function') callback(); });
    socket.on('disconnect', () => {
      game.removePlayer(socket.id, room);
      io.to(channel).emit(EVENTS.snapshot, game.snapshot(room));
    });
    io.to(channel).emit(EVENTS.snapshot, game.snapshot(room));
  });

  // Bound catch-up work after a long process stall, rather than teleporting players.
  const stepMs = 1000 / TICK_RATE;
  let previous = performance.now();
  let accumulator = 0;
  const simulationTimer = setInterval(() => {
    const now = performance.now();
    accumulator += Math.min(now - previous, stepMs * 5);
    previous = now;
    while (accumulator >= stepMs) {
      game.step(now);
      accumulator -= stepMs;
      if (game.tick % (TICK_RATE / SNAPSHOT_RATE) === 0) {
        for (const room of game.rooms.keys()) io.to(`game:${room}`).emit(EVENTS.snapshot, game.snapshot(room));
      }
    }
  }, stepMs / 2);

  try {
    if (serveClient && dev) {
      const { createServer } = await import('vite');
      vite = await createServer({
        configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
        // Native loading avoids temporary config modules retriggering node --watch.
        configLoader: 'native',
        server: { middlewareMode: true, ws: { server: httpServer } },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else if (serveClient) {
      const dist = fileURLToPath(new URL('../dist', import.meta.url));
      if (!existsSync(`${dist}/index.html`)) throw new Error('Missing client build. Run npm run build first, or use npm run dev.');
      app.use(express.static(dist));
    }
  } catch (error) {
    clearInterval(simulationTimer);
    await new Promise(resolve => io.close(resolve));
    throw error;
  }

  return {
    app, httpServer, io, game,
    async listen(port = 3000, host = '0.0.0.0') {
      await new Promise((resolve, reject) => {
        httpServer.once('error', reject);
        httpServer.listen(port, host, () => { httpServer.off('error', reject); resolve(); });
      });
      return httpServer.address();
    },
    async close() {
      clearInterval(simulationTimer);
      if (vite) await vite.close();
      await new Promise(resolve => io.close(resolve));
    },
  };
}
