"use client";

import { useEffect } from "react";

const MIN = 0.68;
const MAX = 1.05;
const MARGIN = 8; // px of breathing room left under a card

/**
 * Scales the project cards (via --card-zoom on the grid) to the largest size where a whole
 * card still fits on screen below the nav bar. The CSS in page.module.css sets sensible
 * steps by screen height; this fine-tunes them to the actual screen and refits on resize.
 */
export function CardFit({ target }: { target: string }) {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(target);
    if (!grid) return;

    const tallest = () =>
      Math.max(...Array.from(grid.querySelectorAll("article"), (a) => a.getBoundingClientRect().height));

    const fit = () => {
      const nav = document.querySelector("nav")?.getBoundingClientRect().height ?? 0;
      const room = window.innerHeight - nav - MARGIN;
      let z = parseFloat(getComputedStyle(grid).getPropertyValue("--card-zoom")) || 0.8;
      // Text rewraps as the size changes, so home in over a few passes.
      for (let i = 0; i < 5; i++) {
        grid.style.setProperty("--card-zoom", z.toFixed(3));
        const next = Math.min(MAX, Math.max(MIN, z * (room / tallest())));
        if (Math.abs(next - z) < 0.004) break;
        z = next;
      }
      // Then make sure it really fits.
      while (z > MIN && tallest() > room) {
        z -= 0.01;
        grid.style.setProperty("--card-zoom", z.toFixed(3));
      }
    };

    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        grid.style.removeProperty("--card-zoom");
        fit();
      }, 120);
    };

    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [target]);

  return null;
}
