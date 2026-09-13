import Link from "next/link";

import { HeroGround } from "@/components/HeroGround";

/**
 * THE HERO — a full-bleed opening band: the claim, what the firm is, and two
 * ways in.
 *
 * IT REPLACES THE TITLE PAGE. The site used to open with a separate
 * full-viewport panel carrying the mark and the firm's name, which you
 * scrolled past to reach the register underneath. That was a good instinct
 * built as two things: an entrance, and then a page. Once the palette moved
 * to white it also became a jolt — a full screen of ink, then a white site.
 *
 * The two are the same object. This band does the entrance's job (the name of
 * the firm, meeting you before any figure) and the hero's job (a claim and a
 * way forward) in one screen that is part of the page rather than a gate in
 * front of it. Nothing is scrolled past to reach the content; the content
 * starts here.
 *
 * THE COUNTS ARE GONE FROM IT, AND THAT IS THE WHOLE POINT OF THE CHANGE.
 * The band used to carry a four-figure stat row — strategies researched,
 * backtests recorded, presented as an edge, portfolios — directly under the
 * lede. Every figure was true, read from the payload, and none of them was a
 * performance claim. They were still in the wrong place.
 *
 * A reader who has been on this site for four seconds has been told the firm's
 * name and is then shown 528,527. What they take away is that RVB has run a lot
 * of backtests, which is not the argument: the search is EVIDENCE FOR a way of
 * working, and evidence read before the claim it supports is just a big number.
 * So the counts moved down the page, under a heading that says what they are
 * for, after the two sections that say who the firm is and what it optimises
 * for. Nothing was removed and nothing was softened — the record is still the
 * longest part of the front page. It is the second half of it now instead of
 * the first.
 *
 * TWO DOORS, AND THEY GO TO DIFFERENT HALVES OF THE SITE. One into the
 * portfolios — the product — and one into how the firm invests. "Verify it
 * yourself" used to be the second, which sent a first-time reader straight into
 * a page of hashes before they knew what was being hashed; verification is
 * reached from the record section below, where the record is.
 *
 * FULL-BLEED FROM INSIDE A CAPPED COLUMN. `main` caps its width and pads it,
 * which is right for prose and wrong for a band that should touch both edges.
 * `left-1/2 -translate-x-1/2 w-screen` breaks out of that container without
 * needing the layout to know about it — safe because `body` sets
 * `overflow-x: hidden`, so the 100vw width can never introduce a horizontal
 * scrollbar of its own.
 *
 * The band keeps the ink ground the rest of the site has left behind, and
 * that is the point: one dark screen at the top of a white document reads as
 * a cover. Repeated anywhere else it would just be a second theme.
 *
 * IT HAS A GROUND UNDER IT. `HeroGround` paints a wireframe relief into the
 * band — the shape of a search over a parameter space, not a measurement of
 * anything, and the only drawing on this site that is not read from the
 * published record. Its own file says why at length. The copy sits above it in
 * the stacking order and the drawing is extinguished under the type, so the
 * band reads exactly as it did before if the canvas never paints.
 *
 * IT DOES NOT CARRY THE MARK. The masthead directly above it does, and on
 * this page the two sat 136px apart at 13px and 46px — the same logo twice on
 * one screen, which is what made the pair read as two competing bands rather
 * than as a head and a cover.
 *
 * AND IT BUTTS THE RULE. `main` pads itself `py-8 lg:py-10`, which is right for
 * prose and wrong for a full-bleed band: it left a 40px strip of white between
 * the masthead's bottom rule and the top of the ink, so the band floated
 * instead of meeting the head. The negative top margin cancels exactly that
 * padding. It lives here rather than in `Shell` because this is the only child
 * that wants it, and `main` must keep its padding for every other page.
 */
export function Hero() {
  return (
    <section className="ground-ink relative left-1/2 -mt-8 w-screen -translate-x-1/2 overflow-hidden bg-[#0c0d0e] text-[#f2f0ec] lg:-mt-10">
      <HeroGround />
      {/* ROOM FOR THE GROUND BELOW THE COPY. The headline is capped at 19
          characters and the lede at 62, so under about 1,200px the copy fills
          the band and the drawing has nowhere to be except underneath the type,
          where it is extinguished. The extra bottom padding is the strip the
          horizon runs across — the landscape seen from further off. Once the
          band is wide enough for the copy and a landscape side by side, the
          padding goes back to what the prose wants. `data-hero-copy` is how the
          drawing finds the type it must keep clear of. */}
      <div
        data-hero-copy
        className="relative mx-auto max-w-[var(--column)] px-5 sm:px-8 lg:px-12 pt-14 pb-28 lg:pt-20 xl:pb-18"
      >
        <h1 className="max-w-[19ch] text-display font-semibold">
          Systematic trading, built on research and verifiable in public.
        </h1>

        <p className="mt-7 max-w-[62ch] text-subhead text-[#b9b4ab]">
          RVB Partners is a systematic trading firm in France, trading its own
          capital. It builds diversified portfolios of systematic strategies,
          and publishes what it trades, how each strategy was tested, and a
          hash-chained record that can be checked independently.
        </p>

        {/* COLOURS INLINE, NOT AS UTILITIES. The band sets a light text colour
            on the whole section, and the primary button needs a DARK one on a
            light fill. Both are single-class arbitrary utilities, so they carry
            equal specificity and the winner is decided by the order Tailwind
            happens to emit them in — which put white text on a white button and
            rendered the main call to action as an empty rectangle. An inline
            style is not a preference here; it is the only way to state the
            override so that nothing can reorder it. */}
        {/* FULL WIDTH WHILE THEY ARE STACKED. Below `sm` the two buttons wrap
            onto separate lines and each took its own text width, so the pair
            sat as two ragged left-aligned blocks of different lengths. They
            share an edge now, and go back to sitting side by side at their own
            widths as soon as there is room. */}
        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <Link
            href="/portfolios"
            style={{ background: "#f2f0ec", color: "#0c0d0e" }}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-small font-medium transition-opacity hover:opacity-90"
          >
            Explore the portfolios
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/approach"
            style={{ borderColor: "#3a3a37", color: "#f2f0ec" }}
            className="inline-flex items-center justify-center gap-2.5 border px-6 py-3.5 text-small font-medium transition-colors hover:bg-white/5"
          >
            How we invest
          </Link>
        </div>
      </div>
    </section>
  );
}
