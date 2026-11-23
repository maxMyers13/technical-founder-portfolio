/**
 * Coco, built from parameters. The room and the character builder (#builder) both draw her from this file, so what
 * Max dials in the builder is exactly what sits under the desk.
 *
 * She is built the way a dog is put together: a spine from rump to withers, a neck, a skull and a muzzle, four legs
 * of three bones and a paw each, ears that grow from the top of the skull, and a tail of eight segments. Every part
 * is a smooth skin swept along its bones. A pose sets the joint angles; the curl bends the whole spine; lying poses
 * roll her onto her side. Then she is set on the floor.
 *
 * Units are millimetres in her own frame: x toward her nose, y up, z out of her left side.
 */
import saved from './coco.params.json';

export type CocoPose = 'curled' | 'sphinx' | 'side' | 'sit' | 'stand';
export type EarStyle = 'tipped' | 'rose' | 'drop' | 'erect';
export type EyeState = 'open' | 'sleepy' | 'closed';

export type CocoParams = {
  pose: CocoPose;
  curl: number;
  headLift: number;
  headTurn: number;
  headTilt: number;
  flip: boolean;
  size: number;
  bodyLength: number;
  chestDepth: number;
  chestWidth: number;
  waistTuck: number;
  rump: number;
  neckLength: number;
  neckThickness: number;
  legLength: number;
  legThickness: number;
  pawSize: number;
  skullWidth: number;
  skullLength: number;
  skullHeight: number;
  stop: number;
  browRidge: number;
  muzzleLength: number;
  muzzleWidth: number;
  muzzleDepth: number;
  jowls: number;
  noseSize: number;
  earStyle: EarStyle;
  earSize: number;
  earWidth: number;
  earSet: number;
  earSpread: number;
  earFold: number;
  eyes: EyeState;
  eyeSize: number;
  eyeColor: string;
  tailLength: number;
  tailThickness: number;
  tailSet: number;
  tailCurl: number;
  coat: string;
  coatSheen: number;
  muzzleGrey: number;
  greyColor: string;
  chestPatch: number;
  patchColor: string;
  socks: number;
  tanPoints: boolean;
  tanColor: string;
  hoodie: boolean;
  hoodieColor: string;
  hood: 'down' | 'up';
  wings: boolean;
  collar: boolean;
  collarColor: string;
  tag: boolean;
};

/** Coco as she is: a lean black lab/shepherd mix of about 50 lb, from Max's photos. */
export const COCO_BASE: CocoParams = {
  pose: 'sphinx',
  curl: 0,
  headLift: -0.25,
  headTurn: 0,
  headTilt: 0,
  flip: false,
  size: 1,
  bodyLength: 1,
  chestDepth: 1,
  chestWidth: 0.92,
  waistTuck: 0.55,
  rump: 0.95,
  neckLength: 1,
  neckThickness: 1,
  legLength: 1.05,
  legThickness: 0.9,
  pawSize: 1,
  skullWidth: 1,
  skullLength: 1,
  skullHeight: 1,
  stop: 0.55,
  browRidge: 0.5,
  muzzleLength: 1,
  muzzleWidth: 1,
  muzzleDepth: 1,
  jowls: 0.25,
  noseSize: 1,
  earStyle: 'tipped',
  earSize: 1,
  earWidth: 1,
  earSet: 0.6,
  earSpread: 0.4,
  earFold: 0.7,
  eyes: 'sleepy',
  eyeSize: 1,
  eyeColor: '#4a2a14',
  tailLength: 0.85,
  tailThickness: 1.15,
  tailSet: 0,
  tailCurl: 0,
  coat: '#1b1818',
  coatSheen: 0.7,
  muzzleGrey: 0.15,
  greyColor: '#6b6560',
  chestPatch: 0.5,
  patchColor: '#e9e4da',
  socks: 0,
  tanPoints: false,
  tanColor: '#8a5a2b',
  hoodie: true,
  hoodieColor: '#1f5a3a',
  hood: 'down',
  wings: true,
  collar: false,
  collarColor: '#b83a26',
  tag: true,
};

/** What the room draws: the base with whatever the builder last saved to coco.params.json on top. */
export const COCO: CocoParams = { ...COCO_BASE, ...(saved as Partial<CocoParams>) };

export type CocoMat = 'coat' | 'muzzle' | 'nose' | 'eye' | 'lidline' | 'patch' | 'socks' | 'tan' | 'hoodie' | 'hood' | 'collar' | 'tag';
export type RawMesh = { pos: number[]; nrm: number[]; uv: number[]; idx: number[] };
export type CocoBuild = {
  meshes: Partial<Record<CocoMat, RawMesh>>;
  /** Her head, for the hover label and the builder's face camera. */
  head: [number, number, number];
  /** The middle of her and her height, for framing. */
  center: [number, number, number];
  height: number;
  length: number;
};

type V = [number, number, number];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: V) => Math.hypot(a[0], a[1], a[2]);
const unit = (a: V): V => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const D2R = Math.PI / 180;
/** A direction in her side-on plane: 0 degrees points down, +90 forward (toward her nose), -90 back. */
const dirDeg = (deg: number, z = 0): V => unit([Math.sin(deg * D2R), -Math.cos(deg * D2R), z]);
/** Rotate v about a unit axis k by angle a (Rodrigues). */
const rot = (v: V, k: V, a: number): V => {
  const c = Math.cos(a), s = Math.sin(a);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c)));
};

/** One cross-section of a skin: its centre, half-width along `wd`, half-height across it. */
type Ring = { c: V; w: number; h: number; wd: V };
type Skin = { mat: CocoMat; rings: Ring[]; open?: boolean; flat?: number; slices?: number; group: 'torso' | 'hind' };

