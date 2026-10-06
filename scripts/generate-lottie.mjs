// Generates the game's Lottie celebration animations as plain JSON shape
// layers — no external Lottie assets, so nothing to license, attribute,
// or worry about the terms of (community Lottie files have wildly mixed
// licenses). Run with `node scripts/generate-lottie.mjs` after tweaking
// anything below; it overwrites assets/lottie/*.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'lottie');
const FR = 60; // frames per second

/** One rectangle "confetti" particle, launched from the center toward
 * `angleDeg` and fading out as it goes — a shape layer with keyframed
 * position/rotation/opacity/scale. */
function confettiParticle(index, { angleDeg, distance, color, size, startFrame, durationFrames, spins }) {
  const cx = 200;
  const cy = 200;
  const rad = (angleDeg * Math.PI) / 180;
  const endX = cx + Math.cos(rad) * distance;
  // Confetti arcs up then falls — bias the endpoint downward and add a
  // mid-flight peak higher than both ends.
  const endY = cy + Math.sin(rad) * distance * 0.5 + 60;
  const peakX = cx + Math.cos(rad) * distance * 0.55;
  const peakY = cy + Math.sin(rad) * distance * 0.55 - 70;
  const endFrame = startFrame + durationFrames;
  const fadeStart = startFrame + Math.round(durationFrames * 0.6);

  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: `particle-${index}`,
    sr: 1,
    ip: startFrame,
    op: endFrame,
    st: startFrame,
    ks: {
      o: {
        a: 1,
        k: [
          { t: startFrame, s: [0] },
          { t: startFrame + 3, s: [100] },
          { t: fadeStart, s: [100] },
          { t: endFrame, s: [0] },
        ],
      },
      r: {
        a: 1,
        k: [
          { t: startFrame, s: [0] },
          { t: endFrame, s: [spins * 360] },
        ],
      },
      p: {
        a: 1,
        k: [
          { t: startFrame, s: [cx, cy, 0], to: [0, 0, 0], ti: [0, 0, 0] },
          { t: startFrame + Math.round(durationFrames * 0.45), s: [peakX, peakY, 0] },
          { t: endFrame, s: [endX, endY, 0] },
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { t: startFrame, s: [0, 0, 100] },
          { t: startFrame + 6, s: [100, 100, 100] },
          { t: endFrame, s: [70, 70, 100] },
        ],
      },
    },
    shapes: [
      {
        ty: 'rc',
        nm: 'rect',
        p: { a: 0, k: [0, 0] },
        s: { a: 0, k: [size, size * 0.42] },
        r: { a: 0, k: 2 },
      },
      {
        ty: 'fl',
        nm: 'fill',
        c: { a: 0, k: color },
        o: { a: 0, k: 100 },
      },
    ],
  };
}

/** A burst of confetti particles in a ring, staggered slightly so it
 * reads as a "pop" rather than everything moving in lockstep. Colors
 * pulled from the region palette so it visually matches the puzzle. */
function buildConfetti() {
  const colors = [
    [0.545, 0.765, 0.29, 1], // toxic green
    [0.941, 0.761, 0.243, 1], // moon yellow
    [0.851, 0.467, 0.341, 1], // pumpkin
    [0.31, 0.494, 0.788, 1], // moonlit blue
    [0.788, 0.651, 0.42, 1], // grave dirt
    [0.49, 0.784, 0.651, 1], // swamp teal
  ];
  const count = 16;
  const durationFrames = 66;
  const layers = [];
  for (let i = 0; i < count; i++) {
    const angleDeg = (360 / count) * i + (i % 2 === 0 ? -8 : 8);
    const distance = 130 + (i % 3) * 25;
    const color = colors[i % colors.length];
    const size = 10 + (i % 3) * 4;
    const startFrame = (i % 4) * 2;
    const spins = 1.5 + (i % 3) * 0.5;
    layers.push(confettiParticle(i + 1, { angleDeg, distance, color, size, startFrame, durationFrames, spins }));
  }
  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: durationFrames + 8,
    w: 400,
    h: 400,
    nm: 'confetti',
    ddd: 0,
    assets: [],
    layers,
  };
}

/** A small heart that pops up, wobbles, and fades — used above the
 * companion when it's fed, a much quieter moment than the win confetti. */
function buildHeartPop() {
  const durationFrames = 54;
  const layer = {
    ddd: 0,
    ind: 1,
    ty: 4,
    nm: 'heart',
    sr: 1,
    ip: 0,
    op: durationFrames,
    st: 0,
    ks: {
      o: {
        a: 1,
        k: [
          { t: 0, s: [0] },
          { t: 6, s: [100] },
          { t: 36, s: [100] },
          { t: durationFrames, s: [0] },
        ],
      },
      r: {
        a: 1,
        k: [
          { t: 0, s: [-8] },
          { t: 16, s: [8] },
          { t: 32, s: [-6] },
          { t: durationFrames, s: [0] },
        ],
      },
      p: {
        a: 1,
        k: [
          { t: 0, s: [200, 260, 0] },
          { t: durationFrames, s: [200, 140, 0] },
        ],
      },
      a: { a: 0, k: [0, 0, 0] },
      s: {
        a: 1,
        k: [
          { t: 0, s: [0, 0, 100] },
          { t: 10, s: [130, 130, 100] },
          { t: 18, s: [100, 100, 100] },
          { t: durationFrames, s: [90, 90, 100] },
        ],
      },
    },
    shapes: [
      {
        ty: 'sh',
        nm: 'heart-path',
        ks: {
          a: 0,
          k: {
            i: [
              [0, -22], [-38, -28], [-38, 10], [0, 40], [0, 40], [38, 10], [38, -28],
            ],
            o: [
              [0, -22], [-38, -28], [-38, 10], [0, 40], [0, 40], [38, 10], [38, -28],
            ],
            v: [
              [0, -10], [-36, -18], [-36, 14], [0, 46], [0, 46], [36, 14], [36, -18],
            ],
            c: true,
          },
        },
      },
      {
        ty: 'fl',
        nm: 'fill',
        c: { a: 0, k: [0.851, 0.467, 0.341, 1] },
        o: { a: 0, k: 100 },
      },
    ],
  };
  return {
    v: '5.9.6',
    fr: FR,
    ip: 0,
    op: durationFrames,
    w: 400,
    h: 400,
    nm: 'heart-pop',
    ddd: 0,
    assets: [],
    layers: [layer],
  };
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'confetti.json'), JSON.stringify(buildConfetti()));
fs.writeFileSync(path.join(OUT_DIR, 'heart-pop.json'), JSON.stringify(buildHeartPop()));
console.log('Wrote assets/lottie/confetti.json and heart-pop.json');
