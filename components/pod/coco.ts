/**
 * Coco, built from parameters. The room and the character builder (#builder) both draw her from this file, so what
 * Max dials in the builder is exactly what sits under the desk.
 *
 * Her body is a real dog mesh with a skeleton (cocoDog.data.ts, Quaternius's CC0 husky). A pose turns its joints;
 * the shape controls stretch or thicken bones (legs, spine, neck, tail, ears) and reshape the muzzle; the coat
 * controls repaint regions of it; the hoodie is a knit shell grown out of her own torso, so it fits whatever pose
 * and build she is in.
 *
 * Units out of buildCoco are millimetres in her own frame: x toward her nose, y up, z out of her right side.
 */
import saved from './coco.params.json';
import { DOG } from './cocoDog.data';

export type CocoPose = 'sphinx' | 'rest' | 'sit' | 'stand';
export type EarStyle = 'tipped' | 'erect' | 'back' | 'drop';
export type EyeState = 'open' | 'sleepy' | 'closed';

export type CocoParams = {
  pose: CocoPose;
  headLift: number;
  headTurn: number;
  headTilt: number;
  flip: boolean;
  size: number;
  bodyLength: number;
  chestDepth: number;
  chestWidth: number;
  neckLength: number;
  neckThickness: number;
  legLength: number;
  legThickness: number;
  pawSize: number;
  headSize: number;
  muzzleLength: number;
  muzzleWidth: number;
  earStyle: EarStyle;
  earSize: number;
  earWidth: number;
  earSpread: number;
  earFold: number;
  eyes: EyeState;
  tailLength: number;
  tailThickness: number;
  tailSet: number;
  tailCurl: number;
  coat: string;
  coatSheen: number;
  smooth: boolean;
  markings: number;
  markColor: string;
  muzzleGrey: number;
  greyColor: string;
  chestPatch: number;
  patchColor: string;
  socks: number;
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
  headLift: -0.15,
  headTurn: 0.15,
  headTilt: 0,
  flip: false,
  size: 1,
  bodyLength: 1,
  chestDepth: 1,
  chestWidth: 1,
  neckLength: 0.95,
  neckThickness: 1,
  legLength: 1.05,
  legThickness: 1,
  pawSize: 1,
  headSize: 1,
  muzzleLength: 1.05,
  muzzleWidth: 1.08,
  earStyle: 'tipped',
  earSize: 1,
  earWidth: 1.05,
  earSpread: 0.25,
  earFold: 0.55,
  eyes: 'sleepy',
  tailLength: 1,
  tailThickness: 1.1,
  tailSet: 0,
  tailCurl: 0.4,
  coat: '#1b1818',
  coatSheen: 0.6,
  smooth: true,
  markings: 0,
  markColor: '#8a847c',
  muzzleGrey: 0.15,
  greyColor: '#6b6560',
  chestPatch: 0.35,
  patchColor: '#e9e4da',
  socks: 0,
  hoodie: true,
  hoodieColor: '#1f5a3a',
  hood: 'down',
  wings: true,
  collar: false,
  collarColor: '#b83a26',
  tag: false,
};

const POSE_NAMES: CocoPose[] = ['sphinx', 'rest', 'sit', 'stand'];
const EAR_NAMES: EarStyle[] = ['tipped', 'erect', 'back', 'drop'];
/** Fill in a possibly old or partial set of params (saved slots, links, coco.params.json) so it builds. */
export function normalizeCoco(pIn: Partial<CocoParams>): CocoParams {
  const p = pIn as Record<string, unknown>;
  const out = { ...COCO_BASE } as Record<string, unknown>;
  for (const k of Object.keys(COCO_BASE)) if (k in p && typeof p[k] === typeof out[k]) out[k] = p[k];
  const q = out as CocoParams;
  if (!POSE_NAMES.includes(q.pose)) q.pose = p.pose === 'curled' || p.pose === 'side' ? 'rest' : 'sphinx';
  if (!EAR_NAMES.includes(q.earStyle)) q.earStyle = p.earStyle === 'rose' ? 'back' : 'tipped';
  return q;
}

/** What the room draws: the base with whatever the builder last saved to coco.params.json on top. */
export const COCO: CocoParams = normalizeCoco(saved as Partial<CocoParams>);

export type CocoMat = 'coat' | 'marks' | 'muzzle' | 'nose' | 'eye' | 'shine' | 'patch' | 'socks' | 'hoodie' | 'collar' | 'tag';
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

// ---------------------------------------------------------------------------------------------------------------
// The dog: decoded once.

const bytes = (b64: string) => {
  const s = atob(b64);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
};
type V3 = [number, number, number];
type M4 = Float64Array; // row-major 4x4
const m4 = () => {
  const m = new Float64Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
};
const mul = (a: M4, b: M4): M4 => {
  const o = new Float64Array(16);
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
  return o;
};
const trsM = (t: number[], q: number[], s: number[]): M4 => {
  const [x, y, z, w] = q;
  const R = [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ];
  const m = m4();
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) m[r * 4 + c] = R[r * 3 + c] * s[c];
    m[r * 4 + 3] = t[r];
  }
  return m;
};
const inv = (a: M4): M4 => {
  const o = new Float64Array(16);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  const d = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d;
  return o;
};
const xf = (m: M4, x: number, y: number, z: number): V3 => [
  m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11],
];
const rotAxis = (ax: V3, deg: number): M4 => {
  const l = Math.hypot(...ax), x = ax[0] / l, y = ax[1] / l, z = ax[2] / l;
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t), k = 1 - c;
  const m = m4();
  m[0] = c + x * x * k; m[1] = x * y * k - z * s; m[2] = x * z * k + y * s;
  m[4] = y * x * k + z * s; m[5] = c + y * y * k; m[6] = y * z * k - x * s;
  m[8] = z * x * k - y * s; m[9] = z * y * k + x * s; m[10] = c + z * z * k;
  return m;
};

