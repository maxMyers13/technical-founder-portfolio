/**
 * The pod, rendered as materials instead of flat shapes.
 * A shadow map, two practical lamps, and a macro depth of field.
 * Geometry and photos are original; nothing is taken from the game.
 */

import { WorldId } from './worlds';
import { lookAt, mul, normalMat3, ortho, perspective, transformPoint, trs } from './math';

export type Anchor = { id: WorldId; x: number; y: number };

export type PodRoom = {
  setCalm: (calm: boolean) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

type CpuMesh = { interleaved: Float32Array; indices: Uint16Array };

type GpuMesh = { vao: WebGLVertexArrayObject; count: number };

type Draw = {
  mesh: GpuMesh;
  kind: number;
  tint: [number, number, number];
  rough: number;
  wrap: number;
  disc: number;
  tex: WebGLTexture | null;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  bob: number;
  phase: number;
  anchor: WorldId | null;
  anchorDy: number;
};

const BEAUTY_VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=2) in vec2 aUv;
layout(location=3) in float aAo;
layout(location=4) in float aEdge;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform mat3 uNormal;
uniform mat4 uLightVP;
out vec3 vWorld;
out vec3 vNrm;
out vec2 vUv;
out float vAo;
out float vEdge;
out vec4 vLight;
out float vViewZ;
void main() {
  vec4 world = uModel * vec4(aPos, 1.0);
  vec4 view = uView * world;
  vWorld = world.xyz;
  vNrm = uNormal * aNrm;
  vUv = aUv;
  vAo = aAo;
  vEdge = aEdge;
  vLight = uLightVP * world;
  vViewZ = -view.z;
  gl_Position = uProj * view;
}`;

const BEAUTY_FS = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
precision highp sampler2D;
in vec3 vWorld;
in vec3 vNrm;
in vec2 vUv;
in float vAo;
in float vEdge;
in vec4 vLight;
in float vViewZ;
uniform vec3 uTint;
uniform float uKind;
uniform float uRough;
uniform float uWrap;
uniform float uDisc;
uniform float uHasTex;
uniform sampler2D uPhoto;
uniform sampler2DShadow uShadow;
uniform vec3 uLightDir;
uniform vec3 uFillDir;
uniform vec3 uCam;
uniform vec3 uLampA;
uniform vec3 uLampB;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oDepth;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.05 + 1.7;
    a *= 0.5;
  }
  return v;
}

void main() {
  if (uDisc > 0.5 && length(vUv - 0.5) > 0.5) discard;
  vec3 n = normalize(vNrm);
  vec3 albedo = uTint;
  if (uHasTex > 0.5) {
    albedo = texture(uPhoto, vUv).rgb;
    if (uDisc > 0.5) {
      float r = length(vUv - 0.5);
      float ring = smoothstep(0.5, 0.42, r) * (1.0 - smoothstep(0.34, 0.4, r));
      albedo = mix(albedo, vec3(0.79, 0.63, 0.29), ring);
    }
  } else if (uKind < 0.5) {
    float fiber = fbm(vWorld.xy * vec2(2.4, 12.0) + vWorld.yz);
    albedo *= 0.84 + 0.22 * fiber;
    n.x += (fiber - 0.5) * 0.28;
    if (vEdge > 0.5) {
      float flute = sin((vWorld.y + vWorld.z) * 80.0);
      albedo *= 0.7 + 0.3 * (0.5 + 0.5 * flute);
      n.x += flute * 0.4;
    }
  } else if (uKind < 1.5) {
    float fuzz = fbm(vWorld.xy * 14.0 + vWorld.zx);
    albedo *= 0.88 + 0.16 * fuzz;
    n.xy += (vec2(noise(vWorld.xy * 20.0), noise(vWorld.yz * 20.0)) - 0.5) * 0.3;
  } else if (uKind < 2.5) {
    albedo *= 0.93 + 0.1 * fbm(vWorld.xy * 7.0);
  } else if (uKind < 3.5) {
    albedo *= 0.8 + 0.28 * fbm(vWorld.xy * vec2(2.0, 16.0));
  } else if (uKind < 4.5) {
    albedo *= 0.94 + 0.08 * noise(vWorld.xy * 8.0);
  } else if (uKind < 6.5) {
    vec2 cell = fract(vUv * vec2(26.0, 9.0)) - 0.5;
    albedo *= 0.84 + 0.2 * smoothstep(0.46, 0.18, length(cell));
    if (vUv.y > 0.9) {
      float stripe = step(0.5, fract(vUv.x * 16.0));
      albedo = mix(vec3(0.91, 0.7, 0.22), vec3(0.09, 0.07, 0.05), stripe);
    }
  } else {
    albedo *= 0.75 + 0.35 * fbm(vWorld.xy * 2.2);
    float star = step(0.993, hash(floor(vWorld.xy * 28.0 + vWorld.z)));
    albedo += vec3(1.0, 0.94, 0.78) * star;
  }

  n = normalize(n);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(uCam - vWorld);
  vec3 H = normalize(L + V);
  float ndl = dot(n, L);
  float diff = clamp(mix(ndl, ndl * 0.5 + 0.5, uWrap), 0.0, 1.0);
  float spec = pow(clamp(dot(n, H), 0.0, 1.0), mix(10.0, 72.0, 1.0 - uRough)) * (1.0 - uRough) * 0.4;

  vec3 proj = vLight.xyz / max(vLight.w, 0.0001);
  proj = proj * 0.5 + 0.5;
  float occ = 1.0;
  bool receive = uKind < 4.5 || uKind > 5.5;
  if (receive && proj.x > 0.02 && proj.x < 0.98 && proj.y > 0.02 && proj.y < 0.98) {
    float bias = 0.0022 + 0.0055 * (1.0 - clamp(ndl, 0.0, 1.0));
    float sh = 0.0;
    vec2 texel = vec2(1.0 / 2048.0);
    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        sh += texture(uShadow, vec3(proj.xy + vec2(float(x), float(y)) * texel * 1.4, proj.z - bias));
      }
    }
    occ = mix(0.34, 1.0, sh / 9.0);
  }

  float la = 1.0 / (1.0 + dot(vWorld - uLampA, vWorld - uLampA) * 3.2);
  float lb = 1.0 / (1.0 + dot(vWorld - uLampB, vWorld - uLampB) * 3.2);
  vec3 lamp = vec3(1.0, 0.84, 0.52) * (la + lb);
  vec3 fill = vec3(0.42, 0.5, 0.62) * clamp(dot(n, normalize(uFillDir)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = albedo * (vec3(0.32, 0.26, 0.22) * vAo + vec3(1.08, 0.94, 0.78) * diff * occ + fill * 0.28 + lamp * 0.5);
  col += spec * occ * vec3(1.0, 0.96, 0.86);
  if (uKind > 4.5 && uKind < 5.5) col = uTint * (1.15 + (la + lb) * 1.6);
  float rim = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 2.3);
  col += rim * vec3(0.4, 0.28, 0.16) * 0.18;
  oColor = vec4(col, 1.0);
  oDepth = vec4(clamp(vViewZ / 10.0, 0.0, 1.0), 0.0, 0.0, 1.0);
}`;

