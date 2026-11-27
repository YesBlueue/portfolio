"use client";

import { useEffect } from "react";

const MIN = 0.68;
const MAX = 1.05;
const MARGIN = 8; // px of breathing room left under a card

/**
 * Scales the project cards (via --card-zoom on the grid) to the largest size where a whole
 * card still fits on screen below the nav bar. The CSS in page.module.css sets sensible
 * steps by screen height; this fine-tunes them to the actual screen and refits on resize.
 *
 * Phones change the window height all the time as the browser's toolbars slide in and out
 * while you scroll. Refitting then would resize every card mid-scroll and make the page
 * jump, so the fit uses the height with the toolbars showing (which stays put), and only
 * refits when that or the width really changes: a rotation, or a resized window.
 */
export function CardFit({ target }: { target: string }) {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(target);
    if (!grid) return;

    const tallest = () =>
      Math.max(...Array.from(grid.querySelectorAll("article"), (a) => a.getBoundingClientRect().height));

    // The smallest the viewport gets (toolbars showing), via 100svh where supported.
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:100vh";
    if (CSS.supports("height", "100svh")) probe.style.height = "100svh";
    document.body.appendChild(probe);
    const screenH = () => probe.offsetHeight || window.innerHeight;

    const fit = () => {
      const nav = document.querySelector("nav")?.getBoundingClientRect().height ?? 0;
      const room = screenH() - nav - MARGIN;
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
    let lastW = window.innerWidth;
    let lastH = screenH();
    const onResize = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const w = window.innerWidth, h = screenH();
        if (w === lastW && h === lastH) return; // just the toolbars moving
        lastW = w;
        lastH = h;
        fit();
      }, 120);
    };

    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      probe.remove();
    };
  }, [target]);

  return null;
}