type Dog = {
  names: string[];
  parent: number[];
  local: M4[];
  rest: M4[];
  idx: Record<string, number>;
  joints: number[];
  ibm: M4[];
  pos: Float32Array;
  jnt: Uint8Array;
  wgt: Uint8Array;
  tri: Uint16Array;
  mat: Uint8Array;
  /** Each vertex's standing rest position, for region tests that must not move with the pose. */
  restPos: Float32Array;
  /** Welded vertex ids: vertices at the same spot share one, so smooth normals and the hoodie shell stay closed. */
  weld: Int32Array;
  nWeld: number;
};
let dogCache: Dog | null = null;
function dog(): Dog {
  if (dogCache) return dogCache;
  const names = DOG.nodes.map((n) => n[0]);
  const parent = DOG.nodes.map((n) => n[1]);
  const local = DOG.nodes.map((n) => trsM(n[2], n[3], n[4]));
  const rest: M4[] = [];
  const restOf = (i: number): M4 => rest[i] ?? (rest[i] = parent[i] < 0 ? local[i] : mul(restOf(parent[i]), local[i]));
  names.forEach((_, i) => restOf(i));
  const idx: Record<string, number> = {};
  names.forEach((n, i) => (idx[n] = i));
  const ibmF = new Float32Array(bytes(DOG.ibm));
  const ibm = DOG.joints.map((_, k) => {
    const m = new Float64Array(16);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) m[r * 4 + c] = ibmF[k * 16 + c * 4 + r];
    return m;
  });
  const pos = new Float32Array(bytes(DOG.pos));
  const jnt = new Uint8Array(bytes(DOG.jnt));
  const wgt = new Uint8Array(bytes(DOG.wgt));
  const tri = new Uint16Array(bytes(DOG.idx));
  const mat = new Uint8Array(bytes(DOG.mat));
  const nv = pos.length / 3;
  const restPos = new Float32Array(nv * 3);
  const sk = DOG.joints.map((j, k) => mul(rest[j], ibm[k]));
  for (let v = 0; v < nv; v++) {
    for (let k = 0; k < 4; k++) {
      const w = wgt[v * 4 + k] / 255;
      if (!w) continue;
      const p = xf(sk[jnt[v * 4 + k]], pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
      restPos[v * 3] += p[0] * w; restPos[v * 3 + 1] += p[1] * w; restPos[v * 3 + 2] += p[2] * w;
    }
  }
  const weld = new Int32Array(nv);
  const seen = new Map<string, number>();
  for (let v = 0; v < nv; v++) {
    const key = `${Math.round(pos[v * 3] * 2e5)},${Math.round(pos[v * 3 + 1] * 2e5)},${Math.round(pos[v * 3 + 2] * 2e5)}`;
    if (!seen.has(key)) seen.set(key, seen.size);
    weld[v] = seen.get(key)!;
  }
  dogCache = { names, parent, local, rest, idx, joints: DOG.joints, ibm, pos, jnt, wgt, tri, mat, restPos, weld, nWeld: seen.size };
  return dogCache;
}

// ---------------------------------------------------------------------------------------------------------------
// Posing. The dog's frame: x out of her left side, y up, z toward her nose, about 3.4 units nose to rump.
// A pose turns bones about world axes at their joints (children follow); `T` nudges a joint.

type Turn = [V3, number] | ['T', V3];
type Pose = Record<string, Turn[]>;
const X: V3 = [1, 0, 0];
const Y: V3 = [0, 1, 0];
const Z: V3 = [0, 0, 1];
/** Both sides at once: the right side mirrors the left (turns about y or z flip sign, nudges flip x). */
const both = (bone: string, turns: Turn[], pose: Pose) => {
  pose[`${bone}.L`] = [...(pose[`${bone}.L`] ?? []), ...turns];
  pose[`${bone}.R`] = [
    ...(pose[`${bone}.R`] ?? []),
    ...turns.map((t): Turn => (t[0] === 'T' ? ['T', [-t[1][0], t[1][1], t[1][2]]] : [t[0], t[0] === X ? t[1] : -t[1]])),
  ];
};
const push = (pose: Pose, bone: string, ...turns: Turn[]) => (pose[bone] = [...(pose[bone] ?? []), ...turns]);
/** Bend the neck forward (+) or back, spread over its three joints so the skin doesn't kink at the withers. */
const neck = (pose: Pose, deg: number) => {
  push(pose, 'Neck1', [X, deg * 0.25]);
  push(pose, 'Neck2', [X, deg * 0.35]);
  push(pose, 'Neck3', [X, deg * 0.4]);
};

/** The floor each lying pose is pressed onto: belly and chest flatten onto it instead of floating or sinking. */
const FLOORS: Record<CocoPose, number | null> = { sphinx: 1.14, rest: 1.14, sit: null, stand: null };

