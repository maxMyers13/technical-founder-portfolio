/**
 * The pod, rendered as materials instead of flat shapes.
 * A shadow map, two practical lamps, and a macro depth of field.
 * Geometry and photos are original; nothing is taken from the game.
 */

import { WorldId } from './worlds';
import { worldMapWhenFontsReady } from './worldMap';
import * as P from './propTextures';
import { routeMap, singletFabric } from './artTextures';
import { BOOKS, RECORDS, SHELF_TOPICS, bookLink, clothFor, isOwn, nowReading } from './books';
import { GAMES, caseFor } from './games';
import { LEARNING } from './learning';
import { AUDIOBOOKS } from './audiobooks';
import { lookAt, mul, normalMat3, ortho, perspective, transformPoint, trs } from './math';
import { LOOT, type PropName } from './loot';
import { loadGLB } from './glbLoader';
import { MODELS } from './models';
import { EVENTS } from './events';

/** A screen point for a DOM element to sit on: a world's label, or a controller button ('pad:up', 'pad:triangle', ...). */
/** Places the camera can fly to that aren't sections: the desk you can step up to. */
export type Place = 'desk';
export type Anchor = { id: WorldId | Place | `pad:${string}` | `badge:${string}`; x: number; y: number };

export type PodRoom = {
  /** Fly the camera in to a world's object (null flies back out). */
  focus: (id: WorldId | Place | null) => void;
  setCalm: (calm: boolean) => void;
  setPointer: (x: number, y: number) => void;
  dispose: () => void;
};

type CpuMesh = { interleaved: Float32Array; indices: Uint16Array | Uint32Array };

/** `type` is UNSIGNED_SHORT for the hand-built meshes, UNSIGNED_INT for big imported models. */
type GpuMesh = { vao: WebGLVertexArrayObject; count: number; type: number };

/** Material kind for imported .glb parts: base colour x factor, metallic-roughness and normal maps. */
const KIND_MODEL = 10;

type Draw = {
  mesh: GpuMesh;
  kind: number;
  tint: [number, number, number];
  rough: number;
  /** 0 = dielectric, 1 = metal (GGX with F0 taken from the albedo). */
  metal: number;
  /** Imported models: tangent-space normal map and glTF metallic-roughness map (G = rough, B = metal). */
  nrm: WebGLTexture | null;
  nrmScale: number;
  mr: WebGLTexture | null;
  /** Discard texels below this alpha (0 = opaque). */
  alphaCut: number;
  /** Draw both faces (glTF doubleSided). */
  twoSided: boolean;
  /** A backlit display: self-lit picture under glass, not a printed surface. */
  screen: boolean;
  /** Lift with this section on hover without being its anchor (the other parts of a multi-part model). */
  follow: WorldId | Place | null;
  /** Jelly: this part belongs to a soft body centred here. It squashes, stretches and rocks about that point. */
  jelly?: readonly [number, number, number];
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
  spin: number;
  anchor: WorldId | Place | null;
  anchorDy: number;
  uvScale: number;
  uvOff: [number, number];
  /** Per-axis UV window (1,1 = the whole picture); with uvOff it maps a slice of one picture onto this face. */
  uvXY: [number, number];
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
uniform float uUvScale;
uniform vec2 uUvOff;
uniform vec2 uUvXY;
uniform sampler2D uPhoto;
uniform sampler2DShadow uShadow;
uniform vec3 uLightDir;
uniform vec3 uFillDir;
uniform vec3 uCam;
uniform vec3 uLampA;
uniform vec3 uLampB;
uniform mat4 uView;
uniform float uEmissive;
uniform float uMetal;
uniform float uHasNrm;
uniform float uNrmScale;
uniform float uHasMR;
uniform float uAlphaCut;
uniform float uScreen;
uniform sampler2D uNrmMap;
uniform sampler2D uMRMap;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oDepth;

/**
 * Tangent-space normal map without a tangent attribute: the frame comes from screen-space derivatives of
 * position and uv (Schuler, "Normal Mapping Without Precomputed Tangents"). Green is flipped because glTF
 * uvs run top-down while this frame is built bottom-up, the same correction three.js applies.
 */
vec3 perturbNormal(vec3 N, vec3 p, vec2 uv, vec3 m) {
  vec3 dp1 = dFdx(p);
  vec3 dp2 = dFdy(p);
  vec2 duv1 = dFdx(uv);
  vec2 duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N);
  vec3 dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
  vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float len = max(dot(T, T), dot(B, B));
  if (len < 1e-20) return N;
  float inv = inversesqrt(len);
  m.y = -m.y;
  return normalize(mat3(T * inv, B * inv, N) * m);
}

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
  float rough = uRough;
  float metal = uMetal;
  if (uKind > 9.5) {
    // Imported model (kind 10): glTF metallic-roughness, drawn through the same lights as everything else.
    if (!gl_FrontFacing) n = -n;
    vec4 base = uHasTex > 0.5 ? texture(uPhoto, vUv) : vec4(1.0);
    if (base.a < uAlphaCut) discard;
    albedo = uTint * base.rgb;
    if (uHasMR > 0.5) {
      vec4 mr = texture(uMRMap, vUv);
      rough *= mr.g;
      metal *= mr.b;
    }
    if (uHasNrm > 0.5) {
      vec3 m = texture(uNrmMap, vUv).xyz * 2.0 - 1.0;
      m.xy *= uNrmScale;
      n = perturbNormal(n, vWorld, vUv, m);
    }
  } else if (uHasTex > 0.5) {
    vec2 uv = (vUv - 0.5) * uUvScale * uUvXY + 0.5 + uUvOff;
    vec4 tex = texture(uPhoto, uKind > 7.5 ? vec2(1.0 - vUv.x, vUv.y) : clamp(uv, 0.0, 1.0));
    if (tex.a < 0.5) discard;
    albedo = tex.rgb;
    if (uScreen < 0.5) {
    // Printed and painted faces get a paper tooth, so they catch light like the card around them
    // instead of reading as flat stickers. World-space, so it stays put as the picture is cropped.
    float tooth = fbm(vWorld.xy * 46.0 + vWorld.zy * 31.0);
    albedo *= 0.95 + 0.09 * tooth;
    n.xy += (vec2(noise(vWorld.xy * 140.0 + vWorld.z * 50.0), noise(vWorld.yz * 140.0 + vWorld.x * 50.0)) - 0.5) * 0.14;
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
  } else if (uKind < 6.5 && uKind > 5.5) {
    vec2 cell = fract(vUv * vec2(26.0, 9.0)) - 0.5;
    albedo *= 0.84 + 0.2 * smoothstep(0.46, 0.18, length(cell));
    if (vUv.y > 0.9) {
      float stripe = step(0.5, fract(vUv.x * 16.0));
      albedo = mix(vec3(0.91, 0.7, 0.22), vec3(0.09, 0.07, 0.05), stripe);
    }
  } else if (uKind < 7.5) {
    albedo *= 0.75 + 0.35 * fbm(vWorld.xy * 2.2);
  } else if (uKind > 8.5 && uKind < 9.5) {
    albedo = uTint;
  } else {
    vec3 sea = vec3(0.13, 0.36, 0.58);
    vec3 land = vec3(0.52, 0.66, 0.34);
    float continent = noise(vUv * vec2(3.2, 2.4) + vec2(1.7, 0.4));
    float coast = noise(vUv * 6.5 + 2.2);
    albedo = mix(sea, land, smoothstep(0.46, 0.6, continent) * smoothstep(0.25, 0.7, coast));
    albedo += vec3(0.35, 0.55, 0.7) * pow(clamp(dot(n, normalize(vec3(-0.4, 0.6, 0.8))), 0.0, 1.0), 8.0) * 0.35;
  }

  n = normalize(n);
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(uCam - vWorld);
  vec3 H = normalize(L + V);
  float ndl = dot(n, L);
  float diff = clamp(mix(ndl, ndl * 0.5 + 0.5, uWrap), 0.0, 1.0);

  // Key-light specular: GGX distribution, Schlick-GGX geometry, Schlick Fresnel (Cook-Torrance).
  // F0 is 4% for dielectrics and the albedo for metals, so a metal's highlight takes its colour.
  float rgh = clamp(rough, 0.08, 1.0);
  vec3 F0 = mix(vec3(0.04), albedo, metal);
  float nv = max(dot(n, V), 1e-4);
  float nl = max(ndl, 0.0);
  float nh = max(dot(n, H), 0.0);
  float vh = max(dot(V, H), 0.0);
  float a2 = rgh * rgh * rgh * rgh;
  float dd = nh * nh * (a2 - 1.0) + 1.0;
  float ggxD = a2 / (3.14159265 * dd * dd);
  float gk = (rgh + 1.0) * (rgh + 1.0) / 8.0;
  float ggxG = (nv / (nv * (1.0 - gk) + gk)) * (nl / (nl * (1.0 - gk) + gk));
  vec3 fres = F0 + (1.0 - F0) * pow(1.0 - vh, 5.0);
  vec3 spec = min(ggxD * ggxG * fres / (4.0 * nv * max(nl, 1e-4)) * nl, vec3(12.0));

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
        occ = mix(0.16, 1.0, sh / 9.0);
  }

  float la = 1.0 / (1.0 + dot(vWorld - uLampA, vWorld - uLampA) * 3.2);
  float lb = 1.0 / (1.0 + dot(vWorld - uLampB, vWorld - uLampB) * 3.2);
  vec3 lamp = vec3(1.0, 0.84, 0.52) * (la + lb);
  vec3 fill = vec3(0.42, 0.5, 0.62) * clamp(dot(n, normalize(uFillDir)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 lit = vec3(0.32, 0.26, 0.22) * vAo + vec3(1.08, 0.94, 0.78) * diff * occ + fill * 0.28 + lamp * 0.5;
  vec3 col;
  if (uHasTex > 0.5 && uKind < 7.5) {
    // Printed faces take the same lamps, fill and bounce as the card and felt around them. Kept a little
    // flatter than raw lit (photos are authored bright) so a picture does not blow out under the key light.
    col = albedo * mix(vec3(0.86), lit, 0.72);
  } else {
    col = albedo * lit;
  }
  // Metals have no diffuse; they show the room instead: a warm floor below, the ceiling glow above, and a
  // softbox highlight from the key light. Rough metals see a blurred, dimmer room.
  vec3 R = reflect(-V, n);
  vec3 room = mix(vec3(0.3, 0.2, 0.2), vec3(0.78, 0.7, 0.6), smoothstep(-0.5, 0.7, R.y));
  room += vec3(1.0, 0.92, 0.78) * smoothstep(0.72, 0.97, dot(R, L)) * (1.0 - rgh) * 1.4;
  vec3 envF = F0 + (max(vec3(1.0 - rgh), F0) - F0) * pow(1.0 - nv, 5.0);
  col = col * (1.0 - metal) + room * envF * mix(1.0, 0.45, rgh) * mix(0.55, 1.0, occ) * vAo * metal;
  col += spec * occ * vec3(1.08, 0.94, 0.78);
  if (uScreen > 0.5) {
    // A backlit panel: it makes its own light, so the room's shadows and lamps don't shade the picture.
    // What it does pick up is the glass: a Fresnel sheen of the room and the key light's highlight.
    float glass = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
    col = albedo * mix(1.0, uEmissive, 0.18) * 1.02 + room * glass * 0.35 + spec * 0.6;
  }
  if (uKind > 4.5 && uKind < 5.5) col = uTint * (1.15 + (la + lb) * 1.6);
  float rim = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 2.3);
  col += rim * vec3(0.4, 0.28, 0.16) * 0.18;
  // Felt sheen: fibres catch light at grazing angles (felt walls, felt objects, the rug).
  bool felt = (uKind > 0.5 && uKind < 1.5) || (uKind > 5.5 && uKind < 7.5);
  if (felt && uHasTex < 0.5) {
    float grazing = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 3.0);
    vec3 sheenCol = mix(albedo, vec3(1.0, 0.93, 0.82), 0.55);
    col += sheenCol * grazing * (0.35 + 0.65 * diff * occ) * 0.55 + sheenCol * (la + lb) * grazing * 0.6;
  }
  // Kind 9: a mechanical keyboard, dark keycaps with rainbow light bleeding up through the gaps (it blooms).
  if (uKind > 8.5 && uKind < 9.5) {
    vec2 g = fract(vUv * vec2(15.0, 5.0));
    float edge = min(min(g.x, 1.0 - g.x), min(g.y, 1.0 - g.y));
    float gap = 1.0 - smoothstep(0.05, 0.13, edge);
    vec3 rgb = 0.5 + 0.5 * cos(6.2831853 * (vUv.x * 0.85 + vec3(0.0, 0.33, 0.67)));
    col = mix(col, rgb * 1.3 * uEmissive, gap * 0.85);
  }
  // Practical lamps run hot so bloom and the light shafts have something to work with.
  if (uKind > 4.5 && uKind < 5.5) col *= uEmissive;
  oColor = vec4(col, 1.0);
  vec3 vn = normalize(mat3(uView) * normalize(vNrm));
  oDepth = vec4(vViewZ / 20.0, vn * 0.5 + 0.5);
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

// ---------- post stack: SSAO -> bloom chain -> god rays -> combine -> tilt-shift DOF + CA + tonemap + LUT + grain ----------
// The G-buffer (oDepth) holds view depth / 20 in r and the view-space normal (0..1) in gba.

const POST_HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
precision highp sampler3D;
in vec2 vUv;
out vec4 oColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

/** Scalable ambient occlusion: depth + normals, a rotated spiral of 16 taps, range-checked. */
const SSAO_FS = `${POST_HEAD}
uniform sampler2D uG;
uniform vec2 uTan;
uniform float uRadius;
vec3 viewPos(vec2 uv, float z) { return vec3((uv * 2.0 - 1.0) * uTan * z, -z); }
void main() {
  vec4 g = texture(uG, vUv);
  float z = g.r * 20.0;
  if (z > 14.0) { oColor = vec4(1.0); return; }
  vec3 P = viewPos(vUv, z);
  vec3 N = normalize(g.gba * 2.0 - 1.0);
  float spin = hash(gl_FragCoord.xy) * 6.2831853;
  vec2 rUv = vec2(uRadius / (z * uTan.x), uRadius / (z * uTan.y)) * 0.5;
  float ao = 0.0;
  const int TAPS = 16;
  for (int i = 0; i < TAPS; i++) {
    float t = (float(i) + 0.5) / float(TAPS);
    float a = t * 37.6991 + spin;
    vec2 uv = vUv + vec2(cos(a), sin(a)) * rUv * t;
    float sz = texture(uG, uv).r * 20.0;
    vec3 S = viewPos(uv, sz);
    vec3 v = S - P;
    float vv = dot(v, v);
    float range = smoothstep(0.0, 1.0, uRadius * uRadius / max(vv, 1e-5));
    ao += max(0.0, dot(v, N) - 0.012 * z) / (vv + 0.004) * range;
  }
  ao = clamp(1.0 - ao * 0.07, 0.0, 1.0);
  oColor = vec4(vec3(pow(ao, 1.6)), 1.0);
}`;

/** Depth-aware 4x4 blur so the AO noise disappears without bleeding across edges. */
const AO_BLUR_FS = `${POST_HEAD}
uniform sampler2D uAo;
uniform sampler2D uG;
uniform vec2 uTexel;
void main() {
  float z0 = texture(uG, vUv).r * 20.0;
  float acc = 0.0;
  float w = 0.0;
  for (int x = -2; x <= 1; x++) {
    for (int y = -2; y <= 1; y++) {
      vec2 uv = vUv + (vec2(float(x), float(y)) + 0.5) * uTexel;
      float z = texture(uG, uv).r * 20.0;
      float k = exp(-abs(z - z0) * 18.0);
      acc += texture(uAo, uv).r * k;
      w += k;
    }
  }
  oColor = vec4(vec3(acc / max(w, 1e-4)), 1.0);
}`;

/** Bloom prefilter: soft-knee threshold, with a 4-tap downsample to kill fireflies. */
const BLOOM_PRE_FS = `${POST_HEAD}
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThreshold;
vec3 pre(vec3 c) {
  float br = max(c.r, max(c.g, c.b));
  float knee = uThreshold * 0.6;
  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-4);
  float contrib = max(soft, br - uThreshold) / max(br, 1e-4);
  return c * contrib / (1.0 + br * 0.25);
}
void main() {
  vec3 a = pre(texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb);
  vec3 b = pre(texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb);
  vec3 c = pre(texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb);
  vec3 d = pre(texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb);
  oColor = vec4((a + b + c + d) * 0.25, 1.0);
}`;

/** Dual-Kawase downsample. */
const BLOOM_DOWN_FS = `${POST_HEAD}
uniform sampler2D uSrc;
uniform vec2 uTexel;
void main() {
  vec3 s = texture(uSrc, vUv).rgb * 4.0;
  s += texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
  s += texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  s += texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb;
  s += texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  oColor = vec4(s / 8.0, 1.0);
}`;

/** Dual-Kawase upsample, blended additively into the next level up. */
const BLOOM_UP_FS = `${POST_HEAD}
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uScatter;
void main() {
  vec2 h = uTexel;
  vec3 s = texture(uSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb;
  s += texture(uSrc, vUv + vec2(-h.x, h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(0.0, h.y * 2.0)).rgb;
  s += texture(uSrc, vUv + vec2(h.x, h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  s += texture(uSrc, vUv + vec2(h.x, -h.y)).rgb * 2.0;
  s += texture(uSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  s += texture(uSrc, vUv + vec2(-h.x, -h.y)).rgb * 2.0;
  oColor = vec4(s / 12.0 * uScatter, 1.0);
}`;

/** Volumetric light shafts: a radial march from each light toward the pixel over the bright buffer. */
const RAYS_FS = `${POST_HEAD}
uniform sampler2D uSrc;
uniform vec2 uLights[3];
uniform float uLightPower[3];
uniform float uJitter;
vec3 shaft(vec2 light, float power) {
  const int STEPS = 48;
  vec2 delta = (vUv - light) * (0.92 / float(STEPS));
  vec2 uv = vUv - delta * hash(gl_FragCoord.xy + uJitter);
  float decay = 1.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < STEPS; i++) {
    uv -= delta;
    acc += max(texture(uSrc, clamp(uv, 0.0, 1.0)).rgb - 0.35, 0.0) * decay;
    decay *= 0.955;
  }
  float falloff = smoothstep(0.7, 0.0, length((vUv - light) * vec2(1.6, 1.0)));
  return acc / float(STEPS) * power * falloff;
}
void main() {
  vec3 c = vec3(0.0);
  for (int i = 0; i < 3; i++) c += shaft(uLights[i], uLightPower[i]);
  oColor = vec4(c, 1.0);
}`;

