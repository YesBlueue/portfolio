"use client";

import { useEffect, useRef } from "react";
import styles from "./Spool.module.css";

// Spool drawing, in SVG units.
const CX = 24; // centre line
const CORE = 10; // bare core width
const FULL = 34; // thread width when fully wound
const TOP = 10, BOT = 50; // between the flanges
const STRIPE = 2.4; // spacing of the thread wraps

/**
 * Back to top, as a spool of thread in the bottom-left corner. It doubles as a reading
 * gauge: the further down the page, the more thread has unwound. The wraps turn as you
 * scroll; click it and it spins, winding the thread back up as the page returns to the top.
 */
export function Spool() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const threadRef = useRef<SVGRectElement>(null);
  const shadeRef = useRef<SVGRectElement>(null);
  const wrapsRef = useRef<SVGGElement>(null);
  const tailRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const btn = btnRef.current, thread = threadRef.current, shade = shadeRef.current;
    const wraps = wrapsRef.current, tail = tailRef.current;
    if (!btn || !thread || !shade || !wraps || !tail) return;

    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      // Most of the thread comes off as you read; a little always stays on the spool.
      const w = CORE + (FULL - CORE) * (1 - p * 0.9);
      for (const r of [thread, shade]) {
        r.setAttribute("x", (CX - w / 2).toFixed(2));
        r.setAttribute("width", w.toFixed(2));
      }
      // The wraps creep as the spool turns.
      wraps.setAttribute("transform", `translate(0 ${(-(window.scrollY * 0.04) % STRIPE).toFixed(2)})`);
      // The loose end leaves from the edge of the thread and trails down past the flange.
      const x = CX + w / 2;
      tail.setAttribute("d", `M${x.toFixed(1)} 40 C${(x + 7).toFixed(1)} 44 ${(x + 2).toFixed(1)} 52 ${(x + 8).toFixed(1)} 58`);
      // Only once you've left the top of the page.
      btn.dataset.shown = String(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const rewind = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.dataset.spinning = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    const done = () => {
      if (window.scrollY > 2) return;
      delete btn.dataset.spinning;
      window.removeEventListener("scroll", done);
    };
    window.addEventListener("scroll", done, { passive: true });
    // In case the page was already at the top, or scrolling gets interrupted.
    window.setTimeout(() => {
      delete btn.dataset.spinning;
      window.removeEventListener("scroll", done);
    }, 1600);
    // Keyboard users land at the top too: on the first link in the nav.
    document.querySelector<HTMLElement>("nav a")?.focus({ preventScroll: true });
  };

  return (
    <button ref={btnRef} type="button" className={styles.spool} onClick={rewind} aria-label="Back to top" data-shown="false">
      <svg viewBox="0 0 48 60" aria-hidden="true">
        <defs>
          <linearGradient id="spool-wood" x1="0" x2="1">
            <stop offset="0" stopColor="#8a5a2e" />
            <stop offset=".35" stopColor="#e0b57c" />
            <stop offset=".7" stopColor="#c08a55" />
            <stop offset="1" stopColor="#7a4d26" />
          </linearGradient>
          <linearGradient id="spool-round" x1="0" x2="1">
            <stop offset="0" stopColor="#1c0c06" stopOpacity=".55" />
            <stop offset=".3" stopColor="#fff" stopOpacity=".18" />
            <stop offset=".55" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#1c0c06" stopOpacity=".6" />
          </linearGradient>
          <clipPath id="spool-thread">
            <rect ref={threadRef} x={CX - FULL / 2} y={TOP} width={FULL} height={BOT - TOP} />
          </clipPath>
        </defs>

        <ellipse cx="24" cy="57.5" rx="19" ry="2.2" fill="rgba(30,14,6,.28)" />

        {/* The bare wooden core. */}
        <rect x={CX - CORE / 2} y={TOP} width={CORE} height={BOT - TOP} fill="url(#spool-wood)" />

        {/* The thread, wound round it. */}
        <g clipPath="url(#spool-thread)">
          <rect x="0" y={TOP} width="48" height={BOT - TOP} fill="var(--rust)" />
          <g ref={wrapsRef}>
            {Array.from({ length: Math.ceil((BOT - TOP) / STRIPE) + 3 }, (_, i) => (
              <line
                key={i}
                x1="0"
                x2="48"
                y1={TOP - STRIPE + i * STRIPE}
                y2={TOP - STRIPE + i * STRIPE + 0.6}
                stroke="rgba(40,12,4,.45)"
                strokeWidth=".7"
              />
            ))}
          </g>
        </g>
        <rect ref={shadeRef} x={CX - FULL / 2} y={TOP} width={FULL} height={BOT - TOP} fill="url(#spool-round)" />

        {/* The loose end. */}
        <path ref={tailRef} d="M41 40 C48 44 43 52 49 58" fill="none" stroke="var(--rust)" strokeWidth="1.4" strokeLinecap="round" />

        {/* Flanges. */}
        <rect x="3" y="3" width="42" height="8" rx="3" fill="url(#spool-wood)" />
        <rect x="3" y="49" width="42" height="8" rx="3" fill="url(#spool-wood)" />
        <path d="M6 5.2h36M6 51.2h36" stroke="rgba(255,236,200,.45)" strokeWidth=".8" strokeLinecap="round" />
      </svg>
      <span className={styles.tip} aria-hidden="true">
        back to top
      </span>
    </button>
  );
}
