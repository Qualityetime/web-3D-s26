// The client and server use these same units and simulation rules.
export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;
export const SNAPSHOT_RATE = 20;
export const INPUT_SEND_RATE = 30;
export const MAX_PLAYERS = 2;
export const MAX_INPUT_BATCH = 8;
export const INPUT_TIMEOUT_MS = 300;
export const INTERPOLATION_MS = 100;
export const PLAYER = Object.freeze({
  radius: 0.35,
  height: 1.8,
  eyeHeight: 1.62,
  walkSpeed: 4.2,
  sprintSpeed: 7.4,
  jumpSpeed: 7.2,
  gravity: 22,
});
export const PLAYER_COLORS = [0x91d3c6, 0xf1b378];