/** HDR combine: scene x AO, plus bloom and shafts, still linear. */
const COMBINE_FS = `${POST_HEAD}
uniform sampler2D uColor;
uniform sampler2D uAo;
uniform sampler2D uBloom;
uniform sampler2D uRays;
uniform float uBloomAmt;
uniform float uRaysAmt;
uniform float uAoMin;
uniform float uDebug;
void main() {
  vec3 c = texture(uColor, vUv).rgb;
  float ao = texture(uAo, vUv).r;
  if (uDebug > 0.5 && uDebug < 1.5) { oColor = vec4(vec3(ao), 1.0); return; }
  if (uDebug > 1.5 && uDebug < 2.5) { oColor = vec4(texture(uBloom, vUv).rgb, 1.0); return; }
  if (uDebug > 2.5 && uDebug < 3.5) { oColor = vec4(texture(uRays, vUv).rgb, 1.0); return; }
  c *= mix(uAoMin, 1.0, ao);
  c += texture(uBloom, vUv).rgb * uBloomAmt;
  c += texture(uRays, vUv).rgb * vec3(1.0, 0.86, 0.62) * uRaysAmt;
  oColor = vec4(c, 1.0);
}`;

/**
 * Final: tilt-shift + depth of field (36-tap golden-angle bokeh, per-tap CoC weighting), chromatic aberration that
 * grows to the frame edge, filmic (ACES) tonemap, a baked 3D LUT grade, halation, vignette, film grain, dither.
 */
const FINAL_FS = `${POST_HEAD}
uniform sampler2D uColor;
uniform sampler2D uG;
uniform sampler3D uLut;
uniform float uFocus;
uniform float uFocusY;
uniform float uTime;
uniform float uAspect;
uniform float uBlur;
uniform float uCa;
uniform float uGrain;
uniform float uExposure;
float cocAt(vec2 uv) {
  float z = texture(uG, uv).r * 20.0;
  float depthCoc = clamp(abs(z - uFocus) * 0.3, 0.0, 1.0);
  float tilt = smoothstep(0.22, 0.7, abs(uv.y - uFocusY));
  return max(depthCoc, tilt * 0.75);
}
// The beauty pass is authored display-referred, so the tonemap is only a soft shoulder for what bloom
// and the lamps push past white: linear-ish below 0.6, rolling off smoothly to 1.
vec3 shoulder(vec3 x) {
  vec3 over = max(x - 0.6, 0.0);
  return min(x, 0.6) + 0.4 * (1.0 - exp(-over / 0.4));
}
void main() {
  float coc0 = cocAt(vUv);
  vec2 centre = vUv - 0.5;
  vec2 caDir = centre * dot(centre, centre) * uCa;
  vec3 acc = vec3(0.0);
  float w = 0.0;
  const int TAPS = 36;
  for (int i = 0; i < TAPS; i++) {
    float t = sqrt((float(i) + 0.5) / float(TAPS));
    float a = float(i) * 2.39996323;
    vec2 o = vec2(cos(a) / uAspect, sin(a)) * t * uBlur * coc0;
    vec2 uv = vUv + o;
    float k = (i == 0) ? 1.0 : smoothstep(t - 0.2, t, cocAt(uv) + 0.08);
    vec3 s;
    s.r = texture(uColor, uv + caDir).r;
    s.g = texture(uColor, uv).g;
    s.b = texture(uColor, uv - caDir).b;
    acc += s * k;
    w += k;
  }
  vec3 hdr = acc / max(w, 1e-4) * uExposure;
  // halation: warm glow bleeding off the brightest edges, like film
  float lum = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  hdr += vec3(0.9, 0.35, 0.12) * smoothstep(1.1, 3.0, lum) * 0.12;
  vec3 col = shoulder(hdr);
  col = texture(uLut, clamp(col, 0.0, 1.0) * (31.0 / 32.0) + 0.5 / 32.0).rgb;
  float vig = smoothstep(1.2, 0.25, length(centre * vec2(1.15, 1.0)));
  col *= mix(0.55, 1.0, vig);
  float g = hash(gl_FragCoord.xy + fract(uTime * 7.31) * 113.0) - 0.5;
  float grainAmt = uGrain * mix(1.4, 0.6, dot(col, vec3(0.333)));
  col += g * grainAmt;
  col += (hash(gl_FragCoord.yx + 3.7) - 0.5) / 255.0;
  oColor = vec4(col, 1.0);
}`;

/**
 * The grade, baked into a 32^3 LUT once at start-up: a gentle S-curve, warm highlights and cool teal shadows
 * (split toning), a lifted black, and a touch more saturation in the midtones. Swap this function to re-grade.
 */
function buildLut(size = 32) {
  const data = new Uint8Array(size * size * size * 4);
  const s = (x: number) => x * x * (3 - 2 * x);
  let i = 0;
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        let c = [r / (size - 1), g / (size - 1), b / (size - 1)];
        c = c.map((v) => v * 0.82 + s(v) * 0.18);
        const l = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
        const sh = Math.max(0, 1 - l * 2.2);
        const hi = Math.max(0, l * 1.8 - 0.8);
        c = [c[0] - sh * 0.035 + hi * 0.05, c[1] + sh * 0.01 + hi * 0.02, c[2] + sh * 0.055 - hi * 0.04];
        const mid = 1 + 0.18 * (1 - Math.abs(l - 0.5) * 2);
        c = c.map((v) => l + (v - l) * mid);
        c = c.map((v) => 0.03 + v * 0.96);
        for (const v of c) data[i++] = Math.round(Math.max(0, Math.min(1, v)) * 255);
        data[i++] = 255;
      }
    }
  }
  return data;
}

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

  tri(a: number, b: number, c: number) {
    this.ix.push(a, b, c);
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

function sphereMesh(stacks = 24, slices = 32): CpuMesh {
  const b = new Builder();
  const at = (phi: number, th: number) => {
    const sp = Math.sin(phi);
    return [sp * Math.cos(th), sp * Math.sin(th), Math.cos(phi)];
  };
  const grid: number[][] = [];
  for (let i = 0; i <= stacks; i++) {
    const row: number[] = [];
    const phi = (i / stacks) * Math.PI;
    for (let j = 0; j <= slices; j++) {
      const th = (j / slices) * Math.PI * 2;
      const p = at(phi, th);
      row.push(b.vert(p, p, [j / slices, 1 - i / stacks], 1, 0));
    }
    grid.push(row);
  }
  for (let i = 0; i < stacks; i++) {
    for (let j = 0; j < slices; j++) {
      // wound counter-clockwise seen from outside, so back-face culling keeps the outside (it used to keep the inside,
      // which made balls look hollow from above)
      b.tri(grid[i][j], grid[i + 1][j + 1], grid[i][j + 1]);
      b.tri(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1]);
    }
  }
  return b.finish();
}

function discMesh(seg = 40): CpuMesh {
  const b = new Builder();
  const center = b.vert([0, 0, 0], [0, 0, 1], [0.5, 0.5], 1, 0);
  const ring: number[] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    const x = Math.cos(a) * 0.5;
    const y = Math.sin(a) * 0.5;
    ring.push(b.vert([x, y, 0], [0, 0, 1], [x + 0.5, y + 0.5], 1, 0));
  }
  for (let i = 0; i < seg; i++) b.tri(center, ring[i], ring[(i + 1) % seg]);
  return b.finish();
}

function cylinderMesh(seg = 40): CpuMesh {
  const b = new Builder();
  const ring: [number, number][] = [];
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    const x = Math.sin(t) * 0.5;
    const z = Math.cos(t) * 0.5;
    ring.push([b.vert([x, -0.5, z], [x, 0, z], [i / seg, 0], 0.9, 0), b.vert([x, 0.5, z], [x, 0, z], [i / seg, 1], 1, 0)]);
  }
  for (let i = 0; i < seg; i++) {
    b.tri(ring[i][0], ring[i + 1][0], ring[i + 1][1]);
    b.tri(ring[i][0], ring[i + 1][1], ring[i][1]);
  }
  return b.finish();
}

/** Closed Catmull-Rom spline through the control points, `steps` samples per span. */
function smoothLoop(pts: [number, number][], steps = 6): [number, number][] {
  const out: [number, number][] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

/** Ear-clipping triangulation of a simple counter-clockwise polygon; returns index triples. */
function earClip(poly: [number, number][]): number[] {
  const idx = poly.map((_, i) => i);
  const tris: number[] = [];
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const inside = (p: [number, number], a: [number, number], b: [number, number], c: [number, number]) =>
    cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i - 1 + idx.length) % idx.length], ib = idx[i], ic = idx[(i + 1) % idx.length];
      const a = poly[ia], b = poly[ib], c = poly[ic];
      if (cross(a, b, c) <= 1e-12) continue;
      let ok = true;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        if (inside(poly[j], a, b, c)) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      tris.push(ia, ib, ic);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
  return tris;
}

/**
 * A flat outline (counter-clockwise, in the xy plane) extruded to `depth` along z with a rounded edge of
 * radius `r`: a soap-bar slab, the way moulded plastic is. UVs map the outline's bounding box onto the caps.
 */
function slabMesh(outline: [number, number][], depth: number, r: number, rings = 5): CpuMesh {
  const b = new Builder();
  const n = outline.length;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of outline) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  // outward 2D normal at each outline point
  const nrm = outline.map((p, i) => {
    const a = outline[(i - 1 + n) % n], c = outline[(i + 1) % n];
    const tx = c[0] - a[0], ty = c[1] - a[1];
    const l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l] as [number, number];
  });
  const ring = (ang: number, front: number) => {
    // ang 0 = the side wall's middle, PI/2 = fully on the cap
    const inset = r * (1 - Math.cos(ang));
    const z = front * (depth / 2 - r + r * Math.sin(ang));
    return outline.map((p, i) => {
      const nn = nrm[i];
      const pos = [p[0] - nn[0] * inset, p[1] - nn[1] * inset, z];
      const nv = [nn[0] * Math.cos(ang), nn[1] * Math.cos(ang), front * Math.sin(ang)];
      return b.vert(pos, nv, [(pos[0] - x0) / (x1 - x0), (pos[1] - y0) / (y1 - y0)], 1, 0);
    });
  };
  const rows: number[][] = [];
  for (let k = rings; k >= 1; k--) rows.push(ring((k / rings) * (Math.PI / 2), -1));
  for (let k = 0; k <= rings; k++) rows.push(ring((k / rings) * (Math.PI / 2), 1));
  for (let k = 0; k < rows.length - 1; k++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      b.tri(rows[k][i], rows[k][j], rows[k + 1][j]);
      b.tri(rows[k][i], rows[k + 1][j], rows[k + 1][i]);
    }
  }
  const capPoly = outline.map((p, i) => [p[0] - nrm[i][0] * r, p[1] - nrm[i][1] * r] as [number, number]);
  const tris = earClip(capPoly);
  const front = rows[rows.length - 1];
  const back = rows[0];
  for (let t = 0; t < tris.length; t += 3) {
    b.tri(front[tris[t]], front[tris[t + 1]], front[tris[t + 2]]);
    b.tri(back[tris[t]], back[tris[t + 2]], back[tris[t + 1]]);
  }
  return b.finish();
}

/** The DualShock 4 seen from above, 1 unit wide, counter-clockwise: the touchpad bridge, the shoulders, the two grips. */
function dualShockOutline(): [number, number][] {
  const right: [number, number][] = [
    [0.16, 0.3], [0.3, 0.315], [0.39, 0.3], [0.45, 0.265], [0.49, 0.2], [0.505, 0.11], [0.507, 0.01], [0.5, -0.09],
    [0.485, -0.18], [0.46, -0.26], [0.425, -0.33], [0.38, -0.375], [0.33, -0.385], [0.285, -0.36], [0.25, -0.3],
    [0.215, -0.22], [0.175, -0.155], [0.12, -0.12], [0.05, -0.105],
  ];
  // right half runs top-centre -> bottom-centre (clockwise); build the full loop counter-clockwise
  const left = right.map(([x, y]) => [-x, y] as [number, number]);
  const cw: [number, number][] = [[0, 0.3], ...right, [0, -0.1], ...left.reverse()];
  return smoothLoop(cw.reverse(), 5);
}

/**
 * A slice of a cylinder: a curved panel of radius R spanning `arc` radians, `h` tall, its middle at the origin and
 * its edges wrapping toward +z (the viewer), like a curved monitor. The front surface sits `off` along the inward
 * normal; with `depth` > 0 it is closed into a slab (back, top, bottom and ends). UVs run 0..1 across and up the front.
 */
