// Canvas renderer: blueprint noir. Safe cover is dark blue, danger is amber, loot is gold.
import { conePolygon } from './vision.js';
import { laserHit } from './entities.js';
import { GADGETS } from './tools.js';

const GOLD = '#ffcc55', AMBER = '#ffb24d', CYAN = '#63d6ff', GREEN = '#5dffa8', RED = '#ff5f6d';

function poly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
}

function label(ctx, x, y, text, color, size = 13, align = 'left') {
  ctx.font = `600 ${size}px ui-monospace, Consolas, monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

export function render(ctx, s) {
  const { level, player, guards, cams, gadgets, alarm, credits, lootTaken, time, selected, mode, message } = s;
  ctx.fillStyle = '#070b14';
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = '#10223a';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 40) { ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x, 720); ctx.stroke(); }
  for (let y = 64; y <= 720; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }

  for (const sh of level.shadows) {
    ctx.fillStyle = 'rgba(8,18,36,0.72)';
    ctx.fillRect(sh.x, sh.y, sh.w, sh.h);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(70,130,190,0.45)';
    ctx.strokeRect(sh.x, sh.y, sh.w, sh.h);
    ctx.setLineDash([]);
    label(ctx, sh.x + 8, sh.y + 17, 'COVER', 'rgba(110,170,220,0.55)', 10);
  }

  for (const w of level.walls) {
    ctx.fillStyle = '#15263b';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#3c7ba4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }

  for (const l of level.lasers) {
    const active = gadgets.emp <= 0 && !lootTaken;
    ctx.strokeStyle = active ? 'rgba(255,80,95,0.85)' : 'rgba(90,180,220,0.28)';
    ctx.lineWidth = active ? 3 : 1;
    ctx.setLineDash(active ? [] : [8, 8]);
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
    ctx.setLineDash([]);
    if (active && laserHit(l, player)) { ctx.fillStyle = 'rgba(255,70,80,0.2)'; ctx.fillRect(0, 64, 1280, 656); }
  }

  for (const g of guards) {
    const cone = conePolygon(g.x, g.y, g.angle, g.half, g.range, level.walls);
    poly(ctx, cone, g.mode === 'investigate' ? 'rgba(255,90,70,0.18)' : 'rgba(255,178,77,0.16)', 'rgba(255,190,90,0.45)');
  }
  for (const c of cams) {
    if (c.disabled) continue;
    const cone = conePolygon(c.x, c.y, c.angle, 0.32, 300, level.walls);
    poly(ctx, cone, 'rgba(120,160,255,0.14)', 'rgba(150,185,255,0.4)');
  }

  for (const t of level.terminals) {
    ctx.fillStyle = '#12364a';
    ctx.fillRect(t.x - 12, t.y - 9, 24, 18);
    ctx.strokeStyle = CYAN; ctx.lineWidth = 1;
    ctx.strokeRect(t.x - 12, t.y - 9, 24, 18);
    label(ctx, t.x, t.y + 4, 'E', CYAN, 11, 'center');
  }

  const ex = level.extract;
  ctx.fillStyle = lootTaken ? 'rgba(90,255,168,0.18)' : 'rgba(90,255,168,0.06)';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = lootTaken ? GREEN : 'rgba(90,255,168,0.4)';
  ctx.setLineDash([9, 5]); ctx.strokeRect(ex.x, ex.y, ex.w, ex.h); ctx.setLineDash([]);
  label(ctx, ex.x + ex.w / 2, ex.y + ex.h / 2 + 5, 'EXFIL', lootTaken ? GREEN : 'rgba(90,255,168,0.5)', 14, 'center');

  if (!lootTaken) {
    const pulse = 1 + Math.sin(time * 3) * 0.12;
    ctx.save();
    ctx.translate(level.loot.x, level.loot.y);
    ctx.shadowColor = GOLD; ctx.shadowBlur = 22;
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -level.loot.r * pulse); ctx.lineTo(level.loot.r * pulse, 0);
    ctx.lineTo(0, level.loot.r * pulse); ctx.lineTo(-level.loot.r * pulse, 0);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,204,85,0.35)'; ctx.fill();
    ctx.restore();
    label(ctx, level.loot.x, level.loot.y - level.loot.r - 12, 'VAULT CORE', GOLD, 12, 'center');
  }

  if (gadgets.lure) {
    const a = gadgets.lure.life / 6;
    ctx.strokeStyle = `rgba(255,140,60,${0.25 + a * 0.5})`;
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(gadgets.lure.x, gadgets.lure.y, i * 12 + (1 - a) * 16, 0, 6.283); ctx.stroke(); }
  }
  if (gadgets.pulse > 0) {
    ctx.strokeStyle = `rgba(120,220,255,${gadgets.pulse})`;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(player.x, player.y, (1 - gadgets.pulse) * 260, 0, 6.283); ctx.stroke();
  }

  for (const g of guards) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.angle);
    ctx.fillStyle = g.mode === 'investigate' ? RED : AMBER;
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-9, 8); ctx.lineTo(-9, -8); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (g.mode === 'investigate') label(ctx, g.x, g.y - 18, '?', RED, 18, 'center');
  }
  for (const c of cams) {
    ctx.fillStyle = c.disabled ? '#3b5568' : '#8fa9ff';
    ctx.fillRect(c.x - 7, c.y - 7, 14, 14);
    ctx.strokeStyle = '#0a1220'; ctx.strokeRect(c.x - 7, c.y - 7, 14, 14);
    ctx.fillStyle = '#101a2c'; ctx.fillRect(c.x + Math.cos(c.angle) * 10 - 3, c.y + Math.sin(c.angle) * 10 - 3, 6, 6);
  }

  if (gadgets.cloak <= 0) {
    ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.facing);
    ctx.shadowColor = CYAN; ctx.shadowBlur = 14;
    ctx.fillStyle = '#f2fbff';
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(0, 10); ctx.lineTo(-10, 0); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = `rgba(120,230,255,${0.35 + 0.25 * Math.sin(time * 12)})`;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y, 16, 0, 6.283); ctx.stroke();
  }

  ctx.fillStyle = 'rgba(5,10,18,0.88)';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.strokeStyle = '#2d5a7c'; ctx.beginPath(); ctx.moveTo(0, 64); ctx.lineTo(1280, 64); ctx.stroke();
  label(ctx, 22, 26, 'NIGHTSHIFT', '#eaf6ff', 22);
  label(ctx, 22, 48, `SECTOR ${level.sector}  ·  ${level.name}`, '#7fa8c4', 12);

  const bx = 470, bw = 340;
  label(ctx, bx, 22, `ALARM  ${Math.floor(alarm)}%`, alarm > 65 ? RED : alarm > 30 ? AMBER : CYAN, 13);
  ctx.fillStyle = '#16283a'; ctx.fillRect(bx, 30, bw, 16);
  ctx.fillStyle = alarm > 65 ? RED : alarm > 30 ? AMBER : CYAN;
  ctx.fillRect(bx + 2, 32, (bw - 4) * alarm / 100, 12);
  ctx.strokeStyle = '#4a7694'; ctx.strokeRect(bx, 30, bw, 16);

  label(ctx, 1256, 24, `CREDITS ${credits}`, GOLD, 15, 'right');
  label(ctx, 1256, 48, `HAUL $${level.value.toLocaleString()}`, lootTaken ? GREEN : '#7fa8c4', 12, 'right');

  ctx.fillStyle = 'rgba(5,10,18,0.86)';
  ctx.fillRect(0, 676, 1280, 44);
  GADGETS.forEach((g, i) => {
    const x = 22 + i * 210;
    const on = selected === i;
    ctx.fillStyle = on ? 'rgba(99,214,255,0.18)' : 'rgba(20,36,54,0.7)';
    ctx.fillRect(x, 684, 196, 28);
    ctx.strokeStyle = on ? CYAN : '#2b4b66'; ctx.strokeRect(x, 684, 196, 28);
    label(ctx, x + 8, 702, `${g.key} ${g.name}  ${g.cost}c`, on ? CYAN : '#8fb0c6', 11);
  });
  label(ctx, 1256, 702, message || 'WASD move · SHIFT sprint · E hack · 1-3 gadget · click deploy · R restart', '#7fa8c4', 11, 'right');

  if (mode === 'title' || mode === 'caught' || mode === 'win') {
    ctx.fillStyle = 'rgba(4,8,15,0.78)'; ctx.fillRect(0, 0, 1280, 720);
    const big = mode === 'title' ? 'NIGHTSHIFT' : mode === 'caught' ? 'LOCKDOWN' : 'CLEAN GETAWAY';
    label(ctx, 640, 300, big, mode === 'caught' ? RED : mode === 'win' ? GREEN : '#eaf6ff', 62, 'center');
    label(ctx, 640, 350, mode === 'title' ? 'THE QUIET VAULT  ·  three floors, one silent night' : mode === 'caught' ? 'The alarm won. Read the cones and try another route.' : `Vault core secured — $${level.value.toLocaleString()} in the bag.`, '#a9c6da', 18, 'center');
    label(ctx, 640, 400, mode === 'title' ? 'PRESS ENTER TO BEGIN' : 'PRESS R TO RUN IT AGAIN', CYAN, 16, 'center');
  }
}
