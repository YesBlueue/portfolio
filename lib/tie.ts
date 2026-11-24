// The interactive tie in the hero portrait.
//
// A chain of points hangs from the knot (verlet physics). It sways a little on its own,
// gets pushed by quick cursor movement, and can be grabbed, dragged and flung.
// Coordinates are in the photo's own pixels. The tie layer extends PAD_X pixels to each
// side and down to LAYER_H times the photo height, so the tie can hang out of the frame.
//
// Look: matched to the tie in the portrait. A heathered chocolate-brown weave with thin
// double stripes (a pale pinkish-cream line and a dimmer twin) running diagonally from
// upper left to lower right. The fabric is texture-mapped along the chain, so the stripes
// bend with the tie, and it is shaded as a slightly rounded blade with creases where it
// bends, a soft shadow cast on whatever is behind it, and a knot with a dimple under it.
//
// The current stand-in photo has a tie printed in it, so we paint shirt fabric over that
// area first. With a final photo taken without a tie, set COVER_PRINTED_TIE to false.

export const IMG_W = 1206;
export const IMG_H = 1280;
export const PAD_X = 400;
export const LAYER_H = 1.6;

const COVER_PRINTED_TIE = true;
const KNOT = { x: 603, y: 968 }; // bottom of the knot, where the blade hangs from
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

