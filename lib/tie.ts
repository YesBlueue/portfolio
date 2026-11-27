// The interactive tie in the hero portrait.
//
// A chain of points hangs from the knot (verlet physics). It sways a little on its own,
// gets pushed by quick cursor movement, and can be grabbed, dragged and flung.
// Coordinates are in "tie units": the photo is treated as IMG_W x IMG_H. The real photo is
// 2000 x 2000; at 1.66 photo pixels per unit (measured from the glasses, which span 605 px
// in this photo and 365 in the old one) the tie keeps its size relative to the person.
// The tie is drawn on its own canvas covering the whole window, above everything else on
// the page, so it can be pulled anywhere without being cut off. Each frame the canvas is
// lined up with the photo (including the print's tilt).
//
// Look: matched to the tie in the portrait. A heathered chocolate-brown weave with thin
// double stripes (a pale pinkish-cream line and a dimmer twin) running diagonally from
// upper left to lower right. The fabric is texture-mapped along the chain, so the stripes
// bend with the tie, and it is shaded as a slightly rounded blade with creases where it
// bends, a soft shadow cast on whatever is behind it, and a knot with a dimple under it.
//
// The old stand-in photo had a tie printed in it, so shirt fabric could be painted over
// that area first (COVER_PRINTED_TIE). The current photo has no tie, so it's off.

export const IMG_W = 1205;
export const IMG_H = 1205;

const COVER_PRINTED_TIE = false;
// Bottom of the knot, where the blade hangs from. The knot's top sits on the collar band
// (about 1072, 1350 in the 2000 px photo) with its corners tucked under the collar points.
const KNOT = { x: 646, y: 904 };

// Half-Windsor knot, kept slim: barely wider than the blade at the top and taller than it
// is wide, tapering a little to the blade. In tie units around KNOT.
const KNOT_H = 90; // height
const KNOT_TOP = 44; // half-width across the top
const KNOT_BOTTOM = 35; // half-width at the bottom, about the blade's (36)

// The collar points and the back of the collar, traced in the 2000 px photo. They get
// painted back over the knot from the photo itself, so the knot sits under the collar.
const PHOTO_PX = 2000;
const COLLAR: P2[] = [
  [880, 1300], [1212, 1300], [1212, 1420], [1192, 1484], [1158, 1478], [1135, 1440],
  [1110, 1400], [1094, 1366], [1090, 1346], [1052, 1346], [1048, 1360], [1040, 1382],
  [1000, 1424], [965, 1462], [935, 1478], [905, 1482], [880, 1440],
];
const N = 16; // points along the blade
const SEG = 40; // spacing between points
const STEP_MS = 1000 / 60;

// Blade width, measured from the photo: about 36 px half-width under the knot,
// widening ~0.1 px per px down the tie.
const MAX_HW = 76;
const halfWidth = (i: number) => Math.min(MAX_HW, 36 + i * SEG * 0.095);
const TIP_LEN = 70;

// Fabric texture, in "tie space": u across the blade (centred), v down from the knot.
const TEX_W = MAX_HW * 2 + 8;
const TEX_H = (N - 1) * SEG + TIP_LEN + 20;
const TEX_SCALE = 2; // texture pixels per tie-space pixel

type Pt = { x: number; y: number; px: number; py: number };
type Vec = { x: number; y: number };
type P2 = [number, number];

