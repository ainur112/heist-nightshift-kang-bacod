// Procedural Web Audio only. First call creates the context; no files, no network.
let ctx = null;

function ac() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'sine', vol = 0.07, end = null, delay = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (end) o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, vol) {
  const c = ac();
  if (!c) return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = vol;
  src.buffer = buf;
  src.connect(g);
  g.connect(c.destination);
  src.start();
}

export function step() { noise(0.045, 0.035); tone(110, 0.05, 'sine', 0.02); }
export function lure() { tone(880, 0.1, 'square', 0.05, 1320); tone(1320, 0.12, 'square', 0.04, 880, 0.11); }
export function emp() { tone(180, 0.55, 'sawtooth', 0.08, 40); noise(0.4, 0.05); }
export function cloak() { tone(520, 0.4, 'sine', 0.07, 130); }
export function pickup() {
  tone(660, 0.11, 'triangle', 0.07);
  tone(880, 0.11, 'triangle', 0.07, null, 0.1);
  tone(1320, 0.18, 'triangle', 0.07, null, 0.2);
}
export function alert() { tone(440, 0.18, 'square', 0.06, 220); }
export function heartbeat() { tone(72, 0.13, 'sine', 0.1, 46); tone(66, 0.11, 'sine', 0.07, 44, 0.18); }
export function fanfare() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, 'triangle', 0.08, null, i * 0.13));
}