const SHADOW_VS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uLightVP;
uniform mat4 uModel;
void main() {
  gl_Position = uLightVP * uModel * vec4(aPos, 1.0);
}`;

const SHADOW_FS = `#version 300 es
precision mediump float;
void main() {}`;

const DOF_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const DOF_FS = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform float uFocus;
uniform float uTime;
uniform vec2 uBlur;
out vec4 oColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float z = texture(uDepth, vUv).r * 10.0;
  float coc = clamp(abs(z - uFocus) * 0.045, 0.0, 1.0);
  vec3 acc = texture(uColor, vUv).rgb;
  float w = 1.0;
  for (int ring = 1; ring <= 2; ring++) {
    float rad = coc * uBlur.x * float(ring) * 0.5;
    for (int i = 0; i < 8; i++) {
      float a = (float(i) + float(ring) * 0.37) * 6.2831853 / 8.0;
      vec2 o = vec2(cos(a), sin(a) * uBlur.y) * rad;
      acc += texture(uColor, vUv + o).rgb;
      w += 1.0;
    }
  }
  vec3 col = acc / w;
  col = pow(max(col, 0.0), vec3(0.94));
  float vig = smoothstep(1.25, 0.28, length((vUv - 0.5) * vec2(1.2, 1.05)));
  col *= mix(0.72, 1.0, vig);
  float g = hash(gl_FragCoord.xy + fract(uTime) * 40.0);
  col += (g - 0.5) * 0.028;
  oColor = vec4(col, 1.0);
}`;

