"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { site } from "@/lib/content";
import { TITLE_SEEN_KEY } from "@/lib/title";
import { Ps1Head } from "./Ps1Head";
import styles from "./TitleScreen.module.css";

const isOpen = () => !document.documentElement.hasAttribute("data-title");

/** Close the title screen and remember it for later visits. */
function startGame() {
  const html = document.documentElement;
  if (!isOpen()) return;
  try {
    localStorage.setItem(TITLE_SEEN_KEY, "1");
  } catch {}
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  html.setAttribute("data-title", "leaving");
  window.setTimeout(() => html.setAttribute("data-title", "seen"), reduce ? 0 : 450);
}

/** Bring the title screen back (used by the footer link). */
export function replayTitle() {
  try {
    localStorage.removeItem(TITLE_SEEN_KEY);
  } catch {}
  document.documentElement.removeAttribute("data-title");
  window.dispatchEvent(new Event("title:open"));
}

export function TitleScreen() {
  const ref = useRef<HTMLDivElement>(null);

  // React's dev-mode remount clears attributes on <html>; put the flag back before paint.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(TITLE_SEEN_KEY) || location.hash) {
        document.documentElement.setAttribute("data-title", "seen");
      }
    } catch {}
  }, []);

  const focusScreen = useCallback(() => {
    if (isOpen()) ref.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    focusScreen();
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen() || e.key === "Tab" || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      startGame();
    };
    const onOpen = () => {
      window.scrollTo(0, 0);
      focusScreen();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("title:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("title:open", onOpen);
    };
  }, [focusScreen]);

  return (
    <div
      ref={ref}
      className={styles.screen}
      data-title-screen=""
      role="dialog"
      aria-modal="true"
      aria-label="Title screen"
      tabIndex={-1}
      onClick={startGame}
    >
      <button type="button" className={styles.skip} onClick={startGame}>
        Skip ▸
      </button>
      <div className={styles.stack}>
        <Ps1Head className={styles.head} label={`Low-poly 3D portrait of ${site.name}`} />
        <p className={styles.kicker}>Portfolio · {site.year}</p>
        <p className={styles.logo}>{site.name.toUpperCase()}</p>
        <p className={styles.press}>PRESS START</p>
        <p className={styles.hint}>Press any key, click or tap</p>
      </div>
    </div>
  );
}
