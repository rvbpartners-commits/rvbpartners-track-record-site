"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Mark } from "./Mark";

/**
 * The title page. The mark and the firm's name fill the screen; scrolling
 * lifts and fades them, and the register opens underneath.
 *
 * IT IS IN NORMAL FLOW, AND THAT IS THE WHOLE SAFETY ARGUMENT. The obvious
 * way to build this is a `position: fixed` overlay dismissed by a scroll
 * handler — and that produces a site whose every page is a blank screen if
 * the script fails to load, is blocked, or throws before it binds. A fixed
 * element that JavaScript is solely responsible for removing is a single
 * point of failure in front of the entire record.
 *
 * So the curtain is an ordinary 100svh block at the top of the document. It
 * leaves the viewport because the PAGE SCROLLS, exactly as any tall element
 * would, with no script involved. With JavaScript off, or broken, or still
 * loading, the site is a normal scrolling page that happens to open with a
 * title screen. Nothing can trap a reader above the fold.
 *
 * IT IS ALSO A THRESHOLD, CROSSED ONCE. Once you have scrolled past it the
 * panel is removed from the document, and the top of the register becomes the
 * top of the page — so scrolling up lands on the record and stops there,
 * rather than drifting back out of the site into the title screen. An entrance
 * you can fall back through every time you overscroll is not an entrance, and
 * it makes the page you actually came for feel like a subsection of a splash
 * screen.
 *
 * The removal is invisible, and both halves of that are deliberate:
 *
 *  - It commits only once the panel is ENTIRELY above the viewport, so taking
 *    it out of the flow changes nothing that is being looked at.
 *  - Removing a 100svh block shifts everything below it up by exactly its own
 *    height, so the scroll position is corrected by that height in the same
 *    frame — in a layout effect, before the browser paints. Do it in a
 *    `requestAnimationFrame` instead and the page paints once at the wrong
 *    offset: a visible jump of a full screen.
 *
 * And it waits for scrolling to STOP first. Writing to `window.scrollTo`
 * during a trackpad fling kills the momentum on macOS and iOS, so a reader
 * who flicks into the site would feel it stall under their fingers. A short
 * idle gap costs nothing and guarantees no gesture is in flight.
 *
 * The script only ENHANCES the fade: it drives opacity and a small upward
 * translate from scroll position, so the panel appears to lift away faster
 * than the page moves rather than merely sliding off the top. Remove the
 * script and you lose the fade and the threshold; you do not lose the site.
 *
 * `prefers-reduced-motion` skips the parallax. The panel still scrolls away
 * and is still removed behind you — the preference is about motion, not about
 * how the site is structured.
 *
 * Home only. `usePathname` is the same gate `AccountDisclosure` uses; the
 * hooks above it run unconditionally, so the early return is safe.
 */

/* `useLayoutEffect` warns when React renders on the server, and this component
 * IS server-rendered before it hydrates. The effect only ever has work to do
 * in a browser, so it degrades to `useEffect` where there is no DOM. */
const useBeforePaint =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** How long scrolling must be quiet before the panel is removed (ms). */
const SETTLE_MS = 140;

export function Curtain() {
  const path = usePathname();
  const home = path === "/";

  const section = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  // Where to put the reader once the panel is gone. Read BEFORE the state
  // flips, applied in the layout effect below, so no frame is painted at the
  // uncorrected offset.
  const restoreTo = useRef<number | null>(null);
  const [entered, setEntered] = useState(false);

  const commit = useCallback(() => {
    const el = section.current;
    if (!el) return;
    restoreTo.current = Math.max(0, window.scrollY - el.offsetHeight);
    setEntered(true);
  }, []);

  useEffect(() => {
    if (!home || entered) return;
    const el = section.current;
    const panel = inner.current;
    if (!el || !panel) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    let raf = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const paint = () => {
      raf = 0;
      const h = el.offsetHeight || 1;
      if (!reduced) {
        // Fully faded by ~70% of the panel's height, so the register is clear
        // of it well before the panel has finished leaving on its own.
        const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
        panel.style.opacity = String(1 - p);
        // Moves UP faster than the page does — that difference is what reads
        // as lifting away rather than scrolling past.
        panel.style.transform = `translate3d(0, ${(-p * 14).toFixed(2)}vh, 0)`;
      }
      // The threshold: the panel is wholly above the viewport. Committing here
      // rather than at first scroll is what makes the removal unnoticeable.
      if (window.scrollY >= h) {
        clearTimeout(idle);
        idle = setTimeout(commit, SETTLE_MS);
      } else {
        clearTimeout(idle);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint(); // a reload part-way down must not flash the panel back in
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(idle);
    };
  }, [home, entered, commit]);

  useBeforePaint(() => {
    if (!entered || restoreTo.current === null) return;
    window.scrollTo(0, restoreTo.current);
    restoreTo.current = null;
  }, [entered]);

  if (!home || entered) return null;

  return (
    <section
      ref={section}
      aria-label="RVB Partners"
      className="relative h-[100svh] min-h-[520px] w-full"
    >
      <div
        ref={inner}
        className="absolute inset-0 flex flex-col items-center justify-center px-6 will-change-[opacity,transform]"
      >
        <Mark className="h-[74px] sm:h-[104px] w-auto" />

        {/* NOT an <h1>. The home page already has one — the sentence saying
            what the firm is — and a document with two top-level headings has
            no top-level heading as far as a screen reader's outline or a
            crawler is concerned. The section's aria-label carries the name for
            assistive technology; this element is the typography. */}
        <p className="mt-9 text-center text-[30px] sm:text-[44px] font-semibold leading-none tracking-[-0.015em]">
          RVB Partners
        </p>

        {/* The affordance. Without it a visitor can meet a full screen with no
            visible control and no indication there is anything under it. */}
        <span
          aria-hidden="true"
          className="absolute bottom-9 flex flex-col items-center gap-2.5 font-figure text-[9.5px] uppercase tracking-[0.2em] text-fg-faint"
        >
          Scroll
          <span className="curtain-cue h-7 w-px" />
        </span>
      </div>
    </section>
  );
}
