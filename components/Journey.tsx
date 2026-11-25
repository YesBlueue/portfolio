"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { Milestone } from "@/lib/content";
import styles from "./Journey.module.css";

const GAP = 30; // how far apart the two cloths hang before they're sewn
const OPEN = 160; // over how many px below the needle the seam eases open
const STITCH = 18; // stitch spacing along the seam

/**
 * The journey section as two pieces of dark cloth with a seam down the middle. Below the
 * needle the pieces hang apart; as you scroll, the needle sews down the seam, crossing
 * stitches pull the two pieces together behind it, and each milestone's label comes into
 * full view as the seam reaches it.
 */
export function Journey({ milestones, head }: { milestones: Milestone[]; head: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const stitchRef = useRef<SVGPathElement>(null);
  const holeRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const section = sectionRef.current, left = leftRef.current, right = rightRef.current;
    const list = listRef.current, svg = svgRef.current;
    const stitches = stitchRef.current, holes = holeRef.current, needle = needleRef.current;
    if (!section || !left || !right || !list || !svg || !stitches || !holes || !needle) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(list.children) as HTMLElement[];
    let W = 0, H = 0, cx = 0, top = 0, bottom = 0;
    let knotsAt: number[] = [];

    const ease = (v: number) => {
      const c = Math.min(1, Math.max(0, v));
      return c * c * (3 - 2 * c);
    };
    // A slightly uneven cut edge, so it reads as cloth rather than a straight line.
    const fray = (y: number, side: number) => Math.sin(y * 0.13 + side * 2) * 1.1 + Math.sin(y * 0.041 + side) * 1.6;

    const measure = () => {
      const box = section.getBoundingClientRect();
      W = box.width;
      H = box.height;
      const knots = rows.map((r) => r.querySelector<HTMLElement>("[data-knot]")!.getBoundingClientRect());
      cx = knots[0].left - box.left + knots[0].width / 2;
      knotsAt = knots.map((k) => k.top - box.top + k.height / 2);
      top = knotsAt[0] - 70;
      bottom = knotsAt[knotsAt.length - 1] + 40;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      draw();
    };

    let raf = 0;
    const draw = () => {
      raf = 0;
      const box = section.getBoundingClientRect();
      // The needle sits just past the middle of the screen, on the seam.
      const reach = reduced ? Infinity : Math.min(bottom, Math.max(top, window.innerHeight * 0.62 - box.top));
      const gap = (y: number) => (y <= reach ? 0 : GAP * ease((y - reach) / OPEN));

      // Each cloth's inner edge follows the seam, closed above the needle and open below.
      const l: string[] = ["0px 0px"], r: string[] = [`${W}px 0px`];
      for (let y = 0; y <= H + 12; y += 12) {
        const g = gap(y) / 2;
        l.push(`${(cx - g + fray(y, 0) + 1).toFixed(1)}px ${y}px`);
        r.push(`${(cx + g + fray(y, 1) - 1).toFixed(1)}px ${y}px`);
      }
      l.push(`0px ${H + 12}px`);
      r.push(`${W}px ${H + 12}px`);
      left.style.clipPath = `polygon(${l.join(",")})`;
      right.style.clipPath = `polygon(${r.join(",")})`;

      // Sewn: short crossing stitches above the needle. Waiting: punched holes along both edges.
      let s = "", h = "";
      for (let y = top; y <= bottom; y += STITCH) {
        if (y <= reach) {
          const k = (Math.round((y - top) / STITCH) % 2 ? 1 : -1) * 1.5;
          s += `M${(cx - 6).toFixed(1)} ${(y - k).toFixed(1)}L${(cx + 6).toFixed(1)} ${(y + k).toFixed(1)}`;
        } else {
          const g = gap(y) / 2;
          h += `M${(cx - g - 5).toFixed(1)} ${y}h.01M${(cx + g + 5).toFixed(1)} ${y}h.01`;
        }
      }
      stitches.setAttribute("d", s);
      holes.setAttribute("d", h);
      const ny = Math.min(bottom, reach);
      needle.setAttribute("transform", `translate(${cx.toFixed(1)} ${ny.toFixed(1)})`);
      needle.style.opacity = !reduced && reach > top + 2 && reach < bottom - 2 ? "1" : "0";

      let cur = -1;
      rows.forEach((row, i) => {
        const done = knotsAt[i] <= reach + 4;
        row.dataset.sewn = String(done);
        if (done) cur = i;
      });
      rows.forEach((row, i) => (row.dataset.current = String(i === cur)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    section.dataset.live = "";
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="journey" aria-labelledby="journey-h">
      {/* The two cloths, each with a soft shadow along its cut edge. */}
      <div className={styles.cloth} aria-hidden="true">
        <div className={styles.shade}>
          <div ref={leftRef} className={`${styles.piece} ${styles.left}`} />
        </div>
        <div className={styles.shade}>
          <div ref={rightRef} className={`${styles.piece} ${styles.right}`} />
        </div>
        <svg ref={svgRef} className={styles.seam} preserveAspectRatio="none">
          <path ref={holeRef} className={styles.holes} />
          <path ref={stitchRef} className={styles.stitches} />
          <g ref={needleRef} className={styles.needle}>
            <path d="M0 -26 L2.2 6 Q0 10 -2.2 6 Z" />
            <ellipse cx="0" cy="-19" rx=".9" ry="3.5" />
            <path className={styles.trail} d="M0 -19 C 8 -40, -10 -60, 0 -90" />
          </g>
        </svg>
      </div>

      <div className={`inner ${styles.inner}`}>
        {head}
        <ol ref={listRef} className={styles.list}>
          {milestones.map((m) => (
            <li key={m.title} className={styles.row}>
              <span className={styles.knot} data-knot="" aria-hidden="true" />
              <article className={`${styles.tag} ${m.next ? styles.next : ""}`}>
                <figure className={styles.photo}>
                  {m.image ? (
                    <Image src={m.image.src} alt={m.image.alt} width={m.image.width} height={m.image.height} sizes="140px" />
                  ) : (
                    <span className={styles.blank}>{m.next ? "soon" : "photo"}</span>
                  )}
                </figure>
                <div className={styles.text}>
                  <p className={styles.when}>{m.when}</p>
                  <h3 className={styles.title}>{m.title}</h3>
                  <p className={styles.note}>{m.note}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
