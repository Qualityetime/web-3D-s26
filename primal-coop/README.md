# Primal Co-op — v0.1

A fresh two-player Three.js prototype. Join the same room, walk through a small forest, sprint, jump, collide with trees and stones, and see the other hunter move. All visuals are built from primitives.

## Run it

Install [Node.js](https://nodejs.org/en/download) **22.12 or newer**, extract this project, and open a terminal inside `primal-coop`.

```bash
npm ci
npm run dev
```

Open **http://localhost:3000** in two separate browser windows. Give each hunter a different name, leave both room codes as **BONES**, and click **Enter the clearing** in each window. Switch between the windows to move each hunter. Click **Continue** if the browser asks for another click before capturing your mouse.

For the first connection test, arrange the windows side by side. You should see two names in each roster. Move one hunter and watch the colored capsule move in the other window. Mouse control belongs to the active window.

| Control | Action |
| --- | --- |
| W / A / S / D | Move |
| Mouse | Look |
| Shift + movement | Sprint |
| Space | Jump |
| Esc | Release mouse and pause your controls |
| Continue | Capture the mouse again |
| Leave room | Return to the join screen |
| Copy link | Copy a URL with the current room code |

The game expects a desktop mouse and keyboard and a browser supporting WebGL 2. Chrome, Edge, or Firefox can run the prototype. Losing focus clears held keys; disconnected hunters are removed from the room. A successful reconnect starts a new hunter at the spawn point.

## Play on two computers

Start the server on one computer. On that computer, open `http://localhost:3000`. On another computer on the same network, open `http://YOUR-SERVER-LAN-IP:3000`, using the host computer’s local IPv4 address. Allow Node through the host’s firewall for your private network if prompted. Both hunters use the same room code.

Copy-link support depends on the browser’s clipboard permissions; you can copy the address bar instead.

**A localhost link only works on the computer running the server.** Friends outside your network need a publicly reachable Node server with HTTPS and WebSocket support, or a suitable secure tunnel. This project is ready to run locally; it has not been deployed. A static hosting service alone cannot run the multiplayer server. Room codes group players and are not passwords.

## Build and run the compiled client

```bash
npm run build
npm start
```

The same Node process serves `dist/` and the multiplayer connection on port 3000. Development uses Vite middleware in that process, so both modes use one address and port. In development, client files reload through Vite and server/shared edits restart Node’s watcher.

To choose another port or interface, copy `.env.example` to `.env` and edit it. The default bind address is `0.0.0.0` for LAN access. Use `HOST=127.0.0.1` for a local-only session. Stop with Ctrl+C.

## Project structure

| Location | Responsibility |
| --- | --- |
| `client/index.html` | Join screen, HUD, pause screen and game canvas |
| `client/src/main.js` | Render loop, fixed simulation steps and connection lifecycle |
| `client/src/world.js` | Three.js forest, lighting, stones and map boundary |
| `client/src/input.js` | Mouse capture, keyboard input and focus handling |
| `client/src/player.js` | Immediate local movement prediction and server reconciliation |
| `client/src/avatars.js` | Placeholder hunters, name labels and interpolation |
| `client/src/networking.js` | Socket.IO client, input batches, reconnects and latency |
| `client/src/ui.js` | Room form, roster, status and HUD updates |
| `client/src/styles.css` | Prototype interface styling |
| `server/index.js` | Environment configuration, startup and shutdown |
| `server/app.js` | HTTP/Vite hosting, Socket.IO rooms and simulation scheduling |
| `server/gameState.js` | Player spawning, input queues and authoritative snapshots |
| `shared/config.js` | Movement settings, tick rates and two-player limit |
| `shared/world.js` | Seeded map generation, spawns and collision shapes |
| `shared/movement.js` | Shared movement, gravity, jumping and static collision |
| `shared/protocol.js` | Event names and untrusted input validation |
| `tests/` | Movement, protocol and live two-client network tests |
| `docs/` | Screenshots of the join screen and two-player prototype |
| `vite.config.js` | Client build and shared-module imports |

## How multiplayer works

The client samples input at 60 simulation steps per second, predicts movement immediately, and batches inputs to the server at 30 sends per second. The server accepts movement intent, never client positions or a client-selected timestep. It simulates at 60 Hz and publishes room snapshots at 20 Hz. Each snapshot acknowledges processed inputs, allowing the local hunter to replay pending inputs against the server’s result. Other hunters render with a 100 ms interpolation buffer.

Each room has two distinct spawn slots and colors. Everyone generates the same map from the same seed. Empty rooms are removed. State lives in memory and resets when the server restarts.

The initial controller uses shared circular collision shapes and a flat ground plane. Stones and trunks block movement at all heights; climbing, slopes and player-to-player collision are outside this controller. This keeps the movement prototype small and gives us one shared simulation to replace with a fuller physics controller when needed.

## Check the foundation

```bash
npm test
npm run build
```

The tests cover movement speeds, diagonal normalization, jumps and landing, obstacle and boundary collisions, deterministic map generation, invalid input, server step limits, two actual Socket.IO clients, room isolation, full-room rejection, disconnect cleanup and slot reuse.

For visual verification, run the game in two windows and test movement, mouse-look, jumping, sprinting, a stone collision, leaving and rejoining. The package includes `package-lock.json` so `npm ci` installs the tested dependency versions.

## Next milestone

Add the spear on top of this working movement/networking foundation. Then add the first animal, damage/death, harvesting and campfire/cooking in that order.

API references: [Three.js renderer](https://threejs.org/docs/pages/WebGLRenderer.html), [Socket.IO rooms](https://socket.io/docs/v4/rooms/), [Vite JavaScript API](https://vite.dev/guide/api-javascript.html).