function poseFor(p: CocoParams): Pose {
  const pose: Pose = {};
  if (p.pose === 'sphinx' || p.pose === 'rest') {
    both('FrontUpperLeg', [[X, 20]], pose);
    both('FrontLowerLeg', [[X, -90], [Y, 6], ['T', [0.02, 0.1, 0.05]]], pose);
    both('FF', [[X, 60]], pose);
    both('BackLeg', [[X, -70], [Z, 8]], pose);
    both('BackUpperLeg', [[X, 70]], pose);
    both('BackLowerLeg', [[X, -45]], pose);
    push(pose, 'Tail1', [X, -125], [Y, -40]);
    neck(pose, p.pose === 'rest' ? 52 : 22);
    push(pose, 'Head', [X, p.pose === 'rest' ? 8 : -12]);
  } else if (p.pose === 'sit') {
    push(pose, 'Back', [X, -38]);
    both('FrontUpperLeg', [[X, 38]], pose);
    both('FF', [[X, 4]], pose);
    both('BackLeg', [[X, -58], [Z, 10]], pose);
    both('BackUpperLeg', [[X, 92]], pose);
    both('BackLowerLeg', [[X, -70]], pose);
    push(pose, 'Tail1', [X, -60], [Y, -30]);
    neck(pose, 30);
    push(pose, 'Head', [X, -8]);
  } else {
    push(pose, 'Tail1', [X, -30]);
    neck(pose, 8);
  }
  // head
  neck(pose, -p.headLift * 28);
  push(pose, 'Neck2', [Y, p.headTurn * 22]);
  push(pose, 'Neck3', [Y, p.headTurn * 18]);
  push(pose, 'Head', [Z, -p.headTilt * 22]);
  // ears
  const fold = p.earFold;
  if (p.earStyle === 'tipped') both('Ear3', [[X, 25 + 70 * fold]], pose);
  if (p.earStyle === 'back') {
    both('Ear1', [[X, -55], [Z, -25]], pose);
    both('Ear3', [[X, -20 * fold]], pose);
  }
  if (p.earStyle === 'drop') {
    both('Ear1', [[Z, -95], [X, 15]], pose);
    both('Ear2', [[Z, -30 * fold]], pose);
  }
  both('Ear1', [[Z, -p.earSpread * 30]], pose);
  // tail
  push(pose, 'Tail1', [X, -p.tailSet * 35]);
  const lying = p.pose !== 'stand';
  for (const t of ['Tail2', 'Tail3', 'Tail4', 'Tail5']) push(pose, t, lying ? [Y, -p.tailCurl * 16] : [X, -p.tailCurl * 18]);
  return pose;
}

function scalesFor(p: CocoParams): Record<string, V3> {
  const s: Record<string, V3> = {};
  const set = (b: string, v: V3) => {
    const o = s[b] ?? [1, 1, 1];
    s[b] = [o[0] * v[0], o[1] * v[1], o[2] * v[2]];
  };
  const sides = (b: string, v: V3) => (set(`${b}.L`, v), set(`${b}.R`, v));
  for (const b of ['Torso', 'Torso2']) set(b, [p.chestWidth, p.bodyLength, p.chestDepth]);
  set('Torso3', [p.chestWidth, 1, p.chestDepth]);
  set('Back', [p.chestWidth * 0.5 + 0.5, 1, p.chestDepth * 0.5 + 0.5]);
  for (const b of ['Neck1', 'Neck2', 'Neck3']) set(b, [p.neckThickness, p.neckLength, p.neckThickness]);
  for (const b of ['FrontUpperLeg', 'FrontLowerLeg', 'BackLeg', 'BackUpperLeg', 'BackLowerLeg']) sides(b, [p.legThickness, p.legLength, p.legThickness]);
  for (const b of ['FF', 'FFB']) sides(b, [p.pawSize, p.pawSize, p.pawSize]);
  set('Head', [p.headSize, p.headSize, p.headSize]);
  for (const b of ['Ear1', 'Ear2', 'Ear3', 'Ear4']) sides(b, [p.earWidth * p.earSize, p.earSize, p.earWidth * p.earSize]);
  for (let i = 1; i <= 6; i++) set(`Tail${i}`, [p.tailThickness, p.tailLength, p.tailThickness]);
  return s;
}

/** The feet ride on IK bones parented to the armature; tie them to the lower legs so they follow the pose. */
const IK_PARENT: Record<string, string> = {};
for (const s of ['L', 'R']) {
  IK_PARENT[`IKFrontLeg.${s}`] = IK_PARENT[`FF.${s}`] = `FrontLowerLeg.${s}`;
  IK_PARENT[`IKBackLeg.${s}`] = IK_PARENT[`FFB.${s}`] = `BackLowerLeg.${s}`;
}

