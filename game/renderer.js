import { conePolygon } from './vision.js';
import { GADGETS } from './tools.js';
import { GUARD_HALF, GUARD_RANGE, CAM_HALF, CAM_RANGE } from './entities.js';

const W = 1280;
const H = 720;

function label(ctx, str, x, y, size, color, align = 'left', weight = '') {
  ctx.font = `${weight} ${size}px ui-monospace, Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

function diamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
}

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function render(ctx, s) {
  const lv = s.level;
  const tools = s.tools;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#070b18';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#101d36';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 40) { ctx.moveTo(x + 0.5, 54); ctx.lineTo(x + 0.5, 666); }
  for (let y = 54; y <= 666; y += 40) { ctx.moveTo(12, y + 0.5); ctx.lineTo(1268, y + 0.5); }
  ctx.stroke();

  // Vision cones first so wall outlines stay crisp on top.
  for (const g of s.guards) {
    poly(ctx, conePolygon(g.x, g.y, g.dir, GUARD_HALF, GUARD_RANGE, lv.walls));
    ctx.fillStyle = 'rgba(255,176,58,0.14)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,176,58,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (!s.emp) {
    for (const c of s.cameras) {
      if (!c.on) continue;
      poly(ctx, conePolygon(c.x, c.y, c.angle, CAM_HALF, CAM_RANGE, lv.walls));
      ctx.fillStyle = 'rgba(78,156,255,0.13)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(78,156,255,0.30)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Safe cover boxes.
  ctx.setLineDash([5, 5]);
  for (const sh of lv.shadows) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
    ctx.strokeStyle = '#26566b';
    ctx.lineWidth = 1;
    ctx.strokeRect(sh.x + 0.5, sh.y + 0.5, sh.w - 1, sh.h - 1);
    label(ctx, 'COVER', sh.x + sh.w / 2, sh.y + sh.h / 2, 10, '#47798c', 'center', 'bold');
  }
  ctx.setLineDash([]);

  // Walls.
  for (const w of lv.walls) {
    ctx.fillStyle = '#0d1932';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#2ee6d6';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(w.x + 0.8, w.y + 0.8, w.w - 1.6, w.h - 1.6);
  }

  // Laser tripwires.
  for (const l of lv.lasers) {
    const live = !s.emp && !s.lasersOff;
    ctx.save();
    ctx.setLineDash(live ? [] : [7, 7]);
    ctx.strokeStyle = live ? '#ff3b5c' : '#693041';
    ctx.lineWidth = live ? 2 : 1;
    if (live) { ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 12; }
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
    ctx.restore();
  }

  // Terminals.
  for (const t of lv.terminals) {
    ctx.strokeStyle = s.hacked ? '#62e08a' : '#39d9c0';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(t.x - 13, t.y - 13, 26, 26);
    label(ctx, s.hacked ? 'OK' : 'T', t.x, t.y, 12, s.hacked ? '#62e08a' : '#39d9c0', 'center', 'bold');
  }

  // Extraction zone.
  const e = lv.exfil;
  ctx.save();
  ctx.setLineDash([9, 6]);
  ctx.strokeStyle = '#4ce38a';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.restore();
  ctx.fillStyle = 'rgba(76,227,138,0.07)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  label(ctx, 'EXFIL', e.x + e.w / 2, e.y + e.h / 2, 13, '#4ce38a', 'center', 'bold');

  // Loot.
  if (!s.lootTaken) {
    const p = lv.loot;
    ctx.save();
    ctx.shadowColor = '#ffd34d';
    ctx.shadowBlur = 26;
    diamond(ctx, p.x, p.y, 16);
    ctx.fillStyle = 'rgba(255,211,77,0.35)';
    ctx.fill();
    ctx.strokeStyle = '#ffd34d';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
    label(ctx, 'VAULT CORE', p.x, p.y - 32, 12, '#ffd34d', 'center', 'bold');
    label(ctx, `$${lv.value.toLocaleString('en-US')}`, p.x, p.y + 32, 11, '#c9a94a', 'center');
  }

  // Lure marker.
  if (tools.lure) {
    const l = tools.lure;
    ctx.strokeStyle = 'rgba(255,196,80,0.9)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = 10 + ((s.time * 60 + i * 18) % 54);
      ctx.globalAlpha = 1 - r / 70;
      ctx.beginPath();
      ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    label(ctx, 'LURE', l.x, l.y - 20, 10, '#ffc450', 'center', 'bold');
  }

  // Gadget body effects.
  if (tools.emp > 0) {
    ctx.fillStyle = 'rgba(80,160,255,0.05)';
    ctx.fillRect(12, 54, 1256, 612);
    ctx.strokeStyle = `rgba(120,200,255,${0.25 + 0.2 * Math.sin(s.time * 9)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.player.x, s.player.y, 40 + ((s.time * 130) % 150), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Guards.
  for (const g of s.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.dir);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-9, 9);
    ctx.lineTo(-9, -9);
    ctx.closePath();
    ctx.fillStyle = g.mode === 'investigate' ? '#ff9d3b' : '#ff7a33';
    ctx.fill();
    ctx.strokeStyle = '#ffd0a0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    if (g.mode === 'investigate') label(ctx, '?', g.x, g.y - 20, 14, '#ffb04a', 'center', 'bold');
  }

  // Cameras.
  if (!s.emp) {
    for (const c of s.cameras) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.fillStyle = '#4e9cff';
      ctx.fillRect(-7, -7, 14, 14);
      ctx.strokeStyle = '#c9e2ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-7.5, -7.5, 15, 15);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Thief.
  const p = s.player;
  ctx.save();
  ctx.globalAlpha = p.cloaked ? 0.4 : 1;
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 10;
  diamond(ctx, p.x, p.y, 11);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
  if (p.cloaked) {
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(190,225,255,0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Context prompt.
  let prompt = '';
  if (!s.lootTaken && Math.hypot(p.x - lv.loot.x, p.y - lv.loot.y) < 46) prompt = 'E  TAKE VAULT CORE';
  if (!prompt && !s.hacked && lv.terminals.some((t) => Math.hypot(p.x - t.x, p.y - t.y) < 46)) prompt = 'E  DISABLE LASERS';
  if (!prompt && s.lootTaken && inRect(p.x, p.y, e)) prompt = 'E  EXTRACT';
  if (prompt) {
    label(ctx, prompt, p.x, p.y - 30, 12, '#ffffff', 'center', 'bold');
  }

  // Top HUD.
  ctx.fillStyle = 'rgba(4,10,22,0.94)';
  ctx.fillRect(0, 0, W, 54);
  ctx.strokeStyle = '#1d4a5c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 53.5);
  ctx.lineTo(W, 53.5);
  ctx.stroke();
  label(ctx, 'NIGHTSHIFT', 22, 27, 21, '#39e0d0', 'left', 'bold');
  label(ctx, `SECTOR  ${lv.name}`, 280, 27, 14, '#9fc4d6', 'left', 'bold');

  label(ctx, 'ALARM', 690, 18, 11, '#9fc4d6', 'left', 'bold');
  ctx.fillStyle = '#142238';
  ctx.fillRect(742, 11, 190, 14);
  const a = Math.round(s.alarm);
  ctx.fillStyle = a >= 70 ? '#ff3b5c' : a >= 40 ? '#ffb03b' : '#39e0d0';
  ctx.fillRect(742, 11, 190 * (s.alarm / 100), 14);
  ctx.strokeStyle = '#2d5d70';
  ctx.lineWidth = 1;
  ctx.strokeRect(742.5, 11.5, 189, 13);
  label(ctx, `${a}%`, 942, 18, 12, '#e6f4ff', 'left', 'bold');

  label(ctx, `CREDITS  $${tools.credits}`, 1050, 18, 12, '#8fe6b4', 'left', 'bold');
  label(ctx, `HAUL  $${s.haul.toLocaleString('en-US')}`, 1050, 39, 12, '#ffd34d', 'left', 'bold');
  label(ctx, `FLOOR ${s.levelIndex + 1}/3`, 1236, 28, 11, '#6f93a8', 'right');

  // Bottom hotbar.
  ctx.fillStyle = 'rgba(4,10,22,0.96)';
  ctx.fillRect(0, 666, W, 54);
  ctx.strokeStyle = '#1d4a5c';
  ctx.beginPath();
  ctx.moveTo(0, 666.5);
  ctx.lineTo(W, 666.5);
  ctx.stroke();
  GADGETS.forEach((g, i) => {
    const x = 18 + i * 418;
    const active = tools.selected === i;
    ctx.fillStyle = active ? 'rgba(57,224,208,0.12)' : 'rgba(20,34,56,0.7)';
    ctx.fillRect(x, 673, 400, 40);
    ctx.strokeStyle = active ? '#39e0d0' : '#21455a';
    ctx.lineWidth = active ? 2 : 1;
    ctx.strokeRect(x + 0.5, 673.5, 399, 39);
    label(ctx, g.key, x + 16, 693, 18, active ? '#39e0d0' : '#6f93a8', 'left', 'bold');
    label(ctx, g.name.toUpperCase(), x + 48, 686, 12, active ? '#e6f4ff' : '#8fb0c2', 'left', 'bold');
    const timer = g.id === 'lure' ? tools.lure?.t : g.id === 'emp' ? tools.emp : tools.cloak;
    label(ctx, timer > 0 ? `ACTIVE ${timer.toFixed(1)}s` : `$${g.cost}`, x + 48, 702, 11, timer > 0 ? '#ffd34d' : '#7fa0b3');
  });
  label(ctx, 'WASD MOVE  •  SHIFT SPRINT  •  E USE  •  CLICK DEPLOY  •  R RESTART', 1270, 660, 10, '#5f8296', 'right');

  // Overlays.
  if (s.phase === 'title') {
    ctx.fillStyle = 'rgba(3,8,18,0.88)';
    ctx.fillRect(0, 0, W, H);
    label(ctx, 'NIGHTSHIFT', W / 2, 280, 74, '#39e0d0', 'center', 'bold');
    label(ctx, 'OFFLINE STEALTH HEIST', W / 2, 340, 20, '#9fc4d6', 'center', 'bold');
    label(ctx, 'THREE FLOORS. ONE CORE. NO ALARMS.', W / 2, 385, 14, '#6f93a8', 'center');
    label(ctx, 'WASD / ARROWS MOVE   SHIFT SPRINT   E INTERACT', W / 2, 440, 14, '#c7dcea', 'center');
    label(ctx, '1 LURE   2 EMP   3 CLOAK   CLICK TO DEPLOY   R RESTART', W / 2, 466, 14, '#c7dcea', 'center');
    label(ctx, 'CLICK OR PRESS ENTER TO BEGIN', W / 2, 530, 17, '#ffd34d', 'center', 'bold');
  } else if (s.phase === 'lockdown') {
    ctx.fillStyle = 'rgba(60,4,14,0.78)';
    ctx.fillRect(0, 0, W, H);
    label(ctx, 'LOCKDOWN', W / 2, 322, 66, '#ff3b5c', 'center', 'bold');
    label(ctx, 'ALARM REACHED 100%', W / 2, 382, 18, '#ffc0cc', 'center', 'bold');
    label(ctx, 'PRESS R TO RESTART THE FLOOR', W / 2, 430, 14, '#e6a8b6', 'center');
  } else if (s.phase === 'win') {
    ctx.fillStyle = 'rgba(3,20,14,0.86)';
    ctx.fillRect(0, 0, W, H);
    label(ctx, 'CLEAN GETAWAY', W / 2, 310, 62, '#4ce38a', 'center', 'bold');
    label(ctx, `TOTAL HAUL  $${s.haul.toLocaleString('en-US')}`, W / 2, 375, 22, '#ffd34d', 'center', 'bold');
    label(ctx, 'ALL THREE FLOORS CLEARED', W / 2, 420, 15, '#bfe8d2', 'center');
    label(ctx, 'PRESS R TO PLAY AGAIN', W / 2, 465, 14, '#8fbfa6', 'center');
  }
}
