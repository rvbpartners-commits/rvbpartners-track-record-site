import Link from "next/link";
import type { ReactNode } from "react";
import { getIndex, getResearch } from "@/lib/data";
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

  const runningHead = index
    ? [
        hasLive ? "Public record" : "Public record · paper",
        currentTo ? `current to ${currentTo}` : null,
        `${index.chain.entries} chained entries`,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="min-h-screen flex flex-col">

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
              className="inline-flex items-center gap-2.5 text-subhead font-semibold"
            >
              <Mark aria-hidden="true" className="h-[21px] w-auto" />
              RVB Partners
            </Link>
            {runningHead && (
              <span className="ml-auto font-figure text-label uppercase tracking-[0.15em] text-fg-faint">
                {runningHead}
              </span>
            )}
          </div>

          {/* On a phone the links wrap onto a second row and the masthead
              doubles in height. Below `sm` they scroll sideways on one line
              instead; `-mx-5 px-5` lets the row bleed to the screen edge so the
              last link is visibly cut off rather than looking like the end. */}
          <nav className="border-t hairline -mx-5 sm:mx-0 px-5 sm:px-0 scroll-x">
            <NavLinks items={nav} />
          </nav>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        {children}
      </main>
      <Footer hasLive={hasLive} hasResearch={hasResearch} />
    </div>
  );
}