/** Every joint's world matrix with the pose, and its skinning matrix with the bone's scale (children don't shear). */
function worlds(d: Dog, pose: Pose, scale: Record<string, V3>) {
  const W: M4[] = [], S: M4[] = [];
  const at = (i: number): M4 => {
    if (W[i]) return W[i];
    const nm = d.names[i];
    let M: M4;
    if (IK_PARENT[nm]) {
      const b = d.idx[IK_PARENT[nm]];
      at(b);
      M = mul(mul(S[b], inv(d.rest[b])), d.rest[i]);
    } else if (d.parent[i] < 0) M = d.local[i];
    else {
      const pi = d.parent[i];
      const P = at(pi);
      const ps = scale[d.names[pi]];
      const L = d.local[i].slice() as M4;
      if (ps) {
        L[3] *= ps[0];
        L[7] *= ps[1];
        L[11] *= ps[2];
      }
      M = mul(P, L);
    }
    for (const t of pose[nm] ?? []) {
      if (t[0] === 'T') {
        M = M.slice() as M4;
        M[3] += t[1][0]; M[7] += t[1][1]; M[11] += t[1][2];
        continue;
      }
      const T = m4(), Ti = m4();
      T[3] = M[3]; T[7] = M[7]; T[11] = M[11];
      Ti[3] = -M[3]; Ti[7] = -M[7]; Ti[11] = -M[11];
      M = mul(mul(mul(T, rotAxis(t[0], t[1])), Ti), M);
    }
    W[i] = M;
    const sc = scale[nm];
    if (sc) {
      const Sm = m4();
      Sm[0] = sc[0]; Sm[5] = sc[1]; Sm[10] = sc[2];
      S[i] = mul(M, Sm);
    } else S[i] = M;
    return M;
  };
  d.names.forEach((_, i) => at(i));
  return { W, S };
}

// ---------------------------------------------------------------------------------------------------------------
// Build.

const HOODIE_BONES = ['Back', 'Torso', 'Torso2', 'Torso3', 'Neck1', 'Neck2', 'FrontShoulder.L', 'FrontShoulder.R', 'FrontUpperLeg.L', 'FrontUpperLeg.R'];
const EAR_BONES = ['Ear1.L', 'Ear1.R', 'Ear2.L', 'Ear2.R', 'Ear3.L', 'Ear3.R', 'Ear4.L', 'Ear4.R'];
/** Millimetres per dog unit: about 85 cm nose to rump, 55 cm at the shoulder standing. */
const MM_PER_UNIT = 265;

