import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { getIndex, getResearch } from "@/lib/data";
import { date } from "@/lib/format";
import { visibleNav } from "@/lib/nav";
import { Mark } from "./Mark";
import { NavLinks } from "./NavLinks";
import { Footer } from "./Footer";

/** A ruled page, not a set of panels.
 *
 * The masthead is a RUNNING HEAD and a CONTENTS row, in that order, which is
 * how a document identifies itself: what this is, how current it is, how big
 * it is — then where to go. It was one line with the firm's name, five links
 * and a tagline, all set in the same face at the same weight, which is a
 * navigation bar and tells a reader nothing about what they have opened.
 *
 * The contents row is set in the mono, in capitals. That is not styling: the
 * whole page runs on one rule — the serif is the firm talking, the mono is
 * something read off a file — and an index of the register is the second kind.
 *
 * THE RUNNING HEAD WAS THE PROBLEM, NOT THE WHITE. The band was called cheap,
 * and the reason is not its ground: it is that every element in it sat at the
 * smallest step of the scale — 10.5px, `--fg-faint`, capitals — so an eight-step
 * type scale was represented up here by exactly two steps, and the three facts
 * that say what a reader has opened were a single run-on caption at 4.67:1.
 * They are now three separate facts at `text-small`, each with its own label, in
 * `--fg-muted` and `--fg`.
 *
 * And on the home page the band repeated everything below it: the mark again
 * 136px lower at 3.5x the size, the wordmark again opening the hero's lede, the
 * nav again as the Contents section. The mark now appears ONCE, here, which is
 * the one surface all eight routes share — the hero is the page that has an
 * alternative, not the masthead.
 */
export async function Shell({ children }: { children: ReactNode }) {
  // The masthead tagline described every book here as paper. It is read from the
  // payload for the same reason the footer disclosure is: a standing claim about
  // what the accounts ARE cannot be a constant once one of them changes.
  const [index, research] = await Promise.all([getIndex(), getResearch()]);
  const hasLive = (index?.books ?? []).some((b) => b.capital_at_risk);
  const hasResearch = research !== null;
  const nav = visibleNav(hasResearch).map(({ href, label }) => ({ href, label }));

  // HOW CURRENT THE RECORD IS, read off the books rather than off the clock.
  // `published_at` is when the publisher last RAN, which is not the same claim
  // and is the more flattering one: a publisher that runs nightly reports today
  // even when the newest session it carries is a week old. The latest session
  // any book actually has is the honest answer, and it is the one a reader can
  // check against the chain.
  const currentTo = (index?.books ?? [])
    .map((b) => b.last_session)
    .filter(Boolean)
    .sort()
    .at(-1);

  // THREE FACTS, NOT ONE STRING. Joining them with middots produced a caption;
  // separating them lets each carry its own label and its own weight, which is
  // what a running head is for. Every value is still read from the payload —
  // none of these may ever become a constant.
  const facts: { label: string | null; value: string }[] = index
    ? [
        // The lead keeps its exact wording, including the paper qualifier: it
        // is a standing claim about what these accounts ARE, derived from the
        // books, and it must not be softened into a label.
        { label: null, value: hasLive ? "Public record" : "Public record · paper" },
        ...(currentTo
          ? [{ label: "Current to", value: date(currentTo) }]
          : []),
        { label: "Chained", value: `${index.chain.entries} entries` },
      ]
    : [];

  return (
    <div className="min-h-screen flex flex-col">

      {/* THE FIRST STOP FOR A KEYBOARD, AND THERE WAS NONE. Every route puts
          the same seven contents links ahead of the page, so reaching the
          actual content meant tabbing past all of them, on all twelve routes.
          Visually hidden until it is focused, which is the whole point: it
          costs a sighted reader nothing and it is the first thing a keyboard
          reader reaches. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:border focus-visible:hairline focus-visible:bg-bg focus-visible:px-4 focus-visible:py-2 focus-visible:text-small"
      >
        Skip to the record
      </a>

      <header className="border-b hairline">
        {/* `mx-auto` is what centres the column. A `max-w-*` on its own only
            caps the width — the block stays flush left, which on a wide screen
            leaves the whole site pinned to one edge. Every container that caps
            its width at MEASURE below does both, and they all use the same
            token so the masthead, the body and the footer share one edge. */}
        <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-4 pb-3">
            {/* The mark rides with the name here too. A site whose title page
                opens on a logo and whose masthead then shows none reads as two
                different sites. */}
            <Link
              href="/"
              /* `items-center`, not `items-baseline`. An SVG's baseline is its
                 bottom edge, so a baseline-aligned mark hangs its whole height
                 above the text — survivable for the old 230×130 staircase with
                 a 1px nudge, wrong for a square one. */
              className="inline-flex items-center gap-2.5 text-subhead font-bold tracking-[-0.022em]"
            >
              <Mark aria-hidden="true" className="h-[21px] w-auto" />
              RVB Partners
            </Link>
            {facts.length > 0 && (
              /* Full width under the name on a phone, where three facts and the
                 wordmark cannot share a line; pushed right from `sm` up. */
              <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 text-small text-fg-muted sm:ml-auto sm:w-auto">
                {facts.map((f, i) => (
                  <Fragment key={f.value}>
                    {i > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden h-4 w-px bg-hairline sm:block"
                      />
                    )}
                    <span className="inline-flex items-baseline gap-x-2">
                      {f.label && (
                        <span className="border-b hairline pb-[3px] text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
                          {f.label}
                        </span>
                      )}
                      <span
                        /* `tabular-nums`, not `.tnum`: the site's `.tnum`
                           class also switches the face to the mono, and the
                           chrome is one typeface now. The figures still line
                           up. */
                        className={`tabular-nums text-fg ${f.label ? "" : "font-semibold"}`}
                      >
                        {f.value}
                      </span>
                    </span>
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          {/* On a phone the links wrap onto a second row and the masthead
              doubles in height. Below `sm` they scroll sideways on one line
              instead; `-mx-5 px-5` lets the row bleed to the screen edge so the
              last link is visibly cut off rather than looking like the end. */}
          {/* LABELLED, because there are two navigation landmarks on every
              page and a screen reader announcing "navigation" twice tells a
              reader nothing about which one they are in. */}
          <nav
            aria-label="Sections of the register"
            className="border-t hairline -mx-5 sm:mx-0 px-5 sm:px-0 scroll-x"
          >
            <NavLinks items={nav} />
          </nav>
        </div>
      </header>

      <main
        id="main"
        className="flex-1 mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-10"
      >
        {children}
      </main>
      <Footer hasLive={hasLive} hasResearch={hasResearch} />
    </div>
  );
}
