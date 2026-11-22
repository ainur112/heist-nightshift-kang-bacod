import { LEVELS } from './levels.js';
import { makePlayer, movePlayer, makeGuards, updateGuards, makeCameras, updateCameras, threatAt } from './entities.js';
import { GADGETS, makeGadgetState, deploy, tickGadgets } from './tools.js';
import { render } from './renderer.js';
import * as audio from './audio.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const scene = params.get('scene');
const requested = Math.max(0, Math.min(LEVELS.length - 1, parseInt(params.get('level') || '0', 10) || 0));
const keys = Object.create(null);

const state = {
  levelIndex: requested, level: LEVELS[requested],
  tools: makeGadgetState(), haul: 0, alarm: 0, threat: 0,
  time: 0, phase: 'title', staged: false,
  lootTaken: false, hacked: false, lasersOff: false,
  wasThreat: false, lastHeart: 0, lastStepPhase: 0
};

function resetLevel(i) {
  state.levelIndex = i;
  state.level = LEVELS[i];
  state.player = makePlayer(state.level);
  state.guards = makeGuards(state.level);
  state.cameras = makeCameras(state.level);
  state.lootTaken = false;
  state.hacked = false;
  state.lasersOff = false;
  state.alarm = 0;
  state.threat = 0;
  state.time = 0;
  state.phase = 'play';
  state.staged = false;
  state.wasThreat = false;
  state.lastHeart = 0;
  state.lastStepPhase = 0;
}

function stageScene(name) {
  if (!name) return;
  state.staged = true;
  state.phase = 'play';
  state.time = 1.2;
  if (name === 'cover') {
    state.player.x = 430;
    state.player.y = 415;
    state.player.hidden = true;
    state.alarm = 40;
    state.tools.lure = { x: 520, y: 370, t: 4.5 };
  } else if (name === 'routes') {
    state.player.x = 570;
    state.player.y = 415;
    state.player.hidden = true;
    state.alarm = 12;
  } else if (name === 'gadget') {
    state.player.x = 700;
    state.player.y = 300;
    state.alarm = 55;
    state.tools.emp = 5.5;
  } else if (name === 'extract') {
    state.lootTaken = true;
    state.haul = LEVELS[2].value;
    state.player.x = state.level.exfil.x + 60;
    state.player.y = state.level.exfil.y + 30;
    state.alarm = 20;
  }
}

function input() {
  return {
    left: !!(keys.a || keys.arrowleft),
    right: !!(keys.d || keys.arrowright),
    up: !!(keys.w || keys.arrowup),
    down: !!(keys.s || keys.arrowdown),
    sprint: !!keys.shift
  };
}

function interact() {
  if (state.phase === 'title') { state.phase = 'play'; return; }
  if (state.phase !== 'play') return;
  const p = state.player;
  const lv = state.level;
  if (!state.lootTaken && Math.hypot(p.x - lv.loot.x, p.y - lv.loot.y) < 46) {
    state.lootTaken = true;
    state.haul += lv.value;
    audio.pickup();
    return;
  }
  const t = lv.terminals.find((v) => Math.hypot(p.x - v.x, p.y - v.y) < 46);
  if (t && !state.hacked) {
    state.hacked = true;
    state.lasersOff = true;
    audio.emp();
    return;
  }
  if (state.lootTaken && p.x >= lv.exfil.x && p.x <= lv.exfil.x + lv.exfil.w &&
      p.y >= lv.exfil.y && p.y <= lv.exfil.y + lv.exfil.h) {
    if (state.levelIndex < LEVELS.length - 1) resetLevel(state.levelIndex + 1);
    else { state.phase = 'win'; audio.fanfare(); }
  }
}

function restart() {
  if (state.phase === 'win') {
    state.haul = 0;
    state.tools = makeGadgetState();
    resetLevel(0);
  } else {
    resetLevel(state.levelIndex);
  }
}

function update(dt) {
  state.time += dt;
  tickGadgets(state.tools, dt, state.player);
  updateCameras(state.cameras, dt, state.tools.emp > 0);
  updateGuards(state.guards, dt, state.tools.lure, state.level.walls);
  movePlayer(state.player, input(), dt, state.level);

  const threat = threatAt(state);
  state.threat = threat;
  if (state.player.hidden || threat < 0.05) state.alarm = Math.max(0, state.alarm - dt * 16);
  else state.alarm = Math.min(100, state.alarm + threat * dt * 42);

  if (threat > 0.6 && !state.wasThreat) audio.alert();
  state.wasThreat = threat > 0.6;
  if (state.alarm > 75 && state.time - state.lastHeart > 1.1) {
    audio.heartbeat();
    state.lastHeart = state.time;
  }
  const phase = Math.floor(state.player.walkPhase / 90);
  if (phase !== Math.floor(state.lastStepPhase / 90) && state.player.noise > 0.1) audio.step();
  state.lastStepPhase = state.player.walkPhase;

  if (state.alarm >= 100) {
    state.alarm = 100;
    state.phase = 'lockdown';
    audio.alert();
  }
}

let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0);
  last = ts;
  if (!state.staged && state.phase === 'play') update(dt);
  render(ctx, state);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  if (k === 'e') interact();
  else if (k === 'r') restart();
  else if (k === 'enter' && state.phase === 'title') state.phase = 'play';
  else if (k === '1' || k === '2' || k === '3') state.tools.selected = Number(k) - 1;
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('click', (e) => {
  if (state.phase === 'title') { state.phase = 'play'; return; }
  if (state.staged || state.phase !== 'play') return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const g = GADGETS[state.tools.selected];
  if (deploy(state.tools, g.id, x, y)) audio[g.id]();
  else audio.alert();
});

resetLevel(requested);
stageScene(scene);
window.__nightshift = state;
requestAnimationFrame(frame);