export function buildCoco(pIn: CocoParams): CocoBuild {
  const p = normalizeCoco(pIn);
  const d = dog();
  const nv = d.pos.length / 3;
  const boneW = (v: number, names: string[]) => {
    let w = 0;
    for (let k = 0; k < 4; k++) if (names.includes(d.names[d.joints[d.jnt[v * 4 + k]]])) w += d.wgt[v * 4 + k] / 255;
    return w;
  };
  const headW = new Float32Array(nv);
  for (let v = 0; v < nv; v++) headW[v] = boneW(v, ['Head']);

  // 1. reshape the muzzle in the head's own frame, before skinning
  const src = new Float32Array(d.pos);
  {
    const hk = d.joints.indexOf(d.idx.Head);
    const H = d.ibm[hk], Hi = inv(H);
    // the eyes mark where the muzzle starts; the head bone's y runs out along the muzzle
    let ey = 0, n = 0;
    for (let t = 0; t < d.mat.length; t++)
      if (d.mat[t] === 4)
        for (let c = 0; c < 3; c++) {
          const v = d.tri[t * 3 + c];
          ey += xf(H, d.pos[v * 3], d.pos[v * 3 + 1], d.pos[v * 3 + 2])[1];
          n++;
        }
    ey /= n || 1;
    const lat = Math.abs(H[0]) > Math.abs(H[2]) ? 0 : 2; // which local axis runs across her face
    for (let v = 0; v < nv; v++) {
      const w = headW[v];
      if (w < 0.01) continue;
      const q = xf(H, d.pos[v * 3], d.pos[v * 3 + 1], d.pos[v * 3 + 2]);
      if (q[1] <= ey) continue;
      const q2: V3 = [q[0], q[1], q[2]];
      q2[1] = ey + (q[1] - ey) * p.muzzleLength;
      q2[lat] = q[lat] * p.muzzleWidth;
      const r = xf(Hi, ...q2);
      for (let c = 0; c < 3; c++) src[v * 3 + c] = d.pos[v * 3 + c] + (r[c] - d.pos[v * 3 + c]) * w;
    }
  }

  // 2. pose and skin
  const pose = poseFor(p);
  const scales = scalesFor(p);
  const { W, S } = worlds(d, pose, scales);
  const sk = d.joints.map((j, k) => mul(S[j], d.ibm[k]));
  const P = new Float64Array(nv * 3);
  for (let v = 0; v < nv; v++) {
    for (let k = 0; k < 4; k++) {
      const w = d.wgt[v * 4 + k] / 255;
      if (!w) continue;
      const q = xf(sk[d.jnt[v * 4 + k]], src[v * 3], src[v * 3 + 1], src[v * 3 + 2]);
      P[v * 3] += q[0] * w; P[v * 3 + 1] += q[1] * w; P[v * 3 + 2] += q[2] * w;
    }
  }
  const floor = FLOORS[p.pose];
  if (floor != null) for (let v = 0; v < nv; v++) P[v * 3 + 1] = Math.max(P[v * 3 + 1], floor);

  // 3. normals: per face, and smoothed across the welded vertices
  const nT = d.tri.length / 3;
  const fN = new Float64Array(nT * 3);
  const wN = new Float64Array(d.nWeld * 3);
  for (let t = 0; t < nT; t++) {
    const a = d.tri[t * 3], b = d.tri[t * 3 + 1], c = d.tri[t * 3 + 2];
    const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
    const vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    fN[t * 3] = nx; fN[t * 3 + 1] = ny; fN[t * 3 + 2] = nz;
    for (const v of [a, b, c]) {
      const wv = d.weld[v];
      wN[wv * 3] += nx; wN[wv * 3 + 1] += ny; wN[wv * 3 + 2] += nz;
    }
  }
  const smoothN = (v: number): V3 => {
    const w = d.weld[v];
    const x = wN[w * 3], y = wN[w * 3 + 1], z = wN[w * 3 + 2], l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };
  const faceN = (t: number): V3 => {
    const x = fN[t * 3], y = fN[t * 3 + 1], z = fN[t * 3 + 2], l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  };

  // 4. paint: which material each triangle wears, decided on her standing shape so it doesn't move with the pose
  const R = d.restPos;
  const cen = (t: number): V3 => {
    let x = 0, y = 0, z = 0;
    for (let c = 0; c < 3; c++) {
      const v = d.tri[t * 3 + c];
      x += R[v * 3]; y += R[v * 3 + 1]; z += R[v * 3 + 2];
    }
    return [x / 3, y / 3, z / 3];
  };
  const paint: CocoMat[] = [];
  for (let t = 0; t < nT; t++) {
    const m = d.mat[t];
    const [cx, cy, cz] = cen(t);
    let mat: CocoMat = m === 1 ? 'marks' : m === 2 ? 'nose' : m === 3 ? 'shine' : m === 4 ? 'eye' : 'coat';
    if (mat === 'coat' || mat === 'marks') {
      const hw = (headW[d.tri[t * 3]] + headW[d.tri[t * 3 + 1]] + headW[d.tri[t * 3 + 2]]) / 3;
      if (p.muzzleGrey > 0.02 && hw > 0.5 && cz > 2.12 - p.muzzleGrey * 0.25) mat = 'muzzle';
      // the white spot on her chest, below the throat
      const r = Math.hypot(cx / 0.8, (cy - 1.45) / 1.4, (cz - 1.32) / 0.7);
      if (p.chestPatch > 0.02 && r < 0.04 + p.chestPatch * 0.22 && hw < 0.2) mat = 'patch';
      if (p.socks > 0.02 && cy < 0.06 + p.socks * 0.45) mat = 'socks';
    }
    if (mat === 'eye' || mat === 'shine') {
      if (p.eyes === 'closed') mat = 'coat';
      else if (p.eyes === 'sleepy' && mat === 'shine') mat = 'eye';
    }
    paint.push(mat);
  }

  // 5. her frame: dog units → millimetres (x to her nose, y up, z out of her right side), mirrored if asked
  const k = MM_PER_UNIT * p.size;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let v = 0; v < nv; v++) {
    minX = Math.min(minX, P[v * 3 + 2]); maxX = Math.max(maxX, P[v * 3 + 2]);
    minY = Math.min(minY, P[v * 3 + 1]); maxY = Math.max(maxY, P[v * 3 + 1]);
    minZ = Math.min(minZ, P[v * 3]); maxZ = Math.max(maxZ, P[v * 3]);
  }
  const ox = (minX + maxX) / 2, oz = (minZ + maxZ) / 2;
  const fl = p.flip ? 1 : -1;
  const toMM = (x: number, y: number, z: number): V3 => [(z - ox) * k, (y - minY) * k, fl * (x - oz) * k];
  const toN = (n: V3): V3 => [n[2], n[1], fl * n[0]];
  const wind = (a: number, b: number, c: number): V3 => (p.flip ? [a, c, b] : [a, b, c]);

  const meshes: Partial<Record<CocoMat, RawMesh>> = {};
  const mesh = (m: CocoMat) => (meshes[m] ??= { pos: [], nrm: [], uv: [], idx: [] });
  const vert = (m: RawMesh, q: V3, n: V3, u = 0, w = 0) => {
    m.pos.push(q[0], q[1], q[2]);
    m.nrm.push(n[0], n[1], n[2]);
    m.uv.push(u, w);
    return m.pos.length / 3 - 1;
  };
  // which triangles the hoodie covers (their fur isn't drawn: the knit sits over it)
  const hood = p.hood === 'up';
  const zBack = -0.42, zFront = 1.75;
  const inHoodie = new Uint8Array(nT);
  if (p.hoodie)
    for (let t = 0; t < nT; t++) {
      if (d.mat[t] > 1) continue;
      let ok = true;
      for (let c = 0; c < 3 && ok; c++) {
        const v = d.tri[t * 3 + c];
        const rz = R[v * 3 + 2], ry = R[v * 3 + 1];
        // the neckline: a clean ring round her neck, cut square to it just past where it leaves her shoulders
        const neckline = (ry - 1.92) * 0.82 + (rz - 1.31) * 0.57 < 0.1;
        const onBody = boneW(v, HOODIE_BONES) > 0.45 && rz > zBack && neckline && ry > 1.02;
        const onHead = hood && headW[v] > 0.5 && rz < 1.93 && ry > 2.2;
        if (!onBody && !onHead) ok = false;
        if (boneW(v, EAR_BONES) > 0.2) ok = false;
      }
      inHoodie[t] = ok ? 1 : 0;
    }
  // fur along the hoodie's edges stays drawn, so no gap opens where the knit is smoothed away from her
  const hemFur = new Uint8Array(nT);
  if (p.hoodie) {
    const ec = new Map<string, number>();
    const ekey = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
    for (let t = 0; t < nT; t++)
      if (inHoodie[t])
        for (let c = 0; c < 3; c++) {
          const key = ekey(d.weld[d.tri[t * 3 + c]], d.weld[d.tri[t * 3 + ((c + 1) % 3)]]);
          ec.set(key, (ec.get(key) ?? 0) + 1);
        }
    const hem = new Set<number>();
    for (const [key, c] of ec) if (c === 1) for (const x of key.split(',')) hem.add(+x);
    for (let t = 0; t < nT; t++)
      if (inHoodie[t]) for (let c = 0; c < 3; c++) if (hem.has(d.weld[d.tri[t * 3 + c]])) hemFur[t] = 1;
  }
  for (let t = 0; t < nT; t++) {
    if (inHoodie[t] && !hemFur[t]) continue;
    const m = mesh(paint[t]);
    const smooth = p.smooth && paint[t] !== 'eye' && paint[t] !== 'shine' && paint[t] !== 'nose';
    const ids = [0, 1, 2].map((c) => {
      const v = d.tri[t * 3 + c];
      return vert(m, toMM(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]), toN(smooth ? smoothN(v) : faceN(t)));
    });
    m.idx.push(...wind(ids[0], ids[1], ids[2]));
  }

  // 6. the hoodie: her torso's own surface, smoothed so the knit drapes over ruffs and creases instead of
  // following them, then pushed out by its fit; the knit texture wraps round her
  if (p.hoodie) {
    const m = mesh('hoodie');
    const vid = new Map<number, number>();
    const offs: number[] = [];
    for (let t = 0; t < nT; t++) {
      if (!inHoodie[t]) continue;
      const ids = [0, 1, 2].map((c) => {
        const v = d.tri[t * 3 + c];
        const w = d.weld[v];
        const got = vid.get(w);
        if (got != null) return got;
        const n = smoothN(v);
        const rx = R[v * 3], ry = R[v * 3 + 1], rz = R[v * 3 + 2];
        // a looser fit over the back, and a gathered hood behind the neck when it is down
        const top = Math.max(0, n[1]);
        let off = 0.05 + 0.02 * top;
        if (!hood) off += 0.045 * top * Math.exp(-((rz - 1.3) ** 2) / 0.12 - (rx * rx) / 0.3) * Math.min(1, Math.max(0, (ry - 1.6) / 0.3));
        if (hood && headW[v] > 0.5) off = 0.05;
        offs.push(off * k);
        const u = (rz - zBack) / (zFront - zBack);
        const around = Math.atan2(rx, ry - 1.75) / (2 * Math.PI);
        const id = vert(m, toMM(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]), toN(n), u, 0.62 + around * (p.flip ? 1 : -1));
        vid.set(w, id);
        return id;
      });
      if (ids[0] === ids[1] || ids[1] === ids[2] || ids[0] === ids[2]) continue;
      m.idx.push(...wind(ids[0], ids[1], ids[2]));
    }
    // two rounds of splitting every triangle in four, so the smoothing has something to round off
    for (let lvl = 0; lvl < 2; lvl++) {
      const mid = new Map<string, number>();
      const half = (a: number, b: number) => {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        const got = mid.get(key);
        if (got != null) return got;
        const id = m.pos.length / 3;
        for (let c = 0; c < 3; c++) {
          m.pos.push((m.pos[a * 3 + c] + m.pos[b * 3 + c]) / 2);
          m.nrm.push((m.nrm[a * 3 + c] + m.nrm[b * 3 + c]) / 2);
        }
        // the texture's v wraps round her; don't average across the seam
        let va = m.uv[a * 2 + 1], vb = m.uv[b * 2 + 1];
        if (vb - va > 0.5) vb -= 1;
        if (va - vb > 0.5) va -= 1;
        m.uv.push((m.uv[a * 2] + m.uv[b * 2]) / 2, (va + vb) / 2);
        offs.push((offs[a] + offs[b]) / 2);
        mid.set(key, id);
        return id;
      };
      const idx2: number[] = [];
      for (let i = 0; i < m.idx.length; i += 3) {
        const a = m.idx[i], b = m.idx[i + 1], c = m.idx[i + 2];
        const ab = half(a, b), bc = half(b, c), ca = half(c, a);
        idx2.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
      }
      m.idx = idx2;
    }
    const n = m.pos.length / 3;
    const nb: Set<number>[] = Array.from({ length: n }, () => new Set());
    const cnt = new Map<string, number>();
    for (let i = 0; i < m.idx.length; i += 3)
      for (let a = 0; a < 3; a++) {
        const u = m.idx[i + a], v = m.idx[i + ((a + 1) % 3)];
        nb[u].add(v);
        nb[v].add(u);
        const key = u < v ? `${u},${v}` : `${v},${u}`;
        cnt.set(key, (cnt.get(key) ?? 0) + 1);
      }
    const edge = new Uint8Array(n);
    for (const [key, c] of cnt) if (c === 1) for (const x of key.split(',')) edge[+x] = 1;
    // Taubin smoothing: a shrink step then an inflate step, so the shell smooths without sinking into her
    const step = (lam: number) => {
      const next = m.pos.slice();
      for (let v = 0; v < n; v++) {
        if (!nb[v].size) continue;
        let x = 0, y = 0, z = 0;
        for (const u of nb[v]) {
          x += m.pos[u * 3]; y += m.pos[u * 3 + 1]; z += m.pos[u * 3 + 2];
        }
        const c = nb[v].size, l2 = edge[v] ? lam * 0.5 : lam;
        next[v * 3] += (x / c - m.pos[v * 3]) * l2;
        next[v * 3 + 1] += (y / c - m.pos[v * 3 + 1]) * l2;
        next[v * 3 + 2] += (z / c - m.pos[v * 3 + 2]) * l2;
      }
      m.pos = next;
    };
    for (let it = 0; it < 14; it++) {
      step(0.62);
      step(-0.65);
    }
    const nn = new Float64Array(n * 3);
    for (let i = 0; i < m.idx.length; i += 3) {
      const a = m.idx[i], b = m.idx[i + 1], c = m.idx[i + 2];
      const ux = m.pos[b * 3] - m.pos[a * 3], uy = m.pos[b * 3 + 1] - m.pos[a * 3 + 1], uz = m.pos[b * 3 + 2] - m.pos[a * 3 + 2];
      const vx = m.pos[c * 3] - m.pos[a * 3], vy = m.pos[c * 3 + 1] - m.pos[a * 3 + 1], vz = m.pos[c * 3 + 2] - m.pos[a * 3 + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      for (const v of [a, b, c]) {
        nn[v * 3] += fx; nn[v * 3 + 1] += fy; nn[v * 3 + 2] += fz;
      }
    }
    for (let v = 0; v < n; v++) {
      const l = Math.hypot(nn[v * 3], nn[v * 3 + 1], nn[v * 3 + 2]) || 1;
      for (let c = 0; c < 3; c++) {
        m.nrm[v * 3 + c] = nn[v * 3 + c] / l;
        m.pos[v * 3 + c] += m.nrm[v * 3 + c] * offs[v];
      }
    }
  }

  // 7. collar and tag: a band round the neck
  if (p.collar || p.tag) {
    const pa = [d.rest[d.idx.Neck2][3], d.rest[d.idx.Neck2][7], d.rest[d.idx.Neck2][11]];
    const pb = [d.rest[d.idx.Head][3], d.rest[d.idx.Head][7], d.rest[d.idx.Head][11]];
    const ax = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
    const al2 = ax[0] * ax[0] + ax[1] * ax[1] + ax[2] * ax[2];
    const off = p.hoodie && p.hood === 'down' ? 0.12 : 0.03;
    const m = mesh('collar');
    const band: number[] = [];
    for (let t = 0; t < nT; t++) {
      if (d.mat[t] > 1) continue;
      const c = cen(t);
      const s = ((c[0] - pa[0]) * ax[0] + (c[1] - pa[1]) * ax[1] + (c[2] - pa[2]) * ax[2]) / al2;
      if (s < 0.05 || s > 0.32 || boneW(d.tri[t * 3], EAR_BONES) > 0.2) continue;
      band.push(t);
      if (!p.collar) continue;
      const ids = [0, 1, 2].map((cc) => {
        const v = d.tri[t * 3 + cc];
        const n = smoothN(v);
        return vert(m, toMM(P[v * 3] + n[0] * off, P[v * 3 + 1] + n[1] * off, P[v * 3 + 2] + n[2] * off), toN(n));
      });
      m.idx.push(...wind(ids[0], ids[1], ids[2]));
    }
    if (p.tag && band.length) {
      // the tag hangs under the lowest, most forward point of the band
      let best = d.tri[band[0] * 3], score = Infinity;
      for (const t of band)
        for (let c = 0; c < 3; c++) {
          const v = d.tri[t * 3 + c];
          const sc = P[v * 3 + 1] - P[v * 3 + 2] * 0.6;
          if (sc < score) (score = sc), (best = v);
        }
      const n = smoothN(best);
      const c = toMM(P[best * 3] + n[0] * (off + 0.03), P[best * 3 + 1] + n[1] * (off + 0.03) - 0.03, P[best * 3 + 2] + n[2] * (off + 0.03));
      const tm = mesh('tag');
      const r = 0.055 * k, th = 0.012 * k;
      const f0 = toN([n[0], 0, n[2]]);
      const fl2 = Math.hypot(f0[0], f0[2]) || 1;
      const f: V3 = [f0[0] / fl2, 0, f0[2] / fl2];
      const side: V3 = [-f[2], 0, f[0]];
      for (const face of [1, -1]) {
        const nn: V3 = [f[0] * face, 0, f[2] * face];
        const base = vert(tm, [c[0] + f[0] * th * face, c[1], c[2] + f[2] * th * face], nn);
        for (let i = 0; i < 12; i++) {
          const a2 = (i / 12) * Math.PI * 2;
          vert(tm, [c[0] + f[0] * th * face + side[0] * Math.cos(a2) * r, c[1] + Math.sin(a2) * r, c[2] + f[2] * th * face + side[2] * Math.cos(a2) * r], nn);
        }
        for (let i = 0; i < 12; i++) {
          const i1 = base + 1 + i, i2 = base + 1 + ((i + 1) % 12);
          tm.idx.push(...(face > 0 ? [base, i1, i2] : [base, i2, i1]));
        }
      }
    }
  }

  const hd = W[d.idx.Head];
  const head = toMM(hd[3], hd[7], hd[11]);
  const height = (maxY - minY) * k;
  return { meshes, head, center: [0, height / 2, 0], height, length: (maxX - minX) * k };
}