/**
 * The pose table. Joint angles are in degrees in her side-on plane (0 = straight down, +90 = forward) and are
 * measured in the world, so a sitting dog's front legs stay upright however far her body is tipped back.
 * `pitch` tips her body up about the hips (sitting), `roll` turns her onto her side, `curl` bends her spine so her
 * nose comes round toward her tail.
 */
const POSES: Record<CocoPose, {
  pitch: number;
  roll: number;
  curl: number;
  neck: number;
  head: number;
  front: [number, number, number, number];
  hind: [number, number, number, number];
  tail: { set: number; curl: number; sweep: number };
}> = {
  stand: { pitch: 0, roll: 0, curl: 0, neck: 48, head: -8, front: [-18, 0, 14, 88], hind: [28, -42, 6, 88], tail: { set: -40, curl: -4, sweep: 0 } },
  sit: { pitch: 42, roll: 0, curl: 0, neck: 72, head: -4, front: [-4, 0, 10, 88], hind: [72, -84, 90, 92], tail: { set: -20, curl: 0, sweep: 9 } },
  sphinx: { pitch: 0, roll: 0, curl: 0, neck: 42, head: -6, front: [42, 90, 92, 94], hind: [84, -96, 88, 92], tail: { set: -25, curl: 2, sweep: 8 } },
  side: { pitch: 0, roll: 84, curl: 0.12, neck: 18, head: -6, front: [58, 72, 80, 92], hind: [48, 18, 34, 82], tail: { set: -12, curl: 3, sweep: 0 } },
  curled: { pitch: 0, roll: 82, curl: 0.62, neck: 4, head: -30, front: [28, 96, 104, 100], hind: [62, -58, 36, 88], tail: { set: -20, curl: 16, sweep: 0 } },
};

