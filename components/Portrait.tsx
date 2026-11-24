"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { IMG_H, IMG_W, startTie } from "@/lib/tie";
import styles from "./Portrait.module.css";

/** The hero photo as a tilted print, with the interactive tie hanging out of the frame. */
export function Portrait({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const photoRef = useRef<HTMLDivElement>(null);
  const tieRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!photoRef.current || !tieRef.current) return;
    return startTie(tieRef.current, photoRef.current);
  }, []);

  return (
    <figure className={styles.print}>
      <div className={styles.wrap}>
        <div ref={photoRef} className={styles.photo}>
          <Image src={src} alt={alt} width={IMG_W} height={IMG_H} priority sizes="(max-width: 860px) 90vw, 400px" />
        </div>
        <canvas ref={tieRef} className={styles.tie} aria-hidden="true" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
