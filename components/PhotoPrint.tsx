"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PhotoPrint.module.css";

export type Print = {
  src: string;
  alt: string;
  width: number;
  height: number;
  title: string;
  caption?: string;
};

const PAD = 14; // white border around the photo
const CAPTION_H = 62; // the handwritten strip under it
const TILT = -1; // degrees, once it has landed

/**
 * A Journey photo, opened full size as a print. It lifts out of its card and grows to the
 * middle of the screen with its caption handwritten underneath; closing drops it back into
 * the card. Arrows, arrow keys or a swipe flip to the next or previous photo; Escape, the
 * close button or a click on the backdrop closes it.
 */
export function PhotoPrint({
  prints,
  index,
  origin,
  onMove,
  onClose,
}: {
  prints: Print[];
  index: number;
  /** The card photo it opened from (and returns to). */
  origin: (index: number) => HTMLElement | null;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const p = prints[index];
  const printRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const closing = useRef(false);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The largest size that fits the window, keeping the photo's own shape.
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const fit = () => {
      const maxW = Math.min(window.innerWidth * 0.92, 1100) - PAD * 2;
      const maxH = window.innerHeight * 0.86 - PAD - CAPTION_H;
      const s = Math.min(maxW / p.width, maxH / p.height);
      setBox({ w: Math.round(p.width * s), h: Math.round(p.height * s) });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [p.width, p.height]);

  /** A transform that puts the print exactly over the card photo. */
  const fromCard = useCallback(
    (i: number) => {
      const el = printRef.current, card = origin(i);
      if (!el || !card) return null;
      const a = el.getBoundingClientRect(), b = card.getBoundingClientRect();
      // Compare the photo areas, not the borders, so the picture itself lines up.
      const s = b.width / (box.w || a.width);
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      return `translate(${dx}px, ${dy}px) scale(${s}) rotate(1deg)`;
    },
    [origin, box.w],
  );

  // Lift out of the card.
  useLayoutEffect(() => {
    const el = printRef.current;
    if (!el || !box.w) return;
    if (!reduced) {
      const t = fromCard(index);
      if (t) {
        el.style.transition = "none";
        el.style.transform = t;
        el.getBoundingClientRect();
      }
    }
    el.style.transition = "";
    el.style.transform = `rotate(${TILT}deg)`;
    setShown(true);
    // Only on first open; flipping between photos doesn't fly them in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w > 0]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    const el = printRef.current;
    const t = !reduced && fromCard(index);
    if (!el || !t) return onClose();
    el.style.transform = t;
    const done = () => onClose();
    el.addEventListener("transitionend", done, { once: true });
    window.setTimeout(done, 600); // in case the transition never fires
  }, [fromCard, index, onClose, reduced]);

  const move = useCallback((d: number) => onMove((index + d + prints.length) % prints.length), [index, onMove, prints.length]);

  // Keyboard, scroll lock and focus.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "Tab") {
        // Keep focus inside the dialog.
        const f = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!f?.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prev;
      opener?.focus({ preventScroll: true });
    };
  }, [close, move]);

  // Swipe left or right on touch screens.
  const swipe = useRef<number | null>(null);

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.root}
      data-shown={shown || undefined}
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      <div className={styles.backdrop} onClick={close} />
      <div
        className={styles.stage}
        onPointerDown={(e) => (swipe.current = e.pointerType === "touch" ? e.clientX : null)}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div ref={printRef} className={styles.print} style={{ padding: `${PAD}px ${PAD}px 0` }}>
          <Image
            key={p.src}
            className={styles.photo}
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            sizes="92vw"
            style={{ width: box.w || undefined, height: box.h || undefined }}
            priority
          />
          <p className={styles.caption} style={{ height: CAPTION_H }}>
            {p.caption ?? p.title}
          </p>
        </div>
      </div>
      {prints.length > 1 && (
        <>
          <button type="button" className={`${styles.nav} ${styles.prev}`} onClick={() => move(-1)} aria-label="Previous photo">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 5 8l5 5" />
            </svg>
          </button>
          <button type="button" className={`${styles.nav} ${styles.next}`} onClick={() => move(1)} aria-label="Next photo">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="m6 3 5 5-5 5" />
            </svg>
          </button>
        </>
      )}
      <button ref={closeRef} type="button" className={styles.close} onClick={close} aria-label="Close photo">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}
