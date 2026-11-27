/**
 * Runs `start` once the browser is idle after loading (or within `timeout` ms at the
 * latest), so heavy setup doesn't compete with the first paint. Returns a cleanup that
 * cancels the wait or, if `start` already ran, calls the cleanup it returned.
 */
export function whenIdle(start: () => (() => void) | void, timeout = 1500): () => void {
  let stop: (() => void) | void;
  let done = false;
  const run = () => {
    if (!done) stop = start();
  };
  // Safari has no requestIdleCallback; a short timeout stands in for it there.
  const idle = typeof window.requestIdleCallback === "function";
  const id: number = idle ? window.requestIdleCallback(run, { timeout }) : window.setTimeout(run, 200);
  return () => {
    done = true;
    if (idle) window.cancelIdleCallback(id);
    else window.clearTimeout(id);
    stop?.();
  };
}
