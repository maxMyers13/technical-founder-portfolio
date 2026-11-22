/**
 * A dependency-free reader for binary glTF 2.0 (.glb), shaped for roomGL's renderer.
 *
 * It bakes every node's transform into its vertices, so a model comes out as plain parts that share
 * one frame: centred on the origin, its largest side scaled to 1. That is the same convention as
 * roomGL's boxMesh, so a model is placed and sized with D() exactly like a box.
 *
 * Supported: any number of meshes, nodes and materials; interleaved buffer views (byteStride);
 * every accessor component type, normalized or not (so KHR_mesh_quantization works); embedded or
 * external images; metallic-roughness PBR with base colour, metallic-roughness and normal maps;
 * alpha MASK and BLEND (drawn as a cutout). Missing normals are computed.
 *
 * Not supported, with a clear error instead of garbage: Draco and meshopt compression (decompress
 * first, e.g. `npx @gltf-transform/cli copy in.glb out.glb`), sparse accessors, and non-triangle
 * primitives (those are skipped).
 */

/** Ten floats per vertex: position, normal, uv, ao, edge. Matches roomGL's vertex layout. */
export type ModelMesh = { interleaved: Float32Array; indices: Uint16Array | Uint32Array };

export type ModelPart = {
  mesh: ModelMesh;
  /** glTF baseColorFactor, RGBA. */
  base: [number, number, number, number];
  metal: number;
  rough: number;
  /** 0 for opaque; otherwise texels below this alpha are discarded. */
  alphaCut: number;
  doubleSided: boolean;
  baseImg: ImageBitmap | null;
  /** glTF packing: G = roughness, B = metallic. */
  mrImg: ImageBitmap | null;
  nrmImg: ImageBitmap | null;
  nrmScale: number;
  name: string;
};

export type Model = {
  parts: ModelPart[];
  /** The model's proportions after normalising (the largest is 1), for resting it on a surface. */
  extent: [number, number, number];
  triangles: number;
};

type Json = Record<string, any>;
type M4 = Float64Array;

const UNSUPPORTED = ['KHR_draco_mesh_compression', 'EXT_meshopt_compression', 'KHR_meshopt_compression'];
const COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

function identity(): M4 {
  const m = new Float64Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

function multiply(a: M4, b: M4): M4 {
  const o = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  }
  return o;
}

/** A node's local matrix, column-major, from `matrix` or translation / rotation (quaternion) / scale. */
function localMatrix(node: Json): M4 {
  if (node.matrix) return Float64Array.from(node.matrix);
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  const m = new Float64Array(16);
  m[0] = (1 - 2 * (y * y + z * z)) * sx;
  m[1] = 2 * (x * y + z * w) * sx;
  m[2] = 2 * (x * z - y * w) * sx;
  m[4] = 2 * (x * y - z * w) * sy;
  m[5] = (1 - 2 * (x * x + z * z)) * sy;
  m[6] = 2 * (y * z + x * w) * sy;
  m[8] = 2 * (x * z + y * w) * sz;
  m[9] = 2 * (y * z - x * w) * sz;
  m[10] = (1 - 2 * (x * x + y * y)) * sz;
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  m[15] = 1;
  return m;
}

/** The inverse-transpose of the upper 3x3, row-major, for transforming normals; also the determinant. */
function normalMatrix(m: M4): { n: number[]; det: number } {
  const a = m[0], b = m[4], c = m[8];
  const d = m[1], e = m[5], f = m[9];
  const g = m[2], h = m[6], i = m[10];
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const inv = det !== 0 ? 1 / det : 0;
  // cofactor matrix / det is the inverse-transpose
  return {
    det,
    n: [
      A * inv, B * inv, C * inv,
      -(b * i - c * h) * inv, (a * i - c * g) * inv, -(a * h - b * g) * inv,
      (b * f - c * e) * inv, -(a * f - c * d) * inv, (a * e - b * d) * inv,
    ],
  };
}

