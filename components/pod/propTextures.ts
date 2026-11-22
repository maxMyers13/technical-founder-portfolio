/**
 * Painted surfaces for the objects in Max's room, drawn on canvases at the exact aspect ratio of the face they go on
 * (every painter takes w x h and the caller sizes the mesh to match, so nothing stretches). All original art:
 * fandom items are nods (a converging-paths poster, a cloak with a Pathion P patch), never copies of logos or characters.
 */

const INK = '#1d140c';
const DISPLAY = "'Bagel Fat One', 'Nunito', system-ui, sans-serif";
const BODY = "'Nunito', system-ui, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

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

/** Sepia poster: dozens of glowing paths branching in from the edges and converging on one bright point. */
export function pathsPoster(w = 900, h = 1200) {
  const { c, g } = make(w, h);
  const bg = g.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2a1d12');
  bg.addColorStop(1, '#5b3f24');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(255, 236, 196, ${0.2 + r() * 0.6})`;
    g.fillRect(r() * w, r() * h * 0.7, 2, 2);
  }
  const cx = w / 2;
  const cy = h * 0.34;
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const a = Math.PI * (0.1 + 0.8 * r());
    const sx = cx + Math.cos(a) * w * (0.7 + r() * 0.5) * (r() < 0.5 ? -1 : 1);
    const sy = h * (0.75 + r() * 0.3);
    const mx = (sx + cx) / 2 + (r() - 0.5) * w * 0.4;
    const my = (sy + cy) / 2 + (r() - 0.5) * h * 0.15;
    g.strokeStyle = `rgba(255, 214, 150, ${0.12 + r() * 0.35})`;
    g.lineWidth = 1.5 + r() * 4;
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(mx, my, cx, cy);
    g.stroke();
  }
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.35);
  glow.addColorStop(0, 'rgba(255, 246, 220, 1)');
  glow.addColorStop(0.15, 'rgba(255, 216, 150, 0.6)');
  glow.addColorStop(1, 'rgba(255, 200, 120, 0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#f6e3bf';
  g.font = `900 ${Math.round(w * 0.075)}px ${DISPLAY}`;
  g.fillText('ALL PATHS', cx, h * 0.84);
  g.fillText('CONVERGE', cx, h * 0.92);
  g.strokeStyle = 'rgba(246, 227, 191, 0.6)';
  g.lineWidth = 6;
  g.strokeRect(18, 18, w - 36, h - 36);
  return c;
}

/** A marathon race bib: white tyvek, a red header band and the finishing time. */
export function raceBib(w = 600, h = 450) {
  const { c, g } = make(w, h);
  g.fillStyle = '#f7f5ef';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#d33b2c';
  g.fillRect(0, 0, w, h * 0.22);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.font = `900 ${h * 0.12}px ${BODY}`;
  g.fillText('MARATHON', w / 2, h * 0.15);
  g.fillStyle = INK;
  g.font = `900 ${h * 0.42}px ${DISPLAY}`;
  g.fillText('3:25', w / 2, h * 0.68);
  g.font = `800 ${h * 0.08}px ${BODY}`;
  g.fillText('FINISHER · STILL HAD A KICK', w / 2, h * 0.88);
  g.fillStyle = '#9a9a9a';
  for (const [x, y] of [[0.06, 0.3], [0.94, 0.3], [0.06, 0.9], [0.94, 0.9]]) {
    g.beginPath();
    g.arc(w * x, h * y, 9, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** A track singlet laid flat in a shadow box: red and black, gold "MD". */
export function singlet(w = 600, h = 800) {
  const { c, g } = make(w, h);
  g.fillStyle = '#1b1b1d';
  g.fillRect(0, 0, w, h);
  g.beginPath();
  g.moveTo(w * 0.28, h * 0.06);
  g.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.72, h * 0.06);
  g.lineTo(w * 0.8, h * 0.08);
  g.quadraticCurveTo(w * 0.78, h * 0.3, w * 0.86, h * 0.38);
  g.lineTo(w * 0.84, h * 0.94);
  g.lineTo(w * 0.16, h * 0.94);
  g.lineTo(w * 0.14, h * 0.38);
  g.quadraticCurveTo(w * 0.22, h * 0.3, w * 0.2, h * 0.08);
  g.closePath();
  g.fillStyle = '#c8202b';
  g.fill();
  g.fillStyle = '#e9b62e';
  g.fillRect(w * 0.15, h * 0.55, w * 0.7, h * 0.05);
  g.fillStyle = '#111';
  g.fillRect(w * 0.15, h * 0.6, w * 0.7, h * 0.05);
  g.fillStyle = '#e9b62e';
  g.textAlign = 'center';
  g.font = `900 ${h * 0.2}px ${DISPLAY}`;
  g.fillText('MD', w / 2, h * 0.48);
  g.fillStyle = '#fff';
  g.fillRect(w * 0.36, h * 0.7, w * 0.28, h * 0.14);
  g.fillStyle = INK;
  g.font = `900 ${h * 0.09}px ${BODY}`;
  g.fillText('118', w / 2, h * 0.805);
  return c;
}

/** The second monitor: a terminal where code just ran in the browser and passed. */
export function terminal(w = 960, h = 600) {
  const { c, g } = make(w, h);
  g.fillStyle = '#0f1116';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b1f2a';
  g.fillRect(0, 0, w, 44);
  for (const [i, col] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(26 + i * 26, 22, 8, 0, Math.PI * 2);
    g.fill();
  }
  const lines: [string, string][] = [
    ['#7aa2f7', '$ lilo run solution.py --tests'],
    ['#9aa5ce', '  runtime   pyodide (wasm) · in your browser'],
    ['#9aa5ce', '  sandbox   none needed · $0.00 cloud bill'],
    ['#c0caf5', ''],
    ['#9ece6a', '  ✓ test 1   palindrome("racecar")     2 ms'],
    ['#9ece6a', '  ✓ test 2   palindrome("abca")        1 ms'],
    ['#9ece6a', '  ✓ test 3   palindrome("")            0 ms'],
    ['#c0caf5', ''],
    ['#e0af68', '  3/3 passed · 41 ms total'],
    ['#7aa2f7', '$ █'],
  ];
  g.font = `600 30px ${MONO}`;
  lines.forEach(([col, t], i) => {
    g.fillStyle = col;
    g.fillText(t, 30, 100 + i * 48);
  });
  return c;
}

/** A round laptop sticker: two crossed fingers and "DOMAIN EXPANSION", in Pathion-ish colours. Original drawing. */
export function domainSticker(w = 400, h = 400) {
  const { c, g } = make(w, h);
  g.fillStyle = '#f4f1ea';
  g.beginPath();
  g.arc(w / 2, h / 2, w * 0.48, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#2b2d8f';
  g.beginPath();
  g.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(w / 2, h * 0.5);
  g.fillStyle = '#f2c9a5';
  g.strokeStyle = INK;
  g.lineWidth = 8;
  for (const [rot, dx] of [[-0.25, -18], [0.3, 18]]) {
    g.save();
    g.rotate(rot);
    g.beginPath();
    g.roundRect(dx - 22, -110, 44, 150, 22);
    g.fill();
    g.stroke();
    g.restore();
  }
  g.beginPath();
  g.roundRect(-60, 20, 120, 80, 30);
  g.fill();
  g.stroke();
  g.restore();
  g.fillStyle = '#ffd84a';
  g.textAlign = 'center';
  g.font = `900 ${w * 0.085}px ${DISPLAY}`;
  g.fillText('DOMAIN', w / 2, h * 0.2);
  g.fillText('EXPANSION', w / 2, h * 0.9);
  return c;
}

/** A conference lanyard badge: a coloured header band and the event name. */
export function badge(title: string, sub: string, band: string, w = 300, h = 420) {
  const { c, g } = make(w, h);
  g.fillStyle = '#fbfaf6';
  g.fillRect(0, 0, w, h);
  g.fillStyle = band;
  g.fillRect(0, 0, w, h * 0.32);
  g.fillStyle = '#d9d6cc';
  g.fillRect(w * 0.4, h * 0.05, w * 0.2, h * 0.04);
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.font = `900 ${h * 0.085}px ${BODY}`;
  title.split('\n').forEach((t, i) => g.fillText(t, w / 2, h * (0.18 + i * 0.1)));
  g.fillStyle = INK;
  g.font = `900 ${h * 0.11}px ${DISPLAY}`;
  g.fillText('MAX', w / 2, h * 0.56);
  g.font = `800 ${h * 0.07}px ${BODY}`;
  g.fillText(sub, w / 2, h * 0.7);
  g.fillStyle = band;
  g.fillRect(0, h * 0.88, w, h * 0.12);
  return c;
}

/** The cloak's back: heavy green wool with a stitched round patch carrying a P. Original, not any crest. */
export function cloak(w = 400, h = 720) {
  const { c, g } = make(w, h);
  g.fillStyle = '#34512f';
  g.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let i = 0; i < 2400; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '20,36,18' : '78,110,70'}, 0.18)`;
    g.fillRect(r() * w, r() * h, 2, 6);
  }
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 1; i < 5; i++) g.fillRect((w / 5) * i - 3, 0, 6, h);
  const cx = w / 2;
  const cy = h * 0.38;
  g.fillStyle = '#f2ead8';
  g.beginPath();
  g.arc(cx, cy, w * 0.26, 0, Math.PI * 2);
  g.fill();
  g.setLineDash([10, 8]);
  g.strokeStyle = '#8a6a3a';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(cx, cy, w * 0.23, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
  g.fillStyle = '#2f5fd0';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${w * 0.3}px ${DISPLAY}`;
  g.fillText('P', cx, cy + 4);
  return c;
}

/** The top of the game console: matte black with a "999+ HRS" sticker. */
export function consoleTop(w = 560, h = 400) {
  const { c, g } = make(w, h);
  g.fillStyle = '#1a1a1e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#26262c';
  g.fillRect(w * 0.06, h * 0.08, w * 0.88, h * 0.84);
  g.save();
  g.translate(w * 0.62, h * 0.52);
  g.rotate(-0.12);
  g.fillStyle = '#ffd23f';
  g.beginPath();
  g.roundRect(-w * 0.26, -h * 0.17, w * 0.52, h * 0.34, 16);
  g.fill();
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${h * 0.16}px ${DISPLAY}`;
  g.fillText('999+ HRS', 0, 4);
  g.restore();
  return c;
}