/** Build her: every skin as a mesh, grouped by material. */
export function buildCoco(p: CocoParams): CocoBuild {
  const pose = POSES[p.pose];
  const skins: Skin[] = [];
  const Z: V = [0, 0, 1];
  const X: V = [1, 0, 0];
  const Y: V = [0, 1, 0];

  // ---------- the trunk: rump to chest, the topline level, the belly tucked up behind the ribs ----------
  const L = 560 * p.bodyLength;
  const cd = 108 * p.chestDepth;
  const cw = 74 * p.chestWidth;
  const T = cd; // the top of her back
  const tuck = p.waistTuck;
  const trunk: [number, number, number, number][] = [
    // x, topline, half-width, half-height
    [-0.5 * L, T - 0.16 * cd, 0.5 * cw * p.rump, 0.46 * cd * p.rump],
    [-0.42 * L, T - 0.06 * cd, 0.82 * cw * p.rump, 0.66 * cd * p.rump],
    [-0.3 * L, T - 0.02 * cd, 0.8 * cw, 0.74 * cd * (1 - 0.22 * tuck)],
    [-0.12 * L, T, 0.76 * cw, cd * (0.86 - 0.36 * tuck)],
    [0.08 * L, T, 0.95 * cw, cd * 0.97],
    [0.26 * L, T + 0.02 * cd, cw, cd],
    [0.4 * L, T + 0.06 * cd, 0.9 * cw, cd * 0.94],
    [0.5 * L, T + 0.02 * cd, 0.66 * cw, cd * 0.7],
  ];
  const trunkRings: Ring[] = trunk.map(([x, top, w, h]) => ({ c: [x, top - h, 0], w, h, wd: Z }));
  skins.push({ mat: 'coat', rings: trunkRings, flat: 0.92, group: 'torso' });
  const trunkAt = (x: number) => {
    // the trunk's section at x, by straight interpolation between rings (good enough to seat things on her)
    for (let i = 0; i < trunk.length - 1; i++) {
      const a = trunk[i], b = trunk[i + 1];
      if (x <= b[0] || i === trunk.length - 2) {
        const t = Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0])));
        const top = lerp(a[1], b[1], t), w = lerp(a[2], b[2], t), h = lerp(a[3], b[3], t);
        return { y: top - h, w, h };
      }
    }
    return { y: 0, w: cw, h: cd };
  };

  // world-measured angles become body-measured ones once her body is tipped up for sitting
  const pitch = pose.pitch;
  const body = (deg: number) => deg - pitch;

  // ---------- neck ----------
  const nt = p.neckThickness;
  const NL = 175 * p.neckLength;
  const neckDir = dirDeg(90 + body(pose.neck));
  // the neck rises from inside the top of the chest
  const n0: V = [0.36 * L, T - 0.32 * cd, 0];
  const n1 = add(n0, mul(neckDir, NL * 0.5));
  const n2 = add(n0, mul(neckDir, NL));
  skins.push({
    mat: 'coat',
    group: 'torso',
    rings: [
      { c: add(n0, mul(neckDir, -30)), w: 64 * nt, h: 86 * nt, wd: Z },
      { c: n0, w: 60 * nt, h: 78 * nt, wd: Z },
      { c: n1, w: 50 * nt, h: 58 * nt, wd: Z },
      { c: n2, w: 45 * nt, h: 50 * nt, wd: Z },
    ],
  });

  // ---------- head: a frame at the top of the neck, pitched, turned and tilted ----------
  const pitchH = (body(pose.head) + p.headLift * 35) * D2R;
  let f: V = [Math.cos(pitchH), Math.sin(pitchH), 0];
  let u: V = [-Math.sin(pitchH), Math.cos(pitchH), 0];
  let s: V = Z;
  const turn = p.headTurn * 50 * D2R;
  f = rot(f, Y, turn); u = rot(u, Y, turn); s = rot(s, Y, turn);
  const tilt = p.headTilt * 25 * D2R;
  u = rot(u, f, tilt); s = rot(s, f, tilt);
  const SL = 130 * p.skullLength;
  const SW = 60 * p.skullWidth;
  const SH = 54 * p.skullHeight;
  const hb = add(n2, mul(f, -0.1 * SL));
  const H = (d: number, e: number, side = 0): V => add(add(add(hb, mul(f, d)), mul(u, e)), mul(s, side));
  const stop = p.stop;
  const skull: [number, number, number, number][] = [
    // along f, along u, half-width, half-height
    [0, 0.22 * SH, 0.52 * SW, 0.52 * SH],
    [0.24 * SL, 0.2 * SH, 0.94 * SW, 0.94 * SH],
    [0.52 * SL, 0.18 * SH, SW, SH],
    [0.8 * SL, 0.14 * SH + p.browRidge * 0.06 * SH, 0.88 * SW, 0.9 * SH],
    [SL, 0.02 * SH - stop * 0.1 * SH, 0.7 * SW, 0.74 * SH * (1 - 0.22 * stop)],
  ];
  skins.push({ mat: 'coat', group: 'torso', rings: skull.map(([d, e, w, h]) => ({ c: H(d, e), w, h, wd: s })) });
  const ML = 95 * p.muzzleLength;
  const MW = SW * 0.66 * p.muzzleWidth;
  const MD = SH * 0.66 * p.muzzleDepth;
  const jowl = p.jowls * 0.1 * SH;
  const mz: [number, number, number, number][] = [
    [0.78 * SL, -0.04 * SH, MW * 1.12, MD * 1.12 + jowl],
    [SL + 0.1 * ML, -0.1 * SH - jowl * 0.5, MW * 1.04, MD * 1.02 + jowl],
    [SL + 0.5 * ML, -0.13 * SH - jowl * 0.6, MW * 0.93, MD * 0.94 + jowl * 0.8],
    [SL + 0.86 * ML, -0.14 * SH - jowl * 0.3, MW * 0.86, MD * 0.84],
    [SL + ML, -0.12 * SH, MW * 0.78, MD * 0.74],
  ];
  // the muzzle greys from the nose back: a grey muzzle skin over the black one, as much of it as she has
  skins.push({ mat: 'coat', group: 'torso', flat: 0.8, rings: mz.map(([d, e, w, h]) => ({ c: H(d, e), w, h, wd: s })) });
  if (p.muzzleGrey > 0.02) {
    const from = Math.max(0, 3 - Math.round(p.muzzleGrey * 3));
    const grey = mz.slice(from).map(([d, e, w, h]) => ({ c: H(d, e - 0.6), w: w + 0.8, h: h + 0.8, wd: s }));
    if (grey.length >= 2) skins.push({ mat: 'muzzle', group: 'torso', flat: 0.8, rings: grey });
  }
  // nose: a broad wet leather pad on the end
  const ns = p.noseSize;
  const noseC = H(SL + ML + 2, -0.13 * SH + MD * 0.32);
  skins.push({ mat: 'nose', group: 'torso', rings: [
    { c: add(noseC, mul(f, -8 * ns)), w: MW * 0.58 * ns, h: MD * 0.38 * ns, wd: s },
    { c: noseC, w: MW * 0.62 * ns, h: MD * 0.4 * ns, wd: s },
    { c: add(noseC, mul(f, 7 * ns)), w: MW * 0.5 * ns, h: MD * 0.3 * ns, wd: s },
  ] });
  // the line of her mouth, back from the nose along each side
  for (const sd of [1, -1]) {
    const a = H(SL + ML * 0.92, -0.13 * SH - MD * 0.5, sd * MW * 0.62);
    const b = H(SL + ML * 0.35, -0.12 * SH - MD * 0.62 - jowl, sd * MW * 0.98);
    const c = H(SL + ML * 0.02, -0.06 * SH - MD * 0.5 - jowl, sd * MW * 1.02);
    skins.push({ mat: 'lidline', group: 'torso', rings: [a, b, c].map((q) => ({ c: q, w: 2.2, h: 2.2, wd: s })) });
  }

  // eyes: set into the skull at the brow, looking out and forward
  const eyeRing = skull[3];
  const es = p.eyeSize;
  for (const sd of [1, -1]) {
    const ang = 28 * D2R;
    const surf = H(eyeRing[0] - 4, eyeRing[1] + Math.sin(ang) * eyeRing[3] * 0.82, sd * Math.cos(ang) * eyeRing[2] * 0.86);
    const out = unit(add(mul(s, sd), mul(f, 0.9)));
    const R = 9.5 * es;
    if (p.eyes !== 'closed') {
      const c = add(surf, mul(out, -R * 0.35));
      skins.push({ mat: 'eye', group: 'torso', rings: [
        { c: add(c, mul(out, -R * 0.5)), w: R * 0.85, h: R * 0.78, wd: f },
        { c, w: R, h: R * 0.92, wd: f },
        { c: add(c, mul(out, R * 0.45)), w: R * 0.8, h: R * 0.72, wd: f },
      ] });
      if (p.eyes === 'sleepy') {
        // a heavy upper lid down over the top half
        const lid = add(add(c, mul(u, R * 0.45)), mul(out, R * 0.25));
        skins.push({ mat: 'coat', group: 'torso', rings: [
          { c: add(lid, mul(out, -R * 0.4)), w: R * 1.05, h: R * 0.5, wd: f },
          { c: lid, w: R * 1.1, h: R * 0.55, wd: f },
          { c: add(lid, mul(out, R * 0.35)), w: R * 0.95, h: R * 0.4, wd: f },
        ] });
      }
    } else {
      // asleep: a short dark seam where the lids meet
      const a = add(surf, mul(f, -R * 0.9));
      const b = add(add(surf, mul(f, R * 0.9)), mul(u, -R * 0.15));
      skins.push({ mat: 'lidline', group: 'torso', rings: [a, surf, b].map((q) => ({ c: add(q, mul(out, 1.5)), w: 1.8, h: 1.8, wd: s })) });
    }
    if (p.tanPoints) {
      const brow = add(add(surf, mul(u, R * 1.7)), mul(out, 1));
      skins.push({ mat: 'tan', group: 'torso', rings: [
        { c: add(brow, mul(out, -3)), w: R * 0.55, h: R * 0.45, wd: f },
        { c: add(brow, mul(out, 1)), w: R * 0.5, h: R * 0.4, wd: f },
      ] });
    }
  }

  // ears: from the top corners of the skull. Style decides the path; fold how far the tips tip over.
  const EL = 78 * p.earSize;
  const EW = 30 * p.earWidth;
  const ear0 = skull[1];
  for (const sd of [1, -1]) {
    const ang = (40 + p.earSet * 35) * D2R;
    const root = H(ear0[0], ear0[1] + Math.sin(ang) * ear0[3] * 0.9, sd * Math.cos(ang) * ear0[2] * 0.9);
    const out = mul(s, sd);
    const spread = p.earSpread;
    const fold = p.earFold;
    let pts: V[];
    let wds: V[];
    if (p.earStyle === 'erect' || p.earStyle === 'tipped') {
      const k = p.earStyle === 'erect' ? 0 : fold;
      const up = unit(add(add(u, mul(out, 0.25 + spread * 0.6)), mul(f, -0.12)));
      const p1 = add(root, mul(up, EL * 0.35));
      const p2 = add(root, mul(up, EL * (0.62 + 0.18 * (1 - k))));
      const tip = add(p2, add(mul(up, EL * 0.3 * (1 - k)), add(mul(f, EL * 0.32 * k), mul(u, -EL * 0.18 * k))));
      pts = [root, p1, p2, tip];
      wds = [out, out, out, out].map((o) => unit(sub(o, mul(up, dot(o, up)))));
    } else if (p.earStyle === 'rose') {
      const p1 = add(root, add(mul(out, EL * (0.25 + spread * 0.2)), add(mul(u, EL * 0.22), mul(f, -EL * 0.05))));
      const p2 = add(root, add(mul(out, EL * (0.42 + spread * 0.2)), add(mul(u, EL * 0.12 * (1 - fold)), mul(f, -EL * 0.3))));
      const tip = add(root, add(mul(out, EL * (0.45 + spread * 0.15)), add(mul(u, -EL * 0.1 * fold), mul(f, -EL * 0.55))));
      pts = [root, p1, p2, tip];
      wds = [f, f, u, u];
    } else {
      // drop: out a little, then hanging down beside her cheek
      const p1 = add(root, add(mul(out, EL * (0.2 + spread * 0.25)), add(mul(u, EL * 0.1), mul(f, EL * 0.04))));
      const p2 = add(root, add(mul(out, EL * (0.3 + spread * 0.2)), add(mul(u, -EL * 0.3), mul(f, EL * 0.08))));
      const tip = add(root, add(mul(out, EL * (0.26 + spread * 0.15)), add(mul(u, -EL * (0.75 - fold * 0.2)), mul(f, EL * 0.1))));
      pts = [root, p1, p2, tip];
      wds = [f, f, f, f];
    }
    const widths = [1, 0.82, 0.5, 0.1];
    skins.push({ mat: 'coat', group: 'torso', rings: pts.map((c, i) => ({ c, w: EW * widths[i], h: 4.5 + (i === 0 ? 4 : 0), wd: wds[i] })) });
  }

  // ---------- legs: three bones and a paw, a lean dog's proportions ----------
  const lg = p.legLength;
  const lt = p.legThickness;
  const ps = p.pawSize;
  const sockMat = (i: number): CocoMat => (p.socks > 0 && (i >= 3 || (p.socks > 0.55 && i >= 2)) ? 'socks' : 'coat');
  const leg = (root: V, z: number, bones: number[], angles: number[], radii: [number, number][], group: 'torso' | 'hind') => {
    // front legs ride on the body when it tips up to sit, so their world angles are converted; hind legs stay put
    const ang = (a: number) => (group === 'torso' ? body(a) : a);
    let at: V = [root[0], root[1], z];
    const joints: V[] = [at];
    bones.forEach((b, i) => {
      at = add(at, mul(dirDeg(ang(angles[i])), b));
      joints.push(at);
    });
    // the upper bone as one coat skin down to the wrist/hock, then the pastern and paw (which can be white)
    const upper = joints.slice(0, 3).map((c, i) => ({ c, w: radii[i][0], h: radii[i][1], wd: Z }));
    const lower = joints.slice(2).map((c, i) => ({ c, w: radii[i + 2][0], h: radii[i + 2][1], wd: Z }));
    // start the upper skin inside the body so the leg grows out of it
    const into = add(joints[0], mul(sub(joints[0], joints[1]), 0.35));
    skins.push({ mat: 'coat', group, rings: [{ c: into, w: radii[0][0] * 1.1, h: radii[0][1] * 1.1, wd: Z }, ...upper] });
    skins.push({ mat: sockMat(3), group, rings: [lower[0], lower[1]] });
    // the paw: a rounded oval pad of toes, a little wider than the pastern
    const pawEnd = joints[4];
    const pawMid = mul(add(lower[1].c, pawEnd), 0.5);
    skins.push({ mat: sockMat(4), group, flat: 0.6, rings: [
      { c: lower[1].c, w: radii[3][0], h: radii[3][1], wd: Z },
      { c: pawMid, w: 26 * ps, h: 17 * ps, wd: Z },
      { c: pawEnd, w: 23 * ps, h: 13 * ps, wd: Z },
    ] });
    return joints;
  };
  const shoulder: V = [0.3 * L, T - 0.6 * cd, 0];
  const hip: V = [-0.37 * L, T - 0.32 * cd, 0];
  const frontBones = [125 * lg, 205 * lg, 62 * lg, 50 * ps];
  const hindBones = [165 * lg, 180 * lg, 100 * lg, 54 * ps];
  const frontR: [number, number][] = [[30 * lt, 44 * lt], [22 * lt, 26 * lt], [17 * lt, 18 * lt], [15 * lt, 15 * lt], [0, 0]];
  const hindR: [number, number][] = [[30 * lt, 50 * lt], [22 * lt, 30 * lt], [13 * lt, 19 * lt], [14 * lt, 14 * lt], [0, 0]];
  const fz = 0.6 * cw;
  const hz = 0.62 * cw * p.rump;
  const frontL = leg(shoulder, fz, frontBones, pose.front, frontR, 'torso');
  leg(shoulder, -fz, frontBones, pose.front.map((a, i) => a + (i === 0 ? -6 : i === 1 ? -10 : 0)) as typeof pose.front, frontR, 'torso');
  leg(hip, hz, hindBones, pose.hind, hindR, 'hind');
  leg(hip, -hz, hindBones, pose.hind.map((a, i) => a + (i === 0 ? 5 : 0)) as typeof pose.hind, hindR, 'hind');

  // ---------- tail: eight segments, thick at the root, a whip at the tip ----------
  {
    const N = 8;
    const TL = 340 * p.tailLength;
    // the tail leaves the rump going back, raised or lowered by `set` degrees; curl bends each segment down
    // (toward her belly, positive) or up, sweep swings it round her side
    const e = (pose.tail.set + p.tailSet * 50) * D2R;
    let dir: V = [-Math.cos(e), Math.sin(e), 0];
    let at: V = [-0.5 * L + 10, T - 0.18 * cd, 0];
    const rings: Ring[] = [{ c: add(at, [22, 0, 0]), w: 26 * p.tailThickness, h: 28 * p.tailThickness, wd: Z }];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = lerp(22, 7, Math.pow(t, 1.6)) * p.tailThickness;
      rings.push({ c: at, w: r, h: r, wd: Z });
      at = add(at, mul(dir, TL / N));
      dir = rot(dir, Z, (pose.tail.curl + p.tailCurl * 12) * D2R);
      dir = rot(dir, Y, pose.tail.sweep * D2R);
    }
    skins.push({ mat: 'coat', group: 'hind', rings });
  }

  // ---------- markings ----------
  if (p.chestPatch > 0.02) {
    const x = 0.47 * L;
    const sec = trunkAt(x);
    const c: V = [x + 0.06 * L, sec.y - 0.3 * sec.h, 0];
    const k = p.chestPatch;
    skins.push({ mat: 'patch', group: 'torso', rings: [
      { c: add(c, [-6, 0, 0]), w: 26 * k + 4, h: 40 * k + 5, wd: Z },
      { c: add(c, [4, 0, 0]), w: 22 * k + 3, h: 34 * k + 4, wd: Z },
    ] });
  }

  // ---------- clothes ----------
  if (p.hoodie) {
    const grow = 7;
    const rings: Ring[] = trunkRings.slice(2).map((r) => ({ ...r, w: r.w + grow, h: r.h + grow }));
    rings[0] = { ...rings[0], c: add(rings[0].c, [0.04 * L, 0, 0]) };
    rings.push({ c: add(n0, mul(neckDir, 10)), w: 64 * nt + grow, h: 70 * nt + grow, wd: Z });
    rings.push({ c: add(n0, mul(neckDir, NL * 0.32)), w: 54 * nt + grow, h: 60 * nt + grow, wd: Z });
    skins.push({ mat: 'hoodie', group: 'torso', open: true, flat: 0.92, slices: 34, rings });
    // sleeves over the tops of her front legs
    for (const zz of [fz, -fz]) {
      const a: V = [frontL[0][0] - (frontL[1][0] - frontL[0][0]) * 0.4, frontL[0][1] - (frontL[1][1] - frontL[0][1]) * 0.4, zz];
      const m: V = [frontL[0][0], frontL[0][1], zz];
      const b: V = [lerp(frontL[0][0], frontL[1][0], 0.6), lerp(frontL[0][1], frontL[1][1], 0.6), zz];
      skins.push({ mat: 'hoodie', group: 'torso', open: true, rings: [
        { c: a, w: 36 * lt + 8, h: 50 * lt + 8, wd: Z },
        { c: m, w: 34 * lt + 7, h: 48 * lt + 7, wd: Z },
        { c: b, w: 26 * lt + 6, h: 32 * lt + 6, wd: Z },
      ] });
    }
    if (p.hood === 'down') {
      // the hood down: a soft lump of bunched fabric lying on the back of her neck and shoulders
      const dorsal = unit(cross(Z, neckDir));
      const lump = (t: number, w: number, h: number): Ring => ({ c: add(add(n0, mul(neckDir, NL * t)), mul(dorsal, 54 * nt + h * 0.55)), w, h, wd: Z });
      skins.push({ mat: 'hood', group: 'torso', rings: [lump(0.0, 46 * nt, 12), lump(0.18, 58 * nt, 20), lump(0.38, 54 * nt, 19), lump(0.52, 40 * nt, 11)] });
    } else {
      // the hood up: a soft shell over the top and back of her head, ears through it
      const over: V[] = [
        add(n0, mul(neckDir, NL * 0.45)),
        H(0.05 * SL, SH * 1.0),
        H(0.45 * SL, SH * 1.15),
        H(0.82 * SL, SH * 0.98),
      ];
      skins.push({ mat: 'hood', group: 'torso', open: true, rings: over.map((c, i) => ({ c: add(c, mul(u, -SH * 0.35)), w: SW * (1.18 - (i === 3 ? 0.1 : 0)), h: SH * 0.62, wd: s })) });
    }
  }
  if (p.collar) {
    const at = add(n0, mul(neckDir, NL * 0.62));
    const rings: Ring[] = [];
    const sideV = Z;
    const back = unit(cross(neckDir, Z));
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const c = add(at, add(mul(back, Math.cos(a) * (50 * nt + 3)), mul(sideV, Math.sin(a) * (47 * nt + 3))));
      rings.push({ c, w: 9, h: 3, wd: neckDir });
    }
    skins.push({ mat: 'collar', group: 'torso', open: true, rings });
    if (p.tag) {
      const tagC = add(at, mul(back, -(50 * nt + 14)));
      skins.push({ mat: 'tag', group: 'torso', rings: [
        { c: add(tagC, mul(back, -3)), w: 11, h: 11, wd: Z },
        { c: add(tagC, mul(back, 3)), w: 11, h: 11, wd: Z },
      ].map((r) => ({ ...r, wd: neckDir })) });
    }
  }

  // ---------- pose: tip up for sitting (not the hind legs), bend the spine, roll onto her side ----------
  const pivotSit = hip;
  const sitRot = (q: V) => {
    const a = pitch * D2R;
    const d = sub(q, pivotSit);
    return add(pivotSit, [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a), d[2]]);
  };
  const curl = Math.max(0, Math.min(1.2, pose.curl + p.curl));
  const theta = curl * Math.PI * 1.05;
  const half = L * 0.62;
  const R = theta > 1e-3 ? (2 * half) / theta : 0;
  const y0 = 0;
  const bend = (q: V): V => {
    if (theta <= 1e-3) return q;
    // ventral flexion about z: the spine wraps round a circle below her belly
    const sx = Math.max(-half, Math.min(half, q[0]));
    const extra = q[0] - sx;
    const phi = sx / R;
    const r = R + (q[1] - y0);
    const C: V = [0, y0 - R, 0];
    let out: V = [C[0] + r * Math.sin(phi), C[1] + r * Math.cos(phi), q[2]];
    out = add(out, mul([Math.cos(phi), -Math.sin(phi), 0], extra));
    return out;
  };
  const roll = pose.roll * D2R;
  const rollQ = (q: V): V => {
    // turn her about the spine so her right side (-z) goes down onto the floor
    const cy = T - cd * 0.5;
    const d = q[1] - cy;
    return [q[0], cy + d * Math.cos(roll) - q[2] * Math.sin(roll), d * Math.sin(roll) + q[2] * Math.cos(roll)];
  };
  const place = (q: V, group: 'torso' | 'hind') => rollQ(bend(group === 'torso' && pitch ? sitRot(q) : q));
  for (const sk of skins) {
    sk.rings = sk.rings.map((r) => {
      const c = place(r.c, sk.group);
      const tip = place(add(r.c, mul(r.wd, 5)), sk.group);
      return { ...r, c, wd: unit(sub(tip, c)) };
    });
  }

  // ---------- skins to meshes ----------
  const meshes: Partial<Record<CocoMat, RawMesh>> = {};
  for (const sk of skins) {
    const m = (meshes[sk.mat] ??= { pos: [], nrm: [], uv: [], idx: [] });
    sweep(m, sk.rings, !!sk.open, sk.slices ?? 22, sk.flat ?? 1);
  }
  // sit her on the floor (a few mm into it, the way weight presses) and centre her over her own origin
  let minY = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = -Infinity;
  for (const m of Object.values(meshes)) {
    for (let i = 0; i < m!.pos.length; i += 3) {
      minX = Math.min(minX, m!.pos[i]); maxX = Math.max(maxX, m!.pos[i]);
      minY = Math.min(minY, m!.pos[i + 1]); maxY = Math.max(maxY, m!.pos[i + 1]);
      minZ = Math.min(minZ, m!.pos[i + 2]); maxZ = Math.max(maxZ, m!.pos[i + 2]);
    }
  }
  const shift: V = [-(minX + maxX) / 2, -minY - 4, -(minZ + maxZ) / 2];
  const mirror = p.flip ? -1 : 1;
  for (const m of Object.values(meshes)) {
    for (let i = 0; i < m!.pos.length; i += 3) {
      m!.pos[i] += shift[0];
      m!.pos[i + 1] += shift[1];
      m!.pos[i + 2] = (m!.pos[i + 2] + shift[2]) * mirror;
      m!.nrm[i + 2] *= mirror;
    }
    if (mirror < 0) for (let i = 0; i < m!.idx.length; i += 3) [m!.idx[i + 1], m!.idx[i + 2]] = [m!.idx[i + 2], m!.idx[i + 1]];
  }
  // scale the whole dog last
  for (const m of Object.values(meshes)) for (let i = 0; i < m!.pos.length; i++) m!.pos[i] *= p.size;
  const headPt = place(H(0.6 * SL, SH * 0.3), 'torso');
  const head: V = [(headPt[0] + shift[0]) * p.size, (headPt[1] + shift[1]) * p.size, (headPt[2] + shift[2]) * mirror * p.size];
  return {
    meshes,
    head,
    center: [0, ((maxY - minY) / 2) * p.size, 0],
    height: (maxY - minY) * p.size,
    length: Math.max(maxX - minX, maxZ - minZ) * p.size,
  };
}