/** Read an accessor as floats (normalized integers become 0..1 or -1..1), honouring byteStride. */
function readAccessor(gltf: Json, bin: DataView, index: number): { data: Float32Array; size: number; count: number } {
  const acc = gltf.accessors[index];
  if (acc.sparse) throw new Error('Sparse accessors are not supported');
  const size = COMPONENTS[acc.type];
  const count: number = acc.count;
  const data = new Float32Array(count * size);
  if (acc.bufferView === undefined) return { data, size, count };
  const view = gltf.bufferViews[acc.bufferView];
  if ((view.buffer ?? 0) !== 0) throw new Error('Only the GLB binary chunk is supported as a buffer');
  const type: number = acc.componentType;
  const bytes = type === 5126 || type === 5125 ? 4 : type === 5122 || type === 5123 ? 2 : 1;
  const stride = view.byteStride || bytes * size;
  const start = (view.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const norm = !!acc.normalized;
  for (let v = 0; v < count; v++) {
    for (let c = 0; c < size; c++) {
      const at = start + v * stride + c * bytes;
      let x: number;
      switch (type) {
        case 5126: x = bin.getFloat32(at, true); break;
        case 5125: x = bin.getUint32(at, true); break;
        case 5123: x = bin.getUint16(at, true); if (norm) x /= 65535; break;
        case 5122: x = bin.getInt16(at, true); if (norm) x = Math.max(x / 32767, -1); break;
        case 5121: x = bin.getUint8(at); if (norm) x /= 255; break;
        case 5120: x = bin.getInt8(at); if (norm) x = Math.max(x / 127, -1); break;
        default: throw new Error(`Unsupported componentType ${type}`);
      }
      data[v * size + c] = x;
    }
  }
  return { data, size, count };
}

function readIndices(gltf: Json, bin: DataView, prim: Json, vertexCount: number): Uint32Array {
  if (prim.indices === undefined) return Uint32Array.from({ length: vertexCount }, (_, i) => i);
  const { data } = readAccessor(gltf, bin, prim.indices);
  return Uint32Array.from(data);
}

/** Area-weighted smooth normals, for models exported without them. */
function computeNormals(pos: Float32Array, idx: Uint32Array): Float32Array {
  const n = new Float32Array(pos.length);
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    for (const k of [a, b, c]) {
      n[k] += cx;
      n[k + 1] += cy;
      n[k + 2] += cz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l;
    n[i + 1] /= l;
    n[i + 2] /= l;
  }
  return n;
}

async function decodeImages(gltf: Json, buf: ArrayBuffer, binOffset: number, url: string) {
  // No colour-space conversion or premultiply: normal and metallic-roughness maps are data, not pictures.
  const opts: ImageBitmapOptions = { colorSpaceConversion: 'none', premultiplyAlpha: 'none', imageOrientation: 'none' };
  return Promise.all(
    (gltf.images ?? []).map(async (img: Json): Promise<ImageBitmap | null> => {
      try {
        let blob: Blob;
        if (img.bufferView !== undefined) {
          const view = gltf.bufferViews[img.bufferView];
          const start = binOffset + (view.byteOffset ?? 0);
          blob = new Blob([new Uint8Array(buf, start, view.byteLength)], { type: img.mimeType || 'image/png' });
        } else if (img.uri) {
          blob = await (await fetch(new URL(img.uri, new URL(url, location.href)))).blob();
        } else {
          return null;
        }
        return await createImageBitmap(blob, opts);
      } catch {
        // A texture that will not decode (say, KTX2 or WebP on an old browser) falls back to the factor colour.
        return null;
      }
    }),
  );
}

export async function loadGLB(url: string, signal?: AbortSignal): Promise<Model> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const head = new DataView(buf);
  if (buf.byteLength < 20 || head.getUint32(0, true) !== 0x46546c67) throw new Error(`${url} is not a .glb file`);
  if (head.getUint32(4, true) !== 2) throw new Error(`${url} is not glTF 2.0`);

  let gltf: Json | null = null;
  let binOffset = -1;
  let binLength = 0;
  for (let off = 12; off + 8 <= buf.byteLength; ) {
    const len = head.getUint32(off, true);
    const type = head.getUint32(off + 4, true);
    if (type === 0x4e4f534a) gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off + 8, len)));
    else if (type === 0x004e4942 && binOffset < 0) {
      binOffset = off + 8;
      binLength = len;
    }
    off += 8 + len;
  }
  if (!gltf) throw new Error(`${url} has no JSON chunk`);
  const blocked = [...(gltf.extensionsRequired ?? []), ...(gltf.extensionsUsed ?? [])].find((e: string) => UNSUPPORTED.includes(e));
  if (blocked) throw new Error(`${url} uses ${blocked}; decompress it first (npx @gltf-transform/cli copy in.glb out.glb)`);
  const bin = new DataView(buf, Math.max(binOffset, 0), binLength);

  const images = await decodeImages(gltf, buf, Math.max(binOffset, 0), url);
  const imageFor = (ref: Json | undefined) => {
    if (!ref || ref.index === undefined) return null;
    if ((ref.texCoord ?? 0) !== 0) return null; // only the first UV set is carried
    const src = gltf!.textures?.[ref.index]?.source;
    return src === undefined ? null : images[src] ?? null;
  };

  // Walk the scene graph, baking each node's world matrix into its mesh.
  type Raw = { pos: Float32Array; nrm: Float32Array; uv: Float32Array; idx: Uint32Array; prim: Json; name: string };
  const raws: Raw[] = [];
  const walk = (nodeIndex: number, parent: M4) => {
    const node = gltf!.nodes[nodeIndex];
    const world = multiply(parent, localMatrix(node));
    if (node.mesh !== undefined) {
      const mesh = gltf!.meshes[node.mesh];
      const { n: nm, det } = normalMatrix(world);
      for (const prim of mesh.primitives) {
        if ((prim.mode ?? 4) !== 4) continue;
        const p = readAccessor(gltf!, bin, prim.attributes.POSITION);
        const count = p.count;
        const idx = readIndices(gltf!, bin, prim, count);
        if (det < 0) for (let t = 0; t < idx.length; t += 3) [idx[t + 1], idx[t + 2]] = [idx[t + 2], idx[t + 1]];
        const pos = new Float32Array(count * 3);
        for (let v = 0; v < count; v++) {
          const x = p.data[v * 3], y = p.data[v * 3 + 1], z = p.data[v * 3 + 2];
          pos[v * 3] = world[0] * x + world[4] * y + world[8] * z + world[12];
          pos[v * 3 + 1] = world[1] * x + world[5] * y + world[9] * z + world[13];
          pos[v * 3 + 2] = world[2] * x + world[6] * y + world[10] * z + world[14];
        }
        let nrm: Float32Array;
        if (prim.attributes.NORMAL !== undefined) {
          const src = readAccessor(gltf!, bin, prim.attributes.NORMAL).data;
          nrm = new Float32Array(count * 3);
          for (let v = 0; v < count; v++) {
            const x = src[v * 3], y = src[v * 3 + 1], z = src[v * 3 + 2];
            const nx = nm[0] * x + nm[3] * y + nm[6] * z;
            const ny = nm[1] * x + nm[4] * y + nm[7] * z;
            const nz = nm[2] * x + nm[5] * y + nm[8] * z;
            const l = Math.hypot(nx, ny, nz) || 1;
            nrm[v * 3] = nx / l;
            nrm[v * 3 + 1] = ny / l;
            nrm[v * 3 + 2] = nz / l;
          }
        } else {
          nrm = computeNormals(pos, idx);
        }
        const uv = prim.attributes.TEXCOORD_0 !== undefined ? readAccessor(gltf!, bin, prim.attributes.TEXCOORD_0).data : new Float32Array(count * 2);
        raws.push({ pos, nrm, uv, idx, prim, name: mesh.name ?? node.name ?? `mesh ${node.mesh}` });
      }
    }
    for (const child of node.children ?? []) walk(child, world);
  };
  const scene = gltf.scenes?.[gltf.scene ?? 0];
  const roots: number[] = scene?.nodes ?? (gltf.nodes ?? []).map((_: Json, i: number) => i);
  for (const r of roots) walk(r, identity());
  if (!raws.length) throw new Error(`${url} has no triangle meshes`);

  // One shared frame for every part: centre on the bounds, largest side = 1.
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const r of raws) {
    for (let i = 0; i < r.pos.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        lo[k] = Math.min(lo[k], r.pos[i + k]);
        hi[k] = Math.max(hi[k], r.pos[i + k]);
      }
    }
  }
  const size = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const scale = 1 / (Math.max(...size) || 1);
  const mid = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];

  let triangles = 0;
  const parts: ModelPart[] = raws.map((r) => {
    const count = r.pos.length / 3;
    const out = new Float32Array(count * 10);
    for (let v = 0; v < count; v++) {
      const o = v * 10;
      out[o] = (r.pos[v * 3] - mid[0]) * scale;
      out[o + 1] = (r.pos[v * 3 + 1] - mid[1]) * scale;
      out[o + 2] = (r.pos[v * 3 + 2] - mid[2]) * scale;
      out[o + 3] = r.nrm[v * 3];
      out[o + 4] = r.nrm[v * 3 + 1];
      out[o + 5] = r.nrm[v * 3 + 2];
      out[o + 6] = r.uv[v * 2];
      out[o + 7] = r.uv[v * 2 + 1];
      out[o + 8] = 1; // ao: the SSAO pass handles occlusion for models
      out[o + 9] = 0; // edge
    }
    triangles += r.idx.length / 3;
    const indices = count <= 65536 ? Uint16Array.from(r.idx) : r.idx;
    const mat: Json = r.prim.material !== undefined ? gltf!.materials?.[r.prim.material] ?? {} : {};
    const pbr: Json = mat.pbrMetallicRoughness ?? {};
    const mode = mat.alphaMode ?? 'OPAQUE';
    return {
      mesh: { interleaved: out, indices },
      base: (pbr.baseColorFactor ?? [1, 1, 1, 1]) as [number, number, number, number],
      metal: pbr.metallicFactor ?? 1,
      rough: pbr.roughnessFactor ?? 1,
      alphaCut: mode === 'MASK' ? mat.alphaCutoff ?? 0.5 : mode === 'BLEND' ? 0.5 : 0,
      doubleSided: !!mat.doubleSided,
      baseImg: imageFor(pbr.baseColorTexture),
      mrImg: imageFor(pbr.metallicRoughnessTexture),
      nrmImg: imageFor(mat.normalTexture),
      nrmScale: mat.normalTexture?.scale ?? 1,
      name: r.name,
    };
  });

  return { parts, extent: [size[0] * scale, size[1] * scale, size[2] * scale], triangles };
}
