/** Column-major matrices for the pod room shader. */

export type Mat4 = Float32Array;

export function mat4(): Mat4 {
  const m = new Float32Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

export function mul(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    const b0 = b[c * 4];
    const b1 = b[c * 4 + 1];
    const b2 = b[c * 4 + 2];
    const b3 = b[c * 4 + 3];
    o[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }
  return o;
}

export function translate(x: number, y: number, z: number): Mat4 {
  const m = mat4();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function scale(x: number, y: number, z: number): Mat4 {
  const m = mat4();
  m[0] = x;
  m[5] = y;
  m[10] = z;
  return m;
}

export function rotX(a: number): Mat4 {
  const m = mat4();
  const c = Math.cos(a);
  const s = Math.sin(a);
  m[5] = c;
  m[6] = s;
  m[9] = -s;
  m[10] = c;
  return m;
}

export function rotY(a: number): Mat4 {
  const m = mat4();
  const c = Math.cos(a);
  const s = Math.sin(a);
  m[0] = c;
  m[2] = -s;
  m[8] = s;
  m[10] = c;
  return m;
}

export function rotZ(a: number): Mat4 {
  const m = mat4();
  const c = Math.cos(a);
  const s = Math.sin(a);
  m[0] = c;
  m[1] = s;
  m[4] = -s;
  m[5] = c;
  return m;
}

/** Scale, then pitch, yaw, roll, then translate. */
export function trs(
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number,
  sx: number,
  sy: number,
  sz: number,
): Mat4 {
  return mul(translate(x, y, z), mul(rotZ(rz), mul(rotY(ry), mul(rotX(rx), scale(sx, sy, sz)))));
}

export function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

export function ortho(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const m = new Float32Array(16);
  m[0] = 2 / (right - left);
  m[5] = 2 / (top - bottom);
  m[10] = -2 / (far - near);
  m[12] = -(right + left) / (right - left);
  m[13] = -(top + bottom) / (top - bottom);
  m[14] = -(far + near) / (far - near);
  m[15] = 1;
  return m;
}

export function lookAt(
  eye: [number, number, number],
  center: [number, number, number],
  up: [number, number, number],
): Mat4 {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl;
  zy /= zl;
  zz /= zl;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl;
  xy /= xl;
  xz /= xl;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  const m = mat4();
  m[0] = xx;
  m[1] = yx;
  m[2] = zx;
  m[4] = xy;
  m[5] = yy;
  m[6] = zy;
  m[8] = xz;
  m[9] = yz;
  m[10] = zz;
  m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  return m;
}

/** Inverse-transpose of the upper 3×3. The shader normalizes, so the determinant factor can stay. */
export function normalMat3(m: Mat4): Float32Array {
  const a00 = m[0];
  const a01 = m[4];
  const a02 = m[8];
  const a10 = m[1];
  const a11 = m[5];
  const a12 = m[9];
  const a20 = m[2];
  const a21 = m[6];
  const a22 = m[10];
  const b00 = a11 * a22 - a12 * a21;
  const b01 = a12 * a20 - a10 * a22;
  const b02 = a10 * a21 - a11 * a20;
  const b10 = a02 * a21 - a01 * a22;
  const b11 = a00 * a22 - a02 * a20;
  const b12 = a01 * a20 - a00 * a21;
  const b20 = a01 * a12 - a02 * a11;
  const b21 = a02 * a10 - a00 * a12;
  const b22 = a00 * a11 - a01 * a10;
  return new Float32Array([b00, b01, b02, b10, b11, b12, b20, b21, b22]);
}

export function transformPoint(
  m: Mat4,
  x: number,
  y: number,
  z: number,
  w = 1,
): [number, number, number, number] {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}
