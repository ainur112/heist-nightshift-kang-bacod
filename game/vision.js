// Ray-vs-AABB helpers. Cones terminate at the first wall they touch.
const EPS = 1e-6;

export function rayDistance(x, y, dx, dy, maxDist, walls) {
  let best = maxDist;
  for (const w of walls) {
    let t0 = 0;
    let t1 = best;
    if (Math.abs(dx) < EPS) {
      if (x < w.x || x > w.x + w.w) continue;
    } else {
      let a = (w.x - x) / dx;
      let b = (w.x + w.w - x) / dx;
      if (a > b) { const t = a; a = b; b = t; }
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t1 < t0) continue;
    }
    if (Math.abs(dy) < EPS) {
      if (y < w.y || y > w.y + w.h) continue;
    } else {
      let a = (w.y - y) / dy;
      let b = (w.y + w.h - y) / dy;
      if (a > b) { const t = a; a = b; b = t; }
      t0 = Math.max(t0, a);
      t1 = Math.min(t1, b);
      if (t1 < t0) continue;
    }
    const hit = Math.max(t0, 0);
    if (t1 >= hit) best = Math.min(best, hit);
  }
  return best;
}

export function conePolygon(ox, oy, angle, half, range, walls, steps = 22) {
  const pts = [{ x: ox, y: oy }];
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayDistance(ox, oy, dx, dy, range, walls);
    pts.push({ x: ox + dx * d, y: oy + dy * d });
  }
  return pts;
}

export function clearLine(ax, ay, bx, by, walls) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < EPS) return true;
  return rayDistance(ax, ay, dx / len, dy / len, len, walls) >= len - 0.5;
}

export function seesPoint(ox, oy, angle, half, range, px, py, walls) {
  const dx = px - ox;
  const dy = py - oy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < EPS) return true;
  const toward = Math.atan2(dy, dx);
  const diff = Math.atan2(Math.sin(toward - angle), Math.cos(toward - angle));
  if (Math.abs(diff) > half) return false;
  return clearLine(ox, oy, px, py, walls);
}

export function insideShadow(x, y, shadows) {
  for (const s of shadows) {
    if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  }
  return false;
}
