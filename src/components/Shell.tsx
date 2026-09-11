import Link from "next/link";
import type { ReactNode } from "react";
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
 * THE RUNNING HEAD IS ONE QUIET LINE. It began as a run-on caption at 10.5px
 * in `--fg-faint`, which is 4.67:1 and the floor of the scale: the facts that
 * tell a reader what they have opened, set as the least legible thing on the
 * page. Breaking it into three labelled facts with ruled labels fixed the
 * legibility and overshot — at `text-small` with an underline under each label
 * it read as a row of controls, and the underlines read as links.
 *
 * So: one line again, at `text-caption` in `--fg-muted` (8.88:1) with the two
 * VALUES in `--fg`, so the date and the count carry and the words around them
 * recede. A running head is read once, on arrival, and then ignored; staying
 * out of the way is a requirement and not a compromise.
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

  // The lead keeps its exact wording, paper qualifier included: it is a
  // standing claim about what these accounts ARE, derived from the books, and
  // it may never become a constant. Nor may either figure beside it.
  const lead = hasLive ? "Public record" : "Public record · paper";

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

      {/* NO RULE ON THE <header> ITSELF. It carried `border-b hairline`, which
          sits OUTSIDE the capped container and therefore ran the full width of
          the viewport — while the rule between the name row and the contents
          row, and every section rule on every page below, stop at the text
          column. One band, two rule widths, and the wider of the two was the
          one dividing the masthead from the page.

          The rules now all measure the same, so the masthead is bounded the
          way the text is and the head reads as the top of the document rather
          than as a bar laid across it. */}
      <header>
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
              <Mark aria-hidden="true" className="h-[26px] w-auto" />
              RVB Partners
            </Link>
            {index && (
              /* `tabular-nums`, not `.tnum`: the site's `.tnum` class also
                 switches the face to the mono, and the chrome is one typeface
                 now. The figures still line up.

                 Full width under the wordmark on a phone; right-aligned from
                 `sm` up, where it has a column of its own. */
              <p className="w-full text-caption tabular-nums text-fg-muted sm:ml-auto sm:w-auto sm:text-right">
                {lead}
                {currentTo && (
                  <>
                    {" · current to "}
                    <span className="text-fg">{date(currentTo)}</span>
                  </>
                )}
                {" · "}
                <span className="text-fg">{index.chain.entries}</span>
                {" chained entries"}
              </p>
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
            className="border-y hairline -mx-5 sm:mx-0 px-5 sm:px-0 scroll-x"
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
      <Footer hasLive={hasLive} />
    </div>
  );
}
