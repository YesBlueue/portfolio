"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { IMG_H, IMG_W, startTie } from "@/lib/tie";
import styles from "./Portrait.module.css";

/** The hero photo as a tilted print, with the interactive tie hanging out of the frame. */
export function Portrait({ src, alt, caption, note }: { src: string; alt: string; caption: string; note?: string }) {
  const photoRef = useRef<HTMLDivElement>(null);

  // The tie draws on its own canvas over the whole page (see lib/tie.ts).
  useEffect(() => {
    if (!photoRef.current) return;
    return startTie(photoRef.current);
  }, []);

  return (
    <figure className={styles.print}>
      <div className={styles.wrap}>
        <div ref={photoRef} className={styles.photo}>
          <Image src={src} alt={alt} width={IMG_W} height={IMG_H} priority sizes="(max-width: 860px) 90vw, 400px" />
        </div>
      </div>
      <figcaption>{caption}</figcaption>
      {/* On phones the hint sits here, in the print's bottom-right corner. */}
      {note && (
        <span className={styles.note} aria-hidden="true">
          {note}
        </span>
      )}
    </figure>
  );
}
