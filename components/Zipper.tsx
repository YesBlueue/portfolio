"use client";

import { useEffect, useRef } from "react";
import { whenIdle } from "@/lib/idle";
import { startZipper } from "@/lib/zipper";
import styles from "./Zipper.module.css";

const STOPS = [
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "contact", label: "Contact" },
];

/** The scrollbar on laptops and desktops: a zipper that closes as you read down the page. */
export function Zipper() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    if (!root || !canvas || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const tags = STOPS.flatMap((s, i) => {
      const el = tagRefs.current[i], target = document.getElementById(s.id);
      return el && target ? [{ el, target }] : [];
    });
    // Set up once the browser is idle after loading, so it doesn't slow the first paint.
    return whenIdle(() => {
      root.dataset.on = "";
      return startZipper(root, canvas, tags);
    });
  }, []);

  return (
    // Decorative: keyboard and screen-reader users scroll the page as usual.
    <div ref={rootRef} className={styles.zipper} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      {STOPS.map((s, i) => (
        <button
          key={s.id}
          ref={(el) => {
            tagRefs.current[i] = el;
          }}
          type="button"
          tabIndex={-1}
          className={styles.tag}
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
