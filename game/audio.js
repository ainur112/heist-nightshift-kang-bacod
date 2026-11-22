// Procedural sound: no files, no network. A context starts only after the first key or click.
let ac = null;

function ctx() {
  if (!ac) {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    ac = new A();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq, dur, type, gain, slide = 0) {
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}

export function step(sprint) { tone(sprint ? 150 : 110, 0.05, 'triangle', 0.035); }
export function lure() { tone(880, 0.16, 'sine', 0.07, -420); }
export function emp() { tone(220, 0.5, 'sawtooth', 0.06, -170); }
export function cloak() { tone(520, 0.4, 'sine', 0.05, 320); }
export function pickup() { tone(660, 0.16, 'triangle', 0.08, 300); }
export function alert() { tone(320, 0.22, 'square', 0.05, -120); }
export function heartbeat() { tone(80, 0.12, 'sine', 0.07); }
export function fanfare() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.07), i * 120)); }
