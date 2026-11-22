import { insideShadow, seesPoint } from './vision.js';

export const GUARD_HALF = 0.42;
export const GUARD_RANGE = 250;
export const CAM_HALF = 0.32;
export const CAM_RANGE = 300;

function blocked(x, y, r, walls) {
  for (const w of walls) {
    const nx = Math.max(w.x, Math.min(x, w.x + w.w));
    const ny = Math.max(w.y, Math.min(y, w.y + w.h));
    if ((x - nx) ** 2 + (y - ny) ** 2 < r * r) return true;
  }
  return false;
}

export function makePlayer(level) {
  return {
    x: level.start.x, y: level.start.y, r: 9, dir: 0,
    noise: 0, hidden: false, cloaked: false, walkPhase: 0
  };
}

export function movePlayer(p, input, dt, level) {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const mag = Math.hypot(dx, dy);
  const speed = input.sprint ? 235 : 145;
  if (mag > 0) {
    dx /= mag;
    dy /= mag;
    p.dir = Math.atan2(dy, dx);
    if (!blocked(p.x + dx * speed * dt, p.y, p.r, level.walls)) p.x += dx * speed * dt;
    if (!blocked(p.x, p.y + dy * speed * dt, p.r, level.walls)) p.y += dy * speed * dt;
    p.walkPhase += speed * dt;
  }
  p.hidden = insideShadow(p.x, p.y, level.shadows);
  const target = mag > 0 ? (input.sprint ? 1 : 0.5) * (p.hidden ? 0.5 : 1) : 0;
  p.noise += (target - p.noise) * Math.min(1, dt * 6);
  return p;
}

export function makeGuards(level) {
  return level.guards.map((g) => ({
    x: g.points[0].x, y: g.points[0].y, points: g.points,
    speed: g.speed, idx: 1 % g.points.length, dir: 0,
    mode: 'patrol', lure: null
  }));
}

export function updateGuards(guards, dt, lure, walls) {
  for (const g of guards) {
    const hasLure = !!(lure && lure.t > 0 && Math.hypot(g.x - lure.x, g.y - lure.y) < 380);
    if (hasLure) {
      g.mode = 'investigate';
      g.lure = lure;
    } else if (g.mode === 'investigate') {
      g.mode = 'patrol';
      g.lure = null;
      let best = 0;
      let bd = Infinity;
      g.points.forEach((pt, i) => {
        const d = Math.hypot(g.x - pt.x, g.y - pt.y);
        if (d < bd) { bd = d; best = i; }
      });
      g.idx = best;
    }
    const target = g.mode === 'investigate' ? g.lure : g.points[g.idx];
    if (!target) continue;
    const dx = target.x - g.x;
    const dy = target.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      if (g.mode === 'patrol') g.idx = (g.idx + 1) % g.points.length;
      continue;
    }
    const step = Math.min(d, g.speed * (g.mode === 'investigate' ? 1.15 : 1) * dt);
    const ox = g.x;
    const oy = g.y;
    if (!blocked(g.x + (dx / d) * step, g.y, 8, walls)) g.x += (dx / d) * step;
    if (!blocked(g.x, g.y + (dy / d) * step, 8, walls)) g.y += (dy / d) * step;
    if (g.x !== ox || g.y !== oy) g.dir = Math.atan2(g.y - oy, g.x - ox);
  }
}

export function makeCameras(level) {
  return level.cameras.map((c) => ({ ...c, t: 0, angle: c.base, on: true }));
}

export function updateCameras(cameras, dt, disabled) {
  for (const c of cameras) {
    c.t += dt;
    c.angle = c.base + Math.sin(c.t * c.speed) * c.sweep;
    c.on = !disabled;
  }
}

export function laserHit(p, lasers) {
  for (const l of lasers) {
    const vx = l.x2 - l.x1;
    const vy = l.y2 - l.y1;
    const len2 = vx * vx + vy * vy;
    let t = len2 ? ((p.x - l.x1) * vx + (p.y - l.y1) * vy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = l.x1 + vx * t;
    const py = l.y1 + vy * t;
    if (Math.hypot(p.x - px, p.y - py) < p.r + 3) return true;
  }
  return false;
}

export function threatAt(state) {
  if (state.player.cloaked || state.phase !== 'play') return 0;
  const p = state.player;
  const lv = state.level;
  let t = 0;
  for (const g of state.guards) {
    if (seesPoint(g.x, g.y, g.dir, GUARD_HALF, GUARD_RANGE, p.x, p.y, lv.walls)) {
      t = Math.max(t, p.hidden ? 0.35 : 0.85);
    }
  }
  if (!state.emp) {
    for (const c of state.cameras) {
      if (c.on && seesPoint(c.x, c.y, c.angle, CAM_HALF, CAM_RANGE, p.x, p.y, lv.walls)) {
        t = Math.max(t, p.hidden ? 0.3 : 0.7);
      }
    }
  }
  if (!state.emp && !state.lasersOff && laserHit(p, lv.lasers)) t = 1;
  t = Math.max(t, p.noise * 0.45);
  return Math.min(1, t);
}
