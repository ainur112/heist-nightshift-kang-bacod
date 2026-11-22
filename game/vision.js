// Raycast line of sight. Walls are axis-aligned rectangles; cones stop at the first wall a ray hits.
function rayBox(ox, oy, dx, dy, b) {
  let tmin = 0, tmax = Infinity;
  if (Math.abs(dx) < 1e-9) { if (ox < b.x || ox > b.x + b.w) return Infinity; }
  else { let t1 = (b.x - ox) / dx, t2 = (b.x + b.w - ox) / dx; if (t1 > t2) [t1, t2] = [t2, t1]; tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); }
  if (Math.abs(dy) < 1e-9) { if (oy < b.y || oy > b.y + b.h) return Infinity; }
  else { let t1 = (b.y - oy) / dy, t2 = (b.y + b.h - oy) / dy; if (t1 > t2) [t1, t2] = [t2, t1]; tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); }
  return tmax >= tmin ? tmin : Infinity;
}

export function rayDistance(ox, oy, dx, dy, walls, max) {
  let best = max;
  for (const w of walls) {
    const t = rayBox(ox, oy, dx, dy, w);
    if (t < best) best = t;
  }
  return best;
}

export function conePolygon(ox, oy, angle, half, range, walls, steps = 20) {
  const pts = [[ox, oy]];
  for (let i = 0; i <= steps; i++) {
    const a = angle - half + (2 * half * i) / steps;
    const dx = Math.cos(a), dy = Math.sin(a);
    const t = rayDistance(ox, oy, dx, dy, walls, range);
    pts.push([ox + dx * t, oy + dy * t]);
  }
  return pts;
}

export function clearLine(x1, y1, x2, y2, walls) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-6) return true;
  return rayDistance(x1, y1, dx / len, dy / len, walls, len) >= len - 0.5;
}

export function seesPoint(ox, oy, angle, half, range, target, walls) {
  const dx = target.x - ox, dy = target.y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > half) return false;
  return clearLine(ox, oy, target.x, target.y, walls);
}

export function insideShadow(x, y, shadows) {
  for (const s of shadows) if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return true;
  return false;
}
