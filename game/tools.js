export const GADGETS = [
  { id: 'lure', key: '1', name: 'Distraction Lure', cost: 25, duration: 6 },
  { id: 'emp', key: '2', name: 'Micro EMP', cost: 45, duration: 7 },
  { id: 'cloak', key: '3', name: 'Phase Cloak', cost: 70, duration: 5 }
];

export function makeGadgetState() {
  return { credits: 150, selected: 0, lure: null, emp: 0, cloak: 0 };
}

export function deploy(g, id, x, y) {
  const spec = GADGETS.find((v) => v.id === id);
  if (!spec || g.credits < spec.cost) return false;
  g.credits -= spec.cost;
  if (id === 'lure') g.lure = { x, y, t: spec.duration };
  else if (id === 'emp') g.emp = spec.duration;
  else g.cloak = spec.duration;
  return true;
}

export function tickGadgets(g, dt, player) {
  if (g.lure) {
    g.lure.t -= dt;
    if (g.lure.t <= 0) g.lure = null;
  }
  g.emp = Math.max(0, g.emp - dt);
  g.cloak = Math.max(0, g.cloak - dt);
  player.cloaked = g.cloak > 0;
}