/** Builds the woven fabric: heathered brown base, twill, and the diagonal double stripes. */
function makeFabric(): HTMLCanvasElement {
  const tex = document.createElement("canvas");
  tex.width = Math.ceil(TEX_W * TEX_SCALE);
  tex.height = Math.ceil(TEX_H * TEX_SCALE);
  const g = tex.getContext("2d");
  if (!g) return tex;
  const W = tex.width;
  const H = tex.height;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Base colour, sampled from the photo and lifted slightly (the photo is in shade).
  g.fillStyle = "rgb(74,52,44)";
  g.fillRect(0, 0, W, H);

  // Heather: short flecks of lighter and darker yarn, mostly following the twill.
  for (let k = 0; k < (W * H) / 9; k++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const len = 2 + rnd() * 5;
    const r = rnd();
    g.strokeStyle =
      r < 0.42 ? "rgba(40,26,22,.28)" : r < 0.8 ? "rgba(112,84,74,.26)" : "rgba(140,108,96,.22)";
    g.lineWidth = 1 + rnd() * 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len * 0.7, y - len * 0.7);
    g.stroke();
  }

  // Twill: very fine diagonal ribs.
  g.save();
  g.globalAlpha = 0.07;
  g.strokeStyle = "#fff";
  g.lineWidth = 1;
  for (let s = -H; s < W + H; s += 4) {
    g.beginPath();
    g.moveTo(s, H);
    g.lineTo(s + H, 0);
    g.stroke();
  }
  g.restore();

  // Double stripes, running upper-left to lower-right (dx/dy ≈ 0.8, measured from the photo),
  // ~62 px apart measured across the stripe.
  const dir = { x: 0.8 / Math.hypot(0.8, 1), y: 1 / Math.hypot(0.8, 1) };
  const perp = { x: dir.y, y: -dir.x };
  const spacing = 62 * TEX_SCALE;
  const reach = W + H;
  for (let s = -reach; s < reach; s += spacing) {
    const lines: [number, number, string][] = [
      [0, 3.2, "rgba(218,188,174,.96)"],
      [7, 2.2, "rgba(190,158,146,.9)"],
    ];
    for (const [off, width, color] of lines) {
      const o = s + off * TEX_SCALE;
      const cx = W / 2 + perp.x * o;
      const cy = H / 2 + perp.y * o;
      g.strokeStyle = color;
      g.lineWidth = width * TEX_SCALE * 0.85;
      g.beginPath();
      g.moveTo(cx - dir.x * reach, cy - dir.y * reach);
      g.lineTo(cx + dir.x * reach, cy + dir.y * reach);
      g.stroke();
    }
  }

  // Weave the stripes in: a light pass of flecks over everything so they don't look printed on.
  for (let k = 0; k < (W * H) / 30; k++) {
    const x = rnd() * W;
    const y = rnd() * H;
    g.fillStyle = rnd() < 0.5 ? "rgba(30,18,14,.22)" : "rgba(255,235,220,.06)";
    g.fillRect(x, y, 1 + rnd() * 1.5, 1);
  }
  return tex;
}

/** Affine map from three texture points to three canvas points (in the current transform). */
function texTri(ctx: CanvasRenderingContext2D, tex: HTMLCanvasElement, src: [P2, P2, P2], dst: [P2, P2, P2]) {
  const [[u0, v0], [u1, v1], [u2, v2]] = src;
  const [[x0, y0], [x1, y1], [x2, y2]] = dst;
  const det = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
  if (!det) return;
  const a = ((x1 - x0) * (v2 - v0) - (x2 - x0) * (v1 - v0)) / det;
  const b = ((y1 - y0) * (v2 - v0) - (y2 - y0) * (v1 - v0)) / det;
  const c = ((x2 - x0) * (u1 - u0) - (x1 - x0) * (u2 - u0)) / det;
  const d = ((y2 - y0) * (u1 - u0) - (y1 - y0) * (u2 - u0)) / det;
  const e = x0 - a * u0 - c * v0;
  const f = y0 - b * u0 - d * v0;
  // Grow the clip a little so neighbouring triangles don't leave hairline seams.
  const mx = (x0 + x1 + x2) / 3;
  const my = (y0 + y1 + y2) / 3;
  const grow = (x: number, y: number): P2 => {
    const dx = x - mx;
    const dy = y - my;
    const l = Math.hypot(dx, dy) || 1;
    return [x + (dx / l) * 1.2, y + (dy / l) * 1.2];
  };
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...grow(x0, y0));
  ctx.lineTo(...grow(x1, y1));
  ctx.lineTo(...grow(x2, y2));
  ctx.closePath();
  ctx.clip();
  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(tex, 0, 0);
  ctx.restore();
}

/** Layer for the tie: over the nav, zipper and spool, under the knitted intro. */
const LAYER_Z = 80;

