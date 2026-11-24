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

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas || html.dataset.intro === "done") return;

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

    const knit = startKnit(canvas, {
      onFrame() {},
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

        <div className={styles.label} aria-hidden="true">
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