function curvedPanel(R: number, arc: number, h: number, off = 0, depth = 0, segs = 40): CpuMesh {
  const b = new Builder();
  const P = (t: number, y: number, o: number) => [R * Math.sin(t) - Math.sin(t) * o, y, R * (1 - Math.cos(t)) + Math.cos(t) * o];
  const tA = -arc / 2;
  for (let i = 0; i < segs; i++) {
    const t0 = tA + (i * arc) / segs;
    const t1 = tA + ((i + 1) * arc) / segs;
    const tm = (t0 + t1) / 2;
    const n = [-Math.sin(tm), 0, Math.cos(tm)];
    const u0 = i / segs;
    const u1 = (i + 1) / segs;
    b.face([P(t0, -h / 2, off), P(t1, -h / 2, off), P(t1, h / 2, off), P(t0, h / 2, off)], n, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]]);
    if (depth > 0) {
      const back = off - depth;
      b.face([P(t0, -h / 2, back), P(t1, -h / 2, back), P(t1, h / 2, back), P(t0, h / 2, back)], [-n[0], 0, -n[2]], UV, 0.8);
      b.face([P(t0, h / 2, off), P(t1, h / 2, off), P(t1, h / 2, back), P(t0, h / 2, back)], [0, 1, 0], UV, 1, 1);
      b.face([P(t0, -h / 2, off), P(t1, -h / 2, off), P(t1, -h / 2, back), P(t0, -h / 2, back)], [0, -1, 0], UV, 0.8, 1);
    }
  }
  if (depth > 0) {
    for (const [t, s] of [[tA, -1], [-tA, 1]]) {
      const back = off - depth;
      b.face([P(t, -h / 2, off), P(t, -h / 2, back), P(t, h / 2, back), P(t, h / 2, off)], [s * Math.cos(t), 0, s * Math.sin(t)], UV, 1, 1);
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
  return { vao, count: mesh.indices.length, type: mesh.indices instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
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
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  };
  img.src = url;
  return tex;
}

const fract = (x: number) => x - Math.floor(x);

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
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  let failed = false;
  const fail = (message: string) => {
    if (failed) return;
    failed = true;
    hooks.onFail(message);
  };

  // Half-float targets keep the lamps above 1.0 so bloom and shafts read as light, not paint.
  const hdr = !!gl.getExtension('EXT_color_buffer_float');
  const HDR_FMT = hdr ? gl.RGBA16F : gl.RGBA8;
  const HDR_TYPE = hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  let beauty: WebGLProgram;
  let shadow: WebGLProgram;
  let ssao: WebGLProgram;
  let aoBlur: WebGLProgram;
  let bloomPre: WebGLProgram;
  let bloomDown: WebGLProgram;
  let bloomUp: WebGLProgram;
  let rays: WebGLProgram;
  let combine: WebGLProgram;
  let finalP: WebGLProgram;
  try {
    beauty = program(gl, BEAUTY_VS, BEAUTY_FS);
    shadow = program(gl, SHADOW_VS, SHADOW_FS);
    ssao = program(gl, DOF_VS, SSAO_FS);
    aoBlur = program(gl, DOF_VS, AO_BLUR_FS);
    bloomPre = program(gl, DOF_VS, BLOOM_PRE_FS);
    bloomDown = program(gl, DOF_VS, BLOOM_DOWN_FS);
    bloomUp = program(gl, DOF_VS, BLOOM_UP_FS);
    rays = program(gl, DOF_VS, RAYS_FS);
    combine = program(gl, DOF_VS, COMBINE_FS);
    finalP = program(gl, DOF_VS, FINAL_FS);
  } catch (err) {
    fail(err instanceof Error ? err.message : 'shader failed');
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  const box = upload(gl, boxMesh());
  const ball = upload(gl, sphereMesh());
  const coin = upload(gl, discMesh());
  const rug = upload(gl, floorMesh());
  const tube = upload(gl, cylinderMesh());
  const arch = upload(gl, frameMesh(1.22, 1.48, 0.16, 0.09, 0.07));
  const quad = gl.createVertexArray();
  const quadBuf = gl.createBuffer();
  if (!quad || !quadBuf) {
    fail('Could not allocate the frame');
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
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
  const mapTex = gl.createTexture();
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  worldMapWhenFontsReady((map) => {
    if (failed || gl.isContextLost()) return;
    gl.bindTexture(gl.TEXTURE_2D, mapTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  });

  const left: Wing = { x: -1.12, y: 0.08, z: 0.02, ry: 0.42, sx: 1.05, sy: 1.18, sz: 0.06 };
  // The room is bigger on the left: that wall runs on toward the front so Max's desk can stand against it.
  // `left` stays the original stretch (the decor placed in its local coordinates); `leftBig` is the full wall.
  const BIG = 2.2;
  const leftDir = [Math.cos(left.ry), -Math.sin(left.ry)];
  const leftInner = { x: left.x + (leftDir[0] * left.sx) / 2, z: left.z + (leftDir[1] * left.sx) / 2 };
  const leftBig: Wing = { ...left, sx: BIG, x: leftInner.x - (leftDir[0] * BIG) / 2, z: leftInner.z - (leftDir[1] * BIG) / 2 };
  /** A point on the left wall, s world units out from the door-post end, d off its face. */
  const leftAt = (s: number, y: number, d = 0.015) => {
    const u = BIG / 2 - s;
    return {
      x: leftBig.x + Math.cos(leftBig.ry) * u + Math.sin(leftBig.ry) * (leftBig.sz / 2 + d),
      y,
      z: leftBig.z - Math.sin(leftBig.ry) * u + Math.cos(leftBig.ry) * (leftBig.sz / 2 + d),
      ry: leftBig.ry,
    };
  };
  const right: Wing = { x: 1.12, y: 0.08, z: 0.02, ry: -0.42, sx: 1.05, sy: 1.18, sz: 0.06 };

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
    metal: 0,
    nrm: null,
    nrmScale: 1,
    mr: null,
    alphaCut: 0,
    twoSided: false,
    screen: false,
    follow: null,
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
    spin: 0,
    anchor: null,
    anchorDy: -0.22,
    uvScale: 1,
    uvOff: [0, 0],
    uvXY: [1, 1],
    ...extra,
  });

  // ---------- real objects from Max's room ----------
  type Spot = { x: number; y: number; z: number; ry: number };
  const along = (p: Spot, d: number) => ({ x: p.x + Math.sin(p.ry) * d, y: p.y, z: p.z + Math.cos(p.ry) * d });
  /** A wooden picture frame with a cream mat and the photo under glass (low roughness = a glass highlight). */
  const framed = (
    at: Spot,
    w: number,
    h: number,
    tex: WebGLTexture,
    extra: Partial<Draw> = {},
    wood: [number, number, number] = [0.42, 0.27, 0.15],
    pad = 0.13,
  ): Draw[] => {
    const back = along(at, 0.016);
    const mat = along(at, 0.033);
    const pic = along(at, 0.037);
    const tilt = { ry: at.ry, rx: extra.rx ?? 0, rz: extra.rz ?? 0 };
    return [
      D(box, 3, wood, back.x, back.y, back.z, w + pad, h + pad, 0.032, { ...tilt, rough: 0.55 }),
      D(box, 4, [0.95, 0.91, 0.82], mat.x, mat.y, mat.z, w + pad * 0.46, h + pad * 0.46, 0.004, { ...tilt, rough: 0.95 }),
      D(box, 2, [1, 1, 1], pic.x, pic.y, pic.z, w, h, 0.003, { ...tilt, tex, rough: 0.12, ...extra }),
    ];
  };
  const portraitAt = onWing(left, -0.18, 0.18);
  const trackAt = leftAt(2.0, 0.3);
  const medalAt = leftAt(1.05, 0.12);
  const stageAt = onWing(right, -0.14, 0.3);
  const ribbon = along(medalAt, 0.02);
  const ribbonTop = { ...along(medalAt, 0.018), y: medalAt.y + 0.1 };
  const medal = along(medalAt, 0.03);
  const artifacts: Draw[] = [
    // Life: the portrait (1400x1276) and the track photo (1284x1610), each framed
    ...framed(portraitAt, 0.36, 0.33, portrait, { anchor: 'life', anchorDy: -0.3 }),
    ...framed(trackAt, 0.2, 0.25, track, {}, [0.16, 0.13, 0.11]),
    // a D1 track medal on a red and gold ribbon, hung from a pin
    D(box, 2, [0.72, 0.13, 0.1], ribbon.x - Math.cos(medalAt.ry) * 0.022, ribbon.y + 0.06, ribbon.z + Math.sin(medalAt.ry) * 0.022, 0.034, 0.15, 0.004, { ry: medalAt.ry, rz: 0.24, rough: 0.9 }),
    D(box, 2, [0.86, 0.64, 0.18], ribbon.x + Math.cos(medalAt.ry) * 0.022, ribbon.y + 0.06, ribbon.z - Math.sin(medalAt.ry) * 0.022, 0.034, 0.15, 0.004, { ry: medalAt.ry, rz: -0.24, rough: 0.9 }),
    D(ball, 2, [0.75, 0.72, 0.68], ribbonTop.x, ribbonTop.y + 0.035, ribbonTop.z, 0.012, 0.012, 0.012, { rough: 0.2 }),
    D(coin, 4, [0.93, 0.7, 0.24], medal.x, medal.y - 0.03, medal.z, 0.11, 0.11, 1, { ry: medalAt.ry, rough: 0.18 }),
    D(coin, 4, [0.78, 0.55, 0.16], along(medalAt, 0.032).x, medal.y - 0.03, along(medalAt, 0.032).z, 0.07, 0.07, 1, { ry: medalAt.ry, rough: 0.3 }),
    // Speaking: the stage photo (1600x1066), framed
    ...framed(stageAt, 0.22, 0.33, standeeTex, { anchor: 'speaking', anchorDy: -0.12 }), // YC Startup School (1067x1600, portrait)
  ];

  // ---------- painted textures (canvas -> texture, repainted when fonts and logos arrive) ----------
  const painted: { tex: WebGLTexture; paint: () => HTMLCanvasElement }[] = [];
  const uploadCanvas = (tex: WebGLTexture, c: HTMLCanvasElement) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
  };
  const paintTex = (paint: () => HTMLCanvasElement) => {
    const tex = gl.createTexture() as WebGLTexture;
    painted.push({ tex, paint });
    uploadCanvas(tex, paint());
    return tex;
  };
  const repaint = () => {
    if (failed || gl.isContextLost()) return;
    for (const p of painted) uploadCanvas(p.tex, p.paint());
  };
  const image = (src: string) => {
    const img = new Image();
    img.onload = repaint;
    img.src = src;
    return img;
  };
  const icon = image('/assets/brand/pathion-icon-white.png');
  const logo = image('/assets/brand/pathion-logo.png');
  document.fonts?.ready.then(repaint).catch(() => {});
  const lilo = loadTexture(gl, '/assets/photos/lilo-editor.jpg');

  // A point on a wing's wall: u along the wall and d off its face in world units, y in world space.
  const wallAt = (w: Wing, u: number, y: number, d = 0) => ({
    x: w.x + Math.cos(w.ry) * u + Math.sin(w.ry) * (w.sz / 2 + d),
    y,
    z: w.z - Math.sin(w.ry) * u + Math.cos(w.ry) * (w.sz / 2 + d),
    ry: w.ry,
  });
  const at = (p: { x: number; y: number; z: number; ry: number }) => [p.x, p.y, p.z] as const;
  // Hovering a book or a game shows its title in a small card that follows the pointer.
  const tip = document.createElement('div');
  tip.className = 'pod-booktip';
  tip.setAttribute('aria-hidden', 'true');
  canvas.parentElement?.appendChild(tip);
  let tipKey = '';
  // Clicking a book that is showing its hover card opens it (on Audible, or a book search for manga).
  let tipHref = '';
  // Once the camera has gone in to an area, dragging looks around it: the view follows the hand, like sliding a
  // photo. pan is in world units (x, y, z), eased into the camera's focus point, and cleared when the area changes.
  const pan = [0, 0, 0];
  let dragFrom: { x: number; y: number; id: number } | null = null;
  let dragged = false;
  const scene = canvas.parentElement;
  const dragStart = (e: PointerEvent) => {
    if (!focusId || e.button !== 0 || !(e.target instanceof Element) || e.target.closest('a, button, .pod-dialog')) return;
    dragFrom = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged = false;
  };
  const dragMove = (e: PointerEvent) => {
    if (!dragFrom || e.pointerId !== dragFrom.id) return;
    const dx = e.clientX - dragFrom.x;
    const dy = e.clientY - dragFrom.y;
    if (!dragged && Math.abs(dx) + Math.abs(dy) < 5) return;
    dragged = true;
    scene?.classList.add('pod-scene--dragging');
    dragFrom.x = e.clientX;
    dragFrom.y = e.clientY;
    const k = 1.25 / Math.max(1, canvas.clientHeight); // room units per pixel at the zoomed-in distance
    if (focusId === 'desk') {
      // looking down at the desk: left-right slides along the wall, up-down slides across the desk's depth
      pan[0] += (-dx * Math.cos(left.ry) + dy * Math.sin(left.ry)) * k * 0.8;
      pan[2] += (dx * Math.sin(left.ry) + dy * Math.cos(left.ry)) * k * 0.8;
    } else {
      pan[0] -= dx * k;
      pan[1] += dy * k;
    }
    pan[0] = Math.max(-0.7, Math.min(0.7, pan[0]));
    pan[1] = Math.max(-0.45, Math.min(0.45, pan[1]));
    pan[2] = Math.max(-0.4, Math.min(0.4, pan[2]));
  };
  const dragEnd = () => {
    dragFrom = null;
    scene?.classList.remove('pod-scene--dragging');
  };
  document.addEventListener('pointerdown', dragStart);
  document.addEventListener('pointermove', dragMove);
  document.addEventListener('pointerup', dragEnd);
  document.addEventListener('pointercancel', dragEnd);
  const openBook = (e: MouseEvent) => {
    if (dragged) {
      dragged = false; // the click that ends a drag opens nothing
      return;
    }
    if (!tipHref || !(e.target instanceof Element) || e.target.closest('a, button, .pod-overlay')) return;
    window.open(tipHref, '_blank', 'noopener,noreferrer');
  };
  document.addEventListener('click', openBook);
  const room: Draw[] = [];
  const add = (...d: Draw[]) => room.push(...d);
  const hash = (i: number, k: number) => {
    const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };

  // ---------- Max's bookcase: a tall black six-shelf case, filled the way his real one is (books.ts) ----------
  const WOOD: [number, number, number] = [0.36, 0.22, 0.12];
  const WOOD_DARK: [number, number, number] = [0.22, 0.13, 0.07];
  const BLACK: [number, number, number] = [0.07, 0.07, 0.08];
  const hex = (c: string) => [1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16) / 255) as [number, number, number];
  const caseU = 0.18;
  const caseW = 0.5;
  const caseD = 0.13;
  const floorY = -0.78;
  const caseTop = 0.12;
  const caseH = caseTop - floorY;
  const plank = 0.016;
  const kick = 0.04;
  const ROWS = 6;
  const rowH = (caseH - kick - plank * (ROWS + 1)) / ROWS;
  const box3 = (u: number, y: number, d: number, sx: number, sy: number, sz: number, tint: [number, number, number], extra: Partial<Draw> = {}) =>
    D(box, 3, tint, ...at(wallAt(right, u, y, d)), sx, sy, sz, { ry: right.ry, rough: 0.6, ...extra });
  add(
    box3(caseU, floorY + caseH / 2, 0.004, caseW, caseH, 0.008, [0.05, 0.05, 0.06], { rough: 0.7 }), // back panel
    box3(caseU - caseW / 2 + plank / 2, floorY + caseH / 2, caseD / 2, plank, caseH, caseD, BLACK, { rough: 0.45 }),
    box3(caseU + caseW / 2 - plank / 2, floorY + caseH / 2, caseD / 2, plank, caseH, caseD, BLACK, { rough: 0.45 }),
    box3(caseU, caseTop - plank / 2, caseD / 2, caseW, plank, caseD, BLACK, { rough: 0.45, anchor: 'library', anchorDy: -0.42 }),
    box3(caseU, floorY + kick / 2, caseD / 2 + 0.004, caseW - 2 * plank, kick, caseD - 0.006, BLACK, { rough: 0.5 }),
  );
  // shelf k (1 = top) sits on the board below it
  const rowFloor = (k: number) => floorY + kick + plank + (ROWS - k) * (rowH + plank);
  for (let k = 1; k < ROWS; k++) add(box3(caseU, rowFloor(k) - plank / 2, caseD / 2, caseW - 2 * plank, plank, caseD - 0.004, BLACK, { rough: 0.45 }));
  add(box3(caseU, rowFloor(ROWS) - plank / 2, caseD / 2, caseW - 2 * plank, plank, caseD - 0.004, BLACK, { rough: 0.45 }));
  const front = caseD - 0.006;
  const innerL = caseU - caseW / 2 + plank + 0.004;
  const innerR = caseU + caseW / 2 - plank - 0.004;
  /** `link`: where a click on it goes (a book on Audible or a book search), with the words for the hover card. */
  type BookHit = { title: string; author?: string; link?: { href: string; label: string } | null; x: number; y: number; z: number };
  const bookHits: BookHit[] = [];
  const badgeHits: { id: `badge:${string}`; x: number; y: number; z: number }[] = [];
  const DIMS = {
    manga: { t: 0.0088, h: 0.094, d: 0.068, px: 5200 },
    paperback: { t: 0.013, h: 0.098, d: 0.074, px: 4400 },
    trade: { t: 0.019, h: 0.104, d: 0.08, px: 3600 },
    hardcover: { t: 0.025, h: 0.11, d: 0.088, px: 3200 },
  } as const;
  /** One book standing spine-out at u on shelf k. Returns its thickness. */
  const standBook = (b: (typeof BOOKS)[number], i: number, k: number, u: number, extraT = 0) => {
    const dm = DIMS[b.size ?? 'trade'];
    // the print copies of his audiobooks are paperbacks of slightly different thicknesses
    const t = dm.t + extraT + (b.audio ? (b.title.length % 4) * 0.0012 : 0);
    const h = Math.min(rowH - 0.008, dm.h);
    const y0 = rowFloor(k);
    const cu = u + t / 2;
    const cy = y0 + h / 2;
    const cloth = clothFor(b, i);
    add(D(box, 2, hex(cloth), ...at(wallAt(right, cu, cy, front - dm.d / 2)), t, h, dm.d, { ry: right.ry, rough: 0.7 }));
    add(D(box, 4, [0.93, 0.9, 0.82], ...at(wallAt(right, cu, cy + h / 2 - 0.0015, front - dm.d / 2 - 0.003)), t - 0.003, 0.004, dm.d - 0.008, { ry: right.ry, rough: 0.95 }));
    const tex = paintTex(() => P.spine({ title: b.title, author: b.author, color: cloth, ink: b.ink, vol: b.vol, own: isOwn(b) }, icon, Math.max(16, Math.round(t * dm.px)), Math.round(h * dm.px)));
    add(D(box, 2, [1, 1, 1], ...at(wallAt(right, cu, cy, front + 0.001)), t - 0.0008, h - 0.0008, 0.0016, { ry: right.ry, tex, rough: 0.55 }));
    bookHits.push({ title: b.vol !== undefined ? `${b.title}, vol. ${b.vol}` : b.title, author: b.author, link: bookLink(b), ...wallAt(right, cu, cy, front) });
    return t;
  };
  /** A pile of books lying flat at u on shelf k, biggest at the bottom. */
  const flatStack = (list: { b: (typeof BOOKS)[number]; i: number }[], k: number, u: number) => {
    let y = rowFloor(k);
    list.forEach(({ b, i }, n) => {
      const dm = DIMS[b.size ?? 'trade'];
      const t = dm.t * 0.9;
      const w = dm.h * 1.0;
      add(D(box, 2, hex(clothFor(b, i)), ...at(wallAt(right, u + w / 2, y + t / 2, front - dm.d / 2)), w, t, dm.d, { ry: right.ry + (n % 2 ? 0.05 : -0.04), rough: 0.7 }));
      bookHits.push({ title: b.title, author: b.author, link: bookLink(b), ...wallAt(right, u + w / 2, y + t / 2, front) });
      y += t;
    });
    return y;
  };
  const onShelf = (k: number) => BOOKS.map((b, i) => ({ b, i })).filter(({ b }) => b.shelf === k && !b.reading);
  // shelves 1-3 and 5: everything standing, left to right; a geode sits between the manga on shelf 2
  for (const k of [1, 2, 3, 5]) {
    let u = innerL + 0.006;
    let prevSeries: string | undefined;
    for (const { b, i } of onShelf(k)) {
      if (k === 2 && prevSeries === 'Attack on Titan' && b.series !== 'Attack on Titan') {
        add(D(ball, 2, [0.58, 0.14, 0.28], ...at(wallAt(right, u + 0.02, rowFloor(k) + 0.022, front - 0.04)), 0.02, 0.024, 0.018, { rough: 0.35 }));
        add(D(ball, 2, [0.85, 0.85, 0.9], ...at(wallAt(right, u + 0.02, rowFloor(k) + 0.024, front - 0.028)), 0.012, 0.015, 0.006, { rough: 0.1 }));
        u += 0.045;
      }
      if (u > innerR - 0.01) break;
      u += standBook(b, i, k, u) + 0.0007;
      prevSeries = b.series;
    }
    // shelf 3 ends with the AfroTech stage photo in a little stand-up frame
    if (k === 3) {
      const yc = wallAt(right, innerR - 0.045, rowFloor(3) + 0.04, front - 0.05);
      add(...framed(yc, 0.04, 0.06, stage, { rx: -0.08 }, [0.12, 0.1, 0.09], 0.025)); // the AfroTech stage shot (1066x1600, portrait)
    }
  }
  // shelf 4: a smart speaker, Investing 101 lying flat (with Max's current book on it), then the business books
  {
    const k = 4;
    const sp = wallAt(right, innerL + 0.05, rowFloor(k) + 0.04, front - 0.05);
    add(
      D(ball, 1, [0.46, 0.6, 0.72], sp.x, sp.y + 0.008, sp.z, 0.042, 0.034, 0.042, { wrap: 0.6, rough: 1 }),
      D(ball, 2, [0.16, 0.24, 0.34], sp.x, sp.y - 0.012, sp.z, 0.043, 0.028, 0.043, { rough: 0.5 }),
    );
    const list = onShelf(k);
    const flat = list.filter(({ b }) => b.flat);
    const top = flatStack(flat, k, innerL + 0.11);
    const reading = nowReading();
    if (reading) {
      const dm = DIMS[reading.size ?? 'trade'];
      const cover = paintTex(() => P.readingCover({ title: reading.title, author: reading.author, color: clothFor(reading, 99), ink: reading.ink, own: isOwn(reading) }, icon));
      const rb = wallAt(right, innerL + 0.11 + dm.h / 2, top + dm.t / 2, front - dm.d / 2);
      add(D(box, 2, [1, 1, 1], rb.x, rb.y, rb.z, dm.h * 0.75, dm.t, dm.h, { ry: right.ry + 0.1, tex: cover, rough: 0.7 }));
      const card = wallAt(right, innerL + 0.24, rowFloor(k) + 0.035, front - 0.02);
      const cardTex = paintTex(() => P.readingCard(reading.title));
      add(D(box, 2, [1, 1, 1], card.x, card.y, card.z, 0.075, 0.05, 0.003, { ry: right.ry - 0.2, rx: -0.15, tex: cardTex, rough: 0.8 }));
      bookHits.push({ title: `Now reading: ${reading.title}`, author: reading.author, link: bookLink(reading), ...rb });
    }
    let u = innerR - 0.006;
    for (const { b, i } of list.filter(({ b }) => !b.flat).reverse()) {
      const dm = DIMS[b.size ?? 'trade'];
      u -= dm.t + 0.0007;
      standBook(b, i, k, u);
    }
  }
  // shelf 6 (bottom): engineering and keepsakes: the coding book standing, the yearbook and the Abloh book lying flat,
  // then the notebooks and legal pads
  {
    let u6 = innerL + 0.006;
    for (const { b, i } of onShelf(6).filter(({ b }) => !b.flat)) u6 += standBook(b, i, 6, u6) + 0.0007;
    flatStack(onShelf(6).filter(({ b }) => b.flat), 6, u6 + 0.01);
    let y = rowFloor(6);
    const pads: [number, number, number][] = [[0.95, 0.86, 0.45], [0.14, 0.14, 0.15], [0.55, 0.35, 0.2], [0.96, 0.9, 0.55], [0.2, 0.36, 0.28]];
    pads.forEach((c, n) => {
      add(D(box, 2, c, ...at(wallAt(right, innerR - 0.08, y + 0.007, front - 0.05)), 0.13, 0.013, 0.09, { ry: right.ry + (n % 2 ? 0.06 : -0.05), rough: 0.8 }));
      y += 0.014;
    });
  }

  // a small cream tag on each shelf's front edge naming its topic
  for (let k = 1; k <= ROWS; k++) {
    const label = SHELF_TOPICS[k];
    if (!label) continue;
    const tagW = 0.14;
    const tagTex = paintTex(() => P.shelfTag(label));
    const tg = wallAt(right, caseU, rowFloor(k) - plank / 2, caseD - 0.0005);
    add(D(box, 2, [1, 1, 1], tg.x, tg.y, tg.z, tagW, tagW / (560 / 64), 0.002, { ry: right.ry, tex: tagTex, rough: 0.8 }));
  }

  // ---------- on top of the bookcase: the katana on a stand, and the favourite games beside the console ----------
  const STEEL: [number, number, number] = [0.82, 0.84, 0.88];
  const katY = caseTop + 0.035;
  add(
    box3(-0.02, caseTop + 0.012, caseD / 2, 0.012, 0.024, 0.05, WOOD_DARK),
    box3(0.16, caseTop + 0.012, caseD / 2, 0.012, 0.024, 0.05, WOOD_DARK),
    D(box, 2, STEEL, ...at(wallAt(right, 0.03, katY, caseD / 2)), 0.3, 0.012, 0.004, { ry: right.ry, rough: 0.06 }), // a very long blade
    D(box, 2, [0.86, 0.66, 0.24], ...at(wallAt(right, 0.185, katY, caseD / 2)), 0.006, 0.032, 0.018, { ry: right.ry, rough: 0.25 }), // guard
    D(box, 1, [0.08, 0.07, 0.09], ...at(wallAt(right, 0.23, katY, caseD / 2)), 0.085, 0.016, 0.014, { ry: right.ry, rough: 1 }), // wrapped grip
    D(ball, 1, [0.04, 0.04, 0.05], ...at(wallAt(right, -0.06, caseTop + 0.006, caseD / 2 + 0.02)), 0.05, 0.003, 0.01, { ry: right.ry + 0.6, rough: 0.9 }), // one black feather
  );
  let gu = caseU + 0.06;
  GAMES.forEach((game, i) => {
    const th = 0.014;
    const gh = 0.1;
    const colr = caseFor(game, i);
    const cu = gu + th / 2;
    add(D(box, 2, hex(colr), ...at(wallAt(right, cu, caseTop + gh / 2, caseD / 2)), th, gh, 0.085, { ry: right.ry, rough: 0.3 }));
    const st = paintTex(() => P.gameSpine(game.title, game.platform ?? '', colr, Math.round(th * 4800), Math.round(gh * 4800)));
    add(D(box, 2, [1, 1, 1], ...at(wallAt(right, cu, caseTop + gh / 2, caseD / 2 + 0.0435)), th - 0.0008, gh - 0.0008, 0.0016, { ry: right.ry, tex: st, rough: 0.25 }));
    bookHits.push({
      title: game.title,
      author: game.platform ? `${game.platform} · a favourite game` : 'a favourite game',
      link: game.href ? { href: game.href, label: 'Open the game' } : null,
      ...wallAt(right, cu, caseTop + gh / 2, caseD / 2 + 0.04),
    });
    gu += th + 0.0015;
  });
  const consoleTex = paintTex(() => P.consoleTop());
  const cAt = wallAt(right, innerR - 0.05, caseTop + 0.014, caseD / 2);
  add(D(box, 2, [1, 1, 1], cAt.x, cAt.y, cAt.z, 0.1, 0.028, 0.072, { ry: right.ry, tex: consoleTex, rough: 0.4 }));
  const pad = (p: { x: number; y: number; z: number }, col: [number, number, number], ry: number) => [
    D(box, 2, col, p.x, p.y, p.z, 0.05, 0.015, 0.027, { ry, rough: 0.35 }),
    D(ball, 2, col, p.x - Math.cos(ry) * 0.024, p.y - 0.003, p.z + Math.sin(ry) * 0.024, 0.013, 0.009, 0.017, { ry, rough: 0.35 }),
    D(ball, 2, col, p.x + Math.cos(ry) * 0.024, p.y - 0.003, p.z - Math.sin(ry) * 0.024, 0.013, 0.009, 0.017, { ry, rough: 0.35 }),
  ];
  add(...pad({ x: cAt.x, y: cAt.y + 0.022, z: cAt.z }, [0.36, 0.3, 0.62], right.ry + 0.3));

  // the paths poster stays above, right of the stage photo
  const posterTex = paintTex(() => P.pathsPoster());
  add(...framed(onWing(right, 0.36, 0.3), 0.13, 0.13 / 0.75, posterTex, {}, [0.1, 0.08, 0.06]));
  // lanyards hang from a hook on the right door post
  add(D(ball, 2, [0.6, 0.6, 0.62], 0.68, 0.2, 0.345, 0.012, 0.012, 0.012, { rough: 0.2, metal: 1 }));
  // one badge per event in events.ts; each reports a screen anchor so a real button can open that event
  EVENTS.forEach((ev, k) => {
    const bt = paintTex(() => P.badge(ev.badge, ev.role, ev.color));
    // fanned out from the one hook so each badge is its own click target
    const off = k - (EVENTS.length - 1) / 2;
    const hook = { x: 0.68, y: 0.2 };
    const bw = 0.064;
    const bh = bw / (300 / 420);
    const bx = hook.x + off * 0.052;
    const by = 0.02 - Math.abs(off) * 0.018;
    const bz = 0.352 + k * 0.003;
    const top = { x: bx, y: by + bh / 2 };
    const len = Math.hypot(top.x - hook.x, top.y - hook.y);
    const ang = Math.atan2(top.x - hook.x, hook.y - top.y);
    add(
      // the lanyard: a strap from the hook down to the badge's clip
      D(box, 2, [0.1, 0.1, 0.12], (hook.x + top.x) / 2, (hook.y + top.y) / 2, bz - 0.002, 0.006, len, 0.002, { rz: ang, rough: 0.9 }),
      D(box, 2, [1, 1, 1], bx, by, bz, bw, bh, 0.003, { rz: -ang * 0.4, tex: bt, rough: 0.45 }),
    );
    badgeHits.push({ id: `badge:${ev.id}`, x: bx, y: by, z: bz + 0.01 });
  });


  // small 3x3 rotation helpers, shared by the controller and the measured props
  type M3 = number[][];
  const rot3 = (ax: number, ay: number, az: number): M3 => {
    const [cx, sx, cy, sy, cz, sz] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)];
    return [
      [cz * cy, cz * sy * sx - sz * cx, cz * sy * cx + sz * sx],
      [sz * cy, sz * sy * sx + cz * cx, sz * sy * cx - cz * sx],
      [-sy, cy * sx, cy * cx],
    ];
  };
  const mul3 = (a: M3, b: M3): M3 => a.map((row) => [0, 1, 2].map((c) => row[0] * b[0][c] + row[1] * b[1][c] + row[2] * b[2][c]));
  const apply3 = (m: M3, v: number[]) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
  /** A rotation matrix back to the rx, ry, rz the renderer composes (Rz * Ry * Rx). */
  const euler = (m: M3) => ({ rx: Math.atan2(m[2][1], m[2][2]), ry: Math.asin(Math.max(-1, Math.min(1, -m[2][0]))), rz: Math.atan2(m[1][0], m[0][0]) });
  // ---------- the controller: a DualShock 4, propped against the bottom of the window board ----------
  // The body is the real silhouette (traced outline, rounded moulded edge), leaning back onto the board.
  // Each button reports a screen anchor so a real HTML button can sit on it.
  const padHits: { id: `pad:${string}`; x: number; y: number; z: number }[] = [];
  {
    const BODY: [number, number, number] = [0.115, 0.12, 0.135];
    const TRIM: [number, number, number] = [0.15, 0.155, 0.17];
    const S = 0.62; // width in room units: big enough to press, low enough to leave the window clear
    const DEPTH = 0.15; // body thickness (in outline units, scaled by S)
    const lean = 0.5; // tipped back so its top rests on the board and the window stays in view
    const cos = Math.cos(lean);
    const sin = Math.sin(lean);
    const cx = 0;
    const cy = floorY + 0.385 * S * cos + (DEPTH / 2) * S * sin;
    const boardFront = 0.385; // it leans on the front edge of the sill
    const cz = boardFront + 0.315 * S * sin + (DEPTH / 2) * S * cos + 0.004;
    /** A point on the pad: lx, ly in outline units on the top face, lz above it (outline units). */
    const padAt = (lx: number, ly: number, lz = 0) => {
      const y = ly * S;
      const z = (DEPTH / 2 + lz) * S;
      return { x: cx + lx * S, y: cy + y * cos + z * sin, z: cz - y * sin + z * cos };
    };
    const FACE = -lean; // rx for parts lying on the top face
    const body = upload(gl, slabMesh(dualShockOutline(), DEPTH, 0.06));
    add(D(body, 2, BODY, cx, cy, cz, S, S, S, { rx: FACE, rough: 0.42, wrap: 0.3 }));
    // The outline alone is a flat slab. A real pad is moulded: fat handles that swell above and below the face,
    // a belly underneath, and bumpers and triggers on the top edge. `spin` turns a part in the plane of the face.
    const bulge = (lx: number, ly: number, lz: number, rx: number, ry: number, rz: number, spin: number, tint = BODY, rough = 0.42) => {
      const q = padAt(lx, ly, lz);
      add(D(ball, 2, tint, q.x, q.y, q.z, rx * S, ry * S, rz * S, { ...euler(mul3(rot3(FACE, 0, 0), rot3(0, 0, spin))), rough, wrap: 0.3 }));
    };
    for (const sx of [-1, 1]) {
      bulge(sx * 0.385, -0.19, -DEPTH / 2, 0.105, 0.19, 0.125, sx * 0.2); // the handle
      bulge(sx * 0.37, -0.33, -DEPTH / 2 - 0.01, 0.075, 0.07, 0.11, 0); // its rounded end
      bulge(sx * 0.33, 0.3, -DEPTH / 2 + 0.01, 0.13, 0.035, 0.055, 0, TRIM, 0.3); // bumper
      bulge(sx * 0.33, 0.31, -DEPTH / 2 - 0.07, 0.1, 0.05, 0.07, 0, TRIM, 0.3); // trigger
    }
    bulge(0, 0.08, -DEPTH - 0.005, 0.36, 0.2, 0.06, 0); // the belly underneath
    // the touchpad: a slightly raised, finely textured matte panel, with the light bar glowing along its top edge
    const tp = padAt(0, 0.175, 0.006);
    add(D(box, 2, TRIM, tp.x, tp.y, tp.z, 0.3 * S, 0.165 * S, 0.012 * S, { rx: FACE, rough: 0.75 }));
    const lb = padAt(0, 0.305, -0.01);
    add(D(box, 5, [0.25, 0.45, 1], lb.x, lb.y, lb.z, 0.26 * S, 0.012 * S, 0.03 * S, { rx: FACE, rough: 0.3 }));
    // Share and Options: small pills either side of the touchpad
    for (const sx of [-1, 1]) {
      const q = padAt(sx * 0.2, 0.235, 0.004);
      add(D(ball, 2, [0.12, 0.12, 0.13], q.x, q.y, q.z, 0.018 * S, 0.036 * S, 0.012 * S, { rx: FACE, rz: sx * -0.35, rough: 0.35 }));
    }
    // the PS button between the sticks, and the speaker grille above it
    const ps = padAt(0, -0.04, 0.002);
    add(D(coin, 2, [0.1, 0.1, 0.11], ps.x, ps.y, ps.z, 0.045 * S, 0.045 * S, 1, { rx: FACE, rough: 0.2, metal: 0.4 }));
    for (let k = -3; k <= 3; k++) {
      const q = padAt(k * 0.012, 0.045, 0.001);
      add(D(coin, 2, [0.015, 0.015, 0.02], q.x, q.y, q.z, 0.007 * S, 0.007 * S, 1, { rx: FACE, rough: 0.9 }));
    }
    // d-pad: four separate wedge-tipped arrows in a shallow dish
    const dp = { x: -0.325, y: 0.1 };
    const dish = padAt(dp.x, dp.y, 0.0005);
    add(D(coin, 2, [0.03, 0.03, 0.035], dish.x, dish.y, dish.z, 0.17 * S, 0.17 * S, 1, { rx: FACE, rough: 0.6 }));
    const arms: [string, number, number][] = [['up', 0, 1], ['down', 0, -1], ['left', -1, 0], ['right', 1, 0]];
    for (const [dir, ax, ay] of arms) {
      const q = padAt(dp.x + ax * 0.043, dp.y + ay * 0.043, 0.008);
      add(D(box, 2, TRIM, q.x, q.y, q.z, (ax ? 0.05 : 0.036) * S, (ay ? 0.05 : 0.036) * S, 0.016 * S, { rx: FACE, rough: 0.35 }));
      padHits.push({ id: `pad:${dir}`, ...padAt(dp.x + ax * 0.043, dp.y + ay * 0.043, 0.02) });
    }
    // face buttons: dark caps with the coloured glyphs, each in its own collar
    const fb = { x: 0.325, y: 0.1 };
    const faces: ['triangle' | 'circle' | 'cross' | 'square', number, number][] = [['triangle', 0, 1], ['cross', 0, -1], ['square', -1, 0], ['circle', 1, 0]];
    for (const [shape, ax, ay] of faces) {
      const tex = paintTex(() => P.faceGlyph(shape));
      const collar = padAt(fb.x + ax * 0.06, fb.y + ay * 0.06, 0.003);
      const cap = padAt(fb.x + ax * 0.06, fb.y + ay * 0.06, 0.013);
      add(
        D(coin, 2, [0.02, 0.02, 0.025], collar.x, collar.y, collar.z, 0.058 * S, 0.058 * S, 1, { rx: FACE, rough: 0.7 }),
        D(tube, 2, [0.07, 0.07, 0.08], cap.x, cap.y, cap.z - 0.004 * S * cos, 0.048 * S, 0.012 * S, 0.048 * S, { rx: Math.PI / 2 + FACE, rough: 0.25 }),
        D(coin, 2, [1, 1, 1], cap.x, cap.y, cap.z, 0.048 * S, 0.048 * S, 1, { rx: FACE, tex, rough: 0.22 }),
      );
      padHits.push({ id: `pad:${shape}`, ...padAt(fb.x + ax * 0.06, fb.y + ay * 0.06, 0.02) });
    }
    // thumbsticks: below and inside the d-pad and face buttons, a domed base with a concave rubber cap
    for (const sx of [-1, 1]) {
      const st = { x: sx * 0.145, y: -0.075 };
      const well = padAt(st.x, st.y, 0.0005);
      const neck = padAt(st.x, st.y, 0.02);
      const cap = padAt(st.x, st.y, 0.042);
      const rim = padAt(st.x, st.y, 0.036);
      add(
        D(coin, 2, [0.02, 0.02, 0.024], well.x, well.y, well.z, 0.115 * S, 0.115 * S, 1, { rx: FACE, rough: 0.7 }),
        D(ball, 2, [0.05, 0.05, 0.056], neck.x, neck.y, neck.z, 0.06 * S, 0.06 * S, 0.035 * S, { rx: FACE, rough: 0.5 }),
        D(tube, 2, [0.08, 0.08, 0.09], rim.x, rim.y, rim.z, 0.085 * S, 0.014 * S, 0.085 * S, { rx: Math.PI / 2 + FACE, rough: 0.85 }),
        D(coin, 1, [0.14, 0.14, 0.155], cap.x, cap.y, cap.z, 0.08 * S, 0.08 * S, 1, { rx: FACE, rough: 0.95, wrap: 0.3 }),
      );
    }
  }

  // ---------- the record crate by the bookcase: gray wood, four slots, the albums, a turntable on top ----------
  {
    const GRAY: [number, number, number] = [0.28, 0.28, 0.3];
    const rx0 = 0.72;
    const rz0 = 0.7;
    const ry0 = -0.25;
    const cw = 0.3;
    const cd = 0.18;
    const legH = 0.13;
    const bodyY0 = floorY + legH;
    const bodyH = 0.18;
    const P2 = (lx: number, y: number, lz: number) => ({
      x: rx0 + Math.cos(ry0) * lx + Math.sin(ry0) * lz,
      y,
      z: rz0 - Math.sin(ry0) * lx + Math.cos(ry0) * lz,
    });
    const part = (lx: number, y: number, lz: number, sx: number, sy: number, sz: number, tint = GRAY, extra: Partial<Draw> = {}) => {
      const q = P2(lx, y, lz);
      return D(box, 3, tint, q.x, q.y, q.z, sx, sy, sz, { ry: ry0, rough: 0.55, ...extra });
    };
    add(
      part(0, bodyY0 + bodyH + 0.008, 0, cw + 0.02, 0.016, cd + 0.01), // top
      part(0, bodyY0 + 0.007, 0, cw, 0.014, cd), // bottom
      part(-cw / 2, bodyY0 + bodyH / 2, 0, 0.014, bodyH, cd), // sides
      part(cw / 2, bodyY0 + bodyH / 2, 0, 0.014, bodyH, cd),
      part(0, bodyY0 + bodyH / 2, -cd / 2 + 0.004, cw, bodyH, 0.008), // back
      ...[-1, 0, 1].map((n) => part(n * (cw / 4), bodyY0 + bodyH / 2, 0, 0.01, bodyH, cd - 0.01)), // dividers
      ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => part(sx * (cw / 2 - 0.012), floorY + legH / 2, sz * (cd / 2 - 0.012), 0.016, legH, 0.016, [0.12, 0.12, 0.13]))),
    );
    RECORDS.forEach((r, n) => {
      const lx = -cw / 2 + cw / 8 + n * (cw / 4);
      const q = P2(lx - 0.012, bodyY0 + 0.014 + 0.085, 0.005);
      const tex = paintTex(() => P.sleeve(r.title, r.artist, r.color, r.ink));
      add(D(box, 2, [1, 1, 1], q.x, q.y, q.z, 0.17, 0.17, 0.004, { ry: ry0 - Math.PI / 2 + 0.25, rz: 0, tex, rough: 0.6 }));
      bookHits.push({ title: r.title, author: `${r.artist} · on vinyl`, ...q });
    });
    // the turntable
    const tt = P2(0, bodyY0 + bodyH + 0.034, 0);
    add(
      D(box, 2, [0.1, 0.09, 0.09], tt.x, tt.y, tt.z, 0.26, 0.036, 0.19, { ry: ry0, rough: 0.35 }),
      D(coin, 2, [0.75, 0.76, 0.78], tt.x - 0.03, tt.y + 0.019, tt.z, 0.165, 0.165, 1, { rx: -Math.PI / 2, rough: 0.2 }),
      D(coin, 2, [0.03, 0.03, 0.035], tt.x - 0.03, tt.y + 0.021, tt.z, 0.155, 0.155, 1, { rx: -Math.PI / 2, rough: 0.15 }),
      D(coin, 2, [0.75, 0.1, 0.12], tt.x - 0.03, tt.y + 0.022, tt.z, 0.05, 0.05, 1, { rx: -Math.PI / 2, rough: 0.6 }),
      D(box, 2, [0.8, 0.8, 0.82], tt.x + 0.06, tt.y + 0.03, tt.z + 0.02, 0.1, 0.006, 0.006, { ry: ry0 + 0.6, rough: 0.2 }),
    );
  }

  // ---------- left wall additions: the singlet shadow box, a marathon medal, the race bib ----------
  // The singlet is a real garment shape, not a painting: a thin moulded slab cut to a tank top's outline, hung in
  // a deep shadow box on black backing.
  {
    const at = onWing(left, 0.2, 0.3);
    const tilt = { ry: at.ry };
    const bw = 0.17, bh = 0.22;
    const back = along(at, 0.006);
    const box0 = along(at, 0.022);
    const shirt = along(at, 0.028);
    const FRAME: [number, number, number] = [0.07, 0.055, 0.045];
    const fabricTex = paintTex(() => singletFabric());
    const outline: [number, number][] = smoothLoop(
      ([
        [0, 0.3], [0.07, 0.33], [0.1, 0.41], [0.165, 0.41], [0.175, 0.3], [0.205, 0.17], [0.265, 0.09], [0.272, -0.1],
        [0.285, -0.4], [0.2, -0.425], [0, -0.43], [-0.2, -0.425], [-0.285, -0.4], [-0.272, -0.1], [-0.265, 0.09],
        [-0.205, 0.17], [-0.175, 0.3], [-0.165, 0.41], [-0.1, 0.41], [-0.07, 0.33],
      ] as [number, number][]).reverse(),
      5,
    );
    const garment = upload(gl, slabMesh(outline, 0.03, 0.012, 3));
    const sh = 0.2 / 0.84; // garment height 0.2 world units
    add(
      // the box: black velvet back, four deep sides
      D(box, 1, [0.03, 0.03, 0.035], back.x, back.y, back.z, bw, bh, 0.008, { ...tilt, rough: 1, wrap: 0.4 }),
      ...[
        [0, bh / 2, bw + 0.02, 0.012], [0, -bh / 2, bw + 0.02, 0.012], [bw / 2, 0, 0.012, bh], [-bw / 2, 0, 0.012, bh],
      ].map(([dx, dy, sx, sy]) => {
        const q = { x: box0.x + Math.cos(at.ry) * dx, y: box0.y + dy, z: box0.z - Math.sin(at.ry) * dx };
        return D(box, 3, FRAME, q.x, q.y, q.z, sx, sy, 0.045, { ...tilt, rough: 0.5 });
      }),
      D(garment, 2, [1, 1, 1], shirt.x, shirt.y - 0.004, shirt.z, sh, sh, sh, { ...tilt, tex: fabricTex, rough: 0.85, wrap: 0.35 }),
    );
  }
  const m2 = leftAt(1.17, 0.11);
  const m2r = along(m2, 0.02);
  add(
    D(box, 2, [0.12, 0.25, 0.6], m2r.x, m2r.y + 0.06, m2r.z, 0.03, 0.14, 0.004, { ry: m2.ry, rz: 0.1, rough: 0.9 }),
    D(coin, 4, [0.75, 0.76, 0.8], along(m2, 0.03).x, m2.y - 0.03, along(m2, 0.03).z, 0.1, 0.1, 1, { ry: m2.ry, rough: 0.16 }),
  );
  const bibTex = paintTex(() => P.raceBib());
  const bibAt = along(leftAt(2.05, 0.6), 0.004);
  add(D(box, 2, [1, 1, 1], bibAt.x, bibAt.y, bibAt.z, 0.12, 0.09, 0.002, { ry: left.ry, rz: 0.05, tex: bibTex, rough: 0.9 }));


  // ---------- measured props ----------
  /** World units per millimetre. Fixed by the MX Keys (430 mm wide = 0.2 units) and used for every measured prop. */
  const MM = 0.2 / 430;
  /** The sphere mesh has radius 1, so a ball's scale is half the size it should measure. */
  const BALL = 0.5;
  const matPhoto = image('/assets/photos/desk-mat.jpg');
  const paints: Partial<Record<string, WebGLTexture>> = {
    mxKeys: paintTex(() => P.mxKeys()),
    // Max's real mat: his photo, perspective-flattened to the mat's 900x400 mm (public/assets/photos/desk-mat.jpg).
    // Painted fallback until it loads; going through a canvas keeps the mipmaps, so the line art doesn't shimmer.
    deskMat: paintTex(() => {
      if (!matPhoto.complete || !matPhoto.naturalWidth) return P.deskMat();
      const c = document.createElement('canvas');
      c.width = matPhoto.naturalWidth;
      c.height = matPhoto.naturalHeight;
      c.getContext('2d')?.drawImage(matPhoto, 0, 0);
      return c;
    }),
    whiteboard: paintTex(() => P.whiteboard()),
  };
  const hexTint = (hex: string): [number, number, number] => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const FINISH = {
    matte: { kind: 2, rough: 0.8, wrap: 0.2 },
    satin: { kind: 2, rough: 0.42, wrap: 0.2 },
    gloss: { kind: 2, rough: 0.12, wrap: 0.2 },
    metal: { kind: 2, rough: 0.2, wrap: 0.2 },
    fabric: { kind: 1, rough: 1, wrap: 0.5 },
    glow: { kind: 5, rough: 0.2, wrap: 0.2 },
  } as const;
  /**
   * One measured prop from loot.ts, standing at (x, y, z) and turned by `yaw`. Every part keeps its real size:
   * millimetres times MM. Cylinders get end caps (the tube mesh is open).
   */
  const prop = (name: PropName, x: number, y: number, z: number, yaw = 0): Draw[] => {
    const turn = rot3(0, yaw, 0);
    const out: Draw[] = [];
    for (const part of LOOT[name].parts) {
      const rad = part.rot.map((deg) => (deg * Math.PI) / 180);
      const R = mul3(turn, rot3(rad[0], rad[1], rad[2]));
      const c = apply3(turn, part.at.map((v) => v * MM));
      const [sx, sy, sz] = part.size.map((v) => v * MM);
      const fin = FINISH[part.finish];
      const tex = part.paint ? paints[part.paint] ?? null : null;
      const look = { rough: fin.rough, wrap: fin.wrap, ...(tex ? { tex } : {}) };
      const tint: [number, number, number] = tex ? [1, 1, 1] : hexTint(part.color);
      const px = x + c[0];
      const py = y + c[1];
      const pz = z + c[2];
      if (part.shape === 'box') out.push(D(box, fin.kind, tint, px, py, pz, sx, sy, sz, { ...euler(R), ...look }));
      else if (part.shape === 'sphere') out.push(D(ball, fin.kind, tint, px, py, pz, sx * BALL, sy * BALL, sz * BALL, { ...euler(R), ...look }));
      else {
        out.push(D(tube, fin.kind, tint, px, py, pz, sx, sy, sz, { ...euler(R), ...look }));
        for (const end of [1, -1]) {
          const off = apply3(R, [0, (end * sy) / 2, 0]);
          const face = mul3(R, rot3((-end * Math.PI) / 2, 0, 0));
          out.push(D(coin, fin.kind, tint, px + off[0], py + off[1], pz + off[2], sx, sz, 1, { ...euler(face), ...look }));
        }
      }
    }
    return out;
  };

  // ---------- Max's desk, from his office (cleaned up): walnut desk, glowing PC tower, two curved monitors, mat ----------
  const deskStart = room.length;
  const deskX = 0;
  const deskZ = 0;
  const deskTop = -0.43;
  const WALNUT: [number, number, number] = [0.3, 0.17, 0.09];
  const MATTE: [number, number, number] = [0.05, 0.05, 0.055];
  add(
    D(box, 3, WALNUT, deskX, deskTop - 0.015, deskZ, 1.5, 0.03, 0.32, { rough: 0.4 }),
    // the desk view centres on the working area, between the ViewSonic and the KOORUI
    D(box, 3, WALNUT, deskX + 0.12, deskTop - 0.016, deskZ, 0.01, 0.01, 0.01, { rough: 0.4, anchor: 'desk', anchorDy: -0.07 }),
    ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => D(box, 2, MATTE, deskX + sx * 0.72, (deskTop - 0.03 + floorY) / 2, deskZ + sz * 0.13, 0.025, deskTop - 0.03 - floorY, 0.025, { rough: 0.4 }))),
    D(box, 2, MATTE, deskX, deskTop - 0.05, deskZ - 0.13, 1.42, 0.03, 0.02, { rough: 0.4 }), // the frame's back rail
  );
  // the PC: a black tempered-glass mid-tower, turned so the glass side and the mesh front both face the room.
  // Inside: motherboard, an AIO pump with a lit ring, RAM, a long GPU, the PSU shroud, and blue LED light.
  const pcX = deskX - 0.6;
  const pcZ = deskZ + 0.0;
  const pcH = 0.28;
  const pcRy = -0.35; // glass side to the room, the fan-lit mesh front toward the monitors (both in view)
  const pcL = 0.22; // front to back
  const pcW = 0.12; // side to side
  const pc = (lx: number, ly: number, lz: number) => ({
    x: pcX + Math.cos(pcRy) * lx + Math.sin(pcRy) * lz,
    y: deskTop + ly,
    z: pcZ - Math.sin(pcRy) * lx + Math.cos(pcRy) * lz,
  });
  const pcPart = (mesh: GpuMesh, kind: number, tint: [number, number, number], lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, extra: Partial<Draw> = {}) => {
    const q = pc(lx, ly, lz);
    return D(mesh, kind, tint, q.x, q.y, q.z, sx, sy, sz, { ry: pcRy + (extra.ry ?? 0), ...extra, ...(extra.ry !== undefined ? { ry: pcRy + extra.ry } : {}) });
  };
  const CASE: [number, number, number] = [0.025, 0.025, 0.03];
  const LIT_WALL: [number, number, number] = [0.06, 0.1, 0.27]; // the inside of the case, washed blue by the LEDs
  const BOARD: [number, number, number] = [0.13, 0.14, 0.19];
  const LED: [number, number, number] = [0.04, 0.12, 0.42];
  const meshTex = paintTex(() => P.caseMesh());
  add(
    // the shell: back wall, top, bottom, rear; the glass side is open so the inside shows
    pcPart(box, 2, LIT_WALL, 0, pcH / 2, -pcW / 2 + 0.003, pcL, pcH, 0.006, { rough: 0.35 }),
    pcPart(box, 2, CASE, 0, pcH - 0.004, 0, pcL, 0.008, pcW, { rough: 0.3 }),
    pcPart(box, 2, CASE, 0, 0.004, 0, pcL, 0.008, pcW, { rough: 0.3 }),
    pcPart(box, 2, CASE, -pcL / 2 + 0.003, pcH / 2, 0, 0.006, pcH, pcW, { rough: 0.35 }),
    // the front: black mesh (its face points out the front, local +x)
    pcPart(box, 2, [1, 1, 1], pcL / 2 - 0.004, pcH / 2, 0, pcW - 0.004, pcH - 0.004, 0.008, { ry: Math.PI / 2, tex: meshTex, rough: 0.7 }),
    // a thin black frame around the glass opening
    pcPart(box, 2, CASE, 0, pcH - 0.006, pcW / 2 - 0.002, pcL, 0.012, 0.004, { rough: 0.2 }),
    pcPart(box, 2, CASE, 0, 0.006, pcW / 2 - 0.002, pcL, 0.012, 0.004, { rough: 0.2 }),
    pcPart(box, 2, CASE, -pcL / 2 + 0.006, pcH / 2, pcW / 2 - 0.002, 0.012, pcH, 0.004, { rough: 0.2 }),
    pcPart(box, 2, CASE, pcL / 2 - 0.006, pcH / 2, pcW / 2 - 0.002, 0.012, pcH, 0.004, { rough: 0.2 }),
    // inside: motherboard on the back wall
    pcPart(box, 2, BOARD, 0.025, 0.165, -pcW / 2 + 0.009, 0.15, 0.2, 0.004, { rough: 0.5 }),
    // AIO pump block with a lit ring, top of the board
    pcPart(tube, 2, [0.06, 0.06, 0.07], 0.035, 0.205, -pcW / 2 + 0.02, 0.05, 0.02, 0.05, { rx: Math.PI / 2, rough: 0.3 }),
    pcPart(coin, 5, LED, 0.035, 0.205, -pcW / 2 + 0.031, 0.052, 0.052, 1, { rough: 0.2 }),
    pcPart(coin, 2, [0.04, 0.04, 0.05], 0.035, 0.205, -pcW / 2 + 0.032, 0.036, 0.036, 1, { rough: 0.25 }),
    // four RAM sticks with lit tops, beside the pump
    ...[0, 1, 2, 3].flatMap((k) => [
      pcPart(box, 2, [0.1, 0.1, 0.11], 0.075 + k * 0.007, 0.2, -pcW / 2 + 0.018, 0.004, 0.05, 0.016, { rough: 0.4 }),
      pcPart(box, 5, LED, 0.075 + k * 0.007, 0.226, -pcW / 2 + 0.018, 0.004, 0.003, 0.016, { rough: 0.2 }),
    ]),
    // the GPU: a long dark shroud with a silver accent, hanging off the board
    pcPart(box, 2, [0.2, 0.2, 0.22], 0.0, 0.12, -pcW / 2 + 0.035, 0.17, 0.032, 0.052, { rough: 0.3 }),
    pcPart(box, 2, [0.7, 0.71, 0.74], 0.0, 0.12, -pcW / 2 + 0.0615, 0.15, 0.004, 0.001, { rough: 0.15 }),
    // the PSU shroud along the bottom
    pcPart(box, 2, [0.04, 0.04, 0.045], 0.0, 0.03, 0, pcL - 0.012, 0.05, pcW - 0.008, { rough: 0.4 }),
    // blue LED strip along the inside of the roof, lighting the parts
    pcPart(box, 5, LED, 0.0, pcH - 0.012, -pcW / 2 + 0.03, pcL - 0.02, 0.004, 0.006, { rough: 0.2 }),
    pcPart(box, 5, LED, -pcL / 2 + 0.009, pcH / 2, -pcW / 2 + 0.03, 0.004, pcH - 0.04, 0.006, { rough: 0.2 }),
    // three intake fans behind the front mesh, their rings glowing through it
    ...[0.22, 0.15, 0.08].flatMap((fy) => [
      pcPart(coin, 5, [0.04, 0.12, 0.38], pcL / 2 + 0.0005, fy, 0, 0.07, 0.07, 1, { ry: Math.PI / 2, rough: 0.2 }),
      pcPart(coin, 2, [0.03, 0.03, 0.04], pcL / 2 + 0.001, fy, 0, 0.05, 0.05, 1, { ry: Math.PI / 2, rough: 0.5 }),
    ]),
  );
  // the ViewSonic VP3256-4K: 32", flat, 16:9, on its own stand, a webcam on top; the paths wallpaper on screen
  {
    const vsTex = paintTex(() => routeMap());
    const vX = deskX - 0.24;
    const vZ = deskZ - 0.07;
    const vW = 0.32;
    const vH = vW / (16 / 9);
    const vY = deskTop + 0.075 + vH / 2;
    add(
      D(box, 2, MATTE, vX, deskTop + 0.004, vZ, 0.12, 0.008, 0.07, { rough: 0.3 }),
      D(box, 2, MATTE, vX, deskTop + 0.05, vZ - 0.02, 0.03, 0.09, 0.012, { rough: 0.3 }),
      D(box, 2, MATTE, vX, vY, vZ, vW + 0.01, vH + 0.012, 0.012, { rough: 0.2 }),
      D(box, 2, [1, 1, 1], vX, vY, vZ + 0.0065, vW, vH, 0.001, { tex: vsTex, rough: 0.1, screen: true }),
      D(box, 2, [0.08, 0.08, 0.09], vX, vY + vH / 2 + 0.016, vZ + 0.004, 0.045, 0.014, 0.018, { rough: 0.3 }), // webcam
      D(coin, 2, [0.02, 0.02, 0.03], vX, vY + vH / 2 + 0.016, vZ + 0.0135, 0.008, 0.008, 1, { rough: 0.05 }),
    );
  }
  // the LG 34GS95QE: a 34" 21:9 curved OLED on Max's VIVO aluminum arm. Five panels on an arc, one picture across them.
  const liloImg = image('/assets/photos/lilo-editor.jpg');
  const learnCanvas = P.learningScreen(LEARNING);
  const uwTex = paintTex(() => P.ultrawideDesktop(liloImg, learnCanvas));
  const cmX = deskX + 0.2;
  const cmY = deskTop + 0.24;
  const cmZ = deskZ - 0.08;
  const uwW = 0.4;
  const uwH = uwW / (21 / 9);
  const arc = 0.9;
  const R = uwW / arc;
  const ALU: [number, number, number] = [0.42, 0.43, 0.46];
  // One continuous curved panel (not facets): the picture on a smooth 1800R-style arc, in a curved housing a few
  // millimetres larger all round, so from above it reads as one bent screen with an even bezel.
  {
    const bez = 0.005;
    const housing = upload(gl, curvedPanel(R, (uwW + bez * 2) / R, uwH + bez * 2, -0.0012, 0.009, 48));
    const panel = upload(gl, curvedPanel(R, arc, uwH, 0, 0, 48));
    add(
      D(housing, 2, MATTE, cmX, cmY, cmZ, 1, 1, 1, { rough: 0.3 }),
      D(panel, 2, [1, 1, 1], cmX, cmY, cmZ, 1, 1, 1, { tex: uwTex, rough: 0.08, screen: true, anchor: 'writing', anchorDy: -0.11 }),
    );
  }
  // the VIVO arm: a desk clamp at the back edge, a post, two aluminum links to the back of the screen
  add(
    D(box, 2, ALU, cmX, deskTop - 0.01, deskZ - 0.15, 0.04, 0.05, 0.03, { rough: 0.3 }),
    D(tube, 2, ALU, cmX, deskTop + 0.07, deskZ - 0.15, 0.022, 0.14, 0.022, { rough: 0.3 }),
    D(box, 2, ALU, cmX, deskTop + 0.15, deskZ - 0.125, 0.026, 0.02, 0.07, { rx: -0.5, rough: 0.3 }),
    D(box, 2, ALU, cmX, cmY - 0.02, cmZ - 0.03, 0.03, 0.04, 0.04, { rough: 0.3 }),
  );
  // the KOORUI 24" on a tall black pole arm, angled in, playing one of the records
  const rec = RECORDS[3] ?? RECORDS[0];
  const learnTex = paintTex(() => P.nowPlaying(rec.title, rec.artist, rec.color, rec.ink));
  const smX = deskX + 0.56;
  const smZ = deskZ - 0.04;
  const smY = deskTop + 0.23;
  add(
    D(tube, 2, MATTE, smX + 0.06, deskTop + 0.24, deskZ - 0.13, 0.018, 0.48, 0.018, { rough: 0.3 }),
    D(box, 2, MATTE, smX + 0.03, smY, deskZ - 0.1, 0.06, 0.012, 0.012, { rough: 0.3 }),
    D(box, 2, MATTE, smX, smY, smZ, 0.2, 0.13, 0.012, { ry: -0.5, rough: 0.2 }),
    D(box, 2, [1, 1, 1], smX + Math.sin(-0.5) * 0.007, smY, smZ + Math.cos(-0.5) * 0.007, 0.19, 0.19 / 1.6, 0.002, { ry: -0.5, tex: learnTex, rough: 0.1, screen: true }),
  );
  // over-ear headphones hanging on the pole (the Audible library lives in them)
  const phonesAt = room.length;
  {
    const hx = smX + 0.06;
    const hy = deskTop + 0.34;
    const hz = deskZ - 0.13 + 0.03;
    const BLK: [number, number, number] = [0.07, 0.07, 0.08];
    add(
      D(box, 2, BLK, hx, hy + 0.045, hz, 0.012, 0.01, 0.07, { rough: 0.4 }), // band over the hook
      D(box, 2, BLK, hx, hy + 0.012, hz - 0.034, 0.012, 0.06, 0.008, { rx: 0.15, rough: 0.4 }),
      D(box, 2, BLK, hx, hy + 0.012, hz + 0.034, 0.012, 0.06, 0.008, { rx: -0.15, rough: 0.4 }),
      D(ball, 2, BLK, hx, hy - 0.025, hz - 0.04, 0.03, 0.042, 0.022, { rough: 0.5 }),
      D(ball, 2, BLK, hx, hy - 0.025, hz + 0.04, 0.03, 0.042, 0.022, { rough: 0.5 }),
      D(ball, 1, [0.2, 0.2, 0.22], hx, hy - 0.025, hz + 0.028, 0.022, 0.032, 0.012, { wrap: 0.5, rough: 1 }),
    );
  }
  // the desk mat, MX Keys and the rest of the loot are placed from measured models further down (see LOOT)
  const kbX = cmX - 0.01;
  // Max's M3 Max MacBook Pro: space black, open, near-invisible bezels and the notch; LILO running tests on screen
  {
    const termTex = paintTex(() => P.terminal());
    const SPACE: [number, number, number] = [0.11, 0.11, 0.12];
    const mbX = deskX + 0.58;
    const mbZ = deskZ + 0.06;
    const mbRy = -0.4;
    const W = 0.2;
    const Dp = 0.14;
    const lean = 0.22;
    const at2 = (lx: number, y: number, lz: number) => ({ x: mbX + Math.cos(mbRy) * lx + Math.sin(mbRy) * lz, y, z: mbZ - Math.sin(mbRy) * lx + Math.cos(mbRy) * lz });
    const base = at2(0, deskTop + 0.004, 0);
    const well = at2(0, deskTop + 0.0085, -0.015);
    const pad2 = at2(0, deskTop + 0.0085, 0.045);
    const lidH = 0.13;
    const hingeZ = -Dp / 2;
    const lid = at2(0, deskTop + 0.008 + (lidH / 2) * Math.cos(lean), hingeZ - (lidH / 2) * Math.sin(lean));
    const scr = at2(0, deskTop + 0.008 + (lidH / 2) * Math.cos(lean), hingeZ - (lidH / 2) * Math.sin(lean) + 0.003 * Math.cos(lean));
    const notch = at2(0, deskTop + 0.008 + (lidH - 0.005) * Math.cos(lean), hingeZ - (lidH - 0.005) * Math.sin(lean) + 0.0035);
    add(
      D(box, 2, SPACE, base.x, base.y, base.z, W, 0.008, Dp, { ry: mbRy, rough: 0.32 }),
      D(box, 2, [0.04, 0.04, 0.045], well.x, well.y, well.z, W * 0.86, 0.001, Dp * 0.42, { ry: mbRy, rough: 0.6 }),
      D(box, 2, [0.14, 0.14, 0.15], pad2.x, pad2.y, pad2.z, W * 0.36, 0.001, Dp * 0.3, { ry: mbRy, rough: 0.25 }),
      D(box, 2, SPACE, lid.x, lid.y, lid.z, W, lidH, 0.005, { ry: mbRy, rx: -lean, rough: 0.32 }),
      // the display runs almost to the edge of the lid: the bezels are a hair thin
      D(box, 2, [1, 1, 1], scr.x, scr.y, scr.z, W - 0.006, (W - 0.006) / 1.6, 0.001, { ry: mbRy, rx: -lean, tex: termTex, rough: 0.08, screen: true }),
      D(box, 2, [0.01, 0.01, 0.01], notch.x, notch.y, notch.z, 0.022, 0.008, 0.001, { ry: mbRy, rx: -lean, rough: 0.3 }),
    );
  }
  // rubber duck (debugging) and the Pathion mug (logo faces the room), at real size like the measured props:
  // a 60 mm duck and an 82 mm mug at the same millimetre scale
  const dx = deskX - 0.12;
  const dz = deskZ + 0.085;
  const DK = 0.33; // ball scales are radii: this makes the duck 60 mm long
  add(
    D(ball, 2, [1.0, 0.82, 0.12], dx, deskTop + 0.025 * DK, dz, 0.035 * DK, 0.025 * DK, 0.045 * DK, { rough: 0.35 }),
    D(ball, 2, [1.0, 0.82, 0.12], dx, deskTop + 0.058 * DK, dz + 0.016 * DK, 0.024 * DK, 0.024 * DK, 0.024 * DK, { rough: 0.35 }),
    D(box, 2, [0.95, 0.45, 0.08], dx, deskTop + 0.056 * DK, dz + 0.042 * DK, 0.016 * DK, 0.006 * DK, 0.014 * DK, { rough: 0.4 }),
    D(ball, 2, [0.05, 0.05, 0.05], dx - 0.01 * DK, deskTop + 0.066 * DK, dz + 0.034 * DK, 0.004 * DK, 0.004 * DK, 0.004 * DK, { rough: 0.2 }),
    D(ball, 2, [0.05, 0.05, 0.05], dx + 0.01 * DK, deskTop + 0.066 * DK, dz + 0.034 * DK, 0.004 * DK, 0.004 * DK, 0.004 * DK, { rough: 0.2 }),
  );
  const mugTex = paintTex(() => P.mugWrap(logo));
  const mugX = deskX - 0.32;
  const mugZ = deskZ + 0.1;
  const MG = 0.7;
  add(
    D(tube, 2, [1, 1, 1], mugX, deskTop + 0.035 * MG, mugZ, 0.055 * MG, 0.07 * MG, 0.055 * MG, { tex: mugTex, ry: -Math.PI / 2, rough: 0.25 }),
    D(coin, 2, [0.24, 0.14, 0.08], mugX, deskTop + 0.064 * MG, mugZ, 0.05 * MG, 0.05 * MG, 1, { rx: -Math.PI / 2, rough: 0.1 }),
    D(box, 2, [0.95, 0.95, 0.93], mugX + 0.035 * MG, deskTop + 0.035 * MG, mugZ, 0.014 * MG, 0.04 * MG, 0.008 * MG, { rough: 0.25 }),
  );
  // the sack-doll plush, sitting on top of the PC
  const BURLAP: [number, number, number] = [0.74, 0.6, 0.42];
  const ty = deskTop + pcH;
  add(
    D(ball, 1, BURLAP, pcX, ty + 0.04, pcZ, 0.035, 0.042, 0.03, { wrap: 0.8, rough: 1 }),
    D(ball, 1, BURLAP, pcX, ty + 0.105, pcZ + 0.004, 0.04, 0.038, 0.035, { wrap: 0.8, rough: 1 }),
    D(ball, 2, [0.06, 0.05, 0.05], pcX - 0.015, ty + 0.11, pcZ + 0.037, 0.006, 0.009, 0.003, { rough: 0.3 }),
    D(ball, 2, [0.06, 0.05, 0.05], pcX + 0.015, ty + 0.11, pcZ + 0.037, 0.006, 0.009, 0.003, { rough: 0.3 }),
    D(ball, 1, BURLAP, pcX - 0.018, ty + 0.012, pcZ + 0.03, 0.013, 0.012, 0.03, { wrap: 0.8, rough: 1 }),
    D(ball, 1, BURLAP, pcX + 0.018, ty + 0.012, pcZ + 0.03, 0.013, 0.012, 0.03, { wrap: 0.8, rough: 1 }),
  );

  {
    const o = leftAt(1.2, 0, 0.19);
    const c0 = Math.cos(leftBig.ry);
    const s0 = Math.sin(leftBig.ry);
    for (const d of room.slice(deskStart)) {
      const lx = d.x;
      const lz = d.z;
      d.x = o.x + c0 * lx + s0 * lz;
      d.z = o.z - s0 * lx + c0 * lz;
      d.ry += leftBig.ry;
    }

    // ----- the loot: real objects modelled in millimetres by `reelforge model` (loot.ts), all at one scale -----
    const deskYaw = leftBig.ry;
    const onDesk = (name: PropName, lx: number, lz: number, yaw = 0, lift = 0) => {
      const at = { x: o.x + c0 * lx + s0 * lz, y: deskTop + lift, z: o.z - s0 * lx + c0 * lz };
      add(...prop(name, at.x, at.y, at.z, deskYaw + yaw));
      return at;
    };
    const matLift = LOOT['desk-mat'].size[1] * MM;
    onDesk('desk-mat', 0.265, 0.06);
    onDesk('mx-keys', kbX, 0.07, 0, matLift);
    onDesk('mx-master', kbX + 0.135, 0.075, 0.1, matLift);
    const pad = onDesk('macro-pad', 0.015, 0.075, 0.12);
    const studio = onDesk('echo-studio', pcX + 0.165, 0.05);
    const sw = onDesk('switch-oled', 0.685, -0.115, -0.25);
    const gc = onDesk('gc-controller', -0.215, 0.085, 0.3);
    const orbi = onDesk('orbi-router', 0.44, -0.115, -0.15);
    // the rolling whiteboard stands in the front-left corner, beside the PC end of the desk, clear of the controller
    const wb = { x: o.x - c0 * 0.62 + s0 * 0.55, z: o.z + s0 * 0.62 + c0 * 0.55 };
    add(...prop('whiteboard', wb.x, floorY, wb.z, deskYaw - 0.2));
    bookHits.push({ title: 'The whiteboard', author: 'this season\'s content calendar', x: wb.x, y: floorY + 1350 * MM, z: wb.z });
    bookHits.push({ title: 'Nintendo Switch OLED', author: 'docked · Super Smash Bros. Ultimate', x: sw.x, y: sw.y + 0.04, z: sw.z });
    bookHits.push({ title: 'GameCube-style controller', author: 'how Max plays Smash · 999+ hours', x: gc.x, y: gc.y + 0.02, z: gc.z });
    bookHits.push({ title: 'Macro pad', author: 'Work Louder · 13 keys, a knob and a stick', x: pad.x, y: pad.y + 0.012, z: pad.z });
    bookHits.push({ title: 'Echo Studio', author: 'the speaker by the PC', x: studio.x, y: studio.y + 0.06, z: studio.z });
    bookHits.push({ title: 'Orbi mesh router', author: 'the Wi-Fi for all of this', x: orbi.x, y: orbi.y + 0.07, z: orbi.z });
    const ph = room[phonesAt + 3];
    const listening = AUDIOBOOKS.filter((a) => a.status === 'listening').length;
    bookHits.push({ title: `Audible · ${AUDIOBOOKS.length} audiobooks`, author: `${listening} in progress · see the Library`, x: ph.x, y: ph.y, z: ph.z });
  }

  // ---------- the LG C3 48" OLED on the wall above the desk: Smash night ----------
  {
    const tvTex = paintTex(() => P.smashNight());
    const tW = 0.48;
    const tH = tW / (16 / 9);
    const t = leftAt(1.5, 0.27, 0.02);
    const t2 = leftAt(1.5, 0.27, 0.031);
    add(
      D(box, 2, [0.03, 0.03, 0.035], t.x, t.y, t.z, tW + 0.006, tH + 0.006, 0.014, { ry: leftBig.ry, rough: 0.2 }),
      D(box, 2, [1, 1, 1], t2.x, t2.y, t2.z, tW, tH, 0.001, { ry: leftBig.ry, tex: tvTex, rough: 0.06, screen: true }),
    );
  }

  // ---------- the drum kit, front right: a five-piece in red, set up the way a right-handed drummer plays it ----------
  // Everything is placed in the kit's own frame (x to the audience's right, z toward the audience, y up) and
  // turned as one to face the room, so the shells, stands and cymbals stay square to each other.
  {
    const SHELL: [number, number, number] = [0.5, 0.04, 0.07];
    const HEAD: [number, number, number] = [0.92, 0.9, 0.84];
    const CHROME: [number, number, number] = [0.78, 0.79, 0.82];
    const BRASS: [number, number, number] = [0.8, 0.6, 0.24];
    const BLACK: [number, number, number] = [0.05, 0.05, 0.055];
    const kx = 1.5;
    const kz = 1.08;
    const face = Math.atan2(-0.25 - kx, 4.25 - kz); // the kit looks at the camera
    const cf = Math.cos(face);
    const sf = Math.sin(face);
    const K = (lx: number, ly: number, lz: number) => ({ x: kx + lx * cf + lz * sf, y: floorY + ly, z: kz - lx * sf + lz * cf });
    const part = (mesh: GpuMesh, kind: number, tint: [number, number, number], lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, extra: Partial<Draw> = {}) => {
      const q = K(lx, ly, lz);
      return D(mesh, kind, tint, q.x, q.y, q.z, sx, sy, sz, { ...extra, ry: face + (extra.ry ?? 0) });
    };
    const metal = { rough: 0.22, metal: 1 };
    /** A vertical chrome post from the floor up to height h, on three splayed legs. */
    const stand = (lx: number, lz: number, h: number) => {
      const out: Draw[] = [part(tube, 2, CHROME, lx, h / 2, lz, 0.008, h, 0.008, metal)];
      const L = 0.11;
      const tilt = 0.75;
      for (let i = 0; i < 3; i++) {
        const b = (i / 3) * Math.PI * 2 + 0.5;
        const dx = Math.sin(b) * (L / 2) * Math.sin(tilt);
        const dz = Math.cos(b) * (L / 2) * Math.sin(tilt);
        out.push(part(box, 2, CHROME, lx + dx, (L / 2) * Math.cos(tilt), lz + dz, 0.006, L, 0.006, { ...metal, rx: tilt, ry: b + Math.PI }));
      }
      return out;
    };
    /** A cymbal: a thin brass dish with a bell, tipped `tip` toward the drummer. */
    const cymbal = (lx: number, ly: number, lz: number, d: number, tip: number) => [
      part(coin, 2, BRASS, lx, ly, lz, d, d, 1, { rx: -Math.PI / 2 - tip, rough: 0.28, metal: 1, twoSided: true }),
      part(ball, 2, BRASS, lx, ly + 0.006, lz, d * 0.18, d * 0.07, d * 0.18, { rx: -tip, rough: 0.25, metal: 1 }),
    ];
    // kick: lying on its side, the resonant head to the audience with a port, two spurs at the front
    const kickR = 0.1;
    const kickL = 0.17;
    add(
      part(tube, 2, SHELL, 0, kickR, 0, kickR * 2, kickL, kickR * 2, { rx: Math.PI / 2, rough: 0.12 }),
      part(coin, 2, HEAD, 0, kickR, kickL / 2 + 0.001, kickR * 2 - 0.006, kickR * 2 - 0.006, 1, { rough: 0.55 }),
      part(coin, 2, BLACK, 0.035, kickR - 0.04, kickL / 2 + 0.002, 0.04, 0.04, 1, { rough: 0.5 }),
      part(coin, 2, HEAD, 0, kickR, -kickL / 2 - 0.001, kickR * 2 - 0.006, kickR * 2 - 0.006, 1, { ry: Math.PI, rough: 0.55 }),
      // hoops
      part(tube, 2, BLACK, 0, kickR, kickL / 2 - 0.004, kickR * 2 + 0.008, 0.012, kickR * 2 + 0.008, { rx: Math.PI / 2, rough: 0.4 }),
      part(tube, 2, BLACK, 0, kickR, -kickL / 2 + 0.004, kickR * 2 + 0.008, 0.012, kickR * 2 + 0.008, { rx: Math.PI / 2, rough: 0.4 }),
      part(box, 2, CHROME, -0.09, 0.03, kickL / 2 - 0.02, 0.006, 0.07, 0.006, { ...metal, rz: 0.6 }),
      part(box, 2, CHROME, 0.09, 0.03, kickL / 2 - 0.02, 0.006, 0.07, 0.006, { ...metal, rz: -0.6 }),
    );
    // rack tom: on a post out of the kick, tipped back toward the drummer
    const tomTip = 0.4;
    const tom = { x: -0.045, y: 0.31, z: -0.02 };
    add(
      part(tube, 2, CHROME, tom.x * 0.5, 0.25, -0.01, 0.01, 0.1, 0.01, metal),
      part(tube, 2, SHELL, tom.x, tom.y, tom.z, 0.12, 0.085, 0.12, { rx: -tomTip, rough: 0.12 }),
      part(coin, 2, HEAD, tom.x, tom.y + Math.cos(tomTip) * 0.0435, tom.z - Math.sin(tomTip) * 0.0435, 0.116, 0.116, 1, { rx: -Math.PI / 2 - tomTip, rough: 0.55 }),
    );
    // floor tom: the audience's left, standing on three legs
    const ft = { x: -0.21, z: -0.07 };
    add(
      part(tube, 2, SHELL, ft.x, 0.17, ft.z, 0.15, 0.14, 0.15, { rough: 0.12 }),
      part(coin, 2, HEAD, ft.x, 0.241, ft.z, 0.146, 0.146, 1, { rx: -Math.PI / 2, rough: 0.55 }),
      ...[0, 1, 2].map((i) => {
        const b = (i / 3) * Math.PI * 2 + 0.3;
        return part(box, 2, CHROME, ft.x + Math.sin(b) * 0.085, 0.07, ft.z + Math.cos(b) * 0.085, 0.006, 0.14, 0.006, { ...metal, rx: 0.15, ry: b + Math.PI });
      }),
    );
    // snare: between the drummer's knees on its own stand, nearly flat
    const sn = { x: 0.1, z: -0.12 };
    add(
      ...stand(sn.x, sn.z, 0.2),
      part(tube, 2, CHROME, sn.x, 0.225, sn.z, 0.13, 0.055, 0.13, { rx: -0.08, rough: 0.2, metal: 1 }),
      part(coin, 2, HEAD, sn.x, 0.254, sn.z - 0.002, 0.126, 0.126, 1, { rx: -Math.PI / 2 - 0.08, rough: 0.6 }),
    );
    // hi-hat: two cymbals closed on one stand, audience's right
    const hh = { x: 0.27, z: -0.1 };
    add(...stand(hh.x, hh.z, 0.34), ...cymbal(hh.x, 0.335, hh.z, 0.12, 0), ...cymbal(hh.x, 0.348, hh.z, 0.12, 0));
    // crash over the hi-hat side, ride over the floor tom
    add(...stand(0.17, 0.02, 0.44), ...cymbal(0.17, 0.445, 0.02, 0.17, 0.3));
    add(...stand(-0.3, 0.02, 0.38), ...cymbal(-0.3, 0.385, 0.02, 0.2, 0.18));
    // the throne behind it all
    add(
      part(tube, 2, BLACK, 0.02, 0.09, -0.3, 0.012, 0.18, 0.012, { rough: 0.3 }),
      part(tube, 1, BLACK, 0.02, 0.19, -0.3, 0.12, 0.035, 0.12, { rough: 1, wrap: 0.4 }),
    );
  }

  // ---------- the floor: Smash night (console + four controllers) ----------

  // ---------- the shrine gate around the window: black timber, blood-red lacquer, two tiers of upswept roof,
  // bone tusks down the pillars and horns on the ridge. An original design, menacing on purpose. ----------
  const shrine: Draw[] = [];
  {
    const TIMBER: [number, number, number] = [0.085, 0.07, 0.075];
    const LACQUER: [number, number, number] = [0.42, 0.06, 0.07];
    const BONE: [number, number, number] = [0.86, 0.82, 0.7];
    const STONE: [number, number, number] = [0.3, 0.29, 0.31];
    const z0 = 0.28;
    for (const sx of [-1, 1]) {
      const px = sx * 0.69;
      shrine.push(
        D(box, 2, TIMBER, px, 0.02, z0, 0.13, 1.62, 0.13, { rough: 0.7 }),
        D(box, 2, STONE, px, floorY + 0.045, z0, 0.22, 0.09, 0.22, { rough: 0.95 }),
        D(box, 2, LACQUER, px, -0.6, z0, 0.15, 0.05, 0.15, { rough: 0.4 }),
        D(box, 2, LACQUER, px, 0.6, z0, 0.15, 0.05, 0.15, { rough: 0.4 }),
        // a paper lantern on each pillar, burning red
        D(box, 5, [1, 0.42, 0.22], px, 0.27, z0 + 0.09, 0.07, 0.11, 0.05, { rough: 0.4 }),
        D(box, 2, TIMBER, px, 0.335, z0 + 0.09, 0.09, 0.02, 0.07, { rough: 0.6 }),
        D(box, 2, TIMBER, px, 0.205, z0 + 0.09, 0.09, 0.02, 0.07, { rough: 0.6 }),
      );
      // the upswept ends of both roofs
      shrine.push(
        D(box, 2, TIMBER, sx * 1.07, 0.865, z0 + 0.03, 0.3, 0.045, 0.36, { rz: sx * 0.42, rough: 0.75 }),
        D(box, 2, LACQUER, sx * 1.075, 0.84, z0 + 0.03, 0.28, 0.02, 0.3, { rz: sx * 0.42, rough: 0.4 }),
        D(box, 2, TIMBER, sx * 0.74, 0.975, z0 + 0.03, 0.22, 0.04, 0.3, { rz: sx * 0.42, rough: 0.75 }),
        // horns on the ridge
        D(ball, 2, BONE, sx * 0.36, 1.015, z0 + 0.03, 0.014, 0.04, 0.014, { rz: sx * -0.5, rough: 0.5 }),
      );
    }
    shrine.push(
      D(box, 2, LACQUER, 0, 0.745, z0, 1.62, 0.06, 0.11, { rough: 0.4 }), // the tie beam
      D(box, 2, TIMBER, 0, 0.79, z0 + 0.03, 1.5, 0.035, 0.2, { rough: 0.7 }),
      D(box, 2, TIMBER, 0, 0.825, z0 + 0.03, 1.9, 0.045, 0.36, { rough: 0.75 }), // lower roof
      D(box, 2, LACQUER, 0, 0.8, z0 + 0.03, 1.84, 0.02, 0.3, { rough: 0.4 }),
      D(box, 2, TIMBER, 0, 0.885, z0 + 0.03, 1.0, 0.08, 0.2, { rough: 0.7 }),
      D(box, 2, LACQUER, 0, 0.925, z0 + 0.03, 1.2, 0.02, 0.26, { rough: 0.4 }),
      D(box, 2, TIMBER, 0, 0.945, z0 + 0.03, 1.3, 0.04, 0.3, { rough: 0.75 }), // upper roof
      D(box, 2, TIMBER, 0, 0.985, z0 + 0.03, 0.7, 0.04, 0.1, { rough: 0.7 }), // ridge
      // a row of fangs under the tie beam, so the doorway reads as a mouth
      ...[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) =>
        D(ball, 2, BONE, k * 0.118, 0.7 - (Math.abs(k) === 4 ? 0.02 : 0), z0 + 0.02, Math.abs(k) === 4 ? 0.024 : 0.017, Math.abs(k) === 4 ? 0.065 : 0.04 - (k % 2 ? 0.008 : 0), 0.017, { rough: 0.5 }),
      ),
      // a bone crest over the doorway
      D(ball, 2, BONE, 0, 0.745, z0 + 0.07, 0.05, 0.04, 0.03, { rough: 0.5 }),
      D(ball, 2, BONE, -0.085, 0.75, z0 + 0.065, 0.016, 0.05, 0.016, { rz: 0.5, rough: 0.5 }),
      D(ball, 2, BONE, 0.085, 0.75, z0 + 0.065, 0.016, 0.05, 0.016, { rz: -0.5, rough: 0.5 }),
    );
  }

  // ---------- Ask WM3: a soul. A pale, glowing orb sewn together with stitched seams, a great screw
  // driven through its crown and wisps streaming off the top. A nod to Soul Eater, built from primitives (no
  // character, no traced art). Every part bobs in step and lifts together on hover. ----------
  const soul: Draw[] = [];
  {
    const C = [-0.33, 0.37, 0.4] as const;
    const R = 0.125;
    const K = R / 0.21; // every fixed size below was drawn for a 0.21 orb
    const live = { bob: 0.02, phase: 1.2, follow: 'ask' as const, jelly: C };
    type V3 = [number, number, number];
    const norm = (v: V3): V3 => {
      const l = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / l, v[1] / l, v[2] / l];
    };
    const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    /** The renderer's rx, ry, rz for a part whose local x, y, z axes should point along ax, ay, az. */
    const facing = (ax: V3, ay: V3, az: V3) => euler([[ax[0], ay[0], az[0]], [ax[1], ay[1], az[1]], [ax[2], ay[2], az[2]]]);
    const at3 = (n: V3, r: number): V3 => [C[0] + n[0] * r, C[1] + n[1] * r, C[2] + n[2] * r];
    soul.push(D(ball, 1, [0.5, 0.8, 1], C[0], C[1], C[2], R, R, R, { rough: 0.3, wrap: 0.95, bob: 0.02, phase: 1.2, anchor: 'ask', anchorDy: -0.2, jelly: C }));
    // seams: each runs over the orb through three points; a dark thread with pale cross-stitches every few degrees
    const THREAD: V3 = [0.2, 0.22, 0.26];
    const STITCH: V3 = [0.95, 0.92, 0.8];
    const seams: [V3, V3, V3][] = [
      [[-0.12, 0.97, 0.2], [0.22, 0.12, 0.96], [0.5, -0.82, 0.28]],
      [[-0.8, 0.52, 0.3], [-0.5, 0.0, 0.87], [-0.12, -0.55, 0.83]],
      [[0.45, 0.84, 0.3], [0.78, 0.25, 0.57], [0.93, -0.3, 0.2]],
    ];
    for (const [a, m, b] of seams) {
      const pts: V3[] = [];
      const N = 22;
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        // a quadratic blend through the middle point, pushed back out onto the sphere
        const w0 = (1 - t) * (1 - t);
        const w1 = 2 * t * (1 - t) * 1.6;
        const w2 = t * t;
        pts.push(norm([a[0] * w0 + m[0] * w1 + b[0] * w2, a[1] * w0 + m[1] * w1 + b[1] * w2, a[2] * w0 + m[2] * w1 + b[2] * w2]));
      }
      for (let k = 0; k < N; k++) {
        const n = norm([pts[k][0] + pts[k + 1][0], pts[k][1] + pts[k + 1][1], pts[k][2] + pts[k + 1][2]]);
        if (n[2] < 0.32) continue; // nothing on the rim: thread seen edge-on reads as bumps on the outline
        const along = norm([pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1], pts[k + 1][2] - pts[k][2]]);
        const across = cross(n, along);
        const len = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1], pts[k + 1][2] - pts[k][2]) * R;
        const q = at3(n, R + 0.001 * K);
        soul.push(D(box, 2, THREAD, q[0], q[1], q[2], len * 1.15, 0.005 * K, 0.004 * K, { ...facing(along, across, n), rough: 0.8, ...live }));
        if (k % 2 === 0) {
          const s2 = at3(n, R + 0.003 * K);
          // most stitches lie straight across the seam; every fifth is a cross
          soul.push(D(box, 2, STITCH, s2[0], s2[1], s2[2], 0.04 * K, 0.011 * K, 0.006 * K, { ...facing(across, along, n), rough: 0.7, ...live }));
          if (k % 10 === 4) {
            const d1 = norm([across[0] + along[0], across[1] + along[1], across[2] + along[2]]);
            soul.push(D(box, 2, STITCH, s2[0], s2[1], s2[2], 0.04 * K, 0.011 * K, 0.007 * K, { ...facing(d1, cross(n, d1), n), rough: 0.7, ...live }));
          }
        }
      }
    }
    // the screw: a slotted head on a thick shaft, driven in at the upper left
    {
      const STEEL: V3 = [0.2, 0.23, 0.26];
      const axis = norm([-0.62, 0.72, 0.3]);
      const u = norm(cross([0, 0, 1], axis));
      const v = cross(u, axis);
      const neg = (w: V3): V3 => [-w[0], -w[1], -w[2]];
      const tubeRot = facing(u, axis, v);
      const shaft = at3(axis, R + 0.03 * K);
      const head = at3(axis, R + 0.105 * K);
      const headTop = at3(axis, R + (0.105 + 0.0275) * K);
      const headBottom = at3(axis, R + (0.105 - 0.0275) * K);
      soul.push(
        D(tube, 2, STEEL, shaft[0], shaft[1], shaft[2], 0.07 * K, 0.1 * K, 0.07 * K, { ...tubeRot, rough: 0.45, ...live }),
        D(tube, 2, STEEL, head[0], head[1], head[2], 0.2 * K, 0.055 * K, 0.2 * K, { ...tubeRot, rough: 0.4, ...live }),
        D(coin, 2, [0.26, 0.29, 0.33], headTop[0], headTop[1], headTop[2], 0.2 * K, 0.2 * K, 1, { ...facing(u, neg(v), axis), rough: 0.4, ...live }),
        D(coin, 2, STEEL, headBottom[0], headBottom[1], headBottom[2], 0.2 * K, 0.2 * K, 1, { ...facing(u, v, neg(axis)), rough: 0.5, ...live }),
        D(box, 2, [0.07, 0.08, 0.1], headTop[0] + axis[0] * 0.002, headTop[1] + axis[1] * 0.002, headTop[2] + axis[2] * 0.002, 0.18 * K, 0.006 * K, 0.026 * K, { ...facing(u, axis, v), rough: 0.8, ...live }),
      );
    }
    // wisps streaming off the crown: three tongues, each a run of overlapping spheres that tapers to a point, so
    // the outline is one smooth flame instead of separate lumps
    const tongues: [number, number, number, number, number, number, number][] = [
      // from (x, y), bending through (x, y), to (x, y), root radius: all in 0.21-orb units
      [0.05, 0.15, 0.15, 0.31, 0.35, 0.31, 0.068],
      [0.12, 0.1, 0.25, 0.2, 0.38, 0.16, 0.05],
      [-0.03, 0.17, 0.0, 0.31, 0.11, 0.38, 0.05],
    ];
    for (const [x0, y0, x1, y1, x2, y2, r0] of tongues) {
      const N = 26;
      for (let k = 0; k <= N - 2; k++) { // stop just short of the end: the last spheres are too small to overlap
        const t = k / N;
        const x = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * x1 + t * t * x2;
        const y = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * y1 + t * t * y2;
        const r = r0 * Math.pow(1 - t, 0.8) * K;
        soul.push(D(ball, 1, [0.56, 0.84, 1], C[0] + x * K, C[1] + y * K, C[2], r, r, r, { rough: 0.3, wrap: 0.95, ...live }));
      }
    }
  }

  const draws: Draw[] = [
    D(box, 7, [0.16, 0.18, 0.32], 0, 0.15, -0.85, 7.2, 2.6, 0.04, { rough: 1, wrap: 0.4 }), // wide enough that no void shows past the side walls
    D(box, 7, [0.18, 0.2, 0.36], leftBig.x, leftBig.y, leftBig.z, leftBig.sx, leftBig.sy, leftBig.sz, { ry: leftBig.ry, rough: 1 }),
    D(box, 7, [0.14, 0.16, 0.3], right.x, right.y, right.z, right.sx, right.sy, right.sz, { ry: right.ry, rough: 1 }),
    D(arch, 2, [0.34, 0.05, 0.06], 0, 0.08, 0.2, 1, 1, 1, { rough: 0.45 }),
    ...shrine,
    D(box, 1, [0.55, 0.32, 0.48], 0, 0.05, 0.02, 0.98, 1.18, 0.03, { wrap: 0.65, rough: 1 }),
    D(rug, 6, [0.48, 0.2, 0.28], -0.3, -0.78, 0.55, 4.9, 1, 1.9, { rough: 1, wrap: 0.45 }),
    D(box, 2, [0.085, 0.07, 0.075], 0, -0.42, 0.34, 0.92, 0.06, 0.08, { rough: 0.7 }), // the shrine's sill, in the same black timber
    D(ball, 5, [1, 0.93, 0.7], 0.22, 0.62, 0.32, 0.045, 0.055, 0.045),
    D(ball, 5, [1, 0.93, 0.7], 0.3, 0.66, 0.32, 0.05, 0.06, 0.05),
    D(ball, 5, [1, 0.93, 0.7], 0.38, 0.62, 0.32, 0.045, 0.055, 0.045),
    ...artifacts,
    ...room,
    D(ball, 8, [0.2, 0.38, 0.58], -0.02, 0.16, 0.4, 0.2, 0.2, 0.2, {
      rough: 0.32,
      rx: -Math.PI / 2,
      spin: 0.12,
      tex: mapTex,
      bob: 0.025,
      anchor: 'lilo',
      anchorDy: 0.27,
    }),
    ...soul,
    D(ball, 1, [0.7, 0.6, 0.43], 0.3, 0.02, 0.4, 0.1, 0.1, 0.1, {
      wrap: 0.55,
      rough: 0.85,
      bob: 0.02,
      phase: 2.1,
      anchor: 'builds',
      anchorDy: 0.16,
    }),
  ];

  const SHADOW = 2048;
  const shadowTex = gl.createTexture();
  const shadowFb = gl.createFramebuffer();
  if (!shadowTex || !shadowFb) {
    fail('Could not allocate shadows');
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
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
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  const colorTex = gl.createTexture();
  const depthTex = gl.createTexture();
  const colorFb = gl.createFramebuffer();
  const depthRb = gl.createRenderbuffer();
  if (!colorTex || !depthTex || !colorFb || !depthRb) {
    fail('Could not allocate the frame');
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  // A colour target with its own framebuffer, for the post passes.
  type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };
  const makeTarget = (): Target => {
    const tex = gl.createTexture();
    const fb = gl.createFramebuffer();
    if (!tex || !fb) throw new Error('Could not allocate a post target');
    return { tex, fb, w: 0, h: 0 };
  };
  const sizeTarget = (t: Target, w: number, h: number) => {
    t.w = Math.max(1, w);
    t.h = Math.max(1, h);
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, HDR_FMT, t.w, t.h, 0, gl.RGBA, HDR_TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
  };
  const BLOOM_LEVELS = 6;
  let aoRaw: Target;
  let aoSoft: Target;
  let raysT: Target;
  let combined: Target;
  const bloom: Target[] = [];
  try {
    aoRaw = makeTarget();
    aoSoft = makeTarget();
    raysT = makeTarget();
    combined = makeTarget();
    for (let i = 0; i < BLOOM_LEVELS; i++) bloom.push(makeTarget());
  } catch (err) {
    fail(err instanceof Error ? err.message : 'post targets failed');
    return { focus: () => {}, setCalm: () => {}, setPointer: () => {}, dispose: () => {} };
  }

  // The grade as a real 3D LUT texture (32^3).
  const lutTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_3D, lutTex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0); // 3D uploads refuse a flip
  gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA8, 32, 32, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildLut(32));
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

  let bw = 0;
  let bh = 0;
  const allocTargets = (w: number, h: number) => {
    bw = w;
    bh = h;
    sizeTarget(aoRaw, w >> 1, h >> 1);
    sizeTarget(aoSoft, w >> 1, h >> 1);
    sizeTarget(raysT, w >> 1, h >> 1);
    sizeTarget(combined, w, h);
    for (let i = 0; i < BLOOM_LEVELS; i++) sizeTarget(bloom[i], w >> (i + 1), h >> (i + 1));
    gl.bindTexture(gl.TEXTURE_2D, colorTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, HDR_FMT, w, h, 0, gl.RGBA, HDR_TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, depthTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, HDR_FMT, w, h, 0, gl.RGBA, HDR_TYPE, null);
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

  // ---------- imported .glb props (see models.ts): loaded after the room is up, drawn by the same shader ----------
  const bitmapTex = (bmp: ImageBitmap) => {
    const t = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    return t;
  };
  const modelAbort = new AbortController();
  for (const m of MODELS) {
    loadGLB(m.url, modelAbort.signal)
      .then((model) => {
        if (failed || gl.isContextLost()) return;
        const texCache = new Map<ImageBitmap, WebGLTexture>();
        const texOf = (b: ImageBitmap | null) => {
          if (!b) return null;
          if (!texCache.has(b)) texCache.set(b, bitmapTex(b));
          return texCache.get(b)!;
        };
        const y = m.rest !== undefined ? m.rest + (model.extent[1] * m.size) / 2 : m.y ?? 0;
        model.parts.forEach((part, i) => {
          draws.push(
            D(upload(gl, part.mesh), KIND_MODEL, [part.base[0], part.base[1], part.base[2]], m.x, y, m.z, m.size, m.size, m.size, {
              rx: m.rx ?? 0,
              ry: m.ry ?? 0,
              rz: m.rz ?? 0,
              tex: texOf(part.baseImg),
              mr: texOf(part.mrImg),
              nrm: texOf(part.nrmImg),
              nrmScale: part.nrmScale,
              metal: m.metal ?? part.metal,
              rough: m.rough ?? part.rough,
              alphaCut: part.alphaCut,
              twoSided: part.doubleSided,
              wrap: 0,
              // one part carries the section anchor, so hover and click treat the model as one object
              ...(m.anchor ? (i === 0 ? { anchor: m.anchor } : { follow: m.anchor }) : {}),
            }),
          );
        });
      })
      .catch((err) => {
        if (!modelAbort.signal.aborted) console.warn(`[pod] model ${m.url} skipped:`, err instanceof Error ? err.message : err);
      });
  }

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
    uvScale: gl.getUniformLocation(beauty, 'uUvScale'),
    uvOff: gl.getUniformLocation(beauty, 'uUvOff'),
    uvXY: gl.getUniformLocation(beauty, 'uUvXY'),
    photo: gl.getUniformLocation(beauty, 'uPhoto'),
    shadow: gl.getUniformLocation(beauty, 'uShadow'),
    lightDir: gl.getUniformLocation(beauty, 'uLightDir'),
    fillDir: gl.getUniformLocation(beauty, 'uFillDir'),
    cam: gl.getUniformLocation(beauty, 'uCam'),
    lampA: gl.getUniformLocation(beauty, 'uLampA'),
    lampB: gl.getUniformLocation(beauty, 'uLampB'),
    metal: gl.getUniformLocation(beauty, 'uMetal'),
    alphaCut: gl.getUniformLocation(beauty, 'uAlphaCut'),
    hasNrm: gl.getUniformLocation(beauty, 'uHasNrm'),
    nrmScale: gl.getUniformLocation(beauty, 'uNrmScale'),
    hasMR: gl.getUniformLocation(beauty, 'uHasMR'),
    screen: gl.getUniformLocation(beauty, 'uScreen'),
    nrmMap: gl.getUniformLocation(beauty, 'uNrmMap'),
    mrMap: gl.getUniformLocation(beauty, 'uMRMap'),
  };
  const sModel = gl.getUniformLocation(shadow, 'uModel');
  const sLight = gl.getUniformLocation(shadow, 'uLightVP');
  const bEmissive = gl.getUniformLocation(beauty, 'uEmissive');
  const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);

  let calm = hooks.calm;
  let pointerX = 0;
  let pointerY = 0;
  let hoverId: WorldId | Place | null = null;
  // Camera focus: a click glides the camera most of the way to the object, aimed at it.
  let focusId: WorldId | Place | null = null;
  let camK = 0;
  const camFocus = [0, 0, 0];
  let lastNow = 0;
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

  /** When the pointer last arrived on each hoverable thing, for the jelly wobble. */
  const jellyKick: { [id: string]: number } = {};
  let lastHover: string | null = null;
  const modelOf = (d: Draw, time: number) => {
    const bob = calm ? 0 : Math.sin(time * 1.3 + d.phase) * d.bob;
    const lift = (d.anchor ?? d.follow) && (d.anchor ?? d.follow) === hoverId ? 0.06 : 0;
    const spin = calm ? 0 : time * d.spin;
    if (d.jelly && !calm) {
      // A soft body: a slow breathing squash and stretch plus a gentle rock, and a springy wobble that rings and
      // dies away after the pointer touches it. Volume is kept (wider when shorter). Parts beyond the body, the
      // wisps and the screw head, swing further and a beat later, like hair following a head.
      const id = d.anchor ?? d.follow;
      const since = id && jellyKick[id] !== undefined ? time - jellyKick[id] : 99;
      const ring = Math.exp(-since * 2.6);
      const rx0 = d.x - d.jelly[0];
      const ry0 = d.y - d.jelly[1];
      const rz0 = d.z - d.jelly[2];
      const reach = Math.hypot(rx0, ry0, rz0);
      const lag = Math.min(1.2, reach * 5);
      const a = 0.045 * Math.sin(time * 2.3 + d.phase) + ring * 0.16 * Math.sin(since * 13 - lag);
      const rock = 0.06 * Math.sin(time * 1.7 + d.phase + 1 - lag * 0.6) * (1 + lag) + ring * 0.2 * Math.sin(since * 10 + 0.6 - lag) * (1 + lag);
      const wide = 1 / Math.sqrt(1 + a);
      const px = rx0 * wide;
      const py = ry0 * (1 + a);
      const pz = rz0 * wide;
      const c = Math.cos(rock);
      const sn = Math.sin(rock);
      const own = reach < 1e-6; // the body itself: it changes shape; the parts on it only ride along
      return trs(
        d.jelly[0] + px * c - py * sn,
        d.jelly[1] + px * sn + py * c + bob,
        d.jelly[2] + pz + lift,
        d.rx, d.ry + spin, d.rz + rock,
        own ? d.sx * wide : d.sx, own ? d.sy * (1 + a) : d.sy, own ? d.sz * wide : d.sz,
      );
    }
    return trs(d.x, d.y + bob, d.z + lift, d.rx, d.ry + spin, d.rz, d.sx, d.sy, d.sz);
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
        gl.uniform1f(bLoc.uvScale, d.uvScale);
        gl.uniform2fv(bLoc.uvOff, d.uvOff);
        gl.uniform2fv(bLoc.uvXY, d.uvXY);
        gl.uniform1f(bLoc.metal, d.metal);
        gl.uniform1f(bLoc.alphaCut, d.alphaCut);
        gl.uniform1f(bLoc.hasNrm, d.nrm ? 1 : 0);
        gl.uniform1f(bLoc.nrmScale, d.nrmScale);
        gl.uniform1f(bLoc.hasMR, d.mr ? 1 : 0);
        gl.uniform1f(bLoc.screen, d.screen ? 1 : 0);
        if (d.tex) {
          gl.activeTexture(gl.TEXTURE2);
          gl.bindTexture(gl.TEXTURE_2D, d.tex);
        }
        if (d.nrm) {
          gl.activeTexture(gl.TEXTURE5);
          gl.bindTexture(gl.TEXTURE_2D, d.nrm);
        }
        if (d.mr) {
          gl.activeTexture(gl.TEXTURE6);
          gl.bindTexture(gl.TEXTURE_2D, d.mr);
        }
      }
      if (d.twoSided) gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(d.mesh.vao);
      gl.drawElements(gl.TRIANGLES, d.mesh.count, d.mesh.type, 0);
      if (d.twoSided && prog === 'shadow') gl.enable(gl.CULL_FACE);
    }
  };

  const frame = (now: number) => {
    if (failed || gl.isContextLost()) return;
    raf = requestAnimationFrame(frame);
    resize();
    if (bw < 2 || bh < 2) return;
    const time = (now - t0) / 1000;
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
    lastNow = now;
    const goalK = focusId ? 1 : 0;
    if (focusId) {
      const d = draws.find((x) => x.anchor === focusId);
      if (d) {
        // the Library frames the shelves (their middle, not the top board) and leaves room on the left for its panel
        const lift = focusId === 'library' ? -0.4 : 0;
        const shiftX = focusId === 'library' ? -0.22 : 0;
        const ease = calm || camK < 0.01 ? 1 : 1 - Math.exp(-dt * 6);
        camFocus[0] += (d.x + shiftX + pan[0] - camFocus[0]) * ease;
        camFocus[1] += (d.y + lift + pan[1] - camFocus[1]) * ease;
        camFocus[2] += (d.z + pan[2] - camFocus[2]) * ease;
      }
    }
    camK = calm ? goalK : camK + (goalK - camK) * (1 - Math.exp(-dt * 4.5));
    const kk = camK * camK * (3 - 2 * camK);
    const baseEye: [number, number, number] = [-0.16 * (1 - kk) + pointerX * 0.22 * (1 - kk), 0.26 - pointerY * 0.1 * (1 - kk), 4.25];
    // a section's object fills the frame; the desk is a place you step up to, so the camera goes closer
    const near = focusId === 'library' ? 0.57 : 0.58; // far enough back that all six shelves and the top fit
    const toward: [number, number, number] = [
      baseEye[0] + (baseEye[0] + (camFocus[0] - baseEye[0]) * near - baseEye[0]) * kk,
      baseEye[1] + (baseEye[1] + (camFocus[1] - baseEye[1]) * near - baseEye[1]) * kk,
      baseEye[2] + (baseEye[2] + (camFocus[2] - baseEye[2]) * near - baseEye[2]) * kk,
    ];
    const overhead: [number, number, number] = [
      baseEye[0] + (camFocus[0] + Math.sin(left.ry) * 0.2 - baseEye[0]) * kk,
      baseEye[1] + (camFocus[1] + 0.95 - baseEye[1]) * kk,
      baseEye[2] + (camFocus[2] + Math.cos(left.ry) * 0.2 - baseEye[2]) * kk,
    ];
    const eye: [number, number, number] = focusId === 'desk' ? overhead : toward;
    const target: [number, number, number] = [-0.16 + (camFocus[0] + 0.16) * kk, -0.04 + (camFocus[1] + 0.04) * kk, camFocus[2] * kk];
    const view = lookAt(eye, target, [0, 1, 0]);
    // Keep the whole room in frame at any window shape: 34 degrees tall at 16:9, wider when the window is narrower.
    const fovY = 2 * Math.atan(Math.tan((17 * Math.PI) / 180) * Math.max(1, (16 / 9) / (bw / bh)));
    const proj = perspective(fovY, bw / bh, 0.08, 20);
    const pick = mul(proj, view);
    const mx = (pointerX * 0.5 + 0.5) * canvas.clientWidth;
    const my = (pointerY * 0.5 + 0.5) * canvas.clientHeight;
    // books and games under the pointer
    let bookNear = 14;
    let hitBook: BookHit | null = null;
    let hitX = 0;
    let hitY = 0;
    for (const b of bookHits) {
      // individual books only answer once the bookshelf itself has been opened (the Library view)
      if (b.link !== undefined && focusId !== 'library') continue;
      const p = transformPoint(pick, b.x, b.y, b.z);
      if (p[3] <= 0) continue;
      const x = (p[0] / p[3] * 0.5 + 0.5) * canvas.clientWidth;
      const y = (1 - (p[1] / p[3] * 0.5 + 0.5)) * canvas.clientHeight;
      const dist = Math.abs(x - mx) + Math.abs(y - my) * 0.25;
      if (dist < bookNear) {
        bookNear = dist;
        hitBook = b;
        hitX = x;
        hitY = y;
      }
    }
    const key = hitBook ? `${hitBook.title}|${hitBook.author ?? ''}` : '';
    if (key !== tipKey) {
      tipKey = key;
      tip.textContent = '';
      if (hitBook) {
        const t = document.createElement('strong');
        t.textContent = hitBook.title || 'A book Max read';
        tip.appendChild(t);
        if (hitBook.author) {
          const a = document.createElement('span');
          a.textContent = hitBook.author;
          tip.appendChild(a);
        }
        if (hitBook.link) {
          const go = document.createElement('em');
          go.textContent = `Click: ${hitBook.link.label.toLowerCase()} ↗`;
          tip.appendChild(go);
        }
      }
      tipHref = hitBook?.link?.href ?? '';
      tip.classList.toggle('pod-booktip--on', !!hitBook);
    }
    if (hitBook) tip.style.transform = `translate(${Math.round(hitX)}px, ${Math.round(hitY - 70)}px) translateX(-50%)`;

    hoverId = null;
    let nearest = 78;
    for (const d of draws) {
      if (!d.anchor) continue;
      const p = transformPoint(pick, d.x, d.y, d.z);
      if (p[3] <= 0) continue;
      const x = (p[0] / p[3] * 0.5 + 0.5) * canvas.clientWidth;
      const y = (1 - (p[1] / p[3] * 0.5 + 0.5)) * canvas.clientHeight;
      const dist = Math.hypot(x - mx, y - my);
      if (dist < nearest) {
        nearest = dist;
        hoverId = d.anchor;
      }
    }
    if (hoverId !== lastHover) {
      if (hoverId) jellyKick[hoverId] = time;
      lastHover = hoverId;
    }

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
    gl.clearBufferfv(gl.COLOR, 0, [0.1, 0.07, 0.05, 1]);
    gl.clearBufferfv(gl.COLOR, 1, [1, 0.5, 0.5, 1]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(beauty);
    gl.uniform1f(bEmissive, hdr ? 3.2 : 1);
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
    gl.uniform1i(bLoc.nrmMap, 5);
    gl.uniform1i(bLoc.mrMap, 6);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, portrait);
    drawScene('beauty', time);

    // ---------- post ----------
    // Effect strengths. window.__podFx can override any of them while tuning in devtools.
    const fx = {
      ao: 0.1, aoMin: 0.6, threshold: hdr ? 1.5 : 0.85, bloom: 0.4, rays: 0.3,
      blur: 0.011, ca: 0.005, grain: 0.04, exposure: 0.98, debug: 0,
      ...((window as unknown as { __podFx?: Record<string, number> }).__podFx || {}),
    };
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(quad);
    const tex = (unit: number, t: WebGLTexture | null, target: number = gl.TEXTURE_2D) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(target, t);
    };
    const pass = (p: WebGLProgram, out: Target | null, setup: () => void) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null);
      gl.viewport(0, 0, out ? out.w : canvas.width, out ? out.h : canvas.height);
      gl.useProgram(p);
      setup();
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const tanY = Math.tan(fovY / 2);

    // 1. ambient occlusion at half resolution, then a depth-aware blur
    pass(ssao, aoRaw, () => {
      tex(0, depthTex);
      gl.uniform1i(U(ssao, 'uG'), 0);
      gl.uniform2f(U(ssao, 'uTan'), tanY * (bw / bh), tanY);
      gl.uniform1f(U(ssao, 'uRadius'), fx.ao);
    });
    pass(aoBlur, aoSoft, () => {
      tex(0, aoRaw.tex);
      tex(1, depthTex);
      gl.uniform1i(U(aoBlur, 'uAo'), 0);
      gl.uniform1i(U(aoBlur, 'uG'), 1);
      gl.uniform2f(U(aoBlur, 'uTexel'), 1 / aoRaw.w, 1 / aoRaw.h);
    });

    // 2. bloom: threshold, a six-level dual-Kawase pyramid down, then back up additively
    pass(bloomPre, bloom[0], () => {
      tex(0, colorTex);
      gl.uniform1i(U(bloomPre, 'uSrc'), 0);
      gl.uniform2f(U(bloomPre, 'uTexel'), 1 / bw, 1 / bh);
      gl.uniform1f(U(bloomPre, 'uThreshold'), fx.threshold);
    });
    for (let i = 1; i < BLOOM_LEVELS; i++) {
      const src = bloom[i - 1];
      pass(bloomDown, bloom[i], () => {
        tex(0, src.tex);
        gl.uniform1i(U(bloomDown, 'uSrc'), 0);
        gl.uniform2f(U(bloomDown, 'uTexel'), 1 / src.w, 1 / src.h);
      });
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = BLOOM_LEVELS - 1; i > 0; i--) {
      const src = bloom[i];
      pass(bloomUp, bloom[i - 1], () => {
        tex(0, src.tex);
        gl.uniform1i(U(bloomUp, 'uSrc'), 0);
        gl.uniform2f(U(bloomUp, 'uTexel'), 0.5 / src.w, 0.5 / src.h);
        gl.uniform1f(U(bloomUp, 'uScatter'), 0.85);
      });
    }
    gl.disable(gl.BLEND);

    // 3. light shafts from the pendant and the two sconces, marched over the bright buffer
    const mvpRays = mul(proj, view);
    const toUv = (x: number, y: number, z: number) => {
      const p = transformPoint(mvpRays, x, y, z);
      return [(p[0] / p[3]) * 0.5 + 0.5, (p[1] / p[3]) * 0.5 + 0.5];
    };
    const pendant = toUv(0.3, 0.64, 0.32);
    const sconceA = toUv(-0.72, 0.28, 0.22);
    const sconceB = toUv(0.78, 0.26, 0.22);
    pass(rays, raysT, () => {
      tex(0, bloom[0].tex);
      gl.uniform1i(U(rays, 'uSrc'), 0);
      gl.uniform2fv(U(rays, 'uLights'), [...pendant, ...sconceA, ...sconceB]);
      gl.uniform1fv(U(rays, 'uLightPower'), [1.6, 0.9, 0.9]);
      gl.uniform1f(U(rays, 'uJitter'), calm ? 0 : fract(time) * 50);
    });

    // 4. combine in linear HDR
    pass(combine, combined, () => {
      tex(0, colorTex);
      tex(1, aoSoft.tex);
      tex(2, bloom[0].tex);
      tex(3, raysT.tex);
      gl.uniform1i(U(combine, 'uColor'), 0);
      gl.uniform1i(U(combine, 'uAo'), 1);
      gl.uniform1i(U(combine, 'uBloom'), 2);
      gl.uniform1i(U(combine, 'uRays'), 3);
      gl.uniform1f(U(combine, 'uBloomAmt'), fx.bloom);
      gl.uniform1f(U(combine, 'uRaysAmt'), fx.rays);
      gl.uniform1f(U(combine, 'uAoMin'), fx.aoMin);
      gl.uniform1f(U(combine, 'uDebug'), fx.debug);
    });

    // 5. tilt-shift + DOF, chromatic aberration, ACES, LUT grade, halation, vignette, grain -> screen
    const fp: [number, number, number] = [-0.02 + (camFocus[0] + 0.02) * kk, 0.16 + (camFocus[1] - 0.16) * kk, 0.4 + (camFocus[2] - 0.4) * kk];
    const focusPoint = transformPoint(view, fp[0], fp[1], fp[2]);
    const focusUv = toUv(fp[0], fp[1], fp[2]);
    pass(finalP, null, () => {
      tex(0, combined.tex);
      tex(1, depthTex);
      tex(4, lutTex, gl.TEXTURE_3D);
      gl.uniform1i(U(finalP, 'uColor'), 0);
      gl.uniform1i(U(finalP, 'uG'), 1);
      gl.uniform1i(U(finalP, 'uLut'), 4);
      gl.uniform1f(U(finalP, 'uFocus'), -focusPoint[2]);
      gl.uniform1f(U(finalP, 'uFocusY'), focusUv[1]);
      gl.uniform1f(U(finalP, 'uTime'), calm ? 0 : time);
      gl.uniform1f(U(finalP, 'uAspect'), bw / bh);
      gl.uniform1f(U(finalP, 'uBlur'), fx.blur);
      gl.uniform1f(U(finalP, 'uCa'), fx.ca);
      gl.uniform1f(U(finalP, 'uGrain'), fx.grain);
      gl.uniform1f(U(finalP, 'uExposure'), fx.exposure);
    });
    tex(4, null, gl.TEXTURE_3D);

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
    for (const h of [...padHits, ...badgeHits]) {
      const p = transformPoint(mvp, h.x, h.y, h.z);
      if (p[3] <= 0) continue;
      anchors.push({ id: h.id, x: (p[0] / p[3] * 0.5 + 0.5) * canvas.clientWidth, y: (1 - (p[1] / p[3] * 0.5 + 0.5)) * canvas.clientHeight });
    }
    hooks.onAnchors(anchors);
    if (!ready) {
      ready = true;
      hooks.onReady();
    }
  };

  raf = requestAnimationFrame(frame);

  return {
    focus: (id) => {
      if (id !== focusId) pan[0] = pan[1] = pan[2] = 0;
      focusId = id;
      scene?.classList.toggle('pod-scene--zoomed', !!id);
    },
    setCalm: (next) => {
      calm = next;
    },
    setPointer: (x, y) => {
      pointerX = x;
      pointerY = y;
    },
    dispose: () => {
      tip.remove();
      document.removeEventListener('click', openBook);
      document.removeEventListener('pointerdown', dragStart);
      document.removeEventListener('pointermove', dragMove);
      document.removeEventListener('pointerup', dragEnd);
      document.removeEventListener('pointercancel', dragEnd);
      modelAbort.abort();
      cancelAnimationFrame(raf);
      failed = true;
    },
  };
}