/** A Maryland flag, simplified (public-domain design): gold and black quarters and red and white crossed quarters. */
export function marylandFlag(w = 600, h = 400) {
  const { c, g } = make(w, h);
  const q = (x: number, y: number, kind: 'calvert' | 'crossland') => {
    const qw = w / 2;
    const qh = h / 2;
    if (kind === 'calvert') {
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? '#111' : '#e7b22d';
        g.fillRect(x + (qw / 6) * i, y, qw / 6 + 1, qh);
      }
      g.save();
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + qw, y + qh);
      g.lineTo(x + qw, y + qh * 0.75);
      g.lineTo(x, y - qh * 0.25);
      g.closePath();
      g.clip();
      for (let i = 0; i < 6; i++) {
        g.fillStyle = i % 2 ? '#e7b22d' : '#111';
        g.fillRect(x + (qw / 6) * i, y, qw / 6 + 1, qh);
      }
      g.restore();
    } else {
      g.fillStyle = '#f5f2ea';
      g.fillRect(x, y, qw / 2, qh / 2);
      g.fillRect(x + qw / 2, y + qh / 2, qw / 2, qh / 2);
      g.fillStyle = '#c8202b';
      g.fillRect(x + qw / 2, y, qw / 2, qh / 2);
      g.fillRect(x, y + qh / 2, qw / 2, qh / 2);
      g.fillStyle = '#c8202b';
      g.fillRect(x + qw * 0.44, y + qh * 0.12, qw * 0.12, qh * 0.76);
      g.fillRect(x + qw * 0.18, y + qh * 0.44, qw * 0.64, qh * 0.12);
    }
  };
  q(0, 0, 'calvert');
  q(w / 2, 0, 'crossland');
  q(0, h / 2, 'crossland');
  q(w / 2, h / 2, 'calvert');
  return c;
}

/** A white ceramic mug wrap with the real Pathion logo, centred on the side that faces the room. */
export function mugWrap(logo: HTMLImageElement | null, w = 1024, h = 320) {
  const { c, g } = make(w, h);
  g.fillStyle = '#f6f4ef';
  g.fillRect(0, 0, w, h);
  if (logo && logo.naturalWidth) {
    const lw = w * 0.36;
    const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    g.drawImage(logo, w * 0.25 - lw / 2, h / 2 - lh / 2, lw, lh);
  }
  return c;
}

/** `own`: Max wrote it (a Pathion SOP), so it carries the Pathion mark. Nobody else's book does. */
export type SpineBook = { title: string; author?: string; color: string; ink?: string; vol?: number; own?: boolean };

function inkOn(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return l > 0.6 ? '#1d140c' : '#f6ecd6';
}

/**
 * A book spine at the spine's exact proportions (w x h px): cloth colour, gold bands, the title running bottom to top,
 * the author, and the Pathion P at the foot. A blank title leaves just the P and the bands.
 */
export function spine(book: SpineBook, icon: HTMLImageElement | null, w: number, h: number) {
  const { c, g } = make(w, h);
  g.fillStyle = book.color;
  g.fillRect(0, 0, w, h);
  const shade = g.createLinearGradient(0, 0, w, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.28)');
  shade.addColorStop(0.25, 'rgba(255,255,255,0.08)');
  shade.addColorStop(0.7, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.3)');
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);
  const ink = book.ink ?? inkOn(book.color);
  g.fillStyle = '#d8b25a';
  for (const y of [0.035, 0.05, 0.95, 0.965]) g.fillRect(0, h * y, w, Math.max(2, h * 0.006));
  // a manga volume number in a round badge near the top
  if (book.vol !== undefined) {
    g.fillStyle = ink;
    g.beginPath();
    g.arc(w / 2, h * 0.11, w * 0.36, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = book.color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `900 ${w * 0.42}px ${DISPLAY}`;
    g.fillText(String(book.vol), w / 2, h * 0.112);
  }
  // the Pathion P at the foot, only on the books Max wrote himself
  const foot = h * 0.86;
  if (!book.own) {
    // someone else's book: no mark
  } else if (icon && icon.naturalWidth) {
    const iw = w * 0.62;
    const ih = (iw * icon.naturalHeight) / icon.naturalWidth;
    if (inkOn(book.color) !== '#f6ecd6') g.filter = 'invert(1)';
    g.drawImage(icon, (w - iw) / 2, foot - ih / 2, iw, ih);
    g.filter = 'none';
  } else {
    g.fillStyle = ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `900 ${w * 0.6}px ${DISPLAY}`;
    g.fillText('P', w / 2, foot);
  }
  if (book.title) {
    g.save();
    g.translate(w / 2, book.vol !== undefined ? h * 0.52 : h * 0.47);
    g.rotate(-Math.PI / 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = ink;
    const room = h * (book.vol !== undefined ? 0.5 : 0.68);
    let size = w * 0.42;
    g.font = `800 ${size}px ${BODY}`;
    const title = book.title.toUpperCase();
    while (g.measureText(title).width > room && size > w * 0.18) {
      size -= 1;
      g.font = `800 ${size}px ${BODY}`;
    }
    g.fillText(title, book.author ? -h * 0.03 : 0, book.author ? -w * 0.1 : 0);
    if (book.author) {
      g.font = `700 ${w * 0.22}px ${BODY}`;
      g.globalAlpha = 0.8;
      g.fillText(book.author, -h * 0.03, w * 0.24);
    }
    g.restore();
  }
  return c;
}

/** The cover of the book Max is reading now (w x h = the cover's proportions). */
export function readingCover(book: SpineBook, icon: HTMLImageElement | null, w = 600, h = 800) {
  const { c, g } = make(w, h);
  g.fillStyle = book.color;
  g.fillRect(0, 0, w, h);
  const ink = inkOn(book.color);
  g.strokeStyle = '#d8b25a';
  g.lineWidth = 10;
  g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = ink;
  g.textAlign = 'center';
  if (book.title) {
    g.font = `900 ${w * 0.1}px ${DISPLAY}`;
    const words = book.title.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > w * 0.78 && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => g.fillText(l, w / 2, h * 0.3 + i * w * 0.12));
    if (book.author) {
      g.font = `700 ${w * 0.055}px ${BODY}`;
      g.fillText(book.author, w / 2, h * 0.74);
    }
  }
  if (book.own && icon && icon.naturalWidth) {
    const iw = w * 0.14;
    const ih = (iw * icon.naturalHeight) / icon.naturalWidth;
    if (ink !== '#f6ecd6') g.filter = 'invert(1)';
    g.drawImage(icon, (w - iw) / 2, h * 0.84, iw, ih);
    g.filter = 'none';
  }
  return c;
}

/** A little tent card beside the book: NOW READING. */
export function readingCard(title: string, w = 600, h = 400) {
  const { c, g } = make(w, h);
  g.fillStyle = '#fbf6e9';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8202b';
  g.fillRect(0, 0, w, h * 0.12);
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.font = `900 ${h * 0.2}px ${DISPLAY}`;
  g.fillText('NOW', w / 2, h * 0.42);
  g.fillText('READING', w / 2, h * 0.66);
  g.font = `800 ${h * 0.085}px ${BODY}`;
  g.fillText(title || 'see the Library', w / 2, h * 0.86);
  return c;
}

