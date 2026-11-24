"use client";

import { useEffect, useRef } from "react";
import { startKnit } from "@/lib/knit";
import styles from "./Intro.module.css";

// Runs before first paint: skip the intro if it was already unravelled this visit, or if
// the visitor arrived on a deep link such as /#projects.
const SKIP = `try{if(sessionStorage.getItem("knit")||location.hash.length>1)document.documentElement.dataset.intro="done"}catch(e){}`;

// How long the finished sweater sits still before it starts to unravel.
const HOLD_MS = 2200;

/** A knitted sweater over the whole page. It holds still for a moment, then unravels itself. */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current, canvas = canvasRef.current, label = labelRef.current;
    if (!root || !canvas || !label || html.dataset.intro === "done") return;

    let finished = false;
    let timer = 0;
    const finish = () => {
      if (finished) return;
      finished = true;
      root.dataset.stage = "out";
      try {
        sessionStorage.setItem("knit", "1");
      } catch {}
      timer = window.setTimeout(() => {
        html.dataset.intro = "done";
        knit.destroy();
      }, 600);
    };

    // The woven label is stitched on along its edges. When the unravelling reaches its top
    // it peels forward, hinged on its bottom edge; when it reaches the bottom the label
    // comes free and flutters down like a scrap of cloth: swaying, tilting and tumbling
    // back and forth, picking up speed as it goes.
    let peelAt = 0, fallAt = 0, box: DOMRect | null = null;
    const fall = (edge: number) => {
      box ??= label.getBoundingClientRect();
      const now = performance.now();
      if (!peelAt && edge > box.top + 4) {
        peelAt = now;
        label.dataset.falling = "";
      }
      if (!peelAt) return;
      if (!fallAt && edge > box.bottom - 6) fallAt = Math.max(now, peelAt + 260);

      // Peel: tip forward off the fabric, overshoot a little, settle.
      const p = Math.min(1, (now - peelAt) / 420);
      const peel = -34 * (1 - Math.cos(p * Math.PI * 1.5) * (1 - p));
      let x = 0, y = 0, rz = -1.5, rx = peel, ry = 0, lift = Math.min(1, p * 2);

      if (fallAt && now >= fallAt) {
        const t = (now - fallAt) / 1000;
        const sway = Math.sin(t * 5.2);
        y = 380 * t * t + 40 * t; // gravity, held back a little by the air
        x = 34 * sway + 70 * t; // drifting side to side, and a bit to the right
        rz = -1.5 + 16 * Math.sin(t * 5.2 + 0.7) + 30 * t;
        rx = peel + 48 * Math.sin(t * 6.3); // tumbling, never far enough to show its back
        ry = 28 * Math.sin(t * 3.9 + 1.1);
        lift = 1 + Math.min(1, t * 2);
      }

      label.style.transform =
        `perspective(700px) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) ` +
        `rotate(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      // Further off the fabric, softer and further shadow.
      label.style.boxShadow = `0 ${8 + lift * 14}px ${16 + lift * 18}px -8px rgba(20, 8, 4, ${0.75 - lift * 0.2})`;
    };

    const knit = startKnit(canvas, {
      onFrame(_x, _y, edge) {
        fall(edge);
      },
      onGrab() {
        root.dataset.stage = "pulling";
      },
      onAuto() {
        root.dataset.stage = "auto";
      },
      onMiss() {},
      onDone: finish,
    });
    root.dataset.ready = "";
    const start = window.setTimeout(() => knit.unravel(), HOLD_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if ((e.key === "Enter" || e.key === " ") && document.activeElement === document.body) {
        e.preventDefault();
        knit.unravel();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
      clearTimeout(start);
      knit.destroy();
    };
  }, []);

  return (
    <>
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: SKIP }}
      />
      <noscript>
        <style>{"[data-knit]{display:none!important}html{overflow:auto!important}"}</style>
      </noscript>
      <div
        ref={rootRef}
        className={styles.intro}
        data-knit=""
        role="dialog"
        aria-modal="true"
        aria-label="Welcome. The intro opens by itself in a moment; press Escape to skip it."
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <div ref={labelRef} className={styles.label} aria-hidden="true">
          <b>Thaw Thaw Tun</b>
          <span>Portfolio · 2026</span>
          <span>100% code · 0% wool</span>
          <span>Hand-knit in Yangon</span>
          <span className={styles.style}>Style no. 94 &ldquo;Undone&rdquo;</span>
        </div>
      </div>
    </>
  );
}
