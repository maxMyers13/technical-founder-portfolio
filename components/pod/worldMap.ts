/**
 * The globe's surface: an original, hand-inked fan-map style world (tan continents, thick wobbly coastlines,
 * political regions in faded colour, red italic continent names, red pins). The regions are the site's sections and
 * the pins are real places in Max's story. Drawn once as an equirectangular canvas (u = longitude, v = latitude) and
 * wrapped on the sphere. Deterministic: a seeded RNG, so every visitor gets the same world.
 */

const W = 4096;
const H = 2048;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

/** A noisy closed outline: a stretched circle whose radius wobbles at many frequencies, like a hand-drawn coast. */
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, rough = 0.32, n = 420): Pt[] {
  const r = rng(seed);
  const waves = Array.from({ length: 14 }, (_, i) => {
    const f = 2 + i * (i < 5 ? 1 : 2.3);
    return { f, a: (rough / Math.pow(f, 0.85)) * (0.6 + r() * 0.8), p: r() * Math.PI * 2 };
  });
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    let k = 1;
    for (const w of waves) k += Math.sin(t * w.f + w.p) * w.a;
    k += (r() - 0.5) * rough * 0.06;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  return pts;
}

function trace(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

const INK = '#1d140c';
const LAND = '#a9875a';
const DISPLAY = "'Bagel Fat One', 'Nunito', system-ui, sans-serif";
const BODY = "'Nunito', system-ui, sans-serif";

type Region = { name: string; kind: string; light: string; deep: string; on: number; shape: Pt[]; label: Pt };
type Pin = { at: Pt; label: string[]; side?: 'l' | 'r' };

export function drawWorldMap(canvas: HTMLCanvasElement = document.createElement('canvas')) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sea: pale sky blue, a touch lighter toward the equator.
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#7ccbef');
  sea.addColorStop(0.5, '#a3def7');
  sea.addColorStop(1, '#7ccbef');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, W, H);

  // Continents (kept between ~60 degrees north and south so nothing smears at the poles).
  const continents: Pt[][] = [
    blob(880, 980, 560, 430, 11, 0.34), // west: the Maryland continent
    blob(1560, 620, 300, 200, 23, 0.4), // northwest
    blob(2700, 880, 700, 360, 37, 0.3), // east: the Chromium continent
    blob(2330, 1470, 270, 170, 41, 0.42), // south
    blob(3600, 1240, 320, 280, 53, 0.36), // far east
  ];
  const r = rng(7);
  const islands: Pt[][] = [];
  for (let i = 0; i < 34; i++) {
    const x = r() * W;
    const y = 520 + r() * 1000;
    const s = 18 + r() * 60;
    islands.push(blob(x, y, s * (1 + r()), s, 100 + i, 0.5, 90));
  }
  // An atoll, like a ring in the sea.
  const atoll = blob(1960, 420, 90, 70, 77, 0.3, 160);
  const lagoon = blob(1960, 420, 40, 30, 78, 0.3, 120);

  ctx.lineJoin = 'round';
  for (const c of [...continents, ...islands, atoll]) {
    trace(ctx, c);
    ctx.fillStyle = LAND;
    ctx.fill();
  }
  trace(ctx, lagoon);
  ctx.fillStyle = '#9ad9f5';
  ctx.fill();

  // Regions: each is a noisy shape clipped to its continent, filled with a light-to-deep fade.
  const regions: Region[] = [
    { name: 'LILO', kind: 'EMPIRE', light: '#fbf6b8', deep: '#e6dc3a', on: 2, shape: blob(2520, 780, 360, 200, 201, 0.38), label: [2500, 790] },
    { name: 'BUILDS', kind: 'FEDERATION OF', light: '#c7ecb0', deep: '#4fae4c', on: 2, shape: blob(2860, 1090, 420, 180, 202, 0.34), label: [2880, 1080] },
    { name: 'LIFE', kind: 'KINGDOM', light: '#f6b8ef', deep: '#cf55c4', on: 0, shape: blob(740, 820, 330, 230, 203, 0.36), label: [700, 820] },
    { name: 'SPEAKING', kind: 'UNITED STATES OF', light: '#ffb3ab', deep: '#ec4f46', on: 0, shape: blob(980, 1200, 380, 240, 204, 0.36), label: [990, 1170] },
    { name: 'WRITING', kind: 'REPUBLIC', light: '#c9c9ff', deep: '#4f55ea', on: 1, shape: blob(1560, 640, 250, 150, 205, 0.4), label: [1550, 650] },
    { name: 'ASK WM3', kind: 'UNION', light: '#ffd29a', deep: '#f0861e', on: 3, shape: blob(2330, 1470, 300, 200, 206, 0.2), label: [2330, 1470] },
  ];
  for (const g of regions) {
    ctx.save();
    trace(ctx, continents[g.on]);
    ctx.clip();
    trace(ctx, g.shape);
    const xs = g.shape.map((p) => p[0]);
    const grad = ctx.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
    grad.addColorStop(0, g.deep);
    grad.addColorStop(1, g.light);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }

  // Coastlines last, thick and inky, so region edges tuck under them.
  for (const c of [...continents, atoll, lagoon]) {
    trace(ctx, c);
    ctx.lineWidth = 9;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
  for (const c of islands) {
    trace(ctx, c);
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.stroke();
  }

  const label = (text: string, x: number, y: number, size: number, font: string, color = INK, italic = false) => {
    ctx.font = `${italic ? 'italic ' : ''}900 ${size}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(6, size * 0.16);
    ctx.strokeStyle = 'rgba(255, 252, 240, 0.9)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  for (const g of regions) {
    const [x, y] = g.label;
    const pre = g.kind.endsWith(' OF');
    if (pre) {
      label(g.kind, x, y - 62, 36, BODY);
      label(g.name, x, y, 92, DISPLAY);
    } else {
      label(g.name, x, y - 14, 92, DISPLAY);
      label(g.kind, x, y + 52, 36, BODY);
    }
  }

  // Continent names: red, italic, slanted across the land.
  const continentName = (text: string, x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    label(text, 0, 0, 64, DISPLAY, '#d12a1f', true);
    ctx.restore();
  };
  continentName('MARYLAND CONTINENT', 1080, 1430, -0.08);
  continentName('CHROMIUM CONTINENT', 3130, 760, -0.05);

  // Sea and island names.
  label('THE ATOLL', 1960, 540, 34, BODY);
  label('GREEN-LIGHT SEA', 1900, 1180, 40, BODY, '#1e5a78');

  // Pins: a red map pin with an ink outline, and a two-line label beside it.
  const pins: Pin[] = [
    { at: [560, 700], label: ['BALTIMORE'], side: 'r' },
    { at: [880, 920], label: ['COLLEGE PARK', 'UMD TRACK'], side: 'r' },
    { at: [470, 1010], label: ['FORT MEADE', 'COMMISSARY'], side: 'r' },
    { at: [2760, 1180], label: ['REDMOND', 'EDGE + CHROMIUM'], side: 'r' },
    { at: [1210, 1080], label: ['SEATTLE', 'SRE DAY'], side: 'r' },
    { at: [760, 1330], label: ['AUSTIN', 'SRE DAY'], side: 'r' },
    { at: [2380, 700], label: ['YC STARTUP', 'SCHOOL'], side: 'l' },
    { at: [2290, 1430], label: ['THE ARCHIVE'], side: 'r' },
  ];
  for (const p of pins) {
    const [x, y] = p.at;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8, -20, -22, -30, -22, -48);
    ctx.arc(0, -48, 22, Math.PI, 0);
    ctx.bezierCurveTo(22, -30, 8, -20, 0, 0);
    ctx.closePath();
    ctx.fillStyle = '#e0312a';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -48, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#7a1410';
    ctx.fill();
    ctx.restore();
    const dx = p.side === 'l' ? -36 : 36;
    ctx.textAlign = p.side === 'l' ? 'right' : 'left';
    p.label.forEach((line, i) => {
      const size = i === 0 ? 36 : 26;
      ctx.font = `900 ${size}px ${BODY}`;
      ctx.lineWidth = 7;
      ctx.strokeStyle = 'rgba(255, 252, 240, 0.9)';
      ctx.textBaseline = 'middle';
      const ty = y - 46 + i * 34;
      ctx.strokeText(line, x + dx, ty);
      ctx.fillStyle = INK;
      ctx.fillText(line, x + dx, ty);
    });
  }

  // A title cartouche in the sea, like the top of a printed map.
  label("MAX'S WORLD", 3350, 520, 110, DISPLAY, '#d12a1f');

  return canvas;
}

/** Draw once with whatever fonts are ready, then again when the display fonts arrive. */
export function worldMapWhenFontsReady(onDraw: (canvas: HTMLCanvasElement) => void) {
  const canvas = drawWorldMap();
  onDraw(canvas);
  if (typeof document === 'undefined' || !document.fonts) return;
  Promise.all([
    document.fonts.load(`900 92px 'Bagel Fat One'`),
    document.fonts.load(`900 36px 'Nunito'`),
    document.fonts.load(`italic 900 64px 'Bagel Fat One'`),
  ])
    .then(() => onDraw(drawWorldMap(canvas)))
    .catch(() => {});
}
