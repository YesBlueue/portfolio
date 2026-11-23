// Stand-in PS1 head until the real face model arrives.
// Draws a low-poly textured head on a tiny canvas with the classic PS1 tricks:
// vertices snapped to whole pixels, textures mapped without perspective
// correction, and a 4x4 ordered dither with reduced color depth.

type Vec3 = [number, number, number];
type Vec2 = [number, number];
type Tri = { i: [number, number, number]; uv: [Vec2, Vec2, Vec2] };

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return l < 1e-9 ? [0, 0, 0] : [a[0] / l, a[1] / l, a[2] / l];
};

const RINGS = 10;
const SEGS = 16;
const TW = 64;
const TH = 32;
const LIGHT = norm([-0.45, 0.55, 0.7]);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function buildMesh() {
  const verts: Vec3[] = [];
  for (let i = 0; i <= RINGS; i++) {
    const lat = (i / RINGS) * Math.PI;
    for (let j = 0; j < SEGS; j++) {
      const lon = (j / SEGS) * Math.PI * 2;
      let x = Math.sin(lat) * Math.cos(lon) * 0.78;
      const y = Math.cos(lat) * 1.08;
      let z = Math.sin(lat) * Math.sin(lon) * 0.86;
      if (y < 0) {
        const k = 1 + y * 0.35; // narrower jaw
        x *= k;
        z *= k;
      }
      const front = Math.cos(lon - Math.PI / 2);
      const mid = Math.exp(-((lat - 1.7) ** 2) / 0.04);
      if (front > 0.9) z += 0.24 * mid * ((front - 0.9) / 0.1); // nose
      if (i === 4 && (j === 3 || j === 5)) z -= 0.08; // eye sockets
      verts.push([x, y, z]);
    }
  }

  const tris: Tri[] = [];
  const add = (ids: [number, number, number], uv: [Vec2, Vec2, Vec2]) => {
    const [a, b, c] = ids;
    const n = cross(sub(verts[b], verts[a]), sub(verts[c], verts[a]));
    if (Math.hypot(...n) < 1e-9) return;
    const cen: Vec3 = [
      (verts[a][0] + verts[b][0] + verts[c][0]) / 3,
      (verts[a][1] + verts[b][1] + verts[c][1]) / 3,
      (verts[a][2] + verts[b][2] + verts[c][2]) / 3,
    ];
    tris.push(dot(n, cen) < 0 ? { i: [a, c, b], uv: [uv[0], uv[2], uv[1]] } : { i: ids, uv });
  };
  for (let i = 0; i < RINGS; i++) {
    for (let j = 0; j < SEGS; j++) {
      const a = i * SEGS + j;
      const b = i * SEGS + ((j + 1) % SEGS);
      const c = (i + 1) * SEGS + j;
      const d = (i + 1) * SEGS + ((j + 1) % SEGS);
      const u0 = j / SEGS;
      const u1 = (j + 1) / SEGS;
      const v0 = i / RINGS;
      const v1 = (i + 1) / RINGS;
      add([a, c, b], [[u0, v0], [u0, v1], [u1, v0]]);
      add([b, c, d], [[u1, v0], [u0, v1], [u1, v1]]);
    }
  }
  return { verts, tris };
}

function buildTexture() {
  const tex = document.createElement("canvas");
  tex.width = TW;
  tex.height = TH;
  const t = tex.getContext("2d");
  if (!t) return tex;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const px = (color: string, x: number, y: number, w = 1, h = 1) => {
    t.fillStyle = color;
    t.fillRect(x, y, w, h);
  };
  px("#c98e6a", 0, 0, TW, TH); // skin
  for (let k = 0; k < 220; k++) px(rnd() < 0.5 ? "#bb805d" : "#d59c77", (rnd() * TW) | 0, (rnd() * TH) | 0);
  px("#2a1712", 0, 0, TW, 9); // hair
  px("#2a1712", 27, 0, 37, 19);
  px("#2a1712", 0, 0, 6, 17);
  for (let x = 5; x < 28; x++) px("#2a1712", x, 9, 1, 1 + ((rnd() * 2.4) | 0));
  px("#2a1712", 11, 11, 3, 1); // brows
  px("#2a1712", 18, 11, 3, 1);
  px("#f3ead6", 11, 13, 3, 2); // eyes
  px("#f3ead6", 18, 13, 3, 2);
  px("#1a0f14", 12, 13, 1, 2);
  px("#1a0f14", 19, 13, 1, 2);
  px("#a8704f", 15, 15, 2, 3); // nose shadow
  px("#7a2e2e", 13, 20, 6, 1); // mouth
  return tex;
}

