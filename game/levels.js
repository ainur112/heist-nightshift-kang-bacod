// Hand-authored floor plans for NIGHTSHIFT. Each floor offers three ways through:
// a shadow corridor, a timed camera sweep, or a hacked terminal that kills the lasers.
export const LEVELS = [
  {
    name: 'ATRIUM', sector: '01 / LOBBY', value: 25000,
    start: { x: 96, y: 130 },
    walls: [
      { x: 0, y: 64, w: 1280, h: 14 }, { x: 0, y: 706, w: 1280, h: 14 },
      { x: 0, y: 64, w: 14, h: 656 }, { x: 1266, y: 64, w: 14, h: 656 },
      { x: 310, y: 180, w: 32, h: 150 }, { x: 690, y: 390, w: 32, h: 170 },
      { x: 980, y: 170, w: 32, h: 150 }, { x: 500, y: 130, w: 150, h: 22 },
    ],
    shadows: [
      { x: 80, y: 210, w: 190, h: 110 }, { x: 540, y: 540, w: 200, h: 120 },
      { x: 1030, y: 470, w: 190, h: 130 }, { x: 820, y: 190, w: 120, h: 90 },
    ],
    guards: [
      { path: [[260, 330], [260, 620], [540, 620], [540, 330]], speed: 74 },
      { path: [[790, 220], [1150, 220], [1150, 500], [790, 500]], speed: 80 },
    ],
    cameras: [
      { x: 640, y: 96, base: 1.57, sweep: 0.85, speed: 0.75 },
      { x: 1180, y: 96, base: 2.05, sweep: 0.6, speed: 0.55 },
    ],
    terminals: [{ x: 170, y: 620 }],
    lasers: [{ x1: 600, y1: 430, x2: 900, y2: 430 }],
    loot: { x: 900, y: 300, r: 20 },
    extract: { x: 40, y: 600, w: 120, h: 80 },
  },
  {
    name: 'SERVER GALLERY', sector: '02 / COMPUTE', value: 40000,
    start: { x: 100, y: 640 },
    walls: [
      { x: 0, y: 64, w: 1280, h: 14 }, { x: 0, y: 706, w: 1280, h: 14 },
      { x: 0, y: 64, w: 14, h: 656 }, { x: 1266, y: 64, w: 14, h: 656 },
      { x: 240, y: 160, w: 26, h: 240 }, { x: 240, y: 470, w: 26, h: 180 },
      { x: 620, y: 200, w: 26, h: 330 }, { x: 930, y: 130, w: 26, h: 220 },
      { x: 930, y: 430, w: 26, h: 210 },
    ],
    shadows: [
      { x: 70, y: 300, w: 150, h: 150 }, { x: 420, y: 560, w: 180, h: 110 },
      { x: 720, y: 130, w: 180, h: 110 }, { x: 1050, y: 520, w: 180, h: 130 },
    ],
    guards: [
      { path: [[300, 130], [300, 660], [560, 660], [560, 130]], speed: 82 },
      { path: [[700, 180], [1180, 180], [1180, 420], [700, 420]], speed: 88 },
      { path: [[1050, 660], [1050, 470], [760, 470], [760, 660]], speed: 78 },
    ],
    cameras: [
      { x: 480, y: 96, base: 1.4, sweep: 0.9, speed: 0.8 },
      { x: 840, y: 96, base: 1.9, sweep: 0.7, speed: 0.6 },
      { x: 1120, y: 500, base: 3.1, sweep: 0.8, speed: 0.5 },
    ],
    terminals: [{ x: 120, y: 180 }, { x: 700, y: 640 }],
    lasers: [{ x1: 400, y1: 430, x2: 620, y2: 430 }, { x1: 960, y1: 380, x2: 1240, y2: 380 }],
    loot: { x: 1120, y: 200, r: 22 },
    extract: { x: 40, y: 60, w: 130, h: 80 },
  },
  {
    name: 'TOP FLOOR VAULT', sector: '03 / HOLDING', value: 75000,
    start: { x: 640, y: 660 },
    walls: [
      { x: 0, y: 64, w: 1280, h: 14 }, { x: 0, y: 706, w: 1280, h: 14 },
      { x: 0, y: 64, w: 14, h: 656 }, { x: 1266, y: 64, w: 14, h: 656 },
      { x: 380, y: 250, w: 28, h: 300 }, { x: 870, y: 250, w: 28, h: 300 },
      { x: 540, y: 170, w: 200, h: 24 }, { x: 540, y: 550, w: 200, h: 24 },
    ],
    shadows: [
      { x: 180, y: 140, w: 170, h: 120 }, { x: 180, y: 510, w: 170, h: 120 },
      { x: 1010, y: 140, w: 190, h: 120 }, { x: 1010, y: 510, w: 190, h: 120 },
    ],
    guards: [
      { path: [[240, 250], [240, 560], [350, 560], [350, 250]], speed: 86 },
      { path: [[480, 130], [820, 130], [820, 620], [480, 620]], speed: 92 },
      { path: [[980, 250], [1180, 250], [1180, 560], [980, 560]], speed: 90 },
    ],
    cameras: [
      { x: 300, y: 96, base: 1.3, sweep: 0.9, speed: 0.85 },
      { x: 980, y: 96, base: 1.85, sweep: 0.9, speed: 0.7 },
      { x: 640, y: 380, base: 3.14, sweep: 1.1, speed: 0.6 },
    ],
    terminals: [{ x: 160, y: 380 }, { x: 1120, y: 380 }],
    lasers: [{ x1: 420, y1: 320, x2: 860, y2: 320 }, { x1: 420, y1: 470, x2: 860, y2: 470 }],
    loot: { x: 640, y: 390, r: 26 },
    extract: { x: 1140, y: 620, w: 110, h: 70 },
  },
];