/** Starts the tie on `canvas`, positioned relative to `photo`. Returns a cleanup function. */
export function startTie(canvas: HTMLCanvasElement, photo: HTMLElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tex = makeFabric();
  const knotFabric = ctx.createPattern(tex, "repeat");
  const pts: Pt[] = Array.from({ length: N }, (_, i) => ({
    x: KNOT.x,
    y: KNOT.y + i * SEG,
    px: KNOT.x,
    py: KNOT.y + i * SEG,
  }));

  let scale = 1;
  const resize = () => {
    const r = photo.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    scale = (r.width / IMG_W) * dpr;
    canvas.width = Math.round((IMG_W + PAD_X * 2) * scale);
    canvas.height = Math.round(IMG_H * LAYER_H * scale);
    if (reduce) draw();
  };

  // Pointer, tracked on the whole window since the tie hangs outside the photo.
  let mouse: Vec | null = null;
  let prev: Vec | null = null;
  let grab = -1;
  const toImg = (e: PointerEvent): Vec => {
    const r = photo.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * IMG_W, y: ((e.clientY - r.top) / r.height) * IMG_H };
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
  // Phones: gravity follows how the phone is tilted, and shaking it swings the tie.
  // Gravity here is in photo px per step², pointing down the screen by default.
  const GRAVITY = 0.9;
  const grav = { x: 0, y: GRAVITY };
  const gravTo = { x: 0, y: GRAVITY };
  const jolt = { x: 0, y: 0 };
  const DEG = Math.PI / 180;
  /** Device axes (x right, y down the screen as held upright) to the screen as it's shown now. */
  const toScreen = (x: number, y: number) => {
    const a = (screen.orientation?.angle ?? 0) * DEG;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.beta == null || e.gamma == null) return;
    const b = e.beta * DEG, g = e.gamma * DEG;
    // Where "down" points across the face of the screen.
    const [sx, sy] = toScreen(Math.cos(b) * Math.sin(g), Math.sin(b));
    // Lying flat, gravity points into the screen; keep a little pull down so the tie still hangs.
    const flat = Math.max(0, 0.3 - Math.hypot(sx, sy));
    gravTo.x = GRAVITY * sx;
    gravTo.y = GRAVITY * (sy + flat);
  };
  const onShake = (e: DeviceMotionEvent) => {
    const a = e.acceleration;
    if (!a || a.x == null || a.y == null) return;
    const [sx, sy] = toScreen(a.x, -a.y);
    // The tie lags behind the phone, so it swings the other way.
    jolt.x = Math.max(-8, Math.min(8, jolt.x - sx * 0.15));
    jolt.y = Math.max(-8, Math.min(8, jolt.y - sy * 0.15));
  };
  const sensors = !reduce && window.matchMedia("(pointer: coarse)").matches && "DeviceOrientationEvent" in window;
  let sensing = false;
  const listen = () => {
    window.addEventListener("deviceorientation", onTilt);
    window.addEventListener("devicemotion", onShake);
  };
  type Ask = { requestPermission?: () => Promise<string> };
  // iPhones ask first, and only from a tap; Android just works.
  const needsAsk = sensors && typeof (DeviceOrientationEvent as unknown as Ask).requestPermission === "function";
  if (sensors && !needsAsk) {
    sensing = true;
    listen();
  }
  const askForSensors = () => {
    if (!needsAsk || sensing) return;
    sensing = true;
    const ask = async (api: unknown) => (await (api as Ask).requestPermission?.()) === "granted";
    ask(DeviceOrientationEvent)
      .then(async (ok) => {
        // Not allowed yet: try again on the next tap (a refusal the user made sticks anyway).
        if (!ok) return void (sensing = false);
        if (typeof DeviceMotionEvent !== "undefined") await ask(DeviceMotionEvent).catch(() => false);
        listen();
      })
      // Refused without a tap (iPhone): try again on the next tap of the photo.
      .catch(() => (sensing = false));
  };
  // Some browsers have the permission call but grant it without asking; try once up front.
  askForSensors();

  let touchedTie = false;
  const onDown = (e: PointerEvent) => {
    if (covered(e)) return;
    const m = toImg(e);
    const best = nearest(m);
    // A tap on the photo or the tie is a good moment to ask for motion access on iPhones.
    touchedTie = e.pointerType === "touch" && (best > 0 || (m.x >= 0 && m.x <= IMG_W && m.y >= 0 && m.y <= IMG_H));
    if (best > 0) {
      e.preventDefault();
      grab = best;
      mouse = m;
      document.body.classList.add("dragging-tie");
    }
  };
  const release = (e?: Event) => {
    // Permission prompts need a finished tap (pointerup), not just a press.
    if (touchedTie && e?.type === "pointerup") askForSensors();
    touchedTie = false;
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
    grav.x += (gravTo.x - grav.x) * 0.1;
    grav.y += (gravTo.y - grav.y) * 0.1;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + breeze * (i / N) + grav.x + jolt.x * (i / N);
      p.y += vy + grav.y + jolt.y * (i / N);
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
    jolt.x *= 0.8;
    jolt.y *= 0.8;
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
      // Keep the blade from folding up past the knot, unless the phone is upside down.
      if (grav.y > GRAVITY * 0.4) for (let i = 1; i < N; i++) if (pts[i].y < KNOT.y - 10) pts[i].y = KNOT.y - 10;
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

  function knotPath(c: CanvasRenderingContext2D) {
    c.beginPath();
    c.moveTo(551, 886);
    c.quadraticCurveTo(603, 872, 655, 886);
    c.quadraticCurveTo(648, 934, 634, 972);
    c.quadraticCurveTo(603, 984, 572, 972);
    c.quadraticCurveTo(558, 934, 551, 886);
    c.closePath();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, PAD_X * scale, 0);

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

    // 4. The knot: rounded, with its own shadow on the blade and the shirt.
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
    if (knotFabric) {
      // The knot wraps across the tie, so its stripes sit at a different angle.
      knotFabric.setTransform(new DOMMatrix().translate(560, 880).rotate(-58).scale(1 / TEX_SCALE));
      ctx.fillStyle = knotFabric;
      ctx.fillRect(540, 870, 130, 120);
    }
    // Rounded volume: dark under the collar, lighter in the middle, dark at the sides.
    const kv = ctx.createLinearGradient(0, 884, 0, 978);
    kv.addColorStop(0, "rgba(8,4,2,.6)");
    kv.addColorStop(0.3, "rgba(8,4,2,.08)");
    kv.addColorStop(0.55, "rgba(255,236,222,.12)");
    kv.addColorStop(1, "rgba(8,4,2,.35)");
    ctx.fillStyle = kv;
    ctx.fillRect(540, 870, 130, 120);
    const kh = ctx.createLinearGradient(556, 0, 650, 0);
    kh.addColorStop(0, "rgba(8,4,2,.55)");
    kh.addColorStop(0.3, "rgba(8,4,2,0)");
    kh.addColorStop(0.7, "rgba(8,4,2,0)");
    kh.addColorStop(1, "rgba(8,4,2,.5)");
    ctx.fillStyle = kh;
    ctx.fillRect(540, 870, 130, 120);
    ctx.restore();
    knotPath(ctx);
    ctx.strokeStyle = "rgba(28,16,12,.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);
  document.addEventListener("mouseleave", onLeave);

  // Fixed 60 Hz physics steps, so the tie moves at the same speed even if frames drop.
  let raf = 0;
  if (reduce) {
    for (let i = 0; i < 200; i++) step();
    draw();
  } else {
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
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
    raf = requestAnimationFrame(frame);
  }

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    window.removeEventListener("blur", release);
    window.removeEventListener("deviceorientation", onTilt);
    window.removeEventListener("devicemotion", onShake);
    document.removeEventListener("mouseleave", onLeave);
    document.body.classList.remove("near-tie", "dragging-tie");
  };
}
