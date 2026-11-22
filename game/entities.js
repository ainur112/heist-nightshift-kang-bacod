// Thief, patrol guards and sweeping cameras. All motion is frame-rate independent.
import { clearLine, seesPoint, insideShadow } from './vision.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function makePlayer(start) {
  return { x: start.x, y: start.y, vx: 0, vy: 0, r: 11, sprint: false, noise: 0, hidden: false, facing: 0 };
}

export function movePlayer(p, input, level, dt) {
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const l = Math.hypot(dx, dy) || 1;
  const speed = input.sprint ? 235 : 145;
  p.sprint = input.sprint && l > 0;
  p.vx = (dx / l) * speed;
  p.vy = (dy / l) * speed;
  if (l > 0) p.facing = Math.atan2(p.vy, p.vx);
  const nx = clamp(p.x + p.vx * dt, 24, 1256);
  const ny = clamp(p.y + p.vy * dt, 80, 694);
  if (!blocked(nx, p.y, level.walls, p.r)) p.x = nx;
  if (!blocked(p.x, ny, level.walls, p.r)) p.y = ny;
  p.hidden = insideShadow(p.x, p.y, level.shadows);
  p.noise = p.sprint ? 1 : (l > 0 ? 0.35 : 0);
}

function blocked(x, y, walls, r) {
  for (const w of walls) {
    const cx = clamp(x, w.x, w.x + w.w), cy = clamp(y, w.y, w.y + w.h);
    if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return true;
  }
  return false;
}

export function makeGuards(level) {
  return level.guards.map((g) => ({
    path: g.path, speed: g.speed, node: 1, x: g.path[0][0], y: g.path[0][1],
    angle: 0, mode: 'patrol', timer: 0, target: null, half: 0.42, range: 250,
  }));
}

export function updateGuards(guards, level, player, gadgets, dt, alarm) {
  for (const g of guards) {
    if (g.mode === 'investigate') {
      g.timer -= dt;
      const tx = g.target ? g.target.x : g.x, ty = g.target ? g.target.y : g.y;
      g.angle = Math.atan2(ty - g.y, tx - g.x);
      const d = Math.hypot(tx - g.x, ty - g.y);
      if (d > 12) { const s = g.speed * 1.25 * dt; g.x += ((tx - g.x) / d) * s; g.y += ((ty - g.y) / d) * s; }
      if (g.timer <= 0) { g.mode = 'patrol'; g.target = null; }
    } else {
      const [tx, ty] = g.path[g.node];
      const d = Math.hypot(tx - g.x, ty - g.y);
      if (d < 6) g.node = (g.node + 1) % g.path.length;
      else { const s = g.speed * dt; g.angle = Math.atan2(ty - g.y, tx - g.x); g.x += ((tx - g.x) / d) * s; g.y += ((ty - g.y) / d) * s; }
    }
    const lure = gadgets.lure;
    if (lure && lure.life > 0 && g.mode !== 'investigate' && clearLine(g.x, g.y, lure.x, lure.y, level.walls)) {
      g.mode = 'investigate'; g.target = { x: lure.x, y: lure.y }; g.timer = 3.2;
    }
  }
}

export function makeCameras(level) {
  return level.cameras.map((c) => ({ ...c, angle: c.base, t: 0 }));
}

export function updateCameras(cams, dt, disabled) {
  for (const c of cams) {
    c.t += dt * c.speed;
    c.angle = c.base + Math.sin(c.t) * c.sweep;
    c.disabled = disabled;
  }
}

export function threatAt(guards, cams, player, level, cloaked) {
  if (cloaked) return 0;
  let threat = 0;
  for (const g of guards) {
    if (seesPoint(g.x, g.y, g.angle, g.half, g.range, player, level.walls)) threat = Math.max(threat, player.sprint ? 1 : 0.75);
    if (player.noise > 0.8 && Math.hypot(g.x - player.x, g.y - player.y) < 190) threat = Math.max(threat, 0.35);
  }
  for (const c of cams) {
    if (!c.disabled && seesPoint(c.x, c.y, c.angle, 0.32, 300, player, level.walls)) threat = Math.max(threat, 0.8);
  }
  for (const l of level.lasers) {
    if (laserHit(l, player) && !player.hidden) threat = Math.max(threat, 1);
  }
  return threat;
}

export function laserHit(l, p) {
  const dx = l.x2 - l.x1, dy = l.y2 - l.y1;
  const t = clamp(((p.x - l.x1) * dx + (p.y - l.y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(p.x - (l.x1 + t * dx), p.y - (l.y1 + t * dy)) < p.r + 2;
}