class Builder {
  private p: number[] = [];
  private ix: number[] = [];

  vert(pos: number[], nrm: number[], uv: number[], ao: number, edge: number) {
    const i = this.p.length / 10;
    const nl = Math.hypot(nrm[0], nrm[1], nrm[2]) || 1;
    this.p.push(pos[0], pos[1], pos[2], nrm[0] / nl, nrm[1] / nl, nrm[2] / nl, uv[0], uv[1], ao, edge);
    return i;
  }

  face(pts: number[][], n: number[], uvs: number[][], ao = 1, edge = 0) {
    const e1 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]];
    const e2 = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1];
    const cy = e1[2] * e2[0] - e1[0] * e2[2];
    const cz = e1[0] * e2[1] - e1[1] * e2[0];
    const flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    const order = flip ? [0, 3, 2, 1] : [0, 1, 2, 3];
    const ids = order.map((k) => this.vert(pts[k], n, uvs[k], ao, edge));
    this.ix.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
  }

  finish(): CpuMesh {
    return { interleaved: new Float32Array(this.p), indices: new Uint16Array(this.ix) };
  }
}

const UV = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

function boxMesh(): CpuMesh {
  const b = new Builder();
  const faces: { n: number[]; p: number[][]; edge: number }[] = [
    { n: [0, 0, 1], edge: 0, p: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], edge: 1, p: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], edge: 1, p: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], edge: 1, p: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], edge: 0, p: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], edge: 0, p: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  for (const f of faces) b.face(f.p, f.n, UV, 1, f.edge);
  return b.finish();
}

function sphereMesh(stacks = 14, slices = 18): CpuMesh {
  const b = new Builder();
  const at = (phi: number, th: number) => {
    const sp = Math.sin(phi);
    return [sp * Math.cos(th), sp * Math.sin(th), Math.cos(phi)];
  };
  for (let i = 0; i < stacks; i++) {
    const phi0 = (i / stacks) * Math.PI;
    const phi1 = ((i + 1) / stacks) * Math.PI;
    for (let j = 0; j < slices; j++) {
      const th0 = (j / slices) * Math.PI * 2;
      const th1 = ((j + 1) / slices) * Math.PI * 2;
      const a = at(phi0, th0);
      const c = at(phi0, th1);
      const d = at(phi1, th1);
      const e = at(phi1, th0);
      b.face(
        [a, c, d, e],
        [a[0] + c[0] + d[0] + e[0], a[1] + c[1] + d[1] + e[1], a[2] + c[2] + d[2] + e[2]],
        [
          [j / slices, 1 - i / stacks],
          [(j + 1) / slices, 1 - i / stacks],
          [(j + 1) / slices, 1 - (i + 1) / stacks],
          [j / slices, 1 - (i + 1) / stacks],
        ],
      );
    }
  }
  return b.finish();
}

function floorMesh(): CpuMesh {
  const b = new Builder();
  b.face(
    [
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
      [0.5, 0, 0.5],
      [-0.5, 0, 0.5],
    ],
    [0, 1, 0],
    UV,
    1,
    0,
  );
  return b.finish();
}

