/**
 * More painted surfaces for the pod (see propTextures.ts for the conventions: every painter takes w x h at
 * the face's exact aspect, and all of it is original art).
 */

const SERIF = "'Times New Roman', Georgia, serif";
const DISPLAY = "'Bagel Fat One', 'Nunito', system-ui, sans-serif";

function make(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, g: c.getContext('2d') as CanvasRenderingContext2D };
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The lower 48, coarsely, as [lon, lat], clockwise from the Washington coast. */
const US: [number, number][] = [
  [-124.7, 48.4], [-123.0, 49.0], [-95.2, 49.0], [-89.6, 48.0], [-88.4, 48.3], [-84.6, 46.5], [-82.5, 45.3], [-82.4, 43.0],
  [-83.5, 42.0], [-82.5, 41.7], [-79.0, 42.8], [-79.0, 43.3], [-76.8, 43.6], [-74.8, 45.0], [-71.5, 45.0], [-69.2, 47.4],
  [-67.8, 47.1], [-67.0, 44.8], [-68.0, 44.4], [-70.2, 43.7], [-70.6, 42.7], [-70.0, 41.8], [-70.6, 41.6], [-72.0, 41.0],
  [-74.0, 40.5], [-75.0, 38.8], [-75.9, 38.0], [-76.0, 37.0], [-75.5, 35.3], [-77.0, 34.6], [-79.0, 33.6], [-80.9, 32.0],
  [-81.4, 30.7], [-80.6, 28.6], [-80.0, 26.8], [-80.4, 25.2], [-81.8, 26.0], [-82.7, 28.0], [-84.0, 30.0], [-85.4, 29.7],
  [-88.0, 30.6], [-89.6, 30.2], [-89.4, 29.0], [-91.0, 29.2], [-93.8, 29.7], [-95.0, 29.3], [-97.4, 27.8], [-97.4, 25.9],
  [-99.5, 27.5], [-101.4, 29.8], [-103.1, 29.0], [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.3], [-111.0, 31.3],
  [-114.7, 32.7], [-117.1, 32.5], [-118.4, 34.0], [-120.6, 34.6], [-122.4, 37.8], [-123.8, 39.8], [-124.2, 41.9],
  [-124.1, 43.0], [-124.0, 46.3],
];

const LAKES: [number, number][][] = [
  [[-92.1, 46.8], [-89.5, 47.9], [-86.5, 47.6], [-84.6, 46.6], [-87.2, 46.5], [-90.0, 46.6]], // Superior
  [[-87.8, 42.4], [-87.2, 44.0], [-86.0, 45.9], [-85.2, 45.4], [-86.3, 43.6], [-86.6, 42.2]], // Michigan
  [[-84.6, 45.8], [-82.4, 45.3], [-81.7, 44.5], [-82.5, 43.1], [-83.4, 44.0], [-84.0, 45.0]], // Huron
  [[-83.3, 41.8], [-80.5, 42.2], [-79.0, 42.8], [-79.8, 42.6], [-82.6, 41.6]], // Erie
  [[-79.8, 43.3], [-77.5, 43.4], [-76.3, 43.9], [-77.8, 43.7], [-79.6, 43.6]], // Ontario
];

const RIVERS: [number, number][][] = [
  [[-95.2, 47.2], [-93.3, 45.0], [-91.2, 43.0], [-90.6, 41.4], [-90.2, 38.6], [-89.2, 36.5], [-90.1, 34.0], [-91.2, 31.3], [-90.1, 29.9], [-89.3, 29.1]], // Mississippi
  [[-111.4, 45.9], [-104.0, 48.0], [-100.8, 46.8], [-98.0, 42.8], [-96.0, 41.2], [-94.6, 39.1], [-92.0, 38.6], [-90.2, 38.8]], // Missouri
  [[-80.0, 40.4], [-82.5, 38.4], [-85.8, 38.2], [-88.0, 37.1], [-89.2, 37.0]], // Ohio
  [[-106.6, 39.2], [-104.0, 38.2], [-100.0, 37.8], [-97.3, 37.7], [-95.4, 35.8], [-91.0, 33.9]], // Arkansas
];

/**
 * A hand-painted route map of the United States in the manner of a cross-country race map: parchment land,
 * a contoured ocean, and one red route, starred at each stop. The stops are Max's builds in order,
 * from Redmond (where the Microsoft ones were made) to Baltimore, where Pathion is.
 */
