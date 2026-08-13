"use client";

import { useSyncExternalStore } from "react";

/** Tailwind's `sm`. Below it, the layout is a phone. */
const NARROW = "(max-width: 639px)";

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * True on a phone-width viewport.
 *
 * Layout belongs in CSS and everywhere a breakpoint can do the job the
 * components use one. This exists for the few values a chart library takes as a
 * NUMBER rather than a class — axis width, tick size, tick spacing — which
 * cannot be expressed in CSS at all.
 *
 * The server snapshot is `false`, so server-rendered markup is the desktop
 * layout and is byte-identical to what it was before this existed; the client
 * corrects after hydration.
 */
export function useNarrow(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}
