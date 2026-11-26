"use client";

import { useEffect } from "react";

/**
 * Marks the nav link for the section you're reading with aria-current, so the belt can
 * show it with a brass eyelet. A section counts once it crosses the upper part of the
 * screen; at the very top of the page (the hero) none is marked.
 */
export function NavSpy({ nav }: { nav: string }) {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(`${nav} a[href^="#"]`)).filter(
      (a) => a.hash.length > 1 && a.hash !== "#top",
    );
    const sections = links
      .map((a) => document.getElementById(a.hash.slice(1)))
      .filter((s): s is HTMLElement => !!s);
    if (!sections.length) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.35;
      let current = "";
      for (const s of sections) if (s.getBoundingClientRect().top <= line) current = s.id;
      // At the bottom of the page the last section is current, even if it's short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
      }
      for (const a of links) {
        const on = a.hash === `#${current}`;
        if (on) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [nav]);

  return null;
}