// ---------------------------------------------------------------------------------------------------------------
// The builder's controls, grouped the way a create-a-player screen groups them.

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
        { value: 'rest', label: 'Head down, asleep' },
        { value: 'sit', label: 'Sitting' },
        { value: 'stand', label: 'Standing' },
      ] },
      { key: 'headLift', label: 'Head up / down', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'headTurn', label: 'Head turn', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'headTilt', label: 'Head tilt', type: 'range', min: -1, max: 1, step: 0.01 },
      { key: 'flip', label: 'Mirror her', type: 'toggle' },
    ],
  },
  {
    group: 'Body',
    controls: [
      { key: 'size', label: 'Overall size', type: 'range', min: 0.7, max: 1.3, step: 0.01 },
      { key: 'bodyLength', label: 'Body length', type: 'range', min: 0.8, max: 1.3, step: 0.01 },
      { key: 'chestDepth', label: 'Chest depth', type: 'range', min: 0.8, max: 1.25, step: 0.01 },
      { key: 'chestWidth', label: 'Chest width', type: 'range', min: 0.8, max: 1.3, step: 0.01 },
      { key: 'neckLength', label: 'Neck length', type: 'range', min: 0.75, max: 1.3, step: 0.01 },
      { key: 'neckThickness', label: 'Neck thickness', type: 'range', min: 0.8, max: 1.3, step: 0.01 },
    ],
  },
  {
    group: 'Legs',
    controls: [
      { key: 'legLength', label: 'Leg length', type: 'range', min: 0.8, max: 1.25, step: 0.01 },
      { key: 'legThickness', label: 'Leg thickness', type: 'range', min: 0.75, max: 1.4, step: 0.01 },
      { key: 'pawSize', label: 'Paw size', type: 'range', min: 0.75, max: 1.4, step: 0.01 },
    ],
  },
  {
    group: 'Head',
    controls: [
      { key: 'headSize', label: 'Head size', type: 'range', min: 0.8, max: 1.3, step: 0.01 },
      { key: 'muzzleLength', label: 'Muzzle length', type: 'range', min: 0.7, max: 1.4, step: 0.01 },
      { key: 'muzzleWidth', label: 'Muzzle width', type: 'range', min: 0.75, max: 1.4, step: 0.01 },
    ],
  },
  {
    group: 'Ears',
    controls: [
      { key: 'earStyle', label: 'Ear style', type: 'select', options: [
        { value: 'tipped', label: 'Up, tips folded' },
        { value: 'erect', label: 'Straight up' },
        { value: 'back', label: 'Laid back' },
        { value: 'drop', label: 'Floppy' },
      ] },
      { key: 'earSize', label: 'Ear size', type: 'range', min: 0.6, max: 1.5, step: 0.01 },
      { key: 'earWidth', label: 'Ear width', type: 'range', min: 0.7, max: 1.5, step: 0.01 },
      { key: 'earSpread', label: 'Spread', type: 'range', min: -0.5, max: 1, step: 0.01 },
      { key: 'earFold', label: 'Fold', type: 'range', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    group: 'Eyes',
    controls: [
      { key: 'eyes', label: 'Eyes', type: 'select', options: [
        { value: 'closed', label: 'Closed (asleep)' },
        { value: 'sleepy', label: 'Sleepy' },
        { value: 'open', label: 'Open, bright' },
      ] },
    ],
  },
  {
    group: 'Tail',
    controls: [
      { key: 'tailLength', label: 'Length', type: 'range', min: 0.5, max: 1.4, step: 0.01 },
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
      { key: 'smooth', label: 'Smooth fur (off: faceted)', type: 'toggle' },
      { key: 'markings', label: 'Husky markings', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'markColor', label: 'Marking colour', type: 'color', swatches: ['#8a847c', '#c8c2b8', '#f1ece3', '#a8702f', '#5a3a22'] },
      { key: 'muzzleGrey', label: 'Grey muzzle', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'greyColor', label: 'Grey', type: 'color', swatches: ['#6b6560', '#8a847c', '#a9a39a', '#c8c2b8'] },
      { key: 'chestPatch', label: 'White chest spot', type: 'range', min: 0, max: 1, step: 0.01 },
      { key: 'patchColor', label: 'Spot colour', type: 'color', swatches: ['#e9e4da', '#f6f2ea', '#c9b79a'] },
      { key: 'socks', label: 'White socks', type: 'range', min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    group: 'Outfit',
    controls: [
      { key: 'hoodie', label: 'Hoodie', type: 'toggle' },
      { key: 'hoodieColor', label: 'Hoodie colour', type: 'color', swatches: HOODIES },
      { key: 'wings', label: 'Survey Corps wings', type: 'toggle' },
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
  { name: 'Coco, awake', params: { pose: 'sphinx', eyes: 'open', headLift: 0.2, headTurn: 0.35, earFold: 0.35 } },
  { name: 'Coco, asleep', params: { pose: 'rest', eyes: 'closed', headLift: 0, headTurn: 0.1 } },
  { name: 'Coco, sitting', params: { pose: 'sit', eyes: 'open', headLift: 0.1 } },
  { name: 'Coco, standing', params: { pose: 'stand', eyes: 'open' } },
  { name: 'Lab', params: { earStyle: 'drop', earFold: 0.5, muzzleWidth: 1.2, muzzleLength: 0.95, chestWidth: 1.12, tailThickness: 1.4, headSize: 1.06 } },
  { name: 'Shepherd', params: { earStyle: 'erect', earSize: 1.25, muzzleLength: 1.2, legLength: 1.1, coat: '#3b2618', markings: 0.8, markColor: '#a8702f' } },
  { name: 'Husky', params: { earStyle: 'erect', markings: 1, markColor: '#c8c2b8', coat: '#3a3a3c', eyes: 'open', tailCurl: 0.8, muzzleLength: 1, muzzleWidth: 1, hoodie: false } },
];
