"use client";

import { useRef, useState } from "react";
import styles from "./CopyEmail.module.css";

export function CopyEmail({ email }: { email: string }) {
  const [label, setLabel] = useState("COPY");
  const textRef = useRef<HTMLSpanElement>(null);

  const selectText = () => {
    const el = textRef.current;
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setLabel("COPIED");
      window.setTimeout(() => setLabel("COPY"), 1600);
    } catch {
      selectText();
    }
  };

  return (
    <div className={styles.box}>
      <a href={`mailto:${email}`} className={styles.mail}>
        <span ref={textRef}>{email}</span>
      </a>
      <button type="button" className={styles.copy} onClick={copy} aria-live="polite">
        {label}
      </button>
    </div>
  );
}