function frameMesh(w: number, h: number, radius: number, border: number, depth: number): CpuMesh {
  const loop = (width: number, height: number, rad: number) => {
    const pts: { x: number; y: number }[] = [];
    const hw = width / 2;
    const hh = height / 2;
    const r = Math.min(rad, hw, hh);
    const corners = [
      { cx: hw - r, cy: hh - r, a0: 0, a1: Math.PI / 2 },
      { cx: -(hw - r), cy: hh - r, a0: Math.PI / 2, a1: Math.PI },
      { cx: -(hw - r), cy: -(hh - r), a0: Math.PI, a1: Math.PI * 1.5 },
      { cx: hw - r, cy: -(hh - r), a0: Math.PI * 1.5, a1: Math.PI * 2 },
    ];
    for (const k of corners) {
      for (let i = 0; i < 5; i++) {
        const a = k.a0 + ((k.a1 - k.a0) * i) / 5;
        pts.push({ x: k.cx + Math.cos(a) * r, y: k.cy + Math.sin(a) * r });
      }
    }
    return pts;
  };
  const outer = loop(w, h, radius);
  const inner = loop(w - border * 2, h - border * 2, Math.max(0.02, radius - border));
  const b = new Builder();
  const z1 = depth / 2;
  const z0 = -depth / 2;
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length;
    const o0 = outer[i];
    const o1 = outer[j];
    const i0 = inner[i];
    const i1 = inner[j];
    b.face(
      [
        [o0.x, o0.y, z1],
        [o1.x, o1.y, z1],
        [i1.x, i1.y, z1],
        [i0.x, i0.y, z1],
      ],
      [0, 0, 1],
      UV,
      1,
      0,
    );
    let nx = o1.y - o0.y;
    let ny = o0.x - o1.x;
    let len = Math.hypot(nx, ny) || 1;
    b.face(
      [
        [o0.x, o0.y, z0],
        [o1.x, o1.y, z0],
        [o1.x, o1.y, z1],
        [o0.x, o0.y, z1],
      ],
      [nx / len, ny / len, 0],
      UV,
      0.8,
      1,
    );
    nx = i0.y - i1.y;
    ny = i1.x - i0.x;
    len = Math.hypot(nx, ny) || 1;
    b.face(
      [
        [i0.x, i0.y, z0],
        [i1.x, i1.y, z0],
        [i1.x, i1.y, z1],
        [i0.x, i0.y, z1],
      ],
      [nx / len, ny / len, 0],
      UV,
      0.42,
      1,
    );
  }
  return b.finish();
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'shader compile failed';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) throw new Error('Could not create the pod shader');
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p) || 'shader link failed';
    gl.deleteProgram(p);
    throw new Error(log);
  }
  return p;
}

function upload(gl: WebGL2RenderingContext, mesh: CpuMesh): GpuMesh {
  const vao = gl.createVertexArray();
  const vbo = gl.createBuffer();
  const ibo = gl.createBuffer();
  if (!vao || !vbo || !ibo) throw new Error('Could not allocate pod geometry');
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, mesh.interleaved, gl.STATIC_DRAW);
  const stride = 40;
  const bind = (loc: number, size: number, offset: number) => {
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset);
  };
  bind(0, 3, 0);
  bind(1, 3, 12);
  bind(2, 2, 24);
  bind(3, 1, 32);
  bind(4, 1, 36);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: mesh.indices.length };
}