/** A game case spine (w x h = the spine's proportions): a case colour, a pale header band with the platform, the title. */
export function gameSpine(title: string, platform: string, color: string, w: number, h: number) {
  const { c, g } = make(w, h);
  g.fillStyle = color;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillRect(0, 0, w, h * 0.13);
  g.fillStyle = '#1d140c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${w * 0.32}px ${BODY}`;
  g.save();
  g.translate(w / 2, h * 0.065);
  g.rotate(-Math.PI / 2);
  g.fillText((platform || '').toUpperCase().slice(0, 8), 0, 0);
  g.restore();
  const ink = inkOn(color);
  g.save();
  g.translate(w / 2, h * 0.57);
  g.rotate(-Math.PI / 2);
  g.fillStyle = ink;
  let size = w * 0.5;
  g.font = `900 ${size}px ${DISPLAY}`;
  while (g.measureText(title).width > h * 0.78 && size > w * 0.2) {
    size -= 1;
    g.font = `900 ${size}px ${DISPLAY}`;
  }
  g.fillText(title, 0, 0);
  g.restore();
  return c;
}

/** The second monitor: an editor open on learning.md, listing what Max is studying now. */
export function learningScreen(topics: { topic: string; note?: string }[], w = 960, h = 600) {
  const { c, g } = make(w, h);
  g.fillStyle = '#0f1116';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b1f2a';
  g.fillRect(0, 0, w, 44);
  g.fillStyle = '#262b38';
  g.fillRect(90, 6, 200, 38);
  g.fillStyle = '#c0caf5';
  g.font = `600 22px ${MONO}`;
  g.fillText('learning.md', 112, 32);
  for (const [i, col] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(22 + i * 22, 22, 7, 0, Math.PI * 2);
    g.fill();
  }
  let y = 100;
  const line = (n: number, color: string, text: string, size = 30, weight = 600) => {
    g.fillStyle = '#3b4261';
    g.font = `500 22px ${MONO}`;
    g.fillText(String(n).padStart(2, ' '), 18, y);
    g.fillStyle = color;
    g.font = `${weight} ${size}px ${MONO}`;
    g.fillText(text, 64, y);
    y += size + 18;
  };
  let n = 1;
  line(n++, '#7aa2f7', '# Learning right now', 34, 800);
  line(n++, '#c0caf5', '');
  for (const t of topics.slice(0, 6)) {
    line(n++, '#e0af68', `- [ ] ${t.topic}`);
    if (t.note) line(n++, '#9aa5ce', `      ${t.note}`, 24, 500);
  }
  g.fillStyle = '#c0caf5';
  g.fillRect(64, y - 26, 14, 30);
  return c;
}

/** A record sleeve face (square): the album colour, the title and artist set as type. No cover art. */
export function sleeve(title: string, artist: string, color: string, ink: string, w = 512, h = 512) {
  const { c, g } = make(w, h);
  g.fillStyle = color;
  g.fillRect(0, 0, w, h);
  const shade = g.createLinearGradient(0, 0, w, h);
  shade.addColorStop(0, 'rgba(255,255,255,0.1)');
  shade.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);
  g.fillStyle = ink;
  g.textAlign = 'left';
  g.font = `900 ${w * 0.11}px ${DISPLAY}`;
  g.fillText(title, w * 0.07, h * 0.84);
  g.font = `800 ${w * 0.06}px ${BODY}`;
  g.fillText(artist.toUpperCase(), w * 0.07, h * 0.93);
  return c;
}

/** A face button's top: dark rubber with the coloured outline glyph (triangle, circle, cross, square). */
export function faceGlyph(shape: 'triangle' | 'circle' | 'cross' | 'square', w = 256, h = 256) {
  const { c, g } = make(w, h);
  const grad = g.createRadialGradient(w * 0.4, h * 0.35, 0, w / 2, h / 2, w * 0.6);
  grad.addColorStop(0, '#3a3a40');
  grad.addColorStop(1, '#151518');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  const col = { triangle: '#40d39a', circle: '#ff5c63', cross: '#78acff', square: '#f08ad6' }[shape];
  g.strokeStyle = col;
  g.lineWidth = w * 0.07;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  const m = w / 2;
  const r = w * 0.24;
  if (shape === 'triangle') {
    g.moveTo(m, m - r);
    g.lineTo(m + r * 0.95, m + r * 0.65);
    g.lineTo(m - r * 0.95, m + r * 0.65);
    g.closePath();
  } else if (shape === 'circle') g.arc(m, m, r, 0, Math.PI * 2);
  else if (shape === 'cross') {
    g.moveTo(m - r, m - r);
    g.lineTo(m + r, m + r);
    g.moveTo(m + r, m - r);
    g.lineTo(m - r, m + r);
  } else g.rect(m - r * 0.85, m - r * 0.85, r * 1.7, r * 1.7);
  g.stroke();
  return c;
}

