// The page's scrollbar, drawn as a zipper on a strip of moss-green tape. The slider is the
// scroll position: teeth above it are zipped shut, teeth below it are open, so reading
// down the page zips it closed. Drag the slider (or its pull tab) to scroll, or click the
// tape to jump. The pull tab swings when the scrolling speeds up or slows down.
//
// Scrolling itself stays native (wheel, trackpad, keys); this only shows and drives it.

const TOP = 6; // space above the top stop
const SLIDER_H = 22;
const TAB_L = 30; // pull tab length, hanging below the slider
const PITCH = 6; // tooth spacing on each side
const IDLE_MS = 2600;
const SMALL = 0.68; // size when left alone for a while

const TAPE = "#46553a";
const CLOTH = "#3b2a20"; // the tweed panel the zipper is sewn onto
const TAPE_DARK = "#2f3b27";

export type ZipperTag = { el: HTMLElement; target: HTMLElement };

export function startZipper(root: HTMLElement, canvas: HTMLCanvasElement, tags: ZipperTag[]) {
  const ctx = canvas.getContext("2d")!;
  const doc = document.documentElement;
  let W = 0, H = 0, dpr = 1;
  let k = 1, kTo = 1; // overall size, eased
  let angle = 0, spin = 0; // pull tab swing
  let lastY = window.scrollY, lastV = 0;
  let drag = false, grabDy = 0, hover = false;
  let dirty = true;

  const maxScroll = () => Math.max(1, doc.scrollHeight - window.innerHeight);
  const range = () => {
    const y0 = TOP + SLIDER_H / 2 + 4;
    return { y0, y1: Math.max(y0 + 1, H - TAB_L - SLIDER_H / 2 - 4) };
  };
  const sliderY = () => {
    const { y0, y1 } = range();
    return y0 + Math.min(1, Math.max(0, window.scrollY / maxScroll())) * (y1 - y0);
  };

  // ---------- sizing ----------

  // A small tile of dark brown herringbone tweed, drawn at device resolution.
  let cloth: CanvasPattern | null = null;
  function makeCloth() {
    const T = Math.round(12 * dpr);
    const c = document.createElement("canvas");
    c.width = c.height = T;
    const g = c.getContext("2d")!;
    g.fillStyle = CLOTH;
    g.fillRect(0, 0, T, T);
    g.lineWidth = Math.max(1, dpr * 0.9);
    // Two columns of short slanted strokes, leaning opposite ways.
    for (let col = 0; col < 2; col++) {
      const x0 = (col * T) / 2, dir = col ? -1 : 1;
      for (let y = -T; y < T * 2; y += 2.2 * dpr) {
        g.strokeStyle = (y / dpr) % 4.4 < 2.2 ? "rgba(120, 88, 64, .45)" : "rgba(15, 8, 4, .35)";
        g.beginPath();
        g.moveTo(x0, y);
        g.lineTo(x0 + T / 2, y + (dir * T) / 2);
        g.stroke();
      }
    }
    // Flecks of lighter wool.
    for (let i = 0; i < 6; i++) {
      g.fillStyle = `rgba(${200 + Math.random() * 40}, ${150 + Math.random() * 40}, 110, .35)`;
      g.fillRect(Math.random() * T, Math.random() * T, dpr, dpr);
    }
    cloth = ctx.createPattern(c, "repeat");
    cloth?.setTransform(new DOMMatrix().scale(1 / dpr));
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    makeCloth();
    placeTags();
    dirty = true;
  }

  function placeTags() {
    const { y0, y1 } = range();
    const pad = parseFloat(getComputedStyle(doc).scrollPaddingTop) || 0;
    for (const t of tags) {
      const top = t.target.getBoundingClientRect().top + window.scrollY - pad;
      const p = Math.min(1, Math.max(0, top / maxScroll()));
      t.el.style.top = `${(y0 + p * (y1 - y0)).toFixed(1)}px`;
    }
  }

  // ---------- size: full when in use, a bit smaller when left alone ----------

  let idle = 0;
  function wake() {
    kTo = 1;
    root.dataset.awake = "";
    clearTimeout(idle);
    idle = window.setTimeout(function sleep() {
      if (hover || drag) {
        idle = window.setTimeout(sleep, IDLE_MS);
        return;
      }
      kTo = SMALL;
      delete root.dataset.awake;
    }, IDLE_MS);
  }

  // ---------- drawing ----------

  /** How far each side of the tape has pulled apart at height y (0 where it's zipped). */
  function openness(y: number, sy: number) {
    if (y <= sy) return 0;
    const ease = (v: number) => {
      const c = Math.min(1, Math.max(0, v));
      return c * c * (3 - 2 * c);
    };
    // A long V: wide just below the slider, joined again at the bottom stop.
    return 4.5 * k * ease((y - sy) / 46) * ease((H - 8 - y) / 70);
  }

  function brass(x0: number, x1: number) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, "#7d5b1f");
    g.addColorStop(0.35, "#f3dc8f");
    g.addColorStop(0.6, "#c99d43");
    g.addColorStop(1, "#6e4f19");
    return g;
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const cx = W - 26; // the panel is about 24px either side of this
    const sy = sliderY();
    const top = TOP, bot = H - 6;
    const tapeW = 7.5 * k, tooth = 6.8 * k, inner = 1 * k;

    // The tweed panel underneath, so the open teeth show cloth and not the page.
    const half = inner + 4.5 * k + tooth + tapeW + 4 * k;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cx - half, top - 4, half * 2, bot - top + 8, 5);
    ctx.shadowColor = "rgba(20, 10, 4, .45)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = cloth ?? CLOTH;
    ctx.fill();
    ctx.restore();
    // Soft roll at the edges, and a cream running stitch holding it on.
    const edge = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
    edge.addColorStop(0, "rgba(15, 8, 4, .45)");
    edge.addColorStop(0.18, "rgba(15, 8, 4, 0)");
    edge.addColorStop(0.82, "rgba(15, 8, 4, 0)");
    edge.addColorStop(1, "rgba(15, 8, 4, .45)");
    ctx.fillStyle = edge;
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - half + 2.5, top - 1.5, half * 2 - 5, bot - top + 3, 3.5);
    ctx.setLineDash([3, 2.5]);
    ctx.strokeStyle = "rgba(236, 223, 198, .6)";
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.setLineDash([]);

    // Tape, both halves, following the opening.
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let y = top; y <= bot; y += 3) {
        const o = openness(y, sy);
        ctx.lineTo(cx + side * (inner + o), y);
      }
      for (let y = bot; y >= top; y -= 3) {
        const o = openness(y, sy);
        ctx.lineTo(cx + side * (inner + o + tooth - inner + tapeW), y);
      }
      ctx.closePath();
      ctx.save();
      ctx.shadowColor = "rgba(20, 10, 4, .35)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = -1;
      ctx.shadowOffsetY = 2;
      const g = ctx.createLinearGradient(cx, 0, cx + side * (tooth + tapeW), 0);
      g.addColorStop(0, TAPE);
      g.addColorStop(1, TAPE_DARK);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // A line of cream stitching down the outer edge.
      ctx.beginPath();
      for (let y = top + 3; y <= bot - 3; y += 3) {
        const o = openness(y, sy);
        ctx.lineTo(cx + side * (o + tooth + tapeW - 2.2 * k), y);
      }
      ctx.setLineDash([2.5, 2]);
      ctx.strokeStyle = "rgba(236, 223, 198, .55)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Teeth, interlocking: the right side sits half a step lower than the left.
    const th = Math.max(2.4, 3.4 * k);
    for (const side of [-1, 1]) {
      for (let y = top + 6 + (side > 0 ? PITCH / 2 : 0); y < bot - 6; y += PITCH) {
        const o = openness(y, sy);
        // Closed teeth reach over the middle; open ones stay on their own side.
        const reach = o > 0.5 ? 0 : 1.6 * k;
        const xa = cx + side * (o - reach);
        const xb = cx + side * (o + tooth);
        const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb);
        ctx.fillStyle = brass(x0, x1);
        ctx.beginPath();
        ctx.roundRect(x0, y - th / 2, x1 - x0, th, th / 2.2);
        ctx.fill();
        ctx.fillStyle = "rgba(60, 40, 10, .45)";
        ctx.fillRect(x0 + 0.5, y + th / 2 - 0.7, x1 - x0 - 1, 0.7);
      }
    }

    // Top stops and the bottom box.
    ctx.fillStyle = brass(cx - 6 * k, cx + 6 * k);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(cx + (side < 0 ? -tooth - 1 : 1), top + 1, tooth, 3.2, 1.4);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.roundRect(cx - tooth - 1, bot - 9, tooth * 2 + 2, 7, 2);
    ctx.fill();

    // The slider: wide at the bottom where the two rows of teeth enter.
    const bw = 20 * k, tw = 12 * k, y0 = sy - SLIDER_H / 2, y1 = sy + SLIDER_H / 2;
    ctx.save();
    ctx.shadowColor = "rgba(20, 10, 4, .5)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(cx - tw / 2, y0);
    ctx.lineTo(cx + tw / 2, y0);
    ctx.quadraticCurveTo(cx + bw / 2 + 1, y0 + 4, cx + bw / 2, y1 - 3);
    ctx.quadraticCurveTo(cx + bw / 2, y1, cx + bw / 2 - 3, y1);
    ctx.lineTo(cx - bw / 2 + 3, y1);
    ctx.quadraticCurveTo(cx - bw / 2, y1, cx - bw / 2, y1 - 3);
    ctx.quadraticCurveTo(cx - bw / 2 - 1, y0 + 4, cx - tw / 2, y0);
    ctx.closePath();
    ctx.fillStyle = brass(cx - bw / 2, cx + bw / 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(70, 48, 12, .55)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Raised ridge down the middle.
    ctx.beginPath();
    ctx.moveTo(cx, y0 + 3);
    ctx.lineTo(cx, y1 - 5);
    ctx.strokeStyle = "rgba(255, 240, 190, .7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // The pull tab, hanging from the slider and swinging.
    const hx = cx, hy = y1 - 5;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    const pw = 11 * k, pl = TAB_L;
    ctx.shadowColor = "rgba(20, 10, 4, .5)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(-pw * 0.32, 0);
    ctx.lineTo(pw * 0.32, 0);
    ctx.lineTo(pw / 2, pl - 6);
    ctx.quadraticCurveTo(pw / 2, pl, 0, pl);
    ctx.quadraticCurveTo(-pw / 2, pl, -pw / 2, pl - 6);
    ctx.closePath();
    ctx.fillStyle = brass(-pw / 2, pw / 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(70, 48, 12, .6)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // The slot in the tab, and the ring it hangs from.
    ctx.beginPath();
    ctx.roundRect(-pw * 0.18, pl - 13, pw * 0.36, 8, 2);
    ctx.fillStyle = "rgba(40, 26, 8, .75)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 1.5, 2.2 * k + 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = "#8a6826";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  // ---------- loop ----------

  let raf = 0;
  const frame = () => {
    const y = window.scrollY;
    const v = y - lastY;
    const accel = v - lastV;
    lastY = y;
    lastV = v;
    if (v !== 0) dirty = true;

    // The tab lags behind changes in speed, then settles.
    spin += -accel * 0.0035 - angle * 0.06;
    spin *= 0.88;
    angle = Math.max(-0.9, Math.min(0.9, angle + spin));
    if (Math.abs(spin) > 0.0005 || Math.abs(angle) > 0.002) dirty = true;
    else angle = spin = 0;

    if (Math.abs(kTo - k) > 0.002) {
      k += (kTo - k) * 0.12;
      dirty = true;
    } else k = kTo;

    if (dirty) {
      draw();
      dirty = false;
    }
    raf = requestAnimationFrame(frame);
  };

  // ---------- input ----------

  const local = (e: PointerEvent) => e.clientY - canvas.getBoundingClientRect().top;
  const onSlider = (y: number) => y > sliderY() - SLIDER_H / 2 - 3 && y < sliderY() + SLIDER_H / 2 + TAB_L;

  function scrollToY(y: number, smooth: boolean) {
    const { y0, y1 } = range();
    const p = Math.min(1, Math.max(0, (y - y0) / (y1 - y0)));
    window.scrollTo({ top: p * maxScroll(), behavior: smooth ? "smooth" : "instant" });
  }

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    wake();
    const y = local(e);
    if (onSlider(y)) {
      drag = true;
      grabDy = y - sliderY();
      canvas.setPointerCapture(e.pointerId);
      root.dataset.dragging = "";
    } else {
      scrollToY(y, true);
    }
  };
  const onMove = (e: PointerEvent) => {
    const y = local(e);
    if (drag) {
      scrollToY(y - grabDy, false);
      canvas.style.cursor = "var(--cur-grabbing)";
    } else canvas.style.cursor = onSlider(y) ? "var(--cur-grab)" : "var(--cur-pointer)";
  };
  const onUp = () => {
    drag = false;
    delete root.dataset.dragging;
  };
  const onEnter = () => {
    hover = true;
    wake();
  };
  const onLeave = () => {
    hover = false;
  };
  const onScroll = () => wake();

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", resize);
  // Images and fonts change the page height after load; keep the section tags in place.
  const ro = new ResizeObserver(() => {
    placeTags();
    dirty = true;
  });
  ro.observe(document.body);

  resize();
  wake();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(idle);
    ro.disconnect();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    root.removeEventListener("pointerenter", onEnter);
    root.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", resize);
  };
}
