// The intro: the whole screen is a hand-knit sweater with the name worked into it, and a
// loose end of yarn hanging off the top row. Pull the yarn and the knitting unravels row
// by row (the way a real cast-off edge does), uncovering the site underneath. After a
// decent tug it catches and runs away on its own.
//
// Fabric is drawn once into an offscreen canvas, stitch by stitch from small pre-shaded
// sprites. Each frame only clips that canvas to the rows that are still knitted, then
// draws the live loops along the edge and the crinkled yarn on top.

type RGB = [number, number, number];

const PALETTE: Record<string, RGB> = {
  r: [146, 68, 43], // rust, the body of the sweater
  c: [236, 223, 198], // cream
  k: [54, 37, 29], // cocoa
  m: [70, 86, 58], // moss
  y: [222, 166, 62], // mustard
  a: [188, 136, 86], // camel
};

// 5x7 letters, only the ones the name needs.
const GLYPHS: Record<string, string[]> = {
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
};

const NAME = "THAW THAW TUN";
const TAU = Math.PI * 2;
const N = 40; // rope points after the anchor
const VARIANTS = [0.9, 0.97, 1.03, 1.09]; // heathered brightness per stitch

const textCols = (s: string) => [...s].reduce((w, ch) => w + (ch === " " ? 3 : 5), 0) + s.length - 1;

function rgba(c: RGB, f = 1, a = 1) {
  const v = (n: number) => Math.max(0, Math.min(255, Math.round(n * f)));
  return `rgba(${v(c[0])},${v(c[1])},${v(c[2])},${a})`;
}

export type KnitHooks = {
  /** Every frame: where the loose end of the yarn is, and how far down the unravelled edge has reached, in CSS px. */
  onFrame: (x: number, y: number, edge: number) => void;
  onGrab: () => void;
  onAuto: () => void;
  /** Pressed on the fabric, not on the yarn. */
  onMiss: () => void;
  onDone: () => void;
};

export type Knit = { unravel: () => void; destroy: () => void };