/** A long desk mat printed like a black-and-white manga page: panels, speed lines, halftone. Original art. */
export function mangaMat(w = 1200, h = 360) {
  const { c, g } = make(w, h);
  g.fillStyle = '#f3f1ea';
  g.fillRect(0, 0, w, h);
  const r = rng(21);
  const cols = [0, 0.22, 0.47, 0.63, 0.86, 1];
  for (let i = 0; i < cols.length - 1; i++) {
    const x0 = cols[i] * w + 6;
    const x1 = cols[i + 1] * w - 6;
    const split = h * (0.35 + r() * 0.3);
    for (const [y0, y1] of [[6, split - 6], [split + 6, h - 6]]) {
      g.fillStyle = '#fbfaf6';
      g.fillRect(x0, y0, x1 - x0, y1 - y0);
      const kind = Math.floor(r() * 3);
      g.save();
      g.beginPath();
      g.rect(x0, y0, x1 - x0, y1 - y0);
      g.clip();
      if (kind === 0) {
        // speed lines into a point
        const cx = x0 + (x1 - x0) * r();
        const cy = y0 + (y1 - y0) * r();
        g.strokeStyle = '#141414';
        for (let k = 0; k < 60; k++) {
          const a = r() * Math.PI * 2;
          g.lineWidth = 0.5 + r() * 2;
          g.beginPath();
          g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
          g.lineTo(cx + Math.cos(a) * 600, cy + Math.sin(a) * 600);
          g.stroke();
        }
      } else if (kind === 1) {
        // halftone dots
        g.fillStyle = '#1b1b1b';
        for (let y = y0; y < y1; y += 9) for (let x = x0; x < x1; x += 9) {
          const s = 1 + 3 * Math.abs(Math.sin((x + y) * 0.01));
          g.beginPath();
          g.arc(x, y, s, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        // a big black shape and a speech bubble
        g.fillStyle = '#111';
        g.beginPath();
        g.ellipse(x0 + (x1 - x0) * 0.4, y1, (x1 - x0) * 0.45, (y1 - y0) * 0.7, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#fff';
        g.strokeStyle = '#111';
        g.lineWidth = 3;
        g.beginPath();
        g.ellipse(x1 - (x1 - x0) * 0.3, y0 + (y1 - y0) * 0.3, (x1 - x0) * 0.22, (y1 - y0) * 0.18, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      g.restore();
      g.strokeStyle = '#111';
      g.lineWidth = 4;
      g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
  return c;
}

/**
 * The 34" ultrawide's desktop (21:9): the LILO editor window filling the left, learning.md in a column on the right.
 * Drawn as one picture so it can wrap across the curved panels without a seam.
 */
export function ultrawideDesktop(lilo: HTMLImageElement | null, learning: HTMLCanvasElement, w = 2100, h = 900) {
  const { c, g } = make(w, h);
  g.fillStyle = '#0b0d12';
  g.fillRect(0, 0, w, h);
  const lw = h * 1.6;
  if (lilo && lilo.naturalWidth) g.drawImage(lilo, 0, 0, lw, h);
  g.fillStyle = '#1b1f2a';
  g.fillRect(lw, 0, 6, h);
  // the learning.md editor, cropped into the right-hand column
  const colW = w - lw - 6;
  g.drawImage(learning, 0, 0, learning.width * (colW / (h * 1.6)), learning.height, lw + 6, 0, colW, h);
  return c;
}

/** The 24" monitor: a now-playing screen for one of Max's records (an original player layout, no cover art). */
export function nowPlaying(title: string, artist: string, color: string, ink: string, w = 960, h = 540) {
  const { c, g } = make(w, h);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#121214');
  bg.addColorStop(1, '#25252b');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  // the sleeve, as type only
  g.fillStyle = color;
  g.fillRect(60, 70, 330, 330);
  g.fillStyle = ink;
  g.font = `900 46px ${DISPLAY}`;
  g.fillText(title, 84, 360);
  g.fillStyle = '#9a9aa2';
  g.font = `800 22px ${BODY}`;
  g.fillText('NOW PLAYING', 440, 120);
  g.fillStyle = '#f2f2f4';
  g.font = `900 58px ${DISPLAY}`;
  g.fillText(title, 440, 196);
  g.fillStyle = '#c9c9d0';
  g.font = `700 32px ${BODY}`;
  g.fillText(artist, 440, 246);
  g.fillStyle = '#3a3a42';
  g.fillRect(440, 330, 440, 8);
  g.fillStyle = '#f2f2f4';
  g.fillRect(440, 330, 170, 8);
  g.beginPath();
  g.arc(610, 334, 11, 0, Math.PI * 2);
  g.fill();
  g.font = `600 22px ${MONO}`;
  g.fillStyle = '#9a9aa2';
  g.fillText('1:42', 440, 380);
  g.fillText('4:05', 820, 380);
  g.fillStyle = '#f2f2f4';
  g.beginPath();
  g.moveTo(640, 420);
  g.lineTo(640, 476);
  g.lineTo(688, 448);
  g.closePath();
  g.fill();
  g.fillRect(560, 424, 8, 48);
  g.fillRect(760, 424, 8, 48);
  return c;
}

/**
 * Logitech MX Keys, seen from above (w x h = its 430 x 131 mm footprint): graphite body, round dished keys in a full
 * layout with function row, arrows and numpad, a faint white backlight around each key.
 */
export function mxKeys(w = 1720, h = 524) {
  const { c, g } = make(w, h);
  g.fillStyle = '#1b1b1e';
  g.fillRect(0, 0, w, h);
  const u = w / 23.2; // one key unit
  const key = (x: number, y: number, kw = 1, kh = 1) => {
    const px = 16 + x * u;
    const py = 16 + y * u;
    const pw = kw * u - 8;
    const ph = kh * u - 8;
    g.fillStyle = 'rgba(235, 240, 255, 0.28)';
    g.beginPath();
    g.roundRect(px - 2, py - 2, pw + 4, ph + 4, 10);
    g.fill();
    g.fillStyle = '#56565d';
    g.beginPath();
    g.roundRect(px, py, pw, ph, 9);
    g.fill();
    const dish = g.createRadialGradient(px + pw / 2, py + ph / 2, 2, px + pw / 2, py + ph / 2, Math.min(pw, ph) * 0.5);
    dish.addColorStop(0, '#2f2f33');
    dish.addColorStop(1, 'rgba(70, 70, 76, 0)');
    g.fillStyle = dish;
    g.beginPath();
    g.ellipse(px + pw / 2, py + ph / 2, pw * 0.42, ph * 0.42, 0, 0, Math.PI * 2);
    g.fill();
  };
  for (let i = 0; i < 15; i++) key(i, 0, 1, 0.75); // function row
  const rows: number[][] = [
    [...Array(13).fill(1), 2],
    [1.5, ...Array(12).fill(1), 1.5],
    [1.75, ...Array(11).fill(1), 2.25],
    [2.25, ...Array(10).fill(1), 2.75],
    [1.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 1.25],
  ];
  rows.forEach((row, r) => {
    let x = 0;
    for (const kw of row) {
      key(x, 0.95 + r, kw);
      x += kw;
    }
  });
  // arrows and the numpad
  key(15.25, 4.95);
  key(16.25, 4.95);
  key(17.25, 4.95);
  key(16.25, 3.95);
  for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) if (!(r === 4 && k === 1)) key(18.75 + k, 0.95 + r, r === 4 && k === 0 ? 2 : 1);
  return c;
}

/** A PC case's front panel: black mesh, a fine hex-ish dot grid. */
export function caseMesh(w = 400, h = 512) {
  const { c, g } = make(w, h);
  g.fillStyle = '#0d0d0f';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#26262b';
  for (let y = 6; y < h; y += 9) for (let x = (y / 9) % 2 ? 6 : 10; x < w; x += 9) {
    g.beginPath();
    g.arc(x, y, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** The ViewSonic 32" 4K: a desktop with the Pathion logo as wallpaper. */
export function pathionDesktop(logo: HTMLImageElement | null, w = 1280, h = 720) {
  const { c, g } = make(w, h);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0b1a3d');
  bg.addColorStop(1, '#050913');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  if (logo && logo.naturalWidth) {
    g.fillStyle = '#f6f4ef';
    g.beginPath();
    g.roundRect(w * 0.2, h * 0.34, w * 0.6, h * 0.32, 24);
    g.fill();
    const lw = w * 0.5;
    const lh = (lw * logo.naturalHeight) / logo.naturalWidth;
    g.drawImage(logo, (w - lw) / 2, (h - lh) / 2, lw, lh);
  }
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(0, h - 40, w, 40);
  return c;
}

/** The LG C3 48" on the wall: Smash night, four players ready. An original screen, no game art. */
/**
 * The TV: a fighting-game versus card in the style of the match-up thumbnails: red on the left, blue on the right,
 * split on a slant, a brushed red "VS" in the middle and embers in the air. Both fighters are original silhouettes
 * with rim light (a swordsman with a short broad blade, a hooded fighter with a staff), labelled P1 and P2.
 */
export function smashNight(w = 1280, h = 720) {
  const { c, g } = make(w, h);
  const r = rng(77);
  const bar = h * 0.07; // letterbox
  // left: red, hot in the middle
  const red = g.createRadialGradient(w * 0.25, h * 0.45, 10, w * 0.25, h * 0.5, w * 0.55);
  red.addColorStop(0, '#e0392b');
  red.addColorStop(1, '#5a0a0c');
  g.fillStyle = red;
  g.fillRect(0, 0, w, h);
  // right: blue, split from the red on a slant
  g.save();
  g.beginPath();
  g.moveTo(w * 0.56, 0);
  g.lineTo(w, 0);
  g.lineTo(w, h);
  g.lineTo(w * 0.44, h);
  g.closePath();
  g.clip();
  const blue = g.createRadialGradient(w * 0.75, h * 0.45, 10, w * 0.75, h * 0.5, w * 0.55);
  blue.addColorStop(0, '#2f78c8');
  blue.addColorStop(1, '#0a1838');
  g.fillStyle = blue;
  g.fillRect(0, 0, w, h);
  g.restore();
  // the seam: a pale slash
  g.strokeStyle = 'rgba(255,240,220,0.85)';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(w * 0.56, 0);
  g.lineTo(w * 0.44, h);
  g.stroke();

  const fighter = (draw: () => void, rim: string) => {
    g.save();
    g.shadowColor = rim;
    g.shadowBlur = 18;
    g.fillStyle = '#140d10';
    g.beginPath();
    draw();
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = rim;
    g.lineWidth = 3;
    g.stroke();
    g.restore();
  };
  // left fighter: spiky hair, a pauldron on one shoulder, a broad blade held up behind him
  fighter(() => {
    g.moveTo(w * 0.05, h);
    g.lineTo(w * 0.08, h * 0.72);
    g.quadraticCurveTo(w * 0.12, h * 0.6, w * 0.2, h * 0.6);
    g.lineTo(w * 0.24, h * 0.56);
    g.lineTo(w * 0.33, h * 0.6);
    g.quadraticCurveTo(w * 0.38, h * 0.66, w * 0.38, h);
    g.closePath();
    const hx = w * 0.235, hy = h * 0.42;
    g.moveTo(hx + h * 0.09, hy);
    g.ellipse(hx, hy, h * 0.085, h * 0.105, 0, 0, Math.PI * 2);
    // a topknot
    g.moveTo(hx + h * 0.03, hy - h * 0.09);
    g.ellipse(hx, hy - h * 0.12, h * 0.035, h * 0.04, 0, 0, Math.PI * 2);
    // pauldron
    g.moveTo(w * 0.33 + h * 0.07, h * 0.6);
    g.ellipse(w * 0.32, h * 0.6, h * 0.075, h * 0.05, -0.3, 0, Math.PI * 2);
    // a short blade held up beside the shoulder
    g.moveTo(w * 0.35, h * 0.64);
    g.lineTo(w * 0.37, h * 0.62);
    g.lineTo(w * 0.41, h * 0.3);
    g.lineTo(w * 0.425, h * 0.26);
    g.lineTo(w * 0.43, h * 0.31);
    g.lineTo(w * 0.39, h * 0.64);
    g.closePath();
  }, '#ffb347');
  // right fighter: long hair falling past the shoulders, a high collar, a very long thin blade across the frame
  fighter(() => {
    const hx = w * 0.77, hy = h * 0.4;
    g.moveTo(w * 0.6, h);
    g.quadraticCurveTo(w * 0.62, h * 0.62, w * 0.7, h * 0.58);
    g.lineTo(w * 0.84, h * 0.58);
    g.quadraticCurveTo(w * 0.93, h * 0.62, w * 0.96, h);
    g.closePath();
    // a pointed hood over the head and shoulders
    g.moveTo(hx - h * 0.16, hy + h * 0.2);
    g.quadraticCurveTo(hx - h * 0.14, hy - h * 0.12, hx + h * 0.02, hy - h * 0.2);
    g.quadraticCurveTo(hx + h * 0.16, hy - h * 0.08, hx + h * 0.16, hy + h * 0.2);
    g.closePath();
    // collar
    g.moveTo(hx - h * 0.12, h * 0.58);
    g.lineTo(hx - h * 0.06, h * 0.5);
    g.lineTo(hx + h * 0.08, h * 0.5);
    g.lineTo(hx + h * 0.14, h * 0.58);
    g.closePath();
  }, '#8fd8ff');
  // a staff held across the body
  g.save();
  g.strokeStyle = '#dfe8f0';
  g.shadowColor = '#bfe6ff';
  g.shadowBlur = 14;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(w * 0.9, h * 0.9);
  g.lineTo(w * 0.66, h * 0.16);
  g.stroke();
  g.restore();

  // embers drifting up
  for (let i = 0; i < 90; i++) {
    const x = r() * w, y = bar + r() * (h - 2 * bar), s = 1 + r() * 3.5;
    g.fillStyle = `rgba(255,${140 + Math.floor(r() * 80)},60,${0.35 + r() * 0.6})`;
    g.beginPath();
    g.arc(x, y, s, 0, Math.PI * 2);
    g.fill();
  }

  // the brushed VS: red, outlined in white, leaning forward
  g.save();
  g.translate(w * 0.5, h * 0.55);
  g.rotate(-0.12);
  g.transform(1, 0, -0.25, 1, 0, 0);
  g.font = `900 ${h * 0.42}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = h * 0.035;
  g.strokeStyle = '#ffffff';
  g.strokeText('VS', 0, 0);
  const vs = g.createLinearGradient(0, -h * 0.2, 0, h * 0.2);
  vs.addColorStop(0, '#ffd23f');
  vs.addColorStop(0.35, '#e8231b');
  vs.addColorStop(1, '#8a0a0a');
  g.fillStyle = vs;
  g.fillText('VS', 0, 0);
  g.restore();

  // names
  g.textBaseline = 'alphabetic';
  g.font = `900 ${h * 0.07}px ${DISPLAY}`;
  g.lineWidth = 6;
  g.strokeStyle = '#140d10';
  g.fillStyle = '#ffffff';
  g.textAlign = 'left';
  g.strokeText('P1', w * 0.04, h - bar - h * 0.04);
  g.fillText('P1', w * 0.04, h - bar - h * 0.04);
  g.textAlign = 'right';
  g.strokeText('P2', w * 0.96, h - bar - h * 0.04);
  g.fillText('P2', w * 0.96, h - bar - h * 0.04);

  // letterbox bars
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, bar);
  g.fillRect(0, h - bar, w, bar);
  return c;
}

/**
 * Max's wings desk mat: dark green cloth, a stitched edge, and a pair of wings (one navy, one cream) in a circle.
 * An original drawing in the spirit of his Wings of Freedom mat, not a copy of the emblem.
 */
export function wingsMat(w = 1200, h = 500) {
  const { c, g } = make(w, h);
  g.fillStyle = '#25392a';
  g.fillRect(0, 0, w, h);
  const r = rng(13);
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '12,22,14' : '70,96,72'}, 0.14)`;
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  g.setLineDash([14, 10]);
  g.strokeStyle = '#8fa07e';
  g.lineWidth = 4;
  g.strokeRect(18, 18, w - 36, h - 36);
  g.setLineDash([]);
  const cx = w * 0.875; // the open right end of the mat, past the mouse
  const cy = h * 0.5;
  const R = h * 0.28;
  g.strokeStyle = '#d9cfb4';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(cx, cy, R, 0, Math.PI * 2);
  g.stroke();
  // a wing: stacked feathers fanning up and out from the centre line
  const wing = (dir: 1 | -1, fill: string) => {
    for (let k = 0; k < 5; k++) {
      const len = R * (0.95 - k * 0.12);
      const y0 = cy - R * 0.35 + k * R * 0.16;
      g.fillStyle = fill;
      g.strokeStyle = '#1b2a1d';
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, y0);
      g.quadraticCurveTo(cx + dir * len * 0.6, y0 - R * 0.28, cx + dir * len, y0 - R * 0.05);
      g.quadraticCurveTo(cx + dir * len * 0.55, y0 + R * 0.08, cx, y0 + R * 0.12);
      g.closePath();
      g.fill();
      g.stroke();
    }
  };
  wing(-1, '#2c4f8f');
  wing(1, '#efe8d6');
  return c;
}

/**
 * The PC monitor's wallpaper: an original painting of branching rivers of light pouring out of a blinding point
 * in the sky over low clouds, a small figure standing in the beam. In the spirit of "all paths converge".
 */
export function pathsWallpaper(w = 1600, h = 900) {
  const { c, g } = make(w, h);
  const r = rng(77);
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2a2d5c');
  sky.addColorStop(0.55, '#2b4150');
  sky.addColorStop(1, '#1c2b25');
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  // low clouds
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = h * (0.62 + r() * 0.35);
    const rad = 60 + r() * 140;
    const cl = g.createRadialGradient(x, y, 0, x, y, rad);
    cl.addColorStop(0, 'rgba(70, 92, 84, 0.35)');
    cl.addColorStop(1, 'rgba(70, 92, 84, 0)');
    g.fillStyle = cl;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const ox = w / 2;
  const oy = h * 0.08;
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  // branching rivers of light: each splits as it travels outward and thins
  const branch = (x: number, y: number, ang: number, len: number, wid: number, depth: number) => {
    const ex = x + Math.cos(ang) * len;
    const ey = y + Math.sin(ang) * len;
    const mx = (x + ex) / 2 + (r() - 0.5) * len * 0.35;
    const my = (y + ey) / 2 + (r() - 0.5) * len * 0.35;
    const t = depth / 6;
    g.strokeStyle = `rgba(${255}, ${Math.round(230 - t * 40)}, ${Math.round(170 + t * 70)}, ${0.55 - t * 0.25})`;
    g.lineWidth = wid * 3.5;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(mx, my, ex, ey);
    g.stroke();
    g.strokeStyle = `rgba(255, 250, 235, ${0.8 - t * 0.3})`;
    g.lineWidth = wid;
    g.stroke();
    if (depth >= 6 || wid < 0.6) return;
    const kids = 2 + (r() < 0.35 ? 1 : 0);
    for (let k = 0; k < kids; k++) branch(ex, ey, ang + (r() - 0.5) * 1.1, len * (0.62 + r() * 0.2), wid * 0.62, depth + 1);
  };
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const ang = (side > 0 ? 0 : Math.PI) + side * (0.05 + r() * 0.75);
    branch(ox, oy + r() * 40, ang, 190 + r() * 110, 11 + r() * 5, 0);
  }
  // the beam falling to the ground, and the blinding source
  const beam = g.createLinearGradient(0, oy, 0, h);
  beam.addColorStop(0, 'rgba(255, 244, 214, 0.9)');
  beam.addColorStop(1, 'rgba(255, 214, 140, 0.25)');
  g.fillStyle = beam;
  g.beginPath();
  g.moveTo(ox - 40, oy);
  g.lineTo(ox + 40, oy);
  g.lineTo(ox + 120, h);
  g.lineTo(ox - 120, h);
  g.closePath();
  g.fill();
  const core = g.createRadialGradient(ox, oy, 0, ox, oy, w * 0.32);
  core.addColorStop(0, 'rgba(255, 255, 250, 1)');
  core.addColorStop(0.25, 'rgba(255, 242, 210, 0.75)');
  core.addColorStop(1, 'rgba(255, 220, 170, 0)');
  g.fillStyle = core;
  g.fillRect(0, 0, w, h);
  // drifting sparks
  for (let i = 0; i < 160; i++) {
    g.fillStyle = `rgba(255, 236, 200, ${0.3 + r() * 0.6})`;
    g.beginPath();
    g.arc(r() * w, r() * h * 0.8, 1 + r() * 2, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  // a small, generic figure standing in the light (seen from behind)
  const fx = ox;
  const fy = h * 0.9;
  g.fillStyle = 'rgba(40, 34, 40, 0.92)';
  g.beginPath();
  g.ellipse(fx, fy - 118, 13, 16, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(fx - 22, fy - 100);
  g.quadraticCurveTo(fx, fy - 108, fx + 22, fy - 100);
  g.lineTo(fx + 26, fy - 30);
  g.lineTo(fx + 14, fy + 10);
  g.lineTo(fx - 14, fy + 10);
  g.lineTo(fx - 26, fy - 30);
  g.closePath();
  g.fill();
  return c;
}

/**
 * A GameCube controller seen from above (transparent around it, so the mesh is cut to its outline): the indigo body
 * with its two grips, the grey control stick top-left and the d-pad under it, the big green A with the red B below-left,
 * the kidney X (right) and Y (top) hugging A, the yellow C-stick below, Start in the middle.
 */
export function gcControllerTop(w = 600, h = 420) {
  const { c, g } = make(w, h);
  g.clearRect(0, 0, w, h);
  const IND = '#4a3aa0';
  const IND_DK = '#2c2266';
  g.fillStyle = IND;
  g.strokeStyle = IND_DK;
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(w * 0.5, h * 0.1);
  g.bezierCurveTo(w * 0.78, h * 0.06, w * 0.98, h * 0.12, w * 0.97, h * 0.42);
  g.bezierCurveTo(w * 0.96, h * 0.7, w * 0.9, h * 0.97, w * 0.78, h * 0.96);
  g.bezierCurveTo(w * 0.68, h * 0.95, w * 0.66, h * 0.72, w * 0.6, h * 0.66);
  g.bezierCurveTo(w * 0.55, h * 0.62, w * 0.45, h * 0.62, w * 0.4, h * 0.66);
  g.bezierCurveTo(w * 0.34, h * 0.72, w * 0.32, h * 0.95, w * 0.22, h * 0.96);
  g.bezierCurveTo(w * 0.1, h * 0.97, w * 0.04, h * 0.7, w * 0.03, h * 0.42);
  g.bezierCurveTo(w * 0.02, h * 0.12, w * 0.22, h * 0.06, w * 0.5, h * 0.1);
  g.closePath();
  g.fill();
  g.stroke();
  const shade = g.createRadialGradient(w * 0.5, h * 0.3, 10, w * 0.5, h * 0.5, w * 0.6);
  shade.addColorStop(0, 'rgba(255,255,255,0.12)');
  shade.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = shade;
  g.fill();
  const disc = (x: number, y: number, rad: number, fill: string, ring = '#1d1640') => {
    g.fillStyle = fill;
    g.strokeStyle = ring;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(w * x, h * y, rad, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  };
  // control stick well and cap (top-left), d-pad (below)
  disc(0.25, 0.36, 52, '#2a2160');
  disc(0.25, 0.36, 36, '#9a9aa2');
  g.fillStyle = '#8a8a92';
  g.fillRect(w * 0.34 - 10, h * 0.63 - 30, 20, 60);
  g.fillRect(w * 0.34 - 30, h * 0.63 - 10, 60, 20);
  // start
  disc(0.5, 0.36, 12, '#9a9aa2');
  // A, B, X, Y
  disc(0.74, 0.37, 38, '#2fb35c');
  disc(0.62, 0.52, 20, '#d8322c');
  g.fillStyle = '#c9c9d0';
  g.strokeStyle = '#1d1640';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(w * 0.87, h * 0.33, 14, 34, -0.25, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(w * 0.72, h * 0.17, 32, 13, -0.15, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  // C-stick well and cap
  disc(0.66, 0.66, 30, '#2a2160');
  disc(0.66, 0.66, 20, '#f2c51c');
  return c;
}

/** A shelf's topic tag: a strip of cream card with the topic in small caps. */
export function shelfTag(label: string, w = 560, h = 64) {
  const { c, g } = make(w, h);
  g.fillStyle = '#f3ead3';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1d140c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `900 ${h * 0.56}px ${BODY}`;
  g.fillText(label.toUpperCase(), w / 2, h * 0.54);
  return c;
}

/**
 * Max's long desk mat: a grey sheet of manga panels, dense with line work, with one figure in colour: a swordsman
 * in a forest-green cloak mid-swing. Original art in the spirit of the real mat (no pages or characters are copied):
 * walls and rooftops, steam, slash arcs, a close-up of narrowed eyes, sound-effect strokes.
 */
export function deskMat(w = 2250, h = 1000) {
  const { c, g } = make(w, h);
  const r = rng(404);
  const INKY = '#222126';
  g.fillStyle = '#8f8d8a';
  g.fillRect(0, 0, w, h);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const hatch = (x: number, y: number, pw: number, ph: number, step: number, slope: number, alpha: number) => {
    g.strokeStyle = `rgba(34, 33, 38, ${alpha})`;
    g.lineWidth = 1.6;
    for (let k = -ph; k < pw + ph; k += step) {
      g.beginPath();
      g.moveTo(x + k, y);
      g.lineTo(x + k + ph * slope, y + ph);
      g.stroke();
    }
  };
  const burst = (cx: number, cy: number, n: number, near: number) => {
    g.strokeStyle = INKY;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2;
      const start = near * (0.7 + r() * 0.9);
      g.lineWidth = 0.8 + r() * 2.6;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * start, cy + Math.sin(a) * start);
      g.lineTo(cx + Math.cos(a) * 2400, cy + Math.sin(a) * 2400);
      g.stroke();
    }
  };
  const wall = (x: number, y: number, pw: number, ph: number) => {
    // a brick wall in perspective with a window, cross-hatched in the shade
    g.strokeStyle = 'rgba(34, 33, 38, 0.8)';
    g.lineWidth = 2;
    const rows = 9;
    for (let i = 0; i <= rows; i++) {
      const yy = y + (ph * i) / rows;
      g.beginPath();
      g.moveTo(x, yy);
      g.lineTo(x + pw, yy - ph * 0.12 + (i / rows) * ph * 0.24);
      g.stroke();
      for (let k = 0; k < 7; k++) {
        const xx = x + ((k + (i % 2) * 0.5) / 7) * pw;
        g.beginPath();
        g.moveTo(xx, yy);
        g.lineTo(xx, yy + ph / rows);
        g.stroke();
      }
    }
    g.fillStyle = '#d9d7d2';
    g.fillRect(x + pw * 0.55, y + ph * 0.18, pw * 0.26, ph * 0.4);
    g.strokeStyle = INKY;
    g.lineWidth = 4;
    g.strokeRect(x + pw * 0.55, y + ph * 0.18, pw * 0.26, ph * 0.4);
    g.beginPath();
    g.moveTo(x + pw * 0.68, y + ph * 0.18);
    g.lineTo(x + pw * 0.68, y + ph * 0.58);
    g.stroke();
    hatch(x, y + ph * 0.6, pw, ph * 0.4, 9, 0.6, 0.55);
  };
  const steam = (x: number, y: number, pw: number, ph: number) => {
    for (let k = 0; k < 26; k++) {
      const cx = x + r() * pw;
      const cy = y + ph * (0.35 + r() * 0.65);
      const rad = 26 + r() * 70;
      g.fillStyle = k % 3 ? '#e6e4df' : '#cfcdc8';
      g.beginPath();
      g.arc(cx, cy, rad, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(34, 33, 38, 0.7)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, rad, Math.PI * (1 + r() * 0.3), Math.PI * (1.7 + r() * 0.3));
      g.stroke();
    }
  };
  const slash = (x: number, y: number, pw: number, ph: number, flip: number) => {
    // crossing blade arcs: white streaks with ink edges
    for (let k = 0; k < 5; k++) {
      const y0 = y + ph * (0.1 + k * 0.18);
      g.strokeStyle = INKY;
      g.lineWidth = 9 - k;
      g.beginPath();
      g.moveTo(x + (flip > 0 ? 0 : pw), y0 + ph * 0.3);
      g.quadraticCurveTo(x + pw * 0.5, y0 - ph * 0.25, x + (flip > 0 ? pw : 0), y0 + ph * 0.1);
      g.stroke();
      g.strokeStyle = '#f2f1ed';
      g.lineWidth = 5 - k * 0.7;
      g.stroke();
    }
  };
  const runner = (cx: number, cy: number, s: number, lean: number) => {
    // a small figure mid-leap, all ink: torso, head, flying cape, legs, two blades
    g.save();
    g.translate(cx, cy);
    g.rotate(lean);
    g.fillStyle = INKY;
    g.beginPath();
    g.ellipse(0, -s * 0.2, s * 0.16, s * 0.3, 0.2, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(s * 0.1, -s * 0.6, s * 0.13, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-s * 0.05, -s * 0.45);
    g.quadraticCurveTo(-s * 0.7, -s * 0.5, -s * 0.9, -s * 0.05);
    g.quadraticCurveTo(-s * 0.5, -s * 0.15, -s * 0.1, s * 0.05);
    g.closePath();
    g.fill();
    g.strokeStyle = INKY;
    g.lineWidth = s * 0.1;
    for (const [x1, y1, x2, y2] of [[0, 0, -s * 0.25, s * 0.5], [0.05 * s, 0, s * 0.35, s * 0.4], [-s * 0.25, s * 0.5, -s * 0.5, s * 0.55], [s * 0.35, s * 0.4, s * 0.3, s * 0.75]]) {
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
      g.stroke();
    }
    g.lineWidth = s * 0.035;
    g.beginPath();
    g.moveTo(s * 0.1, -s * 0.3);
    g.lineTo(s * 0.95, -s * 0.75);
    g.moveTo(s * 0.05, -s * 0.2);
    g.lineTo(s * 0.9, s * 0.05);
    g.stroke();
    g.restore();
  };
  const eyes = (x: number, y: number, pw: number, ph: number) => {
    // a close-up strip: two narrowed eyes under a hatched brow
    g.fillStyle = '#3a393e';
    g.fillRect(x, y, pw, ph);
    hatch(x, y, pw, ph, 7, -0.8, 0.9);
    for (const side of [0.28, 0.72]) {
      const cx = x + pw * side;
      const cy = y + ph * 0.55;
      g.fillStyle = '#eceae6';
      g.beginPath();
      g.moveTo(cx - pw * 0.13, cy);
      g.quadraticCurveTo(cx, cy - ph * 0.42, cx + pw * 0.13, cy - ph * 0.04);
      g.quadraticCurveTo(cx, cy + ph * 0.22, cx - pw * 0.13, cy);
      g.fill();
      g.strokeStyle = INKY;
      g.lineWidth = 5;
      g.stroke();
      g.fillStyle = INKY;
      g.beginPath();
      g.arc(cx + pw * 0.01, cy - ph * 0.08, ph * 0.15, 0, Math.PI * 2);
      g.fill();
    }
  };
  const sfx = (x: number, y: number, s: number) => {
    // sound-effect strokes: bold angular marks, not letters
    g.strokeStyle = INKY;
    g.lineWidth = s * 0.16;
    g.lineCap = 'square';
    const marks = [[0, 0, 0.5, -0.2], [0.25, -0.35, 0.2, 0.6], [0.7, -0.3, 1.2, -0.45], [0.95, -0.4, 0.8, 0.5], [1.4, -0.5, 1.45, 0.1], [1.4, 0.35, 1.42, 0.4]];
    for (const [x1, y1, x2, y2] of marks) {
      g.beginPath();
      g.moveTo(x + x1 * s, y + y1 * s);
      g.lineTo(x + x2 * s, y + y2 * s);
      g.stroke();
    }
    g.lineCap = 'round';
  };
  const bubble = (cx: number, cy: number, rx: number, ry: number) => {
    g.fillStyle = '#f4f3ef';
    g.strokeStyle = INKY;
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.lineWidth = 2.5;
    for (let k = -1; k <= 1; k++) for (let m = 0; m < 5; m++) {
      g.beginPath();
      g.moveTo(cx + k * rx * 0.36 - 5, cy - ry * 0.6 + m * ry * 0.26);
      g.lineTo(cx + k * rx * 0.36 + 5, cy - ry * 0.6 + m * ry * 0.26 + 6);
      g.stroke();
    }
  };

  // panels as fractions of the mat: [x0, y0, x1, y1, what]
  const panels: [number, number, number, number, string][] = [
    [0, 0, 0.245, 0.4, 'leap'], [0, 0.4, 0.245, 0.63, 'face'], [0, 0.63, 0.245, 1, 'slash'],
    [0.245, 0, 0.49, 0.47, 'steam'], [0.245, 0.47, 0.49, 0.585, 'eyes'], [0.245, 0.585, 0.49, 1, 'wall'],
    [0.49, 0, 0.765, 0.5, 'burst'], [0.49, 0.5, 0.765, 1, 'ground'],
    [0.765, 0, 1, 0.28, 'impact'], [0.765, 0.28, 1, 0.6, 'wall2'], [0.765, 0.6, 1, 1, 'burst2'],
  ];
  for (const [a, b, c2, d, what] of panels) {
    const x = a * w + 8;
    const y = b * h + 8;
    const pw = (c2 - a) * w - 16;
    const ph = (d - b) * h - 16;
    g.save();
    g.beginPath();
    g.rect(x, y, pw, ph);
    g.clip();
    const tone = g.createLinearGradient(x, y, x + pw, y + ph);
    tone.addColorStop(0, '#dedcd7');
    tone.addColorStop(1, '#b9b7b2');
    g.fillStyle = tone;
    g.fillRect(x, y, pw, ph);
    if (what === 'leap') {
      steam(x, y + ph * 0.3, pw, ph * 0.7);
      burst(x + pw * 0.75, y + ph * 0.3, 50, 140);
      runner(x + pw * 0.62, y + ph * 0.5, ph * 0.42, -0.5);
      hatch(x, y, pw * 0.4, ph, 10, 0.4, 0.4);
    } else if (what === 'face') {
      hatch(x, y, pw, ph, 8, 0.5, 0.5);
      bubble(x + pw * 0.74, y + ph * 0.5, pw * 0.17, ph * 0.38);
      runner(x + pw * 0.28, y + ph * 0.75, ph * 0.6, 0.1);
    } else if (what === 'slash') {
      wall(x + pw * 0.45, y, pw * 0.6, ph * 0.7);
      slash(x, y + ph * 0.25, pw, ph * 0.7, 1);
      runner(x + pw * 0.3, y + ph * 0.62, ph * 0.4, 0.5);
      sfx(x + pw * 0.08, y + ph * 0.2, ph * 0.13);
    } else if (what === 'steam') {
      burst(x + pw * 0.5, y + ph * 0.42, 70, 190);
      steam(x, y + ph * 0.25, pw, ph * 0.75);
      runner(x + pw * 0.5, y + ph * 0.36, ph * 0.26, 0.2);
    } else if (what === 'eyes') {
      eyes(x, y, pw, ph);
    } else if (what === 'wall') {
      wall(x, y, pw, ph * 0.75);
      runner(x + pw * 0.45, y + ph * 0.68, ph * 0.42, 1.2);
      sfx(x + pw * 0.45, y + ph * 0.18, ph * 0.12);
      hatch(x, y + ph * 0.8, pw, ph * 0.2, 6, 1, 0.7);
    } else if (what === 'burst' || what === 'burst2') {
      burst(x + pw * 0.3, y + ph * 0.75, 110, 120);
      slash(x, y, pw, ph * 0.6, -1);
    } else if (what === 'ground') {
      hatch(x, y + ph * 0.55, pw, ph * 0.45, 8, 1.2, 0.6);
      steam(x, y + ph * 0.5, pw * 0.5, ph * 0.5);
      burst(x + pw * 0.9, y + ph * 0.1, 40, 200);
    } else if (what === 'impact') {
      burst(x + pw * 0.55, y + ph * 0.5, 90, 60);
      runner(x + pw * 0.3, y + ph * 0.6, ph * 0.5, 0.9);
    } else {
      wall(x, y, pw, ph);
      bubble(x + pw * 0.75, y + ph * 0.3, pw * 0.14, ph * 0.22);
      runner(x + pw * 0.35, y + ph * 0.6, ph * 0.42, -0.2);
    }
    g.restore();
    g.strokeStyle = INKY;
    g.lineWidth = 6;
    g.strokeRect(x, y, pw, ph);
  }

  // the one figure in colour, breaking across the panels on the right: seen from behind in a deep lunge,
  // the cloak thrown wide, one blade drawn back and one forward
  const S = h * 0.0048;
  g.save();
  g.translate(w * 0.655, h * 0.6);
  g.rotate(-0.12);
  const ink = (lw: number) => {
    g.strokeStyle = '#141418';
    g.lineWidth = lw * S;
    g.stroke();
  };
  // back leg and boot
  g.fillStyle = '#1b1b20';
  g.beginPath();
  g.moveTo(6 * S, 20 * S);
  g.lineTo(60 * S, 62 * S);
  g.lineTo(78 * S, 96 * S);
  g.lineTo(60 * S, 100 * S);
  g.lineTo(34 * S, 72 * S);
  g.lineTo(-8 * S, 44 * S);
  g.closePath();
  g.fill();
  // front leg, bent
  g.beginPath();
  g.moveTo(-10 * S, 30 * S);
  g.lineTo(-36 * S, 76 * S);
  g.lineTo(-22 * S, 100 * S);
  g.lineTo(-6 * S, 98 * S);
  g.lineTo(-14 * S, 76 * S);
  g.lineTo(16 * S, 40 * S);
  g.closePath();
  g.fill();
  // straps crossing the thighs
  g.strokeStyle = '#cfcdc8';
  g.lineWidth = 2.2 * S;
  for (const [x1, y1, x2, y2] of [[-22, 56, -4, 66], [-28, 68, -10, 78], [30, 52, 46, 44], [42, 64, 58, 56]]) {
    g.beginPath();
    g.moveTo(x1 * S, y1 * S);
    g.lineTo(x2 * S, y2 * S);
    g.stroke();
  }
  // the forward arm and blade
  g.strokeStyle = '#1b1b20';
  g.lineWidth = 11 * S;
  g.beginPath();
  g.moveTo(40 * S, -34 * S);
  g.lineTo(96 * S, -52 * S);
  g.stroke();
  for (const [x1, y1, x2, y2] of [[96, -52, 190, -96], [-20, -40, -120, -92]]) {
    g.strokeStyle = '#141418';
    g.lineWidth = 5 * S;
    g.beginPath();
    g.moveTo(x1 * S, y1 * S);
    g.lineTo(x2 * S, y2 * S);
    g.stroke();
    g.strokeStyle = '#f3f2ee';
    g.lineWidth = 2.6 * S;
    g.stroke();
  }
  // the cloak
  g.fillStyle = '#2d4a3a';
  g.beginPath();
  g.moveTo(52 * S, -44 * S);
  g.quadraticCurveTo(10 * S, -66 * S, -40 * S, -40 * S);
  g.quadraticCurveTo(-96 * S, -14 * S, -128 * S, 34 * S);
  g.quadraticCurveTo(-96 * S, 22 * S, -78 * S, 46 * S);
  g.quadraticCurveTo(-52 * S, 26 * S, -30 * S, 50 * S);
  g.quadraticCurveTo(-4 * S, 30 * S, 22 * S, 44 * S);
  g.quadraticCurveTo(44 * S, 28 * S, 66 * S, 30 * S);
  g.quadraticCurveTo(70 * S, -10 * S, 52 * S, -44 * S);
  g.closePath();
  g.fill();
  ink(2.6);
  // light and shade on the cloth
  g.fillStyle = 'rgba(86, 128, 98, 0.55)';
  g.beginPath();
  g.moveTo(40 * S, -42 * S);
  g.quadraticCurveTo(0, -58 * S, -40 * S, -36 * S);
  g.quadraticCurveTo(0, -40 * S, 36 * S, -24 * S);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(14, 28, 20, 0.75)';
  g.lineWidth = 2 * S;
  for (const [x1, y1, cx, cy, x2, y2] of [[-30, -30, -70, -6, -100, 26], [-6, -34, -34, 4, -52, 34], [20, -30, 4, 6, -8, 36], [44, -24, 40, 4, 40, 30]]) {
    g.beginPath();
    g.moveTo(x1 * S, y1 * S);
    g.quadraticCurveTo(cx * S, cy * S, x2 * S, y2 * S);
    g.stroke();
  }
  // a pale crest on the back: a shield with two crossed feathers (an original mark)
  g.save();
  g.translate(2 * S, -6 * S);
  g.rotate(-0.25);
  g.fillStyle = '#e9e5d6';
  g.beginPath();
  g.moveTo(-17 * S, -18 * S);
  g.lineTo(17 * S, -18 * S);
  g.lineTo(17 * S, 4 * S);
  g.quadraticCurveTo(0, 26 * S, -17 * S, 4 * S);
  g.closePath();
  g.fill();
  ink(1.6);
  for (const [dir, col] of [[-1, '#3b5f9a'], [1, '#8f9aa8']] as const) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(dir * -11 * S, 10 * S);
    g.quadraticCurveTo(dir * 2 * S, -4 * S, dir * 12 * S, -14 * S);
    g.quadraticCurveTo(dir * -2 * S, -12 * S, dir * -11 * S, 10 * S);
    g.fill();
  }
  g.restore();
  // the head, hair cropped short at the back
  g.fillStyle = '#121216';
  g.beginPath();
  g.ellipse(56 * S, -58 * S, 16 * S, 15 * S, 0.3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#e8c9a8';
  g.beginPath();
  g.ellipse(66 * S, -50 * S, 7 * S, 9 * S, 0.3, -0.4, 1.9);
  g.fill();
  g.restore();

  // the stitched edge of the mat
  g.strokeStyle = 'rgba(240, 239, 235, 0.95)';
  g.lineWidth = 7;
  g.strokeRect(5, 5, w - 10, h - 10);
  return c;
}

/** The rolling whiteboard: Max's content calendar, as written on the real board in blue marker. */
export function whiteboard(w = 1208, h = 1728) {
  const { c, g } = make(w, h);
  g.fillStyle = '#fbfbf8';
  g.fillRect(0, 0, w, h);
  const r = rng(88);
  // faint eraser smears
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(60, 80, 160, ${0.012 + r() * 0.02})`;
    g.beginPath();
    g.ellipse(r() * w, r() * h, 80 + r() * 200, 30 + r() * 60, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const HAND = "'Bradley Hand', 'Marker Felt', 'Segoe Print', 'Comic Sans MS', cursive";
  const BLUE = '#1f3fc4';
  const u = w / 1208;
  const write = (text: string, x: number, y: number, size = 54, color = BLUE, tilt = -0.015) => {
    g.save();
    g.translate(x * u, y * u);
    g.rotate(tilt);
    g.font = `700 ${size * u}px ${HAND}`;
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.fillText(text, 0, 0);
    g.restore();
  };
  const box = (x: number, y: number, bw: number, bh: number) => {
    g.strokeStyle = BLUE;
    g.lineWidth = 6 * u;
    g.beginPath();
    g.roundRect(x * u, y * u, bw * u, bh * u, 16 * u);
    g.stroke();
  };
  const line = (x0: number, y0: number, x1: number, y1: number, color = BLUE) => {
    g.strokeStyle = color;
    g.lineWidth = 5 * u;
    g.beginPath();
    g.moveTo(x0 * u, y0 * u);
    g.lineTo(x1 * u, y1 * u);
    g.stroke();
  };
  // the week across the top: a date over a line over that day's count
  const days: [string, string][] = [['11/11', '51'], ['11/12', '101'], ['11/13', '0'], ['11/14', '0'], ['11/15', '17'], ['11/16', '100'], ['11/17', '84']];
  days.forEach(([day, n], i) => {
    const x = 70 + i * 156;
    write(day, x, 110, 46, '#222');
    line(x - 6, 142, x + 112, 140, '#222');
    write(n, x + 20, 182, 46, n === '101' ? '#d1362c' : '#222');
  });
  write('Video →  TikTok, IG, LinkedIn', 80, 330, 66);
  write('Flyer →  LinkedIn, IG, TikTok', 80, 430, 66);
  write('Interview season', 110, 560, 50);
  line(100, 596, 760, 590);
  box(74, 640, 120, 70);
  write('Nov', 90, 676, 48);
  write('ramping down before Thanksgiving', 210, 676, 34);
  box(520, 700, 440, 82);
  write('Dec 1st – Dec 8th', 548, 742, 52);
  write('• interview tips', 190, 830, 52);
  write('• testimonials for mock interview prep', 170, 906, 46);
  write("• if you didn't get an interview", 170, 980, 46);
  write('→ resume review', 400, 1046, 46);
  write('Apps & interviews', 80, 1140, 50);
  line(76, 1174, 470, 1170);
  box(620, 1090, 360, 80);
  write('Dec 27th – 31st', 644, 1130, 46);
  write('resume roasts', 740, 1230, 38);
  write('technical problem', 720, 1290, 38);
  write('walkthrough', 760, 1346, 38);
  box(74, 1206, 580, 80);
  write('Jan – March (2nd–3rd week)', 96, 1246, 42);
  write('• interview tips', 130, 1326, 40);
  write('• testimonials', 130, 1378, 40);
  write('• resume rewrite tips', 130, 1430, 40);
  box(74, 1486, 330, 86);
  write('March – May', 98, 1530, 50);
  write('– summer academy', 80, 1616, 46);
  write('– tips to be successful @ internship or FT job', 80, 1680, 40);
  return c;
}


/**
 * The patch on Coco's green hoodie: a pale shield with a pair of wings, one blue and one white, on the hoodie's green.
 * An original drawing in the spirit of the Survey Corps emblem on her real hoodie, not a copy of it.
 */
export function wingsPatch(w = 256, h = 256) {
  const { c, g } = make(w, h);
  g.fillStyle = '#1f5a3a';
  g.fillRect(0, 0, w, h);
  const cx = w / 2;
  // the shield
  g.fillStyle = '#e4e0e8';
  g.strokeStyle = '#a9a2b8';
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(w * 0.2, h * 0.16);
  g.lineTo(w * 0.8, h * 0.16);
  g.lineTo(w * 0.8, h * 0.58);
  g.quadraticCurveTo(w * 0.8, h * 0.78, cx, h * 0.9);
  g.quadraticCurveTo(w * 0.2, h * 0.78, w * 0.2, h * 0.58);
  g.closePath();
  g.fill();
  g.stroke();
  // two wings fanning out from the middle, feathers stacked
  const R = w * 0.32;
  const cy = h * 0.5;
  const wing = (dir: 1 | -1, fill: string) => {
    for (let k = 0; k < 5; k++) {
      const len = R * (0.95 - k * 0.12);
      const y0 = cy - R * 0.45 + k * R * 0.2;
      g.fillStyle = fill;
      g.strokeStyle = '#2a2440';
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(cx, y0);
      g.quadraticCurveTo(cx + dir * len * 0.6, y0 - R * 0.3, cx + dir * len, y0 - R * 0.06);
      g.quadraticCurveTo(cx + dir * len * 0.55, y0 + R * 0.08, cx, y0 + R * 0.14);
      g.closePath();
      g.fill();
      g.stroke();
    }
  };
  wing(-1, '#5b5fc7');
  wing(1, '#ffffff');
  return c;
}

/**
 * The wrap for the energy-drink can on the desk: a slim can in blue and silver blocks with the name in red. A plain
 * stand-in for the real can, with no copied artwork.
 */
export function energyCanWrap(w = 512, h = 512) {
  const { c, g } = make(w, h);
  const cell = w / 8;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const blue = (x / cell + y / cell) % 2 === 0;
      g.fillStyle = blue ? '#1e3f8a' : '#c9ccd3';
      g.fillRect(x, y, cell, cell);
    }
  }
  // a band round the middle for the name
  g.fillStyle = '#e9ebef';
  g.fillRect(0, h * 0.38, w, h * 0.24);
  g.fillStyle = '#d2232a';
  g.font = `900 ${h * 0.13}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  // printed twice round the can so the name faces the room whichever way it is turned
  for (const cx of [w * 0.25, w * 0.75]) g.fillText('Red Bull', cx, h * 0.5);
  return c;
}
