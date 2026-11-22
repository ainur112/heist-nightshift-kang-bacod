// Spendable tactical gadgets, each with a distinct counter-play role.
export const GADGETS = [
  { id: 'lure', key: '1', name: 'DISTRACTION LURE', cost: 25, hint: 'Pull a guard off patrol' },
  { id: 'emp', key: '2', name: 'MICRO EMP', cost: 45, hint: 'Kill cameras and lasers' },
  { id: 'cloak', key: '3', name: 'PHASE CLOAK', cost: 70, hint: 'Invisible for five seconds' },
];

export function makeGadgetState() {
  return { lure: null, emp: 0, cloak: 0, pulse: 0 };
}

export function deploy(id, x, y, credits, gadgets) {
  const g = GADGETS.find((item) => item.id === id);
  if (!g || credits < g.cost) return { ok: false, credits };
  if (id === 'lure') gadgets.lure = { x, y, life: 6 };
  if (id === 'emp') { gadgets.emp = 7; gadgets.pulse = 1; }
  if (id === 'cloak') gadgets.cloak = 5;
  return { ok: true, credits: credits - g.cost };
}

export function tickGadgets(gadgets, dt) {
  if (gadgets.lure) { gadgets.lure.life -= dt; if (gadgets.lure.life <= 0) gadgets.lure = null; }
  if (gadgets.emp > 0) gadgets.emp = Math.max(0, gadgets.emp - dt);
  if (gadgets.cloak > 0) gadgets.cloak = Math.max(0, gadgets.cloak - dt);
  if (gadgets.pulse > 0) gadgets.pulse = Math.max(0, gadgets.pulse - dt * 1.6);
}