export function startKnit(canvas: HTMLCanvasElement, hooks: KnitHooks): Knit {
  const ctx = canvas.getContext("2d")!;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;
  let sw = 14, sh = 11, cols = 0, rows = 0, x0 = 0;
  let grid: string[][] = [];
  let purl: boolean[][] = [];
  let fabric: HTMLCanvasElement | null = null;

  let eaten = 0; // stitches unravelled, may be fractional
  let total = 1;
  let pulled = 0; // px of yarn pulled by hand
  let auto = false;
  let rate = 0;
  let done = false;
  let touched = false;

  const P = Array.from({ length: N + 1 }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
  let ropeLen = 200;
  let grab = -1;
  const target = { x: 0, y: 0 };

  // ---------- fabric ----------

  function layout() {
    const one = textCols(NAME);
    let lines = [NAME];
    let s = W / (one + 8);
    if (s < 9.5) {
      lines = ["THAW", "THAW", "TUN"];
      s = W / (textCols("THAW") + 6);
    }
    sw = Math.max(8, Math.min(17, s));
    sh = sw * 0.78;
    cols = Math.ceil(W / sw) + 1;
    rows = Math.ceil(H / sh) + 1;
    x0 = (W - cols * sw) / 2;
    total = cols * rows;

    grid = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) =>
        // A staggered grid of little camel dots over the rust.
        r % 8 === 4 && (c + (Math.floor(r / 8) % 2) * 4) % 8 === 0 ? "a" : "r",
      ),
    );
    purl = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));

    const set = (r: number, f: (c: number) => string) => {
      if (r < 0 || r >= rows) return;
      for (let c = 0; c < cols; c++) grid[r][c] = f(c);
    };

    const GH = lines.length === 1 ? 9 : 8;
    const GAP = 3;
    const blockH = lines.length * GH + (lines.length - 1) * GAP;
    const top = Math.round(rows * 0.45 - blockH / 2);
    const bottom = top + blockH - 1;
    const mid = Math.floor(cols / 2);

    // Cream band for the name, with a cocoa/mustard checker either side.
    for (let r = top - 3; r <= bottom + 3; r++) set(r, () => "c");
    set(top - 4, (c) => (c % 2 ? "y" : "k"));
    set(bottom + 4, (c) => (c % 2 ? "y" : "k"));
    set(top - 5, () => "c");
    set(bottom + 5, () => "c");

    // Fair-isle diamonds on moss, above and below.
    const diamonds = (start: number) => {
      for (let i = 0; i < 7; i++) {
        set(start + i, (c) => {
          const m = (((c - mid) % 8) + 8) % 8;
          if (i === 3 && (m === 4 || m === 0)) return "c";
          return Math.abs(m - 4) === 3 - Math.abs(i - 3) ? "y" : "m";
        });
      }
      set(start - 1, () => "c");
      set(start + 7, () => "c");
    };
    diamonds(top - 13);
    diamonds(bottom + 7);

    // The name, in cocoa.
    lines.forEach((line, li) => {
      let c = Math.floor((cols - textCols(line)) / 2);
      const r0 = top + li * (GH + GAP);
      for (const ch of line) {
        const g = GLYPHS[ch];
        if (g) {
          for (let i = 0; i < GH; i++) {
            const src = g[Math.floor((i * 7) / GH)];
            for (let j = 0; j < 5; j++) {
              const r = r0 + i;
              if (src[j] === "1" && r >= 0 && r < rows && c + j >= 0 && c + j < cols) grid[r][c + j] = "k";
            }
          }
          c += 6;
        } else c += 4;
      }
    });

    // Ribbed hem: knit two, purl two, in moss.
    for (let r = Math.max(0, rows - 5); r < rows; r++) {
      set(r, () => "m");
      for (let c = 0; c < cols; c++) purl[r][c] = c % 4 >= 2;
    }
  }

  const sprites = new Map<string, HTMLCanvasElement>();
  const OX = () => sw * 0.2; // sprite padding, sides
  const OY = () => sh * 0.2; // sprite padding, top and bottom

  function sprite(ch: string, v: number, isPurl: boolean) {
    const key = `${ch}${v}${isPurl ? "p" : ""}`;
    const hit = sprites.get(key);
    if (hit) return hit;

    const col = PALETTE[ch].map((n) => n * VARIANTS[v]) as RGB;
    const ox = OX(), oy = OY();
    const cv = document.createElement("canvas");
    cv.width = Math.ceil((sw + ox * 2) * dpr);
    cv.height = Math.ceil((sh + oy * 2) * dpr);
    const g = cv.getContext("2d")!;
    g.scale(dpr, dpr);
    g.translate(ox, oy);

    // The shadowed gap between stitches.
    g.fillStyle = rgba(col, 0.4);
    g.fillRect(0, 0, sw + 0.6, sh + 0.6);

    const legs: [number, number, number, number, number][] = isPurl
      ? [
          [sw / 2, sh * 0.3, sw * 0.5, sh * 0.27, -0.06],
          [sw / 2, sh * 0.76, sw * 0.5, sh * 0.27, 0.06],
        ]
      : [
          [sw / 2 - sw * 0.21, sh * 0.5, sw * 0.22, sh * 0.66, -0.42],
          [sw / 2 + sw * 0.21, sh * 0.5, sw * 0.22, sh * 0.66, 0.42],
        ];

    for (const [cx, cy, rx, ry, rot] of legs) {
      g.save();
      g.translate(cx, cy);
      g.rotate(rot);
      g.beginPath();
      g.ellipse(0, 0, rx, ry, 0, 0, TAU);
      const grad = g.createRadialGradient(-rx * 0.3, -ry * 0.3, 0, 0, 0, Math.max(rx, ry) * 1.05);
      grad.addColorStop(0, rgba(col, 1.3));
      grad.addColorStop(0.45, rgba(col, 1));
      grad.addColorStop(1, rgba(col, 0.55));
      g.fillStyle = grad;
      g.fill();
      g.clip();
      // The twist of the plies.
      g.strokeStyle = rgba(col, 0.45, 0.32);
      g.lineWidth = Math.max(0.5, sw * 0.04);
      const step = Math.max(2, sw * 0.14);
      for (let t = -ry * 1.6; t < ry * 1.6; t += step) {
        g.beginPath();
        if (isPurl) {
          g.moveTo(t - ry, -ry * 1.2);
          g.lineTo(t + ry, ry * 1.2);
        } else {
          g.moveTo(-rx * 1.4, t - rx);
          g.lineTo(rx * 1.4, t + rx);
        }
        g.stroke();
      }
      g.restore();
    }

    // A few stray fibres.
    g.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * sw, y = Math.random() * sh, a = Math.random() * TAU, l = sw * (0.15 + Math.random() * 0.25);
      g.strokeStyle = rgba(col, 1.45, 0.3);
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l, y, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }

    sprites.set(key, cv);
    return cv;
  }

  function build() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const frac = eaten / total;
    sprites.clear();
    layout();
    eaten = frac * total;

    fabric = document.createElement("canvas");
    fabric.width = canvas.width;
    fabric.height = canvas.height;
    const f = fabric.getContext("2d")!;
    f.fillStyle = rgba(PALETTE.r, 0.4);
    f.fillRect(0, 0, fabric.width, fabric.height);
    const ox = OX(), oy = OY();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = sprite(grid[r][c], (Math.random() * VARIANTS.length) | 0, purl[r][c]);
        f.drawImage(s, Math.round((x0 + c * sw - ox) * dpr), Math.round((r * sh - oy) * dpr));
      }
    }

    // Lamp light from the top left, falling off into the corners.
    f.setTransform(dpr, 0, 0, dpr, 0, 0);
    const lamp = f.createRadialGradient(W * 0.22, H * 0.12, 0, W * 0.22, H * 0.12, Math.max(W, H) * 0.95);
    lamp.addColorStop(0, "rgba(255,214,150,.16)");
    lamp.addColorStop(1, "rgba(255,214,150,0)");
    f.fillStyle = lamp;
    f.fillRect(0, 0, W, H);
    const vig = f.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    vig.addColorStop(0, "rgba(22,9,4,0)");
    vig.addColorStop(1, "rgba(22,9,4,.42)");
    f.fillStyle = vig;
    f.fillRect(0, 0, W, H);

    // Let the yarn hang straight down from wherever the edge is now.
    const a = anchor();
    ropeLen = Math.max(ropeLen, Math.min(340, Math.max(160, H * 0.36)));
    for (let i = 0; i <= N; i++) {
      const p = P[i];
      p.x = p.px = a.x + Math.sin(i * 0.7) * 2;
      p.y = p.py = a.y + (ropeLen * i) / N;
    }
  }

  // ---------- the unravelling edge ----------

  /** The stitch about to come undone, and where the yarn leaves the fabric. */
  function anchor() {
    const r = Math.min(rows - 1, Math.floor(eaten / cols));
    const e = Math.min(cols, eaten - r * cols);
    // Rows alternate direction, as knitting does: right to left, then back.
    const x = r % 2 === 0 ? x0 + (cols - e - 0.5) * sw : x0 + (e + 0.5) * sw;
    const c = Math.max(0, Math.min(cols - 1, r % 2 === 0 ? cols - 1 - Math.floor(e) : Math.floor(e)));
    return { x: Math.max(3, Math.min(W - 3, x)), y: r * sh + sh * 0.3, color: PALETTE[grid[r]?.[c] ?? "r"] };
  }

  function startAuto() {
    if (auto || done) return;
    auto = true;
    grab = -1;
    rate = Math.max(cols * 2.2, 90);
    hooks.onAuto();
  }

  // ---------- physics ----------

  let tick = 0;

  function step() {
    tick++;
    const a = anchor();
    P[0].x = P[0].px = a.x;
    P[0].y = P[0].py = a.y;

    let pin = -1;
    if (auto) {
      rate *= 1.055;
      eaten = Math.min(total, eaten + rate / 60);
      // An invisible hand reels the yarn off past the top-right corner.
      pin = N;
      const rx = W + 60, ry = -60;
      P[N].x = rx;
      P[N].y = ry;
      ropeLen = Math.hypot(rx - a.x, ry - a.y) * 1.1 + 40;
    } else if (grab >= 0) {
      pin = grab;
      P[grab].x += (target.x - P[grab].x) * 0.6;
      P[grab].y += (target.y - P[grab].y) * 0.6;
    } else if (!touched && !reduced && tick % 210 === 0) {
      // Every few seconds, a little twitch, so the eye finds it.
      P[N].px -= (tick / 210) % 2 ? 7 : -7;
    }

    const seg = ropeLen / N;
    const sway = reduced || touched ? 0 : Math.sin(tick * 0.03) * 0.015;
    for (let i = 1; i <= N; i++) {
      if (i === pin) continue;
      const p = P[i];
      const vx = (p.x - p.px) * 0.985;
      const vy = (p.y - p.py) * 0.985;
      p.px = p.x;
      p.py = p.y;
      p.x += vx + sway * (i / N);
      p.y += vy + 0.32;
    }
    for (let k = 0; k < 24; k++) {
      for (let i = 0; i < N; i++) {
        const p = P[i], q = P[i + 1];
        const dx = q.x - p.x, dy = q.y - p.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        const diff = (d - seg) / d;
        const wp = i === 0 || i === pin ? 0 : 1;
        const wq = i + 1 === pin ? 0 : 1;
        if (wp + wq === 0) continue;
        const sp = wp / (wp + wq), sq = wq / (wp + wq);
        p.x += dx * diff * sp;
        p.y += dy * diff * sp;
        q.x -= dx * diff * sq;
        q.y -= dy * diff * sq;
      }
    }

    // Pulling past the slack draws more yarn out of the fabric.
    if (grab >= 0 && !auto) {
      const ex = Math.hypot(target.x - a.x, target.y - a.y) - grab * seg;
      if (ex > 0.5) {
        eaten = Math.min(total, eaten + Math.min(ex / (sw * 0.45), 3));
        pulled += ex;
        ropeLen = Math.min(Math.max(W, H) * 0.9, ropeLen + (ex * 0.85 * N) / grab);
        if (pulled >= Math.min(650, Math.max(220, W * 0.4))) startAuto();
      }
    }

    if (eaten >= total && !done) {
      done = true;
      hooks.onDone();
    }
  }

  // ---------- drawing ----------

  function edgeShadow(xa: number, xb: number, y: number) {
    if (xb <= xa) return;
    const g = ctx.createLinearGradient(0, y - 14, 0, y + 2);
    g.addColorStop(0, "rgba(22,9,4,0)");
    g.addColorStop(1, "rgba(22,9,4,.3)");
    ctx.fillStyle = g;
    ctx.fillRect(xa, y - 14, xb - xa, 16);
  }

  function loop(c: number, r: number) {
    if (r >= rows) return;
    const x = x0 + (c + 0.5) * sw, y = r * sh;
    const col = PALETTE[grid[r][c]];
    ctx.beginPath();
    ctx.moveTo(x - sw * 0.27, y + sh * 0.2);
    ctx.bezierCurveTo(x - sw * 0.32, y - sh * 0.34, x + sw * 0.32, y - sh * 0.34, x + sw * 0.27, y + sh * 0.2);
    ctx.strokeStyle = rgba(col, 0.45);
    ctx.lineWidth = Math.max(1.6, sw * 0.24);
    ctx.stroke();
    ctx.strokeStyle = rgba(col, 1.12);
    ctx.lineWidth = Math.max(1, sw * 0.15);
    ctx.stroke();
  }

  function drawYarn(color: RGB) {
    let L = 0;
    for (let i = N; i > 0; i--) L += Math.hypot(P[i - 1].x - P[i].x, P[i - 1].y - P[i].y);
    const lam = sw * 0.95, amp = sh * 0.2;

    // Freshly unravelled yarn stays crinkled from the stitches it used to be.
    ctx.beginPath();
    ctx.moveTo(P[N].x, P[N].y);
    let s = 0;
    for (let i = N; i > 0; i--) {
      const ax = P[i].x, ay = P[i].y, bx = P[i - 1].x, by = P[i - 1].y;
      const l = Math.hypot(bx - ax, by - ay) || 0.0001;
      const nx = -(by - ay) / l, ny = (bx - ax) / l;
      const n = Math.max(1, Math.ceil(l / 2.5));
      for (let k = 1; k <= n; k++) {
        const u = k / n, ss = s + u * l;
        const taper = Math.min(1, (L - ss) / (sw * 1.5), ss / (sw * 0.8));
        const o = amp * taper * Math.sin((ss / lam) * TAU);
        ctx.lineTo(ax + (bx - ax) * u + nx * o, ay + (by - ay) * u + ny * o);
      }
      s += l;
    }

    const w = Math.max(3, sw * 0.42);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.save();
    ctx.shadowColor = "rgba(20,8,4,.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 6;
    ctx.strokeStyle = rgba(color, 0.5);
    ctx.lineWidth = w + 1.4;
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = rgba(color, 1.05);
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.setLineDash([w * 0.45, w * 0.75]);
    ctx.strokeStyle = rgba(color, 0.62, 0.55);
    ctx.lineWidth = w * 0.55;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(-w * 0.14, -w * 0.18);
    ctx.strokeStyle = rgba(color, 1.45, 0.45);
    ctx.lineWidth = w * 0.3;
    ctx.stroke();
    ctx.restore();

    // A frayed tip.
    const e = P[N], b = P[N - 1];
    const ang = Math.atan2(e.y - b.y, e.x - b.x);
    ctx.strokeStyle = rgba(color, 1.15);
    ctx.lineWidth = Math.max(0.8, w * 0.3);
    for (let i = 0; i < 4; i++) {
      const t = ang + (i - 1.5) * 0.32;
      const l = sw * (0.45 + (i % 2) * 0.3);
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.quadraticCurveTo(e.x + Math.cos(t) * l * 0.6, e.y + Math.sin(t) * l * 0.6, e.x + Math.cos(t + 0.3) * l, e.y + Math.sin(t + 0.3) * l);
      ctx.stroke();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const a = anchor();

    if (eaten < total && fabric) {
      const r = Math.floor(eaten / cols);
      const ei = Math.floor(eaten - r * cols);
      const even = r % 2 === 0;
      const remA = even ? 0 : ei, remB = even ? cols - ei : cols; // still knitted in row r
      const eatA = even ? remB : 0, eatB = even ? cols : remA; // already gone from row r

      edgeShadow(x0 + remA * sw, x0 + remB * sw, r * sh);
      edgeShadow(x0 + eatA * sw, x0 + eatB * sw, (r + 1) * sh);

      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + remA * sw, r * sh, (remB - remA) * sw, sh + 1);
      ctx.rect(0, (r + 1) * sh, W, H);
      ctx.clip();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(fabric, 0, 0);
      ctx.restore();

      for (let c = remA; c < remB; c++) loop(c, r);
      for (let c = eatA; c < eatB; c++) loop(c, r + 1);
    }

    drawYarn(a.color);
    hooks.onFrame(P[N].x, P[N].y, eaten >= total ? H : Math.floor(eaten / cols) * sh);
  }

  // ---------- input ----------

  function onDown(e: PointerEvent) {
    if (auto || done) return;
    const reach = e.pointerType === "touch" ? 56 : 40;
    let best = -1, bd = reach * reach;
    for (let i = 1; i <= N; i++) {
      const d = (P[i].x - e.clientX) ** 2 + (P[i].y - e.clientY) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    touched = true;
    if (best < 0) {
      // Missed: flick the yarn toward the press so it's obvious where it is.
      P[N].px -= Math.sign(e.clientX - P[N].x) * 6;
      hooks.onMiss();
      return;
    }
    e.preventDefault();
    if (reduced) {
      done = true;
      hooks.onDone();
      return;
    }
    grab = best;
    target.x = e.clientX;
    target.y = e.clientY;
    canvas.style.cursor = "grabbing";
    hooks.onGrab();
  }

  function onMove(e: PointerEvent) {
    if (grab >= 0) {
      target.x = e.clientX;
      target.y = e.clientY;
      return;
    }
    if (auto || done || e.pointerType === "touch") return;
    let near = false;
    for (let i = 1; i <= N && !near; i++) near = (P[i].x - e.clientX) ** 2 + (P[i].y - e.clientY) ** 2 < 1600;
    canvas.style.cursor = near ? "grab" : "";
  }

  function onUp() {
    if (grab < 0) return;
    grab = -1;
    canvas.style.cursor = "";
  }

  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      build();
      draw();
    }, 120);
  };
  window.addEventListener("resize", onResize);

  // ---------- loop ----------

  build();
  // Start with a few stitches already pulled out, so the loose end hangs clear of the edge.
  eaten = Math.round(cols * 0.12) + 2;
  build();
  for (let i = 0; i < 90; i++) step(); // let the yarn settle before the first frame
  draw();

  let raf = 0, last = performance.now(), acc = 0;
  const frame = (now: number) => {
    acc = Math.min(acc + (now - last), 250);
    last = now;
    let n = 0;
    while (acc >= 1000 / 60 && n < 15) {
      step();
      acc -= 1000 / 60;
      n++;
    }
    draw();
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    unravel() {
      touched = true;
      if (reduced) {
        if (!done) {
          done = true;
          hooks.onDone();
        }
        return;
      }
      startAuto();
    },
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", onResize);
    },
  };
}