export function routeMap(w = 1600, h = 900) {
  const { c, g } = make(w, h);
  const r = rng(7);
  // equirectangular, shrunk east-west by cos(38 deg) so the country keeps its shape
  const lon0 = -125.5, lon1 = -66.0, lat0 = 24.0, lat1 = 50.0;
  const k = Math.cos((38 * Math.PI) / 180);
  const spanX = (lon1 - lon0) * k;
  const spanY = lat1 - lat0;
  const scale = Math.min((w * 0.92) / spanX, (h * 0.86) / spanY);
  const ox = (w - spanX * scale) / 2;
  const oy = (h - spanY * scale) / 2 + h * 0.02;
  const P = ([lon, lat]: [number, number]): [number, number] => [ox + (lon - lon0) * k * scale, oy + (lat1 - lat) * scale];
  const path = (pts: [number, number][], close = true) => {
    g.beginPath();
    pts.forEach((p, i) => {
      const [x, y] = P(p);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    if (close) g.closePath();
  };

  // the sea, with the engraver's contour lines rippling out from the coast
  const sea = g.createLinearGradient(0, 0, w, h);
  sea.addColorStop(0, '#5fa9c2');
  sea.addColorStop(1, '#3d8bab');
  g.fillStyle = sea;
  g.fillRect(0, 0, w, h);
  g.lineJoin = 'round';
  for (let i = 14; i >= 1; i--) {
    path(US);
    g.lineWidth = i * 9;
    g.strokeStyle = i % 2 ? 'rgba(220, 240, 245, 0.16)' : 'rgba(30, 80, 110, 0.12)';
    g.stroke();
  }
  // the land: parchment, mottled, with darker high country in the west
  path(US);
  const land = g.createLinearGradient(0, 0, w, 0);
  land.addColorStop(0, '#d7c27a');
  land.addColorStop(0.35, '#e6d790');
  land.addColorStop(1, '#dcd98e');
  g.fillStyle = land;
  g.fill();
  g.save();
  path(US);
  g.clip();
  for (let i = 0; i < 900; i++) {
    const x = r() * w, y = r() * h, rad = 6 + r() * 40;
    g.fillStyle = `rgba(${r() < 0.5 ? '150, 120, 60' : '255, 250, 210'}, ${0.03 + r() * 0.05})`;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  // the Rockies: a long band of hatched ridges
  const ridge: [number, number][] = [[-114.0, 48.8], [-112.0, 45.5], [-110.0, 43.0], [-107.0, 40.0], [-106.0, 37.0], [-105.5, 34.0]];
  for (let i = 0; i < 260; i++) {
    const t = r() * (ridge.length - 1);
    const a = ridge[Math.floor(t)], b = ridge[Math.ceil(t)];
    const f = t - Math.floor(t);
    const [x, y] = P([a[0] + (b[0] - a[0]) * f + (r() - 0.5) * 7, a[1] + (b[1] - a[1]) * f + (r() - 0.5) * 2]);
    g.strokeStyle = 'rgba(120, 85, 40, 0.35)';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 9, y + 6);
    g.lineTo(x, y - 7);
    g.lineTo(x + 9, y + 6);
    g.stroke();
  }
  g.restore();
  path(US);
  g.lineWidth = 3;
  g.strokeStyle = '#4b5d3c';
  g.stroke();
  for (const lake of LAKES) {
    path(lake);
    g.fillStyle = '#6fb3c8';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = '#3f6f80';
    g.stroke();
  }
  for (const river of RIVERS) {
    path(river, false);
    g.lineWidth = 2.6;
    g.strokeStyle = '#4f8fb0';
    g.stroke();
  }

  // big engraved lettering, spaced out across the country
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(110, 80, 40, 0.38)';
  g.font = `700 ${h * 0.11}px ${SERIF}`;
  const word = 'UNITED  STATES';
  const [ux, uy] = P([-98.5, 38.6]);
  g.save();
  g.translate(ux, uy);
  g.fillText(word.split('').join(' '), 0, 0);
  g.restore();
  g.font = `600 ${h * 0.03}px ${SERIF}`;
  g.fillStyle = 'rgba(70, 60, 40, 0.75)';
  for (const [name, at] of [
    ['WASHINGTON', [-120.5, 47.4]], ['OREGON', [-120.5, 44.0]], ['NEVADA', [-116.8, 39.3]], ['COLORADO', [-105.5, 38.9]],
    ['KANSAS', [-98.4, 38.5]], ['ILLINOIS', [-89.2, 40.0]], ['TEXAS', [-99.0, 31.3]], ['MARYLAND', [-76.9, 38.4]],
  ] as [string, [number, number]][]) {
    const [x, y] = P(at);
    g.fillText(name, x, y);
  }

  // the route: start, stops, goal
  const stops: { at: [number, number]; label: string; sub: string }[] = [
    { at: [-122.1, 47.7], label: 'START · REDMOND', sub: 'PWA Hub · 2021' },
    { at: [-116.2, 43.6], label: 'Draggable regions', sub: 'WebView2 · 2022' },
    { at: [-104.9, 39.7], label: 'Find on Page API', sub: 'WebView2 · 2024' },
    { at: [-94.6, 39.1], label: 'Media Telemetry Copilot', sub: 'hackathon' },
    { at: [-87.6, 41.9], label: 'WM3', sub: 'this site · 2026' },
    { at: [-76.6, 39.3], label: 'GOAL · BALTIMORE', sub: 'Pathion · LILO' },
  ];
  const pts = stops.map((s) => P(s.at));
  g.lineWidth = 7;
  g.strokeStyle = '#c8262b';
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const mx = (ax + bx) / 2, my = (ay + by) / 2 + (i % 2 ? -1 : 1) * Math.hypot(bx - ax, by - ay) * 0.12;
    g.quadraticCurveTo(mx, my, bx, by);
  }
  g.stroke();
  const star = (x: number, y: number, R: number) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? R * 0.45 : R;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fillStyle = '#2430a8';
    g.fill();
    g.lineWidth = 2;
    g.strokeStyle = '#f4ecd0';
    g.stroke();
  };
  stops.forEach((s, i) => {
    const [x, y] = pts[i];
    star(x, y, i === 0 || i === stops.length - 1 ? 22 : 17);
    const below = i % 2 === 1;
    g.textAlign = i === stops.length - 1 ? 'right' : 'center';
    const tx = i === stops.length - 1 ? x + 10 : x;
    g.fillStyle = '#b3171d';
    g.font = `700 ${h * 0.034}px ${SERIF}`;
    g.fillText(s.label.toUpperCase(), tx, y + (below ? 44 : -46));
    g.fillStyle = 'rgba(60, 40, 20, 0.85)';
    g.font = `italic 600 ${h * 0.026}px ${SERIF}`;
    g.fillText(s.sub, tx, y + (below ? 74 : -76));
  });

  // a cartouche: the map's title, top right over the Atlantic-side of Canada
  g.textAlign = 'left';
  const bx = w * 0.62, by = h * 0.04, bw = w * 0.34, bh = h * 0.12;
  g.fillStyle = 'rgba(244, 236, 208, 0.92)';
  g.fillRect(bx, by, bw, bh);
  g.lineWidth = 3;
  g.strokeStyle = '#5a4527';
  g.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);
  g.fillStyle = '#3a2a14';
  g.font = `400 ${h * 0.046}px ${DISPLAY}`;
  g.fillText('THE LONG RUN', bx + 24, by + bh * 0.42);
  g.font = `italic 600 ${h * 0.026}px ${SERIF}`;
  g.fillText('Redmond to Baltimore, one build at a time', bx + 24, by + bh * 0.76);
  return c;
}