/** Maps tie units to viewport pixels for `photo`, including any transform on its print. */
function photoMatrix(photo: HTMLElement): DOMMatrix {
  // The print (the nearest ancestor with a transform) is tilted about its centre.
  let print: HTMLElement | null = photo.parentElement;
  while (print && getComputedStyle(print).transform === "none") print = print.parentElement;
  const k = photo.offsetWidth / IMG_W;
  if (!print) {
    const r = photo.getBoundingClientRect();
    return new DOMMatrix().translateSelf(r.left, r.top).scaleSelf(k);
  }
  // The photo's place inside the print, before the tilt.
  let ox = 0, oy = 0;
  let el: HTMLElement | null = photo;
  while (el && el !== print) {
    ox += el.offsetLeft;
    oy += el.offsetTop;
    el = el.offsetParent as HTMLElement | null;
  }
  const t = new DOMMatrix(getComputedStyle(print).transform);
  const box = print.getBoundingClientRect();
  return new DOMMatrix()
    .translateSelf(box.left + box.width / 2, box.top + box.height / 2)
    .multiplySelf(new DOMMatrix([t.a, t.b, t.c, t.d, 0, 0]))
    .translateSelf(-print.offsetWidth / 2 + ox, -print.offsetHeight / 2 + oy)
    .scaleSelf(k);
}