function loadTexture(gl: WebGL2RenderingContext, url: string) {
  const tex = gl.createTexture();
  if (!tex) throw new Error('Could not create a texture');
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([210, 180, 140, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const img = new Image();
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  img.src = url;
  return tex;
}

type Wing = { x: number; y: number; z: number; ry: number; sx: number; sy: number; sz: number };

function onWing(w: Wing, lx: number, ly: number) {
  const px = lx * w.sx;
  const py = ly * w.sy;
  const pz = 0.5 * w.sz + 0.015;
  const c = Math.cos(w.ry);
  const s = Math.sin(w.ry);
  return { x: px * c + pz * s + w.x, y: py + w.y, z: -px * s + pz * c + w.z, ry: w.ry };
}

export function startPodRoom(
  canvas: HTMLCanvasElement,
  hooks: {
    calm: boolean;
    onReady: () => void;
    onAnchors: (anchors: Anchor[]) => void;
    onFail: (message: string) => void;
  },
): PodRoom {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) {
    hooks.onFail('WebGL2 is not available');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  let failed = false;
  const fail = (message: string) => {
    if (failed) return;
    failed = true;
    hooks.onFail(message);
  };

  let beauty: WebGLProgram;
  let shadow: WebGLProgram;
  let dof: WebGLProgram;
  try {
    beauty = program(gl, BEAUTY_VS, BEAUTY_FS);
    shadow = program(gl, SHADOW_VS, SHADOW_FS);
    dof = program(gl, DOF_VS, DOF_FS);
  } catch (err) {
    fail(err instanceof Error ? err.message : 'shader failed');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  const box = upload(gl, boxMesh());
  const ball = upload(gl, sphereMesh());
  const rug = upload(gl, floorMesh());
  const arch = upload(gl, frameMesh(1.22, 1.48, 0.16, 0.09, 0.07));
  const quad = gl.createVertexArray();
  const quadBuf = gl.createBuffer();
  if (!quad || !quadBuf) {
    fail('Could not allocate the frame');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }
  gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  const portrait = loadTexture(gl, '/assets/max-portrait.jpeg');
  const track = loadTexture(gl, '/assets/photos/track-race.jpg');
  const stage = loadTexture(gl, '/assets/photos/on-stage-conference.jpg');
  const standeeTex = loadTexture(gl, '/assets/photos/yc-startup-school.jpg');

  const left: Wing = { x: -1.12, y: 0.08, z: 0.02, ry: 0.42, sx: 1.05, sy: 1.18, sz: 0.06 };
  const right: Wing = { x: 1.12, y: 0.08, z: 0.02, ry: -0.42, sx: 1.05, sy: 1.18, sz: 0.06 };
  const lifeA = onWing(left, -0.16, 0.12);
  const lifeB = onWing(left, 0.2, -0.08);
  const speak = onWing(right, -0.12, 0.16);
  const nudge = (p: { x: number; y: number; z: number; ry: number }, amount: number) => ({
    x: p.x + Math.sin(p.ry) * amount,
    y: p.y,
    z: p.z + Math.cos(p.ry) * amount,
  });
  const lifeAFront = nudge(lifeA, 0.03);
  const lifeABack = nudge(lifeA, -0.02);
  const lifeBFront = nudge(lifeB, 0.03);
  const lifeBBack = nudge(lifeB, -0.02);
  const speakFront = nudge(speak, 0.03);
  const speakBack = nudge(speak, -0.02);
  const shelf = onWing(right, 0.02, -0.32);

  const D = (
    mesh: GpuMesh,
    kind: number,
    tint: [number, number, number],
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    extra: Partial<Draw> = {},
  ): Draw => ({
    mesh,
    kind,
    tint,
    rough: 0.86,
    wrap: 0.2,
    disc: 0,
    tex: null,
    x,
    y,
    z,
    rx: 0,
    ry: 0,
    rz: 0,
    sx,
    sy,
    sz,
    bob: 0,
    phase: 0,
    anchor: null,
    anchorDy: -0.22,
    ...extra,
  });

  const draws: Draw[] = [
    D(box, 7, [0.16, 0.18, 0.32], 0, 0.15, -0.85, 4.4, 2.6, 0.04, { rough: 1, wrap: 0.4 }),
    D(box, 7, [0.18, 0.2, 0.36], left.x, left.y, left.z, left.sx, left.sy, left.sz, { ry: left.ry, rough: 1 }),
    D(box, 7, [0.14, 0.16, 0.3], right.x, right.y, right.z, right.sx, right.sy, right.sz, { ry: right.ry, rough: 1 }),
    D(box, 0, [0.62, 0.45, 0.3], -0.68, 0.02, 0.28, 0.11, 1.62, 0.1, { rough: 0.94 }),
    D(box, 0, [0.62, 0.45, 0.3], 0.68, 0.02, 0.28, 0.11, 1.62, 0.1, { rough: 0.94 }),
    D(arch, 0, [0.64, 0.47, 0.31], 0, 0.08, 0.2, 1, 1, 1, { rough: 0.94 }),
    D(box, 1, [0.55, 0.32, 0.48], 0, 0.05, 0.02, 0.98, 1.18, 0.03, { wrap: 0.65, rough: 1 }),
    D(rug, 6, [0.48, 0.2, 0.28], 0, -0.78, 0.35, 3.3, 1, 1.35, { rough: 1, wrap: 0.45 }),
    D(box, 0, [0.45, 0.32, 0.22], 0, -0.42, 0.34, 0.92, 0.06, 0.08, { rough: 0.9 }),
    D(box, 5, [1, 0.91, 0.62], -0.72, 0.28, 0.22, 0.07, 0.09, 0.05, { rough: 0.4 }),
    D(box, 5, [1, 0.91, 0.62], 0.78, 0.26, 0.22, 0.07, 0.09, 0.05, { rough: 0.4 }),
    D(ball, 5, [1, 0.93, 0.7], 0.22, 0.62, 0.32, 0.045, 0.055, 0.045),
    D(ball, 5, [1, 0.93, 0.7], 0.3, 0.66, 0.32, 0.05, 0.06, 0.05),
    D(ball, 5, [1, 0.93, 0.7], 0.38, 0.62, 0.32, 0.045, 0.055, 0.045),
    D(box, 3, [0.79, 0.63, 0.29], lifeABack.x, lifeABack.y, lifeABack.z, 0.4, 0.5, 0.012, {
      ry: lifeA.ry,
      disc: 1,
      rough: 0.55,
    }),
    D(box, 2, [0.95, 0.9, 0.82], lifeAFront.x, lifeAFront.y, lifeAFront.z, 0.34, 0.44, 0.008, {
      ry: lifeA.ry,
      disc: 1,
      tex: portrait,
      rough: 0.7,
      anchor: 'life',
      anchorDy: -0.28,
    }),
    D(box, 3, [0.79, 0.63, 0.29], lifeBBack.x, lifeBBack.y, lifeBBack.z, 0.34, 0.34, 0.012, {
      ry: lifeB.ry,
      disc: 1,
      rough: 0.55,
    }),
    D(box, 2, [0.95, 0.9, 0.82], lifeBFront.x, lifeBFront.y, lifeBFront.z, 0.28, 0.28, 0.008, {
      ry: lifeB.ry,
      disc: 1,
      tex: track,
      rough: 0.7,
    }),
    D(box, 3, [0.72, 0.55, 0.28], speakBack.x, speakBack.y, speakBack.z, 0.52, 0.4, 0.012, { ry: speak.ry, rough: 0.6 }),
    D(box, 2, [1, 1, 1], speakFront.x, speakFront.y, speakFront.z, 0.46, 0.34, 0.008, {
      ry: speak.ry,
      tex: stage,
      rough: 0.65,
      anchor: 'speaking',
      anchorDy: -0.24,
    }),
    D(box, 3, [0.42, 0.28, 0.14], shelf.x, shelf.y, shelf.z, 0.62, 0.045, 0.16, {
      ry: shelf.ry,
      rough: 0.6,
      anchor: 'writing',
      anchorDy: -0.12,
    }),
    D(box, 2, [0.18, 0.36, 0.55], shelf.x - 0.2, shelf.y + 0.1, shelf.z, 0.06, 0.2, 0.1, { ry: shelf.ry }),
    D(box, 2, [0.72, 0.23, 0.15], shelf.x - 0.1, shelf.y + 0.08, shelf.z, 0.055, 0.16, 0.1, { ry: shelf.ry }),
    D(box, 2, [0.91, 0.7, 0.23], shelf.x, shelf.y + 0.11, shelf.z, 0.05, 0.22, 0.1, { ry: shelf.ry }),
    D(box, 2, [0.18, 0.44, 0.42], shelf.x + 0.1, shelf.y + 0.07, shelf.z, 0.05, 0.15, 0.1, { ry: shelf.ry }),
    D(box, 2, [0.36, 0.3, 0.54], shelf.x + 0.18, shelf.y + 0.09, shelf.z, 0.05, 0.18, 0.1, { ry: shelf.ry, rz: 0.18 }),
    D(ball, 4, [0.2, 0.38, 0.58], -0.02, 0.16, 0.4, 0.2, 0.2, 0.2, {
      rough: 0.32,
      bob: 0.025,
      anchor: 'lilo',
      anchorDy: -0.26,
    }),
    D(ball, 1, [0.96, 0.93, 0.86], -0.32, 0.38, 0.4, 0.09, 0.09, 0.09, {
      wrap: 0.7,
      rough: 0.8,
      bob: 0.02,
      phase: 1.2,
      anchor: 'ask',
      anchorDy: -0.14,
    }),
    D(ball, 1, [0.7, 0.6, 0.43], 0.3, 0.02, 0.4, 0.1, 0.1, 0.1, {
      wrap: 0.55,
      rough: 0.85,
      bob: 0.02,
      phase: 2.1,
      anchor: 'builds',
      anchorDy: -0.16,
    }),
    D(ball, 1, [0.78, 0.26, 0.18], -0.28, -0.36, 0.4, 0.1, 0.06, 0.07, { wrap: 0.7, rough: 1 }),
    D(box, 3, [0.73, 0.39, 0.24], 0.32, -0.4, 0.38, 0.07, 0.06, 0.07, { rough: 0.7 }),
    D(box, 1, [0.3, 0.54, 0.24], 0.32, -0.34, 0.38, 0.04, 0.1, 0.02, { rz: -0.4, wrap: 0.8, rough: 1 }),
    D(box, 2, [0.95, 0.93, 0.9], 1.15, -0.42, 0.55, 0.16, 0.22, 0.012, {
      tex: standeeTex,
      ry: -0.25,
      rz: 0.08,
      rough: 0.6,
    }),
  ];

  const SHADOW = 2048;
  const shadowTex = gl.createTexture();
  const shadowFb = gl.createFramebuffer();
  if (!shadowTex || !shadowFb) {
    fail('Could not allocate shadows');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }
  gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SHADOW, SHADOW, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
  gl.drawBuffers([]);
  gl.readBuffer(gl.NONE);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    fail('Shadow buffer is incomplete');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  const colorTex = gl.createTexture();
  const depthTex = gl.createTexture();
  const colorFb = gl.createFramebuffer();
  const depthRb = gl.createRenderbuffer();
  if (!colorTex || !depthTex || !colorFb || !depthRb) {
    fail('Could not allocate the frame');
    return { setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  let bw = 0;
  let bh = 0;
  const allocTargets = (w: number, h: number) => {
    bw = w;
    bh = h;
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTex, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, depthTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  };

  const lightPos: [number, number, number] = [-0.9, 2.5, 2.4];
  const lightView = lookAt(lightPos, [0, 0, 0], [0, 1, 0]);
  const lightProj = ortho(-2.2, 2.2, -1.8, 1.8, 0.4, 8);
  const lightVP = mul(lightProj, lightView);
  const lightDir = [lightPos[0], lightPos[1], lightPos[2]];
  const lightLen = Math.hypot(...lightDir) || 1;
  lightDir[0] /= lightLen;
  lightDir[1] /= lightLen;
  lightDir[2] /= lightLen;

  const bLoc = {
    proj: gl.getUniformLocation(beauty, 'uProj'),
    view: gl.getUniformLocation(beauty, 'uView'),
    model: gl.getUniformLocation(beauty, 'uModel'),
    normal: gl.getUniformLocation(beauty, 'uNormal'),
    lightVP: gl.getUniformLocation(beauty, 'uLightVP'),
    tint: gl.getUniformLocation(beauty, 'uTint'),
    kind: gl.getUniformLocation(beauty, 'uKind'),
    rough: gl.getUniformLocation(beauty, 'uRough'),
    wrap: gl.getUniformLocation(beauty, 'uWrap'),
    disc: gl.getUniformLocation(beauty, 'uDisc'),
    hasTex: gl.getUniformLocation(beauty, 'uHasTex'),
    photo: gl.getUniformLocation(beauty, 'uPhoto'),
    shadow: gl.getUniformLocation(beauty, 'uShadow'),
    lightDir: gl.getUniformLocation(beauty, 'uLightDir'),
    fillDir: gl.getUniformLocation(beauty, 'uFillDir'),
    cam: gl.getUniformLocation(beauty, 'uCam'),
    lampA: gl.getUniformLocation(beauty, 'uLampA'),
    lampB: gl.getUniformLocation(beauty, 'uLampB'),
  };
  const sModel = gl.getUniformLocation(shadow, 'uModel');
  const sLight = gl.getUniformLocation(shadow, 'uLightVP');
  const dColor = gl.getUniformLocation(dof, 'uColor');
  const dDepth = gl.getUniformLocation(dof, 'uDepth');
  const dFocus = gl.getUniformLocation(dof, 'uFocus');
  const dTime = gl.getUniformLocation(dof, 'uTime');
  const dBlur = gl.getUniformLocation(dof, 'uBlur');

  let calm = hooks.calm;
  let pointerX = 0;
  let pointerY = 0;
  let raf = 0;
  let ready = false;
  const t0 = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const w = Math.max(2, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      allocTargets(w, h);
    }
  };

  const modelOf = (d: Draw, time: number) => {
    const bob = calm ? 0 : Math.sin(time * 1.3 + d.phase) * d.bob;
    return trs(d.x, d.y + bob, d.z, d.rx, d.ry, d.rz, d.sx, d.sy, d.sz);
  };

  const drawScene = (prog: 'beauty' | 'shadow', time: number) => {
    for (const d of draws) {
      const model = modelOf(d, time);
      if (prog === 'shadow') {
        gl.uniformMatrix4fv(sModel, false, model);
      } else {
        gl.uniformMatrix4fv(bLoc.model, false, model);
        gl.uniformMatrix3fv(bLoc.normal, false, normalMat3(model));
        gl.uniform3fv(bLoc.tint, d.tint);
        gl.uniform1f(bLoc.kind, d.kind);
        gl.uniform1f(bLoc.rough, d.rough);
        gl.uniform1f(bLoc.wrap, d.wrap);
        gl.uniform1f(bLoc.disc, d.disc);
        gl.uniform1f(bLoc.hasTex, d.tex ? 1 : 0);
        if (d.tex) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, d.tex);
        }
      }
      gl.bindVertexArray(d.mesh.vao);
      gl.drawElements(gl.TRIANGLES, d.mesh.count, gl.UNSIGNED_SHORT, 0);
    }
  };

  const frame = (now: number) => {
    if (failed || gl.isContextLost()) return;
    raf = requestAnimationFrame(frame);
    resize();
    if (bw < 2 || bh < 2) return;
    const time = (now - t0) / 1000;
    const eye: [number, number, number] = [pointerX * 0.22, 0.22 - pointerY * 0.1, 3.35];
    const view = lookAt(eye, [0, -0.02, 0], [0, 1, 0]);
    const proj = perspective((34 * Math.PI) / 180, bw / bh, 0.08, 20);

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
    gl.viewport(0, 0, SHADOW, SHADOW);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(2.0, 3.0);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(shadow);
    gl.uniformMatrix4fv(sLight, false, lightVP);
    drawScene('shadow', time);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFb);
    gl.viewport(0, 0, bw, bh);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearColor(0.1, 0.07, 0.05, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(beauty);
    gl.uniformMatrix4fv(bLoc.proj, false, proj);
    gl.uniformMatrix4fv(bLoc.view, false, view);
    gl.uniformMatrix4fv(bLoc.lightVP, false, lightVP);
    gl.uniform3fv(bLoc.lightDir, lightDir);
    gl.uniform3fv(bLoc.fillDir, [0.85, 0.25, 0.55]);
    gl.uniform3fv(bLoc.cam, eye);
    gl.uniform3fv(bLoc.lampA, [-0.72, 0.28, 0.22]);
    gl.uniform3fv(bLoc.lampB, [0.78, 0.26, 0.22]);
    gl.uniform1i(bLoc.shadow, 0);
    gl.uniform1i(bLoc.photo, 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, portrait);
    drawScene('beauty', time);

    const focusPoint = transformPoint(view, -0.02, 0.16, 0.4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(dof);
    gl.uniform1i(dColor, 0);
    gl.uniform1i(dDepth, 1);
    gl.uniform1f(dFocus, -focusPoint[2]);
    gl.uniform1f(dTime, time);
    gl.uniform2f(dBlur, 0.007, bw / bh);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const mvp = mul(proj, view);
    const anchors: Anchor[] = [];
    for (const d of draws) {
      if (!d.anchor) continue;
      const bob = calm ? 0 : Math.sin(time * 1.3 + d.phase) * d.bob;
      const p = transformPoint(mvp, d.x, d.y + bob + d.anchorDy, d.z);
      if (p[3] <= 0) continue;
      anchors.push({
        id: d.anchor,
        x: (p[0] / p[3] * 0.5 + 0.5) * canvas.clientWidth,
        y: (1 - (p[1] / p[3] * 0.5 + 0.5)) * canvas.clientHeight,
      });
    }
    hooks.onAnchors(anchors);
    if (!ready) {
      ready = true;
      hooks.onReady();
    }
  };

  raf = requestAnimationFrame(frame);

  return {
    setCalm: (next) => {
      calm = next;
    },
    setPointer: (x, y) => {
      pointerX = x;
      pointerY = y;
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      failed = true;
    },
  };
}

