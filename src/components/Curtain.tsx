"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
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
 * The script only ENHANCES: it drives opacity and a small upward translate
 * from scroll position, so the panel appears to lift away faster than the
 * page moves rather than merely sliding off the top. Remove the script and
 * you lose the fade; you do not lose the site.
 *
 * `prefers-reduced-motion` skips the parallax entirely. The panel still
 * scrolls away — the reader loses nothing but the effect, which is the point
 * of the preference.
 *
 * Home only. `usePathname` is the same gate `AccountDisclosure` uses; the
 * hooks above it run unconditionally, so the early return is safe.
 */
export function Curtain({ runningHead }: { runningHead: string | null }) {
  const path = usePathname();
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (path !== "/") return;
    const el = inner.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let raf = 0;
    const paint = () => {
      raf = 0;
      const h = window.innerHeight || 1;
      // Fully gone by ~70% of a screen's scroll, so the register is clear of
      // the panel well before the panel has finished leaving on its own. A
      // 1:1 fade would keep it faintly visible over the first content.
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
      el.style.opacity = String(1 - p);
      // Moves UP faster than the page does — that difference is what reads as
      // lifting away rather than scrolling past.
      el.style.transform = `translate3d(0, ${(-p * 14).toFixed(2)}vh, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint(); // a reload part-way down the page must not flash the panel back in
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [path]);

  if (path !== "/") return null;

  return (
    <section
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

        {runningHead && (
          <>
            <div
              aria-hidden="true"
              className="mt-8 h-px w-[132px]"
              style={{ background: "var(--hairline)" }}
            />
            <p className="mt-5 max-w-[92vw] text-center font-figure text-[10px] uppercase leading-relaxed tracking-[0.15em] text-fg-faint">
              {runningHead}
            </p>
          </>
        )}

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
