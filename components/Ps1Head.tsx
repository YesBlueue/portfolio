"use client";

import { useEffect, useRef } from "react";
import { createHeadRenderer } from "@/lib/ps1Head";

const FRAME_MS = 64; // ~15 fps, part of the PS1 look

/** Stand-in 3D head. Turns slowly on its own and follows the pointer. */
export function Ps1Head({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const head = createHeadRenderer(ctx, canvas.width, canvas.height);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const area = canvas.parentElement ?? canvas;
    let ry = 0.4;
    let rx = 0.06;
    let targetY: number | null = null;
    let targetX: number | null = null;
    let visible = false;
    let last = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      targetY = ((e.clientX - r.left) / r.width - 0.5) * 1.6;
      targetX = ((e.clientY - r.top) / r.height - 0.5) * 0.7;
      if (reduce) {
        ry = targetY;
        rx = targetX;
        head.draw(ry, rx);
      }
    };
    const onLeave = () => {
      targetY = null;
      targetX = null;
    };
    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    head.draw(ry, rx);

    if (!reduce) {
      const tick = (t: number) => {
        if (visible && t - last > FRAME_MS) {
          last = t;
          const gy = targetY ?? Math.sin(t * 0.0007) * 0.75;
          const gx = targetX ?? Math.sin(t * 0.0005) * 0.12;
          ry += (gy - ry) * 0.3;
          rx += (gx - rx) * 0.3;
          head.draw(ry, rx);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} width={128} height={128} className={className} role="img" aria-label={label} />;
}
