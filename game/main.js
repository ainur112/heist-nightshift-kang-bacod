// NIGHTSHIFT: input, state machine and the frame loop.
import { LEVELS } from './levels.js';
import { makePlayer, movePlayer, makeGuards, updateGuards, makeCameras, updateCameras, threatAt } from './entities.js';
import { makeGadgetState, deploy, tickGadgets, GADGETS } from './tools.js';
import { render } from './renderer.js';
import * as sfx from './audio.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const scene = params.get('scene');

const state = {
  levelIndex: Math.min(2, Math.max(0, Number(params.get('level') || 0))),
  level: null, player: null, guards: [], cams: [], gadgets: makeGadgetState(),
  alarm: 0, credits: 150, lootTaken: false, mode: 'title', selected: 0,
  time: 0, message: '', lasersOff: false, beat: 0,
};
window.__nightshift = state;

function loadLevel(i) {
  state.levelIndex = i;
  state.level = LEVELS[i];
  state.player = makePlayer(state.level.start);
  state.guards = makeGuards(state.level);
  state.cams = makeCameras(state.level);
  state.gadgets = makeGadgetState();
  state.alarm = 0; state.lootTaken = false; state.lasersOff = false;
  state.mode = 'playing';
  state.message = 'Three routes in: cover, camera timing, or the terminal.';
}

function activeLevel() {
  const l = state.level;
  return state.lasersOff ? { ...l, lasers: [] } : l;
}

function stageScene() {
  loadLevel(state.levelIndex);
  if (scene === 'cover') {
    state.alarm = 42;
    state.player.x = 470; state.player.y = 470; state.player.facing = -0.4;
    state.gadgets.lure = { x: 880, y: 250, life: 4 };
    state.message = 'COVER ROUTE · coned but unspotted';
  } else if (scene === 'gadget') {
    state.alarm = 58;
    state.player.x = 620; state.player.y = 500;
    state.gadgets.emp = 5; state.gadgets.pulse = 0.75;
    state.message = 'MICRO EMP · cameras and lasers down';
  } else if (scene === 'extract') {
    state.alarm = 24; state.lootTaken = true; state.credits = 150 + state.level.value;
    const e = state.level.extract;
    state.player.x = e.x + e.w / 2; state.player.y = e.y + e.h / 2;
    state.message = 'CORE SECURED · reaching exfil';
  } else {
    state.player.x = 560; state.player.y = 360; state.player.facing = 0.2;
    state.alarm = 34;
    state.message = 'VAULT CORE · guards sweeping the atrium';
  }
}

const keys = new Set();
const input = () => ({
  left: keys.has('KeyA') || keys.has('ArrowLeft'),
  right: keys.has('KeyD') || keys.has('ArrowRight'),
  up: keys.has('KeyW') || keys.has('ArrowUp'),
  down: keys.has('KeyS') || keys.has('ArrowDown'),
  sprint: keys.has('ShiftLeft') || keys.has('ShiftRight'),
});

function interact() {
  if (state.mode !== 'playing') return;
  const p = state.player, l = state.level;
  if (!state.lootTaken && Math.hypot(p.x - l.loot.x, p.y - l.loot.y) < 52) {
    state.lootTaken = true; state.credits += l.value;
    state.message = `VAULT CORE TAKEN · $${l.value.toLocaleString()}`; sfx.pickup(); return;
  }
  for (const t of l.terminals) {
    if (Math.hypot(p.x - t.x, p.y - t.y) < 46 && !state.lasersOff) {
      state.lasersOff = true; state.message = 'TERMINAL HACKED · laser grid offline'; sfx.emp(); return;
    }
  }
  const e = l.extract;
  if (state.lootTaken && p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
    if (state.levelIndex === LEVELS.length - 1) { state.mode = 'win'; sfx.fanfare(); }
    else { loadLevel(state.levelIndex + 1); sfx.fanfare(); }
  }
}

addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'Enter' && state.mode === 'title') loadLevel(0);
  if (e.code === 'KeyR') { if (scene) stageScene(); else loadLevel(state.levelIndex); }
  if (e.code === 'KeyE') interact();
  if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    state.selected = Number(e.code.slice(-1)) - 1;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));

canvas.addEventListener('mousedown', (e) => {
  if (state.mode !== 'playing') return;
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 1280;
  const y = ((e.clientY - r.top) / r.height) * 720;
  const id = GADGETS[state.selected].id;
  const result = deploy(id, x, y, state.credits, state.gadgets);
  if (result.ok) {
    state.credits = result.credits;
    state.message = `${GADGETS[state.selected].name} DEPLOYED`;
    (id === 'lure' ? sfx.lure : id === 'emp' ? sfx.emp : sfx.cloak)();
  } else state.message = 'NOT ENOUGH CREDITS';
});

let last = performance.now();
let stepClock = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;
  if (state.mode === 'playing') {
    const l = activeLevel();
    movePlayer(state.player, input(), l, dt);
    tickGadgets(state.gadgets, dt);
    updateGuards(state.guards, l, state.player, state.gadgets, dt, state.alarm);
    updateCameras(state.cams, dt, state.gadgets.emp > 0);
    const threat = threatAt(state.guards, state.cams, state.player, l, state.gadgets.cloak > 0);
    if (threat > 0) state.alarm = Math.min(100, state.alarm + threat * 42 * dt);
    else state.alarm = Math.max(0, state.alarm - (state.player.hidden ? 20 : 6) * dt);
    if (threat > 0 && state.alarm > 55 && state.guards.some((g) => g.mode === 'patrol')) {
      const g = state.guards.find((x) => x.mode === 'patrol');
      g.mode = 'investigate'; g.target = { x: state.player.x, y: state.player.y }; g.timer = 3;
      sfx.alert();
    }
    if (state.alarm > 70) {
      state.beat += dt;
      if (state.beat > 0.85) { state.beat = 0; sfx.heartbeat(); }
    }
    stepClock += dt;
    if (stepClock > (state.player.sprint ? 0.19 : 0.31)) { stepClock = 0; if ((input().left || input().right || input().up || input().down)) sfx.step(state.player.sprint); }
    if (state.alarm >= 100) { state.mode = 'caught'; sfx.alert(); }
  }
  render(ctx, { ...state, level: state.level || LEVELS[0] });
  requestAnimationFrame(frame);
}

if (scene) stageScene(); else state.level = LEVELS[0];
requestAnimationFrame(frame);
