import Link from "next/link";

/**
 * THE HERO — a full-bleed opening band, in the shape an institutional site
 * uses: the mark, one claim, the counts that support it, and two ways in.
 *
 * IT REPLACES THE TITLE PAGE. The site used to open with a separate
 * full-viewport panel carrying the mark and the firm's name, which you
 * scrolled past to reach the register underneath. That was a good instinct
 * built as two things: an entrance, and then a page. Once the palette moved
 * to white it also became a jolt — a full screen of ink, then a white site.
 *
 * The two are the same object. This band does the entrance's job (the mark
 * and the name, meeting you before any figure) and the hero's job (a claim,
 * the evidence for it, and a way forward) in one screen that is part of the
 * page rather than a gate in front of it. Nothing is scrolled past to reach
 * the content; the content starts here.
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
 * IT NO LONGER CARRIES THE MARK. The masthead directly above it does, and on
 * this page the two sat 136px apart at 13px and 46px — the same logo twice on
 * one screen, which is what made the pair read as two competing bands rather
 * than as a head and a cover. Of the two the masthead is the one every route
 * has; this band is on one page. So the mark stays up there and the cover opens
 * on the sentence, which is the more confident opening anyway.
 *
 * AND IT BUTTS THE RULE. `main` pads itself `py-8 lg:py-10`, which is right for
 * prose and wrong for a full-bleed band: it left a 40px strip of white between
 * the masthead's bottom rule and the top of the ink, so the band floated
 * instead of meeting the head. The negative top margin cancels exactly that
 * padding. It lives here rather than in `Shell` because this is the only child
 * that wants it, and `main` must keep its padding for every other page.
 */
export function Hero({
  stats,
}: {
  /** Counts only — never a return. A performance figure in a hero is a claim
   *  made where none of the conditions attached to it will fit. */
  stats: { label: string; value: string }[];
}) {
  return (
    <section className="ground-ink relative left-1/2 -mt-8 w-screen -translate-x-1/2 bg-[#0c0d0e] text-[#f2f0ec] lg:-mt-10">
      <div className="mx-auto max-w-[var(--column)] px-5 sm:px-8 lg:px-12 pt-14 pb-14 lg:pt-20 lg:pb-16">
        <h1 className="max-w-[19ch] text-display font-semibold">
          Systematic strategies, tested against how results deceive.
        </h1>

        <p className="mt-7 max-w-[58ch] text-subhead text-[#b9b4ab]">
          RVB Partners is a systematic trading firm in France. It trades its own
          capital and no one else&rsquo;s. This site is the public register of
          what we trade, how it was tested, and what we refused.
        </p>

        {/* COLOURS INLINE, NOT AS UTILITIES. The band sets a light text colour
            on the whole section, and the primary button needs a DARK one on a
            light fill. Both are single-class arbitrary utilities, so they carry
            equal specificity and the winner is decided by the order Tailwind
            happens to emit them in — which put white text on a white button and
            rendered the main call to action as an empty rectangle. An inline
            style is not a preference here; it is the only way to state the
            override so that nothing can reorder it. */}
        <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3">
          <Link
            href="/portfolios"
            style={{ background: "#f2f0ec", color: "#0c0d0e" }}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 text-small font-medium transition-opacity hover:opacity-90"
          >
            See the record
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/verify"
            style={{ borderColor: "#3a3a37", color: "#f2f0ec" }}
            className="inline-flex items-center gap-2.5 border px-6 py-3.5 text-small font-medium transition-colors hover:bg-white/5"
          >
            Verify it yourself
          </Link>
        </div>

        {/* THE COUNTS, ON THE SAME GROUND AS THE CLAIM. An institutional hero
            puts a stat band under its headline; the difference here is that
            every figure is a count of work done rather than a performance
            number, and each is read from the published payload rather than
            typed into the markup. */}
        {stats.length > 0 && (
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[#2a2a27] pt-9 lg:mt-16 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                {/* A RULE UNDER EACH LABEL. With the mono gone the label and
                    its figure were separated by size and colour alone, and at
                    this scale that is not enough to read the four as four
                    pairs rather than as eight stacked lines. */}
                <dt className="border-b border-[#3a3a37] pb-2.5 text-label font-medium uppercase tracking-[0.13em] text-[#8b8781]">
                  {s.label}
                </dt>
                <dd className="mt-3.5 tabular-nums text-heading leading-none sm:text-title">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
