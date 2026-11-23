import React, { useEffect, useRef } from 'react';
import { Route } from '../../types';

/**
 * The top of every page off the pod: a small cardboard diorama, built in CSS 3D, that the page's title hangs in
 * front of. Each layer sits at its own depth (translateZ) inside a perspective stage, and the whole set turns a few
 * degrees after the pointer, so it reads as a model on a desk rather than a picture. The props are original
 * cut-outs drawn in the pod's palette: stand-ins for the page's subject, not anyone's artwork.
 */

const INK = '#1f150e';

type Prop = { el: React.ReactNode; left: string; bottom: string; w: string; z: number; cls?: string };

const Pencil = () => (
  <svg viewBox="0 0 60 220" aria-hidden="true">
    <path d="M18 40h24v150l-12 26-12-26z" fill="#e8b23a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M18 190l12 26 12-26z" fill="#f4c9a0" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M26 206l4 10 4-10z" fill={INK} />
    <rect x="18" y="26" width="24" height="16" fill="#c9ccd3" stroke={INK} strokeWidth="4" />
    <rect x="18" y="6" width="24" height="22" rx="8" fill="#e58b8b" stroke={INK} strokeWidth="4" />
    <path d="M30 42v146" stroke="#c98f1c" strokeWidth="3" />
  </svg>
);
const Paper = () => (
  <svg viewBox="0 0 180 140" aria-hidden="true">
    <rect x="16" y="14" width="150" height="116" rx="6" fill="#efe3cc" stroke={INK} strokeWidth="4" transform="rotate(-5 90 70)" />
    <rect x="10" y="10" width="150" height="116" rx="6" fill="#fffaf0" stroke={INK} strokeWidth="4" />
    {[34, 52, 70, 88, 106].map((y) => (
      <path key={y} d={`M26 ${y}h${y === 106 ? 70 : 116}`} stroke="#9bb4c9" strokeWidth="4" strokeLinecap="round" />
    ))}
  </svg>
);
const Crate = ({ label = '' }: { label?: string }) => (
  <svg viewBox="0 0 140 120" aria-hidden="true">
    <path d="M10 30l60-20 60 20v76l-60 10-60-10z" fill="#c9a27a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M10 30l60 14 60-14M70 44v72" fill="none" stroke={INK} strokeWidth="4" />
    <path d="M28 26l60 14" stroke="#e9d2a8" strokeWidth="10" />
    {label && (
      <text x="40" y="88" fontFamily="Nunito, sans-serif" fontWeight="900" fontSize="18" fill={INK} transform="skewY(8)">
        {label}
      </text>
    )}
  </svg>
);
const Gear = () => (
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <g fill="#7c8a96" stroke={INK} strokeWidth="4" strokeLinejoin="round">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="52" y="4" width="16" height="22" rx="3" transform={`rotate(${i * 45} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="38" />
    </g>
    <circle cx="60" cy="60" r="14" fill="#efe3cc" stroke={INK} strokeWidth="4" />
  </svg>
);
const Bubble = ({ text }: { text: string }) => (
  <svg viewBox="0 0 160 130" aria-hidden="true">
    <path d="M20 10h120a12 12 0 0 1 12 12v62a12 12 0 0 1-12 12H70l-30 26 4-26H20A12 12 0 0 1 8 84V22a12 12 0 0 1 12-12z" fill="#fff6e5" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <text x="80" y="72" textAnchor="middle" fontFamily="'Bagel Fat One', sans-serif" fontSize="52" fill="#5b4b8a">
      {text}
    </text>
  </svg>
);
const Bulb = () => (
  <svg viewBox="0 0 90 130" aria-hidden="true">
    <circle cx="45" cy="48" r="38" fill="#ffe9a8" stroke={INK} strokeWidth="4" />
    <path d="M32 84h26v18H32z" fill="#c9ccd3" stroke={INK} strokeWidth="4" />
    <path d="M34 104h22v10H34z" fill="#7c8a96" stroke={INK} strokeWidth="4" />
    <path d="M36 60q9-18 18 0" fill="none" stroke="#c98f1c" strokeWidth="4" />
  </svg>
);
const Hurdle = () => (
  <svg viewBox="0 0 200 130" aria-hidden="true">
    <rect x="14" y="18" width="172" height="26" fill="#fff6e5" stroke={INK} strokeWidth="4" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={14 + i * 43} y="18" width="22" height="26" fill="#b83a26" />
    ))}
    <rect x="14" y="18" width="172" height="26" fill="none" stroke={INK} strokeWidth="4" />
    <path d="M26 44v76M174 44v76M10 120h34M156 120h34" stroke={INK} strokeWidth="8" strokeLinecap="round" />
  </svg>
);
const Medal = () => (
  <svg viewBox="0 0 90 150" aria-hidden="true">
    <path d="M20 4l25 70L70 4" fill="none" stroke="#b83a26" strokeWidth="16" />
    <path d="M20 4l25 70L70 4" fill="none" stroke="#e8b23a" strokeWidth="4" />
    <circle cx="45" cy="102" r="34" fill="#e8b23a" stroke={INK} strokeWidth="4" />
    <circle cx="45" cy="102" r="22" fill="none" stroke="#c98f1c" strokeWidth="4" />
    <text x="45" y="111" textAnchor="middle" fontFamily="'Bagel Fat One', sans-serif" fontSize="24" fill={INK}>
      1
    </text>
  </svg>
);
const Pennant = () => (
  <svg viewBox="0 0 200 110" aria-hidden="true">
    <path d="M10 8v94" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    <path d="M12 12l176 34-176 34z" fill="#b83a26" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M12 12h40v68H12z" fill="#e8b23a" />
    <path d="M12 12l176 34-176 34z" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <text x="64" y="56" fontFamily="'Bagel Fat One', sans-serif" fontSize="26" fill="#fff6e5">
      MD
    </text>
  </svg>
);
const Laptop = () => (
  <svg viewBox="0 0 220 150" aria-hidden="true">
    <rect x="30" y="8" width="160" height="104" rx="8" fill="#2b2f3a" stroke={INK} strokeWidth="4" />
    <rect x="42" y="20" width="136" height="80" rx="3" fill="#162032" />
    {[
      [52, 34, 50, '#e8b23a'],
      [62, 48, 74, '#8fd0c7'],
      [62, 62, 56, '#f4c9a0'],
      [52, 76, 34, '#e8b23a'],
      [62, 88, 90, '#8fd0c7'],
    ].map(([x, y, l, c], i) => (
      <path key={i} d={`M${x} ${y}h${l}`} stroke={c as string} strokeWidth="6" strokeLinecap="round" />
    ))}
    <path d="M8 118h204l-14 22H22z" fill="#c9ccd3" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
  </svg>
);
const DeadCloud = () => (
  <svg viewBox="0 0 160 110" aria-hidden="true">
    <path d="M38 92a26 26 0 0 1-4-52 34 34 0 0 1 64-10 24 24 0 0 1 32 22 20 20 0 0 1-2 40z" fill="#dfe6ee" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <path d="M60 46l16 16M76 46L60 62M92 46l16 16M108 46L92 62" stroke={INK} strokeWidth="5" strokeLinecap="round" />
  </svg>
);
const Mic = () => (
  <svg viewBox="0 0 100 260" aria-hidden="true">
    <path d="M50 92v150M22 250h56" stroke={INK} strokeWidth="8" strokeLinecap="round" />
    <rect x="30" y="8" width="40" height="70" rx="20" fill="#7c8a96" stroke={INK} strokeWidth="4" />
    {[24, 38, 52].map((y) => (
      <path key={y} d={`M34 ${y}h32`} stroke={INK} strokeWidth="3" opacity="0.5" />
    ))}
    <rect x="40" y="76" width="20" height="18" fill="#2b2f3a" stroke={INK} strokeWidth="4" />
  </svg>
);
const Spot = () => (
  <svg viewBox="0 0 120 100" aria-hidden="true">
    <path d="M20 20l60-12 18 40-60 22z" fill="#2b2f3a" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
    <ellipse cx="88" cy="28" rx="10" ry="22" transform="rotate(-25 88 28)" fill="#ffe9a8" stroke={INK} strokeWidth="4" />
    <path d="M40 70l-10 26M60 64l10 30" stroke={INK} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

/** The page's sign, its colour, a short line under it, and the props on the set. */
const SETS: Record<Exclude<Route, 'home' | 'builder'>, { title: string; sub: string; felt: string; props: Prop[] }> = {
  writing: {
    title: 'Writing',
    sub: 'guides, written properly',
    felt: '#2f6f6b',
    props: [
      { el: <Paper />, left: '6%', bottom: '8%', w: '15%', z: 60 },
      { el: <Pencil />, left: '22%', bottom: '6%', w: '4.5%', z: 90, cls: 'lvl-tilt' },
      { el: <Paper />, left: '78%', bottom: '10%', w: '13%', z: 30, cls: 'lvl-tilt-r' },
    ],
  },
  builds: {
    title: 'Builds',
    sub: 'Edge, Chromium and side quests',
    felt: '#8c6a48',
    props: [
      { el: <Crate label="v1" />, left: '5%', bottom: '6%', w: '13%', z: 70 },
      { el: <Crate />, left: '9%', bottom: '34%', w: '10%', z: 40 },
      { el: <Gear />, left: '80%', bottom: '14%', w: '10%', z: 50, cls: 'lvl-spin' },
      { el: <Crate label="ship" />, left: '88%', bottom: '4%', w: '10%', z: 90 },
    ],
  },
  ask: {
    title: 'Ask WM3',
    sub: 'ask the post archive anything',
    felt: '#5b4b8a',
    props: [
      { el: <Bubble text="?" />, left: '6%', bottom: '18%', w: '13%', z: 70, cls: 'lvl-bob' },
      { el: <Bulb />, left: '83%', bottom: '14%', w: '7%', z: 60, cls: 'lvl-bob2' },
    ],
  },
  life: {
    title: 'Life',
    sub: 'Maryland, track, Microsoft',
    felt: '#b83a26',
    props: [
      { el: <Hurdle />, left: '4%', bottom: '5%', w: '17%', z: 80 },
      { el: <Pennant />, left: '78%', bottom: '44%', w: '14%', z: 30, cls: 'lvl-sway' },
      { el: <Medal />, left: '86%', bottom: '6%', w: '7%', z: 90, cls: 'lvl-sway' },
    ],
  },
  lilo: {
    title: 'LILO',
    sub: 'the case study: a classroom that runs in the browser',
    felt: '#2e5d8c',
    props: [
      { el: <Laptop />, left: '4%', bottom: '6%', w: '18%', z: 80 },
      { el: <DeadCloud />, left: '80%', bottom: '40%', w: '13%', z: 30, cls: 'lvl-bob' },
    ],
  },
  speaking: {
    title: 'Speaking',
    sub: 'talks and workshops',
    felt: '#7a2a20',
    props: [
      { el: <Mic />, left: '12%', bottom: '6%', w: '5.5%', z: 90 },
      { el: <Spot />, left: '84%', bottom: '56%', w: '9%', z: 20 },
      { el: <Spot />, left: '2%', bottom: '58%', w: '8%', z: 20, cls: 'lvl-flip' },
    ],
  },
};

const LevelBanner: React.FC<{ route: Exclude<Route, 'home' | 'builder'>; compact?: boolean }> = ({ route, compact }) => {
  const set = SETS[route];
  const stage = useRef<HTMLDivElement>(null);

  // The set turns a few degrees toward the pointer. Skipped when motion is reduced or the pointer is coarse.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)');
    if (still.matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / Math.max(r.height, 1) - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(6 - Math.max(-1, Math.min(1, y)) * 4).toFixed(2)}deg`);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`lvl${compact ? ' lvl--compact' : ''}`} ref={stage} aria-hidden="true" style={{ '--felt': set.felt } as React.CSSProperties}>
      <div className="lvl__set">
        <div className="lvl__back" />
        <div className="lvl__floor" />
        <div className="lvl__curtain lvl__curtain--l" />
        <div className="lvl__curtain lvl__curtain--r" />
        <div className="lvl__sign">
          <span className="lvl__string lvl__string--l" />
          <span className="lvl__string lvl__string--r" />
          <div className="lvl__board">
            <span className="lvl__title">{set.title}</span>
            <span className="lvl__sub">{set.sub}</span>
          </div>
        </div>
        {set.props.map((p, i) => (
          <div
            key={i}
            className={`lvl__prop ${p.cls ?? ''}`}
            style={{ left: p.left, bottom: p.bottom, width: p.w, transform: `translateZ(${p.z}px)` }}
          >
            <div className="lvl__cut">{p.el}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LevelBanner;
