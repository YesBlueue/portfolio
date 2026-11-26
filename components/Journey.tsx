"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { Milestone } from "@/lib/content";
import { Ordinals } from "./Ordinals";
import styles from "./Journey.module.css";

const GAP = 30; // how far apart the two cloths hang before they're sewn
const OPEN = 160; // over how many px below the needle the seam eases open
const STITCH = 18; // stitch spacing along the seam
const STRIP = 140; // width of the seam strip that gets redrawn

/**
 * The journey section as two pieces of dark cloth with a seam down the middle. Below the
 * needle the pieces hang apart; as you scroll, the needle sews down the seam, crossing
 * stitches pull the two pieces together behind it, and each milestone's label comes into
 * full view as the seam reaches it.
 *
 * Performance: the cloths are cut once and never repainted. Everything that moves (the
 * open gap, holes, stitches, needle) lives in one narrow SVG strip over the seam, on its
 * own layer, redrawn only while the section is on screen and only when the needle moves.
 */
export function Journey({ milestones, head }: { milestones: Milestone[]; head: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const stripRef = useRef<SVGSVGElement>(null);
  const gapRef = useRef<SVGPathElement>(null);
  const edgeRef = useRef<SVGPathElement>(null);
  const holeRef = useRef<SVGPathElement>(null);
  const stitchRef = useRef<SVGPathElement>(null);
  const stitchShadowRef = useRef<SVGPathElement>(null);
  const needleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const section = sectionRef.current, left = leftRef.current, right = rightRef.current;
    const list = listRef.current, strip = stripRef.current;
    const gapPath = gapRef.current, edges = edgeRef.current, holes = holeRef.current;
    const stitches = stitchRef.current, stitchShadow = stitchShadowRef.current, needle = needleRef.current;
    if (!section || !left || !right || !list || !strip || !gapPath || !edges || !holes || !stitches || !stitchShadow || !needle) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(list.children) as HTMLElement[];
    let H = 0, cx = 0, top = 0, bottom = 0;
    let knotsAt: number[] = [];
    let lastReach = NaN;
    let onScreen = false;

    const ease = (v: number) => {
      const c = Math.min(1, Math.max(0, v));
      return c * c * (3 - 2 * c);
    };
    // A slightly uneven cut edge, so it reads as cloth rather than a ruler line.
    const fray = (y: number, side: number) => Math.sin(y * 0.13 + side * 2) * 1.1 + Math.sin(y * 0.041 + side) * 1.6;
    const sx = (x: number) => (x - cx + STRIP / 2).toFixed(1); // section x -> strip x

    // Cut both cloths once along the seam; they never change while scrolling.
    const measure = () => {
      const box = section.getBoundingClientRect();
      H = box.height;
      const knots = rows.map((r) => r.querySelector<HTMLElement>("[data-knot]")!.getBoundingClientRect());
      cx = knots[0].left - box.left + knots[0].width / 2;
      knotsAt = knots.map((k) => k.top - box.top + k.height / 2);
      top = knotsAt[0] - 70;
      bottom = knotsAt[knotsAt.length - 1] + 40;

      const l = ["0px 0px"], r = [`${box.width}px 0px`];
      for (let y = 0; y <= H + 24; y += 24) {
        l.push(`${(cx + fray(y, 0) + 1).toFixed(1)}px ${y}px`);
        r.push(`${(cx + fray(y, 1) - 1).toFixed(1)}px ${y}px`);
      }
      l.push(`0px ${H + 24}px`);
      r.push(`${box.width}px ${H + 24}px`);
      left.style.clipPath = `polygon(${l.join(",")})`;
      right.style.clipPath = `polygon(${r.join(",")})`;

      strip.style.left = `${cx - STRIP / 2}px`;
      strip.setAttribute("viewBox", `0 0 ${STRIP} ${H}`);
      strip.style.height = `${H}px`;
      lastReach = NaN;
      draw();
    };

    let raf = 0;
    const draw = () => {
      raf = 0;
      const boxTop = section.getBoundingClientRect().top;
      const reach = reduced ? Infinity : Math.round(Math.min(bottom, Math.max(top, window.innerHeight * 0.62 - boxTop)));
      if (reach === lastReach) return; // nothing moved
      lastReach = reach;
      const gap = (y: number) => (y <= reach ? 0 : GAP * ease((y - reach) / OPEN));

      // The open part of the seam: a dark wedge below the needle, with shadowed edges.
      let g = "", e = "";
      if (reach < H) {
        const ys: number[] = [];
        for (let y = reach; y <= H; y += 12) ys.push(y);
        ys.push(H);
        g = `M${ys.map((y) => `${sx(cx - gap(y) / 2 + fray(y, 0))} ${y}`).join("L")}`;
        g += `L${ys.reverse().map((y) => `${sx(cx + gap(y) / 2 + fray(y, 1))} ${y}`).join("L")}Z`;
        e = g;
      }
      gapPath.setAttribute("d", g);
      edges.setAttribute("d", e);

      // Sewn: short crossing stitches above the needle. Waiting: punched holes on both edges.
      let s = "", h = "";
      for (let y = top; y <= bottom; y += STITCH) {
        if (y <= reach) {
          const k = (Math.round((y - top) / STITCH) % 2 ? 1 : -1) * 1.5;
          s += `M${sx(cx - 6)} ${(y - k).toFixed(1)}L${sx(cx + 6)} ${(y + k).toFixed(1)}`;
        } else {
          const half = gap(y) / 2;
          h += `M${sx(cx - half - 5)} ${y}h.01M${sx(cx + half + 5)} ${y}h.01`;
        }
      }
      stitches.setAttribute("d", s);
      stitchShadow.setAttribute("d", s);
      holes.setAttribute("d", h);

      needle.setAttribute("transform", `translate(${STRIP / 2} ${Math.min(bottom, reach)})`);
      needle.style.opacity = !reduced && reach > top + 2 && reach < bottom - 2 ? "1" : "0";

      let cur = -1;
      rows.forEach((row, i) => {
        const done = knotsAt[i] <= reach + 4;
        if (row.dataset.sewn !== String(done)) row.dataset.sewn = String(done);
        if (done) cur = i;
      });
      rows.forEach((row, i) => {
        const v = String(i === cur);
        if (row.dataset.current !== v) row.dataset.current = v;
      });
    };
    const onScroll = () => {
      if (onScreen && !raf) raf = requestAnimationFrame(draw);
    };

    // Only work while the section is (nearly) on screen.
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) onScroll();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(section);

    section.dataset.live = "";
    measure();
    document.fonts?.ready.then(measure);
    let resizeTimer = 0;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 100);
    });
    ro.observe(section);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} id="journey" aria-labelledby="journey-h">
      {/* The two cloths: cut once along the seam, painted once. */}
      <div className={styles.cloth} aria-hidden="true">
        <div ref={leftRef} className={`${styles.piece} ${styles.left}`} />
        <div ref={rightRef} className={`${styles.piece} ${styles.right}`} />
        {/* Everything that moves, in one narrow strip over the seam. */}
        <svg ref={stripRef} className={styles.strip} width={STRIP} preserveAspectRatio="none">
          <path ref={edgeRef} className={styles.edgeShadow} />
          <path ref={gapRef} className={styles.gap} />
          <path ref={holeRef} className={styles.holes} />
          <path ref={stitchShadowRef} className={styles.stitchShadow} />
          <path ref={stitchRef} className={styles.stitches} />
          <g ref={needleRef} className={styles.needle}>
            <path className={styles.trail} d="M0 -19 C 8 -40, -10 -60, 0 -90" />
            <path className={styles.blade} d="M0 -26 L2.2 6 Q0 10 -2.2 6 Z" />
            <ellipse cx="0" cy="-19" rx=".9" ry="3.5" />
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
                    <Image src={m.image.src} alt={m.image.alt} width={m.image.width} height={m.image.height} sizes="(max-width: 760px) 70vw, 220px" />
                  ) : (
                    <span className={styles.blank}>{m.next ? "soon" : "photo"}</span>
                  )}
                </figure>
                <div className={styles.text}>
                  <p className={styles.when}>{m.when}</p>
                  <h3 className={styles.title}>
                    <Ordinals text={m.title} />
                  </h3>
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