export function createHeadRenderer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { verts, tris } = buildMesh();
  const tex = buildTexture();

  function texturedTri(A: Vec2, B: Vec2, C: Vec2, uv: [Vec2, Vec2, Vec2], shade: number) {
    // Grow the clip slightly so neighbouring triangles don't leave seams.
    const mx = (A[0] + B[0] + C[0]) / 3;
    const my = (A[1] + B[1] + C[1]) / 3;
    const grow = (p: Vec2): Vec2 => {
      const dx = p[0] - mx;
      const dy = p[1] - my;
      const l = Math.hypot(dx, dy) || 1;
      return [p[0] + (dx / l) * 0.7, p[1] + (dy / l) * 0.7];
    };
    const a = grow(A);
    const b = grow(B);
    const c = grow(C);

    const u0 = uv[0][0] * TW, v0 = uv[0][1] * TH;
    const u1 = uv[1][0] * TW, v1 = uv[1][1] * TH;
    const u2 = uv[2][0] * TW, v2 = uv[2][1] * TH;
    const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
    if (!det) return;
    // Affine map from texture space to screen space (no perspective correction, like the PS1).
    const m11 = ((B[0] - A[0]) * (v2 - v0) - (C[0] - A[0]) * (v1 - v0)) / det;
    const m12 = ((B[1] - A[1]) * (v2 - v0) - (C[1] - A[1]) * (v1 - v0)) / det;
    const m21 = ((C[0] - A[0]) * (u1 - u0) - (B[0] - A[0]) * (u2 - u0)) / det;
    const m22 = ((C[1] - A[1]) * (u1 - u0) - (B[1] - A[1]) * (u2 - u0)) / det;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(m11, m12, m21, m22, A[0] - m11 * u0 - m21 * v0, A[1] - m12 * u0 - m22 * v0);
    ctx.drawImage(tex, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(18,6,28,${((1 - shade) * 0.72).toFixed(3)})`;
    ctx.fill();
    ctx.restore();
  }

  function dither() {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (!d[p + 3]) continue;
        const t = (BAYER[(y & 3) * 4 + (x & 3)] - 7.5) * 1.7;
        for (let k = 0; k < 3; k++) {
          const q = Math.round((d[p + k] + t) / 16) * 16;
          d[p + k] = q < 0 ? 0 : q > 255 ? 255 : q;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function draw(ry: number, rx: number) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);

    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const P: Vec3[] = verts.map(([x, y, z]) => {
      const X = x * cy + z * sy;
      let Z = -x * sy + z * cy;
      const Y = y * cx - Z * sx;
      Z = y * sx + Z * cx;
      return [X, Y, Z];
    });
    const scale = h * 0.37;
    const S: Vec2[] = P.map(([X, Y, Z]) => {
      const p = 4 / (4 - Z);
      return [Math.round(w / 2 + X * p * scale), Math.round(h / 2 - Y * p * scale)];
    });

    const visible: [number, Tri, number][] = [];
    for (const tri of tris) {
      const [a, b, c] = tri.i;
      const A = P[a], B = P[b], C = P[c];
      const n = norm(cross(sub(B, A), sub(C, A)));
      const cz = (A[2] + B[2] + C[2]) / 3;
      const toCam: Vec3 = [-(A[0] + B[0] + C[0]) / 3, -(A[1] + B[1] + C[1]) / 3, 4 - cz];
      if (dot(n, toCam) <= 0) continue;
      visible.push([cz, tri, 0.15 + 0.85 * Math.max(0, dot(n, LIGHT))]);
    }
    visible.sort((p, q) => p[0] - q[0]);
    for (const [, tri, shade] of visible) texturedTri(S[tri.i[0]], S[tri.i[1]], S[tri.i[2]], tri.uv, shade);
    dither();
  }

  return { draw };
}