/**
 * Sweep an ellipse along rings splined through their centres (Catmull-Rom), with rounded caps unless open. The
 * ellipse's width lies along each ring's `wd` (made square to the spine), so ears stay flat and legs stay round
 * whatever way they point. u runs along the skin by arc length, v round it from the side up over the top.
 */
function sweep(m: RawMesh, rings: Ring[], open: boolean, slices: number, flat: number) {
  if (rings.length < 2) return;
  const cr = (a: number, b: number, c: number, d: number, t: number) =>
    0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  type R5 = { c: V; w: number; h: number; wd: V };
  const R: R5[] = [];
  const n = rings.length;
  const sub6 = 5;
  for (let i = 0; i < n - 1; i++) {
    const r0 = rings[Math.max(0, i - 1)], r1 = rings[i], r2 = rings[i + 1], r3 = rings[Math.min(n - 1, i + 2)];
    for (let k = 0; k < sub6; k++) {
      const t = k / sub6;
      R.push({
        c: [0, 1, 2].map((j) => cr(r0.c[j], r1.c[j], r2.c[j], r3.c[j], t)) as V,
        w: Math.max(0.5, cr(r0.w, r1.w, r2.w, r3.w, t)),
        h: Math.max(0.5, cr(r0.h, r1.h, r2.h, r3.h, t)),
        wd: unit([0, 1, 2].map((j) => lerp(r1.wd[j], r2.wd[j], t)) as V),
      });
    }
  }
  R.push({ ...rings[n - 1] });
  if (!open) {
    const cap = (end: R5, next: R5) => {
      const d = unit(sub(end.c, next.c));
      const reach = Math.min(end.w, end.h) * 0.9;
      const out: R5[] = [];
      for (let k = 1; k <= 4; k++) {
        const a = (k / 4) * (Math.PI / 2);
        const c = Math.max(Math.cos(a), 0.02);
        out.push({ c: add(end.c, mul(d, reach * Math.sin(a))), w: end.w * c, h: end.h * c, wd: end.wd });
      }
      return out;
    };
    const head = cap(R[0], R[1]).reverse();
    const tail = cap(R[R.length - 1], R[R.length - 2]);
    R.unshift(...head);
    R.push(...tail);
  }
  const M = R.length;
  const arc = [0];
  for (let i = 1; i < M; i++) arc.push(arc[i - 1] + len(sub(R[i].c, R[i - 1].c)));
  const total = arc[M - 1] || 1;
  const P: V[][] = [];
  for (let i = 0; i < M; i++) {
    const t = unit(sub(R[Math.min(M - 1, i + 1)].c, R[Math.max(0, i - 1)].c));
    let side = sub(R[i].wd, mul(t, dot(R[i].wd, t)));
    if (len(side) < 1e-4) side = cross(t, Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
    side = unit(side);
    const up = unit(cross(side, t));
    const row: V[] = [];
    for (let j = 0; j <= slices; j++) {
      const th = (j / slices) * Math.PI * 2;
      const sn = Math.sin(th);
      const h = sn * R[i].h * (sn < 0 ? flat : 1);
      row.push(add(add(R[i].c, mul(side, Math.cos(th) * R[i].w)), mul(up, h)));
    }
    P.push(row);
  }
  const base = m.pos.length / 3;
  for (let i = 0; i < M; i++) {
    for (let j = 0; j <= slices; j++) {
      const a = P[Math.min(M - 1, i + 1)][j], c = P[Math.max(0, i - 1)][j];
      const e = P[i][(j + 1) % slices], g = P[i][(j - 1 + slices) % slices];
      let nr = cross(sub(e, g), sub(a, c));
      const outward = sub(P[i][j], R[i].c);
      if (dot(nr, outward) < 0) nr = mul(nr, -1);
      if (len(nr) < 1e-9) nr = outward;
      nr = unit(nr);
      m.pos.push(...P[i][j]);
      m.nrm.push(...nr);
      m.uv.push(arc[i] / total, j / slices);
    }
  }
  const W = slices + 1;
  for (let i = 0; i < M - 1; i++) {
    for (let j = 0; j < slices; j++) {
      const p0 = P[i][j], p1 = P[i + 1][j], p2 = P[i][j + 1];
      const fn = cross(sub(p1, p0), sub(p2, p0));
      const a = base + i * W + j, b = base + (i + 1) * W + j, c = base + i * W + j + 1, d = base + (i + 1) * W + j + 1;
      if (dot(fn, sub(p0, R[i].c)) >= 0) m.idx.push(a, b, c, c, b, d);
      else m.idx.push(a, c, b, c, d, b);
    }
  }
}

/** The builder's controls, grouped the way a create-a-player screen groups them. */
export type Control =
  | { key: keyof CocoParams; label: string; type: 'range'; min: number; max: number; step?: number }
  | { key: keyof CocoParams; label: string; type: 'select'; options: { value: string; label: string }[] }
  | { key: keyof CocoParams; label: string; type: 'color'; swatches: string[] }
  | { key: keyof CocoParams; label: string; type: 'toggle' };

const COATS = ['#151314', '#231b17', '#3b2618', '#5a3a22', '#8a5a2b', '#c99a5b', '#e3c48d', '#6d6a68', '#9a9690', '#f1ece3'];
const HOODIES = ['#1f5a3a', '#2e5d8c', '#b83a26', '#c9a04a', '#5b4b8a', '#1f1f24', '#e8e2d4', '#8c3b5a'];
export const CONTROLS: { group: string; controls: Control[] }[] = [
  {
    group: 'Pose',
    controls: [
      { key: 'pose', label: 'Pose', type: 'select', options: [
        { value: 'sphinx', label: 'Lying down' },
        { value: 'curled', label: 'Curled up asleep' },
        { value: 'side', label: 'Flat out on her side' },
        { value: 'sit', label: 'Sitting' },
        { value: 'stand', label: 'Standing' },
      ] },
      { key: 'curl', label: 'Curl', type: 'range', min: -0.6, max: 0.6, step: 0.01 },
      { key: 'headLift', label: 'Head up / down', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'headTurn', label: 'Head turn', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'headTilt', label: 'Head tilt', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'flip', label: 'Lie on the other side', type: 'toggle' },
    ],
  },
  {
    group: 'Body',
    controls: [
      { key: 'size', label: 'Overall size', type: 'range', min: 0.7, max: 1.3, step: 0.01 },
      { key: 'bodyLength', label: 'Body length', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'chestDepth', label: 'Chest depth', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'chestWidth', label: 'Chest width', type: 'range', min: 0.7, max: 1.3, step: 0.01 },
      { key: 'waistTuck', label: 'Waist tuck', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'rump', label: 'Hips', type: 'range', min: 0.75, max: 1.25, step: 0.01 },
      { key: 'neckLength', label: 'Neck length', type: 'range', min: 0.7, max: 1.4, step: 0.01 },
      { key: 'neckThickness', label: 'Neck thickness', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
    ],
  },
  {
    group: 'Legs',
    controls: [
      { key: 'legLength', label: 'Leg length', type: 'range', min: 0.7, max: 1.35, step: 0.01 },
      { key: 'legThickness', label: 'Leg thickness', type: 'range', min: 0.7, max: 1.3, step: 0.01 },
      { key: 'pawSize', label: 'Paw size', type: 'range', min: 0.7, max: 1.4, step: 0.01 },
    ],
  },
  {
    group: 'Head',
    controls: [
      { key: 'skullWidth', label: 'Skull width', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'skullLength', label: 'Skull length', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'skullHeight', label: 'Skull height', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'stop', label: 'Stop (brow to muzzle step)', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'browRidge', label: 'Brow ridge', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'muzzleLength', label: 'Muzzle length', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
      { key: 'muzzleWidth', label: 'Muzzle width', type: 'range', min: 0.7, max: 1.35, step: 0.01 },
      { key: 'muzzleDepth', label: 'Muzzle depth', type: 'range', min: 0.7, max: 1.35, step: 0.01 },
      { key: 'jowls', label: 'Jowls', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'noseSize', label: 'Nose size', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
    ],
  },
  {
    group: 'Ears',
    controls: [
      { key: 'earStyle', label: 'Ear style', type: 'select', options: [
        { value: 'tipped', label: 'Up, tips folded' },
        { value: 'rose', label: 'Rose (folded back)' },
        { value: 'drop', label: 'Drop (floppy)' },
        { value: 'erect', label: 'Straight up' },
      ] },
      { key: 'earSize', label: 'Ear size', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
      { key: 'earWidth', label: 'Ear width', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
      { key: 'earSet', label: 'Set high / low', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'earSpread', label: 'Spread', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'earFold', label: 'Fold', type: 'range', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    group: 'Eyes',
    controls: [
      { key: 'eyes', label: 'Eyes', type: 'select', options: [
        { value: 'closed', label: 'Closed (asleep)' },
        { value: 'sleepy', label: 'Sleepy' },
        { value: 'open', label: 'Open' },
      ] },
      { key: 'eyeSize', label: 'Eye size', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
      { key: 'eyeColor', label: 'Eye colour', type: 'color', swatches: ['#4a2a14', '#6b3d17', '#8a5a1e', '#b07a2a', '#3b3020', '#4f6a7a'] },
    ],
  },
  {
    group: 'Tail',
    controls: [
      { key: 'tailLength', label: 'Length', type: 'range', min: 0.5, max: 1.5, step: 0.01 },
      { key: 'tailThickness', label: 'Thickness', type: 'range', min: 0.6, max: 1.6, step: 0.01 },
      { key: 'tailSet', label: 'Carried low / high', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'tailCurl', label: 'Curl', type: 'range', min: -1, max: 1, step: 0.01 },
    ],
  },
  {
    group: 'Coat',
    controls: [
      { key: 'coat', label: 'Coat', type: 'color', swatches: COATS },
      { key: 'coatSheen', label: 'Shine', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'muzzleGrey', label: 'Grey muzzle', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'greyColor', label: 'Grey', type: 'color', swatches: ['#6b6560', '#8a847c', '#a9a39a', '#c8c2b8'] },
      { key: 'chestPatch', label: 'White chest spot', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'patchColor', label: 'Spot colour', type: 'color', swatches: ['#e9e4da', '#f6f2ea', '#c9b79a'] },
      { key: 'socks', label: 'White socks', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'tanPoints', label: 'Tan eyebrow dots', type: 'toggle' },
      { key: 'tanColor', label: 'Tan', type: 'color', swatches: ['#8a5a2b', '#a8702f', '#c08a45'] },
    ],
  },
  {
    group: 'Outfit',
    controls: [
      { key: 'hoodie', label: 'Hoodie', type: 'toggle' },
      { key: 'hoodieColor', label: 'Hoodie colour', type: 'color', swatches: HOODIES },
      { key: 'wings', label: 'Survey Corps wings on the back', type: 'toggle' },
      { key: 'hood', label: 'Hood', type: 'select', options: [
        { value: 'down', label: 'Down' },
        { value: 'up', label: 'Up' },
      ] },
      { key: 'collar', label: 'Collar', type: 'toggle' },
      { key: 'collarColor', label: 'Collar colour', type: 'color', swatches: ['#b83a26', '#2e5d8c', '#1f1f24', '#c9a04a', '#e05aa0'] },
      { key: 'tag', label: 'Name tag', type: 'toggle' },
    ],
  },
];

/** One-tap starting points. */
export const PRESETS: { name: string; params: Partial<CocoParams> }[] = [
  { name: 'Coco', params: {} },
  { name: 'Coco, awake', params: { pose: 'sphinx', eyes: 'open', headLift: 0.1, headTurn: 0.25 } },
  { name: 'Coco, curled up', params: { pose: 'curled', eyes: 'closed', headLift: 0 } },
  { name: 'Coco, flat out', params: { pose: 'side', eyes: 'closed', headLift: 0 } },
  { name: 'Coco, sitting', params: { pose: 'sit', eyes: 'open', hoodie: true } },
  { name: 'Lab', params: { earStyle: 'drop', earFold: 0.4, stop: 0.7, muzzleWidth: 1.15, chestWidth: 1.1, waistTuck: 0.3, tailThickness: 1.4, jowls: 0.5 } },
  { name: 'Shepherd', params: { earStyle: 'erect', earSize: 1.25, muzzleLength: 1.2, stop: 0.35, legLength: 1.12, waistTuck: 0.6 } },
  { name: 'Pit mix', params: { earStyle: 'rose', skullWidth: 1.22, muzzleWidth: 1.2, muzzleLength: 0.85, chestWidth: 1.2, neckThickness: 1.2, tailLength: 0.8, legThickness: 1.12 } },
];