/**
 * The front of a University of Maryland track singlet, filling the garment's bounding box (the 3D slab cuts
 * the shape): red knit, a black V yoke, flag trim on the straps, MARYLAND across the chest, the 12 hip number and the bib.
 */
export function singletFabric(w = 512, h = 760) {
  const { c, g } = make(w, h);
  const r = rng(118);
  const base = g.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#9e1621');
  base.addColorStop(0.5, '#d01f2c');
  base.addColorStop(1, '#9e1621');
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  // soft vertical folds where the fabric hangs
  for (let i = 0; i < 7; i++) {
    const x = r() * w;
    const fold = g.createLinearGradient(x - 40, 0, x + 40, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0)');
    fold.addColorStop(0.5, `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'}, ${0.05 + r() * 0.06})`);
    fold.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fold;
    g.fillRect(x - 40, h * 0.15, 80, h * 0.85);
  }
  // knit mesh: a fine grid of darker pores
  g.fillStyle = 'rgba(60, 0, 8, 0.22)';
  for (let y = 0; y < h; y += 5) {
    for (let x = (y / 5) % 2 ? 2 : 0; x < w; x += 5) g.fillRect(x, y, 1.6, 1.6);
  }
  // Laid out from Max's race photo (public/assets/photos/track-race.jpg). The texture spans the garment's bounding
  // box: the straps sit at u 0.21-0.33 and 0.67-0.79, the neckline bottoms out at v 0.13.
  const U = (u: number) => u * w, V = (v: number) => v * h;
  // the black V yoke below the neckline, red mesh inside it
  g.fillStyle = '#121212';
  g.beginPath();
  g.moveTo(U(0.27), 0);
  g.lineTo(U(0.73), 0);
  g.lineTo(U(0.5), V(0.31));
  g.closePath();
  g.fill();
  g.fillStyle = '#b3141f';
  g.beginPath();
  g.moveTo(U(0.35), 0);
  g.lineTo(U(0.65), 0);
  g.lineTo(U(0.5), V(0.24));
  g.closePath();
  g.fill();
  g.save();
  g.clip();
  g.fillStyle = 'rgba(40, 0, 6, 0.35)';
  for (let y = 0; y < V(0.24); y += 4) for (let x = U(0.35); x < U(0.65); x += 4) g.fillRect(x + ((y / 4) % 2) * 2, y, 1.6, 1.6);
  g.restore();
  // Maryland flag trim on the straps: black and gold checks on one, red and white crosses on the other
  const check = (u0: number, a: string, b2: string) => {
    const s0 = U(0.03);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = (i + j) % 2 ? a : b2;
      g.fillRect(U(u0) + i * s0, V(0.01) + j * s0, s0, s0);
    }
  };
  check(0.68, '#111', '#e9b62e');
  check(0.21, '#d01f2c', '#f4f4f4');
  // MARYLAND straight across the chest, white with a black keyline
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${h * 0.082}px 'Arial Black', 'Helvetica Neue', Arial, sans-serif`;
  g.lineJoin = 'round';
  g.lineWidth = 7;
  g.strokeStyle = '#111';
  g.strokeText('MARYLAND', w / 2, V(0.4));
  g.fillStyle = '#fff';
  g.fillText('MARYLAND', w / 2, V(0.4));
  // the white hip number pinned over the end of the word
  const hx = U(0.62), hy = V(0.345), hw = U(0.2), hh = V(0.105);
  g.fillStyle = '#fbfbf8';
  g.strokeStyle = '#1a1a1a';
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(hx, hy, hw, hh, 8);
  g.fill();
  g.stroke();
  g.fillStyle = '#111';
  g.font = `900 ${hh * 0.72}px 'Arial Black', Arial, sans-serif`;
  g.fillText('12', hx + hw / 2, hy + hh * 0.55);
  // the bib, with the meet's red header strip, pinned at four corners
  const bx = U(0.26), by = V(0.52), bw = U(0.44), bh = V(0.17);
  g.fillStyle = '#f7f5ef';
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = '#c8202b';
  g.fillRect(bx, by, bw, bh * 0.2);
  g.fillStyle = '#fff';
  g.font = `800 ${bh * 0.12}px 'Arial Black', Arial, sans-serif`;
  g.fillText('KEHOE TWILIGHT MEET', w / 2, by + bh * 0.105);
  g.fillStyle = '#111';
  g.font = `900 ${bh * 0.58}px 'Arial Black', Arial, sans-serif`;
  g.fillText('118', w / 2, by + bh * 0.62);
  g.fillStyle = '#b9b9b9';
  for (const [px, py] of [[bx + 8, by + 8], [bx + bw - 8, by + 8], [bx + 8, by + bh - 8], [bx + bw - 8, by + bh - 8]]) {
    g.beginPath();
    g.arc(px, py, 4, 0, Math.PI * 2);
    g.fill();
  }
  // a thin white binding at the hem
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, V(0.965), w, V(0.02));
  // binding round the neck and armholes reads as a darker edge, which the slab's bevel picks up
  return c;
}
