// The interactive tie in the hero portrait.
//
// A chain of points hangs from the knot (verlet physics). It sways a little on its own,
// gets pushed by quick cursor movement, and can be grabbed, dragged and flung.
// Coordinates are in the photo's own pixels. The tie layer extends PAD_X pixels to each
// side and down to LAYER_H times the photo height, so the tie can hang out of the frame.
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

type Pt = { x: number; y: number; px: number; py: number };
type Vec = { x: number; y: number };

function makeFabric(ctx: CanvasRenderingContext2D) {
  // Brown silk with cream and copper diagonal stripes.
  const swatch = document.createElement("canvas");
  swatch.width = swatch.height = 48;
  const s = swatch.getContext("2d");
  if (!s) return "#5a3322";
  s.fillStyle = "#5a3322";
  s.fillRect(0, 0, 48, 48);
  s.save();
  s.translate(24, 24);
  s.rotate(-Math.PI / 4);
  s.translate(-48, -48);
  for (let x = 0; x < 96; x += 24) {
    s.fillStyle = "#e9d8c2";
    s.fillRect(x, 0, 4, 96);
    s.fillStyle = "#a8653f";
    s.fillRect(x + 8, 0, 2, 96);
  }
  s.restore();
  for (let k = 0; k < 260; k++) {
    s.fillStyle = Math.random() < 0.5 ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.05)";
    s.fillRect(Math.random() * 48, Math.random() * 48, 1, 1);
  }
  return ctx.createPattern(swatch, "repeat") ?? "#5a3322";
}

/** Starts the tie on `canvas`, positioned relative to `photo`. Returns a cleanup function. */
export function startTie(canvas: HTMLCanvasElement, photo: HTMLElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fabric = makeFabric(ctx);
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
    let bd = 80;
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
  const onMove = (e: PointerEvent) => {
    prev = mouse;
    mouse = toImg(e);
    if (grab < 0) document.body.classList.toggle("near-tie", nearest(mouse) > 0);
    if (reduce) {
      for (let i = 0; i < 4; i++) step();
      draw();
    }
  };
  const onDown = (e: PointerEvent) => {
    const m = toImg(e);
    const best = nearest(m);
    if (best > 0) {
      e.preventDefault();
      grab = best;
      mouse = m;
      document.body.classList.add("dragging-tie");
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

  const halfWidth = (i: number) => 44 + (i / (N - 1)) * 30;

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
      ctx.moveTo(556, 955);
      ctx.lineTo(650, 955);
      ctx.lineTo(672, IMG_H);
      ctx.lineTo(530, IMG_H);
      ctx.closePath();
      const shirt = ctx.createLinearGradient(530, 0, 672, 0);
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

    // Blade outline from the chain.
    const L: [number, number][] = [];
    const R: [number, number][] = [];
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(N - 1, i + 1)];
      let tx = b.x - a.x;
      let ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
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
    const tip: [number, number] = [end.x + ex * 58, end.y + ey * 58];

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 6;
    ctx.shadowOffsetY = 8;
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < N; i++) ctx.lineTo(L[i][0], L[i][1]);
    ctx.lineTo(tip[0], tip[1]);
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fillStyle = fabric;
    ctx.fill();
    ctx.restore();

    // Soft shading across the blade so it reads as cloth.
    ctx.save();
    ctx.clip();
    const mid = pts[Math.floor(N / 2)];
    const shade = ctx.createLinearGradient(mid.x - 70, 0, mid.x + 70, 0);
    shade.addColorStop(0, "rgba(0,0,0,.35)");
    shade.addColorStop(0.45, "rgba(255,240,220,.08)");
    shade.addColorStop(1, "rgba(0,0,0,.3)");
    ctx.fillStyle = shade;
    ctx.fillRect(-PAD_X, 0, IMG_W + PAD_X * 2, IMG_H * LAYER_H);
    ctx.restore();

    // The knot stays put under the collar.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(560, 892);
    ctx.lineTo(646, 892);
    ctx.lineTo(630, 972);
    ctx.lineTo(576, 972);
    ctx.closePath();
    ctx.shadowColor = "rgba(0,0,0,.35)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = fabric;
    ctx.fill();
    ctx.shadowColor = "transparent";
    const kshade = ctx.createLinearGradient(0, 892, 0, 972);
    kshade.addColorStop(0, "rgba(0,0,0,.35)");
    kshade.addColorStop(0.5, "rgba(255,235,210,.08)");
    kshade.addColorStop(1, "rgba(0,0,0,.25)");
    ctx.fillStyle = kshade;
    ctx.fill();
    ctx.restore();
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
    document.removeEventListener("mouseleave", onLeave);
    document.body.classList.remove("near-tie", "dragging-tie");
  };
}