/** Starts the tie for `photo`, on a canvas of its own over the page. Returns a cleanup function. */
export function startTie(photo: HTMLElement): () => void {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: String(LAYER_Z),
    // The same grade as the photo (Portrait.module.css), so the collar repaint matches.
    filter: "sepia(0.1) saturate(1.05) contrast(1.03)",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return () => {};
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tex = makeFabric();
  const knotFabric = ctx.createPattern(tex, "repeat");
  const pts: Pt[] = Array.from({ length: N }, (_, i) => ({
    x: KNOT.x,
    y: KNOT.y + i * SEG,
    px: KNOT.x,
    py: KNOT.y + i * SEG,
  }));

  let dpr = 1;
  let M = photoMatrix(photo);
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    if (reduce) draw();
  };
  // With reduced motion there's no animation loop, so redraw when the page moves.
  const onScroll = () => {
    if (reduce) draw();
  };

  // Pointer, tracked on the whole window since the tie hangs outside the photo.
  let mouse: Vec | null = null;
  let prev: Vec | null = null;
  let grab = -1;
  const toImg = (e: PointerEvent): Vec => {
    const p = photoMatrix(photo).inverse().transformPoint(new DOMPoint(e.clientX, e.clientY));
    return { x: p.x, y: p.y };
  };
  const nearest = (m: Vec) => {
    let best = -1;
    let bd = 85;
    pts.forEach((p, i) => {
      if (i < 2) return;
      const d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  // Something is covering the page (the intro): leave the tie alone.
  const covered = (e: PointerEvent) => e.target instanceof Element && !!e.target.closest("[data-knit]");
  const onMove = (e: PointerEvent) => {
    if (covered(e)) return document.body.classList.remove("near-tie");
    prev = mouse;
    mouse = toImg(e);
    if (grab < 0) document.body.classList.toggle("near-tie", nearest(mouse) > 0);
    if (reduce) {
      for (let i = 0; i < 4; i++) step();
      draw();
    }
  };
  const onDown = (e: PointerEvent) => {
    if (covered(e)) return;
    const m = toImg(e);
    const best = nearest(m);
    if (best > 0) {
      e.preventDefault();
      grab = best;
      mouse = m;
      document.body.classList.add("dragging-tie");
      start();
    }
  };
  const release = () => {
    grab = -1;
    document.body.classList.remove("dragging-tie");
  };
  const onLeave = () => {
    mouse = prev = null;
  };

  let t = 0;
  function step() {
    t += 1;
    const breeze = reduce ? 0 : Math.sin(t * 0.013) * 0.05 + Math.sin(t * 0.031) * 0.03;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + breeze * (i / N);
      p.y += vy + 0.9;
      // A quick swipe near the tie pushes it along.
      if (mouse && prev && grab < 0) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (d < 150) {
          const f = (1 - d / 150) * 0.45;
          p.x += (mouse.x - prev.x) * f;
          p.y += (mouse.y - prev.y) * f * 0.4;
        }
      }
    }
    if (grab > 0 && mouse) {
      pts[grab].x = mouse.x;
      pts[grab].y = mouse.y;
    }
    for (let k = 0; k < 10; k++) {
      pts[0].x = KNOT.x;
      pts[0].y = KNOT.y;
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = (d - SEG) / d;
        if (i === 0) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
      // Keep the blade from folding up past the knot.
      for (let i = 1; i < N; i++) if (pts[i].y < KNOT.y - 10) pts[i].y = KNOT.y - 10;
    }
    if (grab > 0 && mouse) {
      pts[grab].x = mouse.x;
      pts[grab].y = mouse.y;
    }
    prev = mouse;
  }

  /** Edges of the blade: left/right points along the chain, the tip, and segment angles. */
  function outline() {
    const L: P2[] = [];
    const R: P2[] = [];
    const ang: number[] = [];
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N - 1, i + 1)];
      let tx = b.x - a.x;
      let ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      ang.push(Math.atan2(tx, ty)); // 0 when hanging straight down
      const w = halfWidth(i);
      L.push([pts[i].x - ty * w, pts[i].y + tx * w]);
      R.push([pts[i].x + ty * w, pts[i].y - tx * w]);
    }
    const end = pts[N - 1];
    const before = pts[N - 2];
    let ex = end.x - before.x;
    let ey = end.y - before.y;
    const el = Math.hypot(ex, ey) || 1;
    ex /= el;
    ey /= el;
    const tip: P2 = [end.x + ex * TIP_LEN, end.y + ey * TIP_LEN];
    return { L, R, tip, ang };
  }

  function bladePath(c: CanvasRenderingContext2D, L: P2[], R: P2[], tip: P2) {
    c.beginPath();
    c.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < N; i++) c.lineTo(L[i][0], L[i][1]);
    c.lineTo(tip[0], tip[1]);
    for (let i = N - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath();
  }

  /** The half-Windsor knot, drawn with its bottom centre at (0, 0). */
  function knotPath(c: CanvasRenderingContext2D) {
    const h = KNOT_H, t = KNOT_TOP, b = KNOT_BOTTOM;
    c.beginPath();
    c.moveTo(-t, -h);
    c.quadraticCurveTo(0, -h - 5, t, -h);
    c.quadraticCurveTo(t + 3, -h * 0.5, b, -2);
    c.quadraticCurveTo(0, 8, -b, -2);
    c.quadraticCurveTo(-(t + 3), -h * 0.5, -t, -h);
    c.closePath();
  }

  // The photo itself, used to paint the collar back over the knot.
  const photoImg = photo.querySelector("img");
  // With reduced motion the tie only redraws on demand, so draw again once the photo is in.
  if (photoImg && !photoImg.complete) photoImg.addEventListener("load", () => reduce && draw(), { once: true });

  function collarPath(c: CanvasRenderingContext2D) {
    const k = IMG_W / PHOTO_PX;
    c.beginPath();
    COLLAR.forEach(([x, y], i) => (i ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k)));
    c.closePath();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    M = photoMatrix(photo);
    // Nothing to draw while the photo is well off screen (unless the tie is in hand).
    const top = M.f, h = window.innerHeight;
    if (grab < 0 && (top > h + 400 || top + photo.offsetHeight < -1200)) return;
    // At rest, keep the tie under the sticky nav like the photo it hangs from; while it's
    // being pulled, it goes over everything.
    ctx.save();
    if (grab < 0) {
      const nav = document.querySelector("nav")?.getBoundingClientRect();
      if (nav && nav.bottom > 0) {
        ctx.beginPath();
        ctx.rect(0, nav.bottom * dpr, canvas.width, canvas.height);
        ctx.clip();
      }
    }
    ctx.setTransform(M.a * dpr, M.b * dpr, M.c * dpr, M.d * dpr, M.e * dpr, M.f * dpr);
    drawTie();
    ctx.restore();
  }

  function drawTie() {
    if (!ctx) return;

    if (COVER_PRINTED_TIE) {
      // Paint shirt fabric over the tie printed in the photo (inside the frame only).
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, IMG_W, IMG_H);
      ctx.clip();
      ctx.filter = "blur(3px)";
      ctx.beginPath();
      // Traced from the printed tie's edges (565–644 at y 1040, 536–664 at the bottom).
      ctx.moveTo(568, 958);
      ctx.lineTo(640, 958);
      ctx.lineTo(668, IMG_H);
      ctx.lineTo(534, IMG_H);
      ctx.closePath();
      const shirt = ctx.createLinearGradient(534, 0, 668, 0);
      shirt.addColorStop(0, "#1f2f58");
      shirt.addColorStop(0.5, "#273b6c");
      shirt.addColorStop(1, "#1d2c52");
      ctx.fillStyle = shirt;
      ctx.fill();
      ctx.clip();
      ctx.strokeStyle = "rgba(205,180,110,.35)";
      ctx.lineWidth = 3;
      for (let y = 1000; y < IMG_H; y += 72) {
        ctx.beginPath();
        ctx.moveTo(520, y);
        ctx.lineTo(690, y + 5);
        ctx.stroke();
      }
      ctx.restore();
      ctx.filter = "none";
    }

    const { L, R, tip, ang } = outline();

    // 1. Cast shadows: a soft one falling down-right, and a tight contact shadow.
    ctx.save();
    ctx.filter = "blur(14px)";
    ctx.translate(14, 22);
    bladePath(ctx, L, R, tip);
    ctx.fillStyle = "rgba(12,6,4,.5)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.filter = "blur(3px)";
    ctx.translate(3, 5);
    bladePath(ctx, L, R, tip);
    ctx.fillStyle = "rgba(10,5,3,.35)";
    ctx.fill();
    ctx.restore();
    ctx.filter = "none";

    // 2. The fabric, mapped segment by segment so the stripes follow the tie.
    const U = (u: number) => (u + TEX_W / 2) * TEX_SCALE;
    const V = (v: number) => (v + 6) * TEX_SCALE;
    for (let i = 0; i < N - 1; i++) {
      const w0 = halfWidth(i);
      const w1 = halfWidth(i + 1);
      const v0 = i * SEG;
      const v1 = (i + 1) * SEG;
      texTri(ctx, tex, [[U(-w0), V(v0)], [U(w0), V(v0)], [U(w1), V(v1)]], [L[i], R[i], R[i + 1]]);
      texTri(ctx, tex, [[U(-w0), V(v0)], [U(w1), V(v1)], [U(-w1), V(v1)]], [L[i], R[i + 1], L[i + 1]]);
    }
    const wEnd = halfWidth(N - 1);
    const vEnd = (N - 1) * SEG;
    texTri(ctx, tex, [[U(-wEnd), V(vEnd)], [U(wEnd), V(vEnd)], [U(0), V(vEnd + TIP_LEN)]], [L[N - 1], R[N - 1], tip]);

    // 3. Shading, clipped to the blade.
    ctx.save();
    bladePath(ctx, L, R, tip);
    ctx.clip();

    // 3a. Rounded cross-section: dark edges, a soft highlight left of centre (light from the top left).
    for (let i = 0; i < N; i++) {
      const a = L[i];
      const b = R[i];
      const next = i < N - 1 ? [L[i + 1], R[i + 1]] : [tip, tip];
      const gr = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      gr.addColorStop(0, "rgba(10,5,3,.55)");
      gr.addColorStop(0.12, "rgba(10,5,3,.16)");
      gr.addColorStop(0.32, "rgba(255,236,222,.13)");
      gr.addColorStop(0.5, "rgba(255,236,222,.04)");
      gr.addColorStop(0.78, "rgba(10,5,3,.12)");
      gr.addColorStop(1, "rgba(10,5,3,.5)");
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(next[1][0], next[1][1]);
      ctx.lineTo(next[0][0], next[0][1]);
      ctx.closePath();
      ctx.fill();
    }

    // 3b. Light by orientation, and creases where the blade bends.
    for (let i = 0; i < N - 1; i++) {
      const tilt = ang[i]; // >0 swings right
      const bend = ang[i + 1] - ang[i];
      const quad = () => {
        ctx.beginPath();
        ctx.moveTo(L[i][0], L[i][1]);
        ctx.lineTo(R[i][0], R[i][1]);
        ctx.lineTo(R[i + 1][0], R[i + 1][1]);
        ctx.lineTo(L[i + 1][0], L[i + 1][1]);
        ctx.closePath();
      };
      const lit = -Math.sin(tilt) * 0.22;
      if (Math.abs(lit) > 0.01) {
        quad();
        ctx.fillStyle = lit > 0 ? `rgba(255,236,222,${(lit * 0.6).toFixed(3)})` : `rgba(10,5,3,${(-lit).toFixed(3)})`;
        ctx.fill();
      }
      const crease = Math.min(0.45, Math.abs(bend) * 2.2);
      if (crease > 0.02) {
        const m = [(L[i + 1][0] + R[i + 1][0]) / 2, (L[i + 1][1] + R[i + 1][1]) / 2];
        const rg = ctx.createRadialGradient(m[0], m[1], 0, m[0], m[1], halfWidth(i + 1) * 1.1);
        rg.addColorStop(0, `rgba(10,5,3,${crease.toFixed(3)})`);
        rg.addColorStop(1, "rgba(10,5,3,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(m[0] - 120, m[1] - 120, 240, 240);
      }
    }

    // 3c. Dimple just under the knot.
    const dim = ctx.createRadialGradient(KNOT.x, KNOT.y + 6, 2, KNOT.x, KNOT.y + 26, 46);
    dim.addColorStop(0, "rgba(10,5,3,.5)");
    dim.addColorStop(1, "rgba(10,5,3,0)");
    ctx.fillStyle = dim;
    ctx.beginPath();
    ctx.moveTo(KNOT.x - 26, KNOT.y);
    ctx.quadraticCurveTo(KNOT.x, KNOT.y + 62, KNOT.x + 26, KNOT.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3d. Edges: a thin dark rim and a faint highlight on the lit side.
    bladePath(ctx, L, R, tip);
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(28,16,12,.65)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(L[0][0] + 3, L[0][1]);
    for (let i = 1; i < N; i++) ctx.lineTo(L[i][0] + 3, L[i][1]);
    ctx.strokeStyle = "rgba(255,230,214,.12)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. The knot: a half-Windsor, with its own shadow on the blade and the shirt.
    ctx.save();
    ctx.translate(KNOT.x, KNOT.y);
    ctx.save();
    knotPath(ctx);
    ctx.shadowColor = "rgba(8,4,2,.5)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "rgb(74,52,44)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    knotPath(ctx);
    ctx.clip();
    const box: [number, number, number, number] = [-KNOT_TOP - 10, -KNOT_H - 12, KNOT_TOP * 2 + 20, KNOT_H + 24];
    if (knotFabric) {
      // The wrap crosses the blade, so the knot's stripes run at a different angle.
      knotFabric.setTransform(new DOMMatrix().translate(-40, -88).rotate(-58).scale(1 / TEX_SCALE));
      ctx.fillStyle = knotFabric;
      ctx.fillRect(...box);
    }
    // Volume: shadowed where it tucks under the collar, light across the middle, darker
    // as it turns under at the bottom; darker at the folded sides.
    const kv = ctx.createLinearGradient(0, -KNOT_H, 0, 4);
    kv.addColorStop(0, "rgba(8,4,2,.62)");
    kv.addColorStop(0.22, "rgba(8,4,2,.1)");
    kv.addColorStop(0.5, "rgba(255,236,222,.13)");
    kv.addColorStop(1, "rgba(8,4,2,.38)");
    ctx.fillStyle = kv;
    ctx.fillRect(...box);
    const kh = ctx.createLinearGradient(-KNOT_TOP, 0, KNOT_TOP, 0);
    kh.addColorStop(0, "rgba(8,4,2,.55)");
    kh.addColorStop(0.28, "rgba(8,4,2,0)");
    kh.addColorStop(0.72, "rgba(8,4,2,0)");
    kh.addColorStop(1, "rgba(8,4,2,.5)");
    ctx.fillStyle = kh;
    ctx.fillRect(...box);
    // The half-Windsor's wrap: one diagonal fold across the face, upper left to lower right.
    ctx.beginPath();
    ctx.moveTo(-KNOT_TOP + 6, -KNOT_H + 8);
    ctx.quadraticCurveTo(-8, -KNOT_H * 0.55, KNOT_BOTTOM - 6, -10);
    ctx.strokeStyle = "rgba(10,5,3,.5)";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.translate(-2.5, -3);
    ctx.strokeStyle = "rgba(255,232,214,.16)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    knotPath(ctx);
    ctx.strokeStyle = "rgba(28,16,12,.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 5. The collar, painted back over the knot from the photo, with a soft shadow on it.
    // Both happen only inside the knot, so the patch's edges are the knot's own outline.
    if (photoImg && photoImg.complete && photoImg.naturalWidth) {
      // The knot's outline, optionally grown about its middle (grow = 1.5 also takes in the
      // knot's rim and the shadow it casts, so none of it shows through the collar).
      const inKnot = (grow = 1) => {
        const m = ctx.getTransform();
        ctx.translate(KNOT.x, KNOT.y - KNOT_H / 2);
        ctx.scale(grow, grow);
        ctx.translate(0, KNOT_H / 2);
        knotPath(ctx);
        ctx.setTransform(m);
        ctx.clip();
      };
      ctx.save();
      inKnot();
      collarPath(ctx);
      ctx.shadowColor = "rgba(5,8,20,.6)";
      ctx.shadowBlur = 9;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#1b2440";
      ctx.fill();
      ctx.restore();
      ctx.save();
      inKnot(1.5);
      collarPath(ctx);
      ctx.clip();
      ctx.drawImage(photoImg, 0, 0, IMG_W, IMG_H);
      // The same warm wash the photo has (Portrait.module.css, .photo::after).
      const wash = ctx.createLinearGradient(IMG_W * 0.33, 0, IMG_W * 0.67, IMG_H);
      wash.addColorStop(0, "rgba(255,175,95,.2)");
      wash.addColorStop(0.45, "rgba(255,175,95,0)");
      wash.addColorStop(1, "rgba(70,40,30,.15)");
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, IMG_W, IMG_H);
      ctx.restore();
    }
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);
  document.addEventListener("mouseleave", onLeave);

  // Fixed 60 Hz physics steps, so the tie moves at the same speed even if frames drop.
  // The loop only runs while someone can see the tie: not behind the knitted intro, and not
  // once the hero has scrolled well out of view (unless the tie is being held).
  let raf = 0;
  let near = true;
  const html = document.documentElement;
  const hidden = () => html.dataset.intro !== "done" || (!near && grab < 0);
  let last = 0;
  let acc = 0;
  const frame = (now: number) => {
    if (hidden()) {
      raf = 0;
      draw(); // clears the layer while the photo is out of view
      return;
    }
    acc += Math.min(250, now - last);
    last = now;
    let n = 0;
    while (acc >= STEP_MS && n < 15) {
      step();
      acc -= STEP_MS;
      n++;
    }
    draw();
    raf = requestAnimationFrame(frame);
  };
  const start = () => {
    if (reduce || raf || hidden()) return;
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      near = entry.isIntersecting;
      start();
    },
    { rootMargin: "300px 0px" },
  );
  io.observe(photo);
  // Starts once the intro has unravelled.
  const mo = new MutationObserver(start);
  mo.observe(html, { attributes: true, attributeFilter: ["data-intro"] });

  if (reduce) {
    for (let i = 0; i < 200; i++) step();
    draw();
  } else {
    start();
  }

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    mo.disconnect();
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", onScroll);
    canvas.remove();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    window.removeEventListener("blur", release);
    document.removeEventListener("mouseleave", onLeave);
    document.body.classList.remove("near-tie", "dragging-tie");
  };
}
