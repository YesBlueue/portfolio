"use client";

import { replayTitle } from "./TitleScreen";

export function ReplayIntro({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={replayTitle}>
      Replay intro
    </button>
  );
}
