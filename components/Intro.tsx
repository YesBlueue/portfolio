"use client";

import { useEffect, useRef } from "react";
import { startKnit, type Knit } from "@/lib/knit";
import styles from "./Intro.module.css";

// Runs before first paint: skip the intro if it was already unravelled this visit, or if
// the visitor arrived on a deep link such as /#projects.
const SKIP = `try{if(sessionStorage.getItem("knit")||location.hash.length>1)document.documentElement.dataset.intro="done"}catch(e){}`;

/** A knitted sweater over the whole page. Pull the loose yarn to unravel it. */
export function Intro() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const knitRef = useRef<Knit | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current, canvas = canvasRef.current, tag = tagRef.current;
    if (!root || !canvas || !tag || html.dataset.intro === "done") return;

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
      onFrame(x, y) {
        tag.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      },
      onGrab() {
        root.dataset.stage = "pulling";
      },
      onAuto() {
        root.dataset.stage = "auto";
      },
      onMiss() {
        tag.classList.remove(styles.nudge);
        void tag.offsetWidth; // restart the animation
        tag.classList.add(styles.nudge);
      },
      onDone: finish,
    });
    knitRef.current = knit;
    root.dataset.ready = "";

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
      knit.destroy();
      knitRef.current = null;
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
        aria-label="Welcome. Pull the loose thread, or press the button, to open the portfolio."
      >
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <div ref={tagRef} className={styles.tag} aria-hidden="true">
          <span>
            pull me
            <svg viewBox="0 0 40 28" width="34" height="24">
              <path d="M4 22 C 14 22, 26 18, 34 6" />
              <path d="M26 6 L 34 5 L 34 13" />
            </svg>
          </span>
        </div>

        <div className={styles.label} aria-hidden="true">
          <b>Thaw Thaw Tun</b>
          <span>Portfolio · 2026</span>
          <span>100% code · 0% wool</span>
          <span>Hand-knit in Yangon</span>
          <span className={styles.style}>Style no. 94 &ldquo;Undone&rdquo;</span>
        </div>

        <button type="button" className={styles.skip} onClick={() => knitRef.current?.unravel()}>
          Unravel it for me
          <kbd>Enter</kbd>
        </button>
      </div>
    </>
  );
}
