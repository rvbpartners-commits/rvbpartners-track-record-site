import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { Stamp } from "@/components/Stamp";
import { DATA_REPO_URL, SITE_ORIGIN, getIndex, getResearch } from "@/lib/data";
import { NO_VALUE, date, prose, slugLabel } from "@/lib/format";

// Rendered per request, like every other page: the numbers move when the
// catalogue does, and a prerender would serve last week's denominator.
export const dynamic = "force-dynamic";

/** The description promises figures. It must not promise them when the summary
 *  has not been published: a page whose metadata advertises "recorded trials,
 *  idea families" and whose body says "not published yet" is a claim with
 *  nothing behind it, and search engines quote the metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const r = await getResearch();
  return {
    title: "Research",
    description: r
      ? "The recorded trials and idea families behind what is published, " +
        "and the bar the survivors were judged against."
      : "The research summary behind this track record.",
    alternates: { canonical: `${SITE_ORIGIN}/research` },
  };
}

/** Counts, in the site's own locale. `—` for a value that was never published:
 *  the absence is the honest rendering and must never round to zero.
 *
 *  THE `Number.isFinite` GUARD IS NOT DECORATION. This helper used to test only
 *  for `null` and `undefined`, while the identical `count()` on /refused tested
 *  for all three — so a `NaN` reaching this page (a JSON `null` that survived a
 *  cast, an arithmetic accident upstream) printed the literal string "NaN" here
 *  and printed the absence marker there, from the same published file. Two
 *  pages disagreeing about the same field is the one thing this register cannot
 *  afford. */
const int = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? NO_VALUE
    : n.toLocaleString("en-US");

/* THE PUBLISHED KEYS ARE NOT A FIXED SET AND ARE NOT CASE-CONSISTENT.
   `by_tier` ships "Baseline", "Optimized" and "Research" capitalised beside a
   lowercase "production". Order is a preference applied case-insensitively; a
   key this file has never heard of sorts to the end and still renders, under
   its own published name. Nothing is dropped, because a tier nobody anticipated
   is still a fact about the catalogue. */
const TIER_ORDER = ["production", "optimized", "baseline", "research"];
const VERDICT_ORDER = ["promote", "conditional", "reject", "unfiled"];

function ordered(keys: string[], preferred: string[]): string[] {
  const rank = (k: string) => {
    const i = preferred.indexOf(k.toLowerCase());
    return i === -1 ? preferred.length : i;
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/**
 * THE DENOMINATOR.
 *
 * One question: how much was searched to produce what is published, and against
 * what bar were the survivors judged? A performance figure means nothing
 * without the number of things that were tried to find it, and that number is
 * the one thing here a reader cannot get anywhere else — it comes from a
 * committed, append-only ledger that our build refuses to let us publish
 * artifacts without.
 *
 * THE PAGE CARRIES NO PERFORMANCE FIGURE, and the section that says so is now
 * the FIRST thing on it rather than the last. It governs everything under it:
 * read at the bottom, it was a footnote apologising for the page; read at the
 * top, it is the frame the counts are read inside.
 *
 * Nothing here is computed. Every figure is a field of `research.json`,
 * regenerated deliberately from the committed catalogue upstream.
 *
 * ON THE GRID. This page carried its own private `Section` — one of six
 * byte-identical copies across the site — which drew a rule, a heading and one
 * column of prose, and left the right-hand half of every section empty. It now
 * uses the shared primitive (src/components/Section.tsx): rail, measure,
 * margin. The gloss moved out of the heading, where it was set in
 * `text-fg-faint/70` (#9e9e9c, 2.68:1 on white — a failing contrast on the only
 * words naming the section) and into the rail, and the margin carries the
 * figures this page had all along and never showed: the tier-by-verdict matrix
 * the payload publishes, and the three deflation counts drawn to one scale.
 */
export default async function ResearchPage() {
  // The index is read for exactly two things: the account disclosure's
  // `hasLive` (derived from the books, never asserted) and the trading
  // record's own clock. No portfolio figure appears on this page. Fetched
  // alongside the summary rather than after it — neither depends on the other,
  // and serialising them puts a second round trip in front of the first byte.
  const [r, index] = await Promise.all([getResearch(), getIndex()]);

  // The last session ANY book has published. Taken from the books rather than
  // from `published_at`, which is when the publisher ran, not what the record
  // covers.
  const recordThrough =
    index && index.books.length > 0
      ? index.books.reduce(
          (latest, b) => (b.last_session > latest ? b.last_session : latest),
          index.books[0].last_session,
        )
      : null;

  if (!r) {
    return (
      <div className="pt-2 lg:pt-6">
        <Masthead />
        <WhatThisIsNot index={index} note={undefined} />
        <Note tone="warn" className="mt-12">
          The research summary has not been published yet. Nothing is shown here
          rather than a figure that might be out of date.
        </Note>
      </div>
    );
  }

  const s = r.search;
  const d = r.deflation;
  const presented = r.catalogue?.presented_folders;

  // THE TIER MATRIX IS RESOLVED HERE, NOT IN THE MARGIN.
  //
  // `catalogue` is optional and `by_tier` is optional inside it, so the margin
  // component was reaching two levels into a payload it was handed one level
  // of. It is resolved once, at the only place that holds the whole object,
  // and the margin is handed rows it cannot mis-read.
  //
  // THE GATE IS THE ROWS, NOT THE KEY. `by_tier: {}` is a published key with
  // nothing in it, and gating on the key alone put the note ("the same
  // catalogue as it is filed on disk…") beside a component that had already
  // returned null — a paragraph describing a matrix next to an empty column.
  // Note and aside now go undefined together, and the margin falls back to the
  // gloss, which is what the grid is for.
  //
  // A cell that is not a number is dropped rather than shown as zero: a
  // verdict a tier publishes no cell for is an absence, and an absence is not
  // a count of none.
  const byTier = r.catalogue?.by_tier;
  const tierRows = byTier
    ? ordered(Object.keys(byTier), TIER_ORDER).map((tier) => {
        const cells = byTier[tier] ?? {};
        return {
          tier,
          verdicts: ordered(
            Object.keys(cells).filter((v) => typeof cells[v] === "number"),
            VERDICT_ORDER,
          ).map((verdict) => ({ verdict, value: cells[verdict] })),
        };
      })
    : [];

  // THE THIRD CLOCK, read off the debt itself. Each grandfathered list is dated
  // where it was generated, and those dates are months older than the figures
  // above them — printing one date for the whole page would silently freshen
  // them. Collected from the payload, never typed: a gate that publishes a new
  // date moves this line by itself.
  const gateDates = r.gate_debt
    ? Array.from(
        new Set(
          Object.values(r.gate_debt)
            .map((block) => block.generated)
            .filter((g): g is string => typeof g === "string"),
        ),
      ).sort()
    : [];
  const gateSpan =
    gateDates.length === 0
      ? NO_VALUE
      : gateDates.length === 1
        ? date(gateDates[0])
        : `${date(gateDates[0])} → ${date(gateDates[gateDates.length - 1])}`;

  return (
    <div className="pt-2 lg:pt-6">
      <Masthead />

      {/* ─── 1. THE FRAME, BEFORE ANY FIGURE ──────────────────────────────
          Moved here from the foot of the page. Everything below is a count of
          things that were thrown away, printed six figures large; a reader who
          meets those before meeting "this is not a performance claim" has
          already read them as one. */}
      <WhatThisIsNot index={index} note={r.note} />

      {/* ─── 2. THE THREE CLOCKS ──────────────────────────────────────────
          Three different dates govern three different parts of this page, and
          they are months apart. Named together, once, because the failure mode
          is a reader carrying the freshest of them across the whole page —
          which would date the gate debt to this week and the search to the
          last trading session. Each is repeated beside what it governs. */}
      <Section
        title="As of"
        gloss="three dates, and they are not the same"
        note={
          <>
            The freshest of the three does not stand in for the other two.
            Nothing on this page is derived from the trading record, and each
            grandfathered list carries the date it was drawn on.
          </>
        }
      >
        <Clocks
          rows={[
            {
              value: date(r.generated_at),
              label: "The figures on this page",
              note: (
                <>
                  Regenerated deliberately from the committed catalogue, not on
                  a schedule and not on every publish. They do not move when the
                  desk marks a session.
                </>
              ),
            },
            {
              value: recordThrough ? date(recordThrough) : NO_VALUE,
              label: (
                <>
                  The{" "}
                  <Link href="/portfolios" className="text-accent hover:underline">
                    trading record
                  </Link>
                </>
              ),
              note: (
                <>
                  The latest session any portfolio in the record has published.
                  Nothing on this page is derived from it, and nothing on it is
                  derived from this page.
                </>
              ),
            },
            {
              value: gateSpan,
              label: "The known-violation lists",
              note: (
                <>
                  Each check&rsquo;s list is dated where it was generated. The
                  dates are printed per check in the table below, because they
                  differ.
                </>
              ),
            },
          ]}
        />
      </Section>

      {/* ─── 3. HOW MUCH WAS SEARCHED ─────────────────────────────────────
          THE MARGIN CARRIES THE CATALOGUE ITSELF. `catalogue.by_tier` is a
          full tier-by-verdict matrix that this page has never rendered — it
          read `presented_folders` and nothing else — while /refused printed it
          in full. Showing it here costs no new derivation: every cell is a
          published integer, printed under the key it was published with. */}
      <Section
        title="How much was searched"
        gloss="the denominator"
        note={
          tierRows.length > 0 ? (
            <>
              The same catalogue as it is filed on disk, folder by folder, under
              the verdict each folder earned. One strategy can own a folder in
              more than one tier at once, so these are folders and not
              strategies. Each tier lists only the verdicts published for it.
            </>
          ) : undefined
        }
        aside={
          tierRows.length > 0 ? <TierMatrix rows={tierRows} /> : undefined
        }
      >
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Figure
            value={int(s.recorded_trials)}
            label="Recorded backtests"
            note={`Every backtest, sweep and grid cell, across ${int(
              s.ledger_entries,
            )} entries of an append-only ledger. Publishing an artifact without the trials that produced it fails our build.`}
          />
          <Figure
            value={int(s.strategies_researched)}
            label="Strategies researched"
            note="Each one carries its own committed returns, report and verdict. That includes the ones that failed."
          />
          <Figure
            value={int(s.idea_families)}
            label="Distinct idea-families"
            note="Clustered by correlation and by shared code, not by name."
          />
          <Figure
            value={int(s.effective_independent_trials)}
            label="Effective independent trials"
            note="The denominator the correction actually uses, after collapsing repeated ideas. Not a whole number, because it is an estimate of independence rather than a tally of runs."
          />
          <Figure
            value={int(s.effective_independent_strategies)}
            label="Effective independent strategies"
            note="The same collapse, counted in strategies rather than trials."
          />
          {presented !== undefined && (
            /* FOLDERS, NOT STRATEGIES — the key says so, and the two counts are
               not the same thing: a strategy adopted from a sweep is filed in
               more than one tier. This tile used to read "out of 829
               researched", which invites exactly that division and gets a
               wrong ratio. The comparison belongs on the page that holds the
               tier breakdown, so it is made there. */
            <Figure
              value={int(presented)}
              label="Presented as an edge"
              note="Catalogue folders the firm presents as a result. Everything else stays on disk, fully auditable, and is never presented as one."
            />
          )}
        </div>

        {/* THE PAYLOAD'S OWN CAVEAT, VERBATIM. It is the sentence that stops
            the trial count being read as that many independent attempts — the
            single most available misreading of this page — and it is the
            desk's wording rather than a paraphrase, because a paraphrase of a
            correction is a second, softer correction. The tile above it says
            only how the families are built; this says why the number matters. */}
        {s.note && (
          <p className="border-t hairline pt-5 text-body text-fg-muted">
            {prose(s.note)}
          </p>
        )}
      </Section>

      {/* ─── 4. WHAT SURVIVES THE CORRECTION ──────────────────────────────
          THE ORDERING WAS INVISIBLE. The page's whole argument here is that the
          count chance alone would produce EXCEEDS the count that cleared the
          bar — and the three figures were three equal-sized tiles, so seeing it
          meant reading 284, 10,300 and 13 and doing the comparison in your
          head. The margin draws them to one scale instead. */}
      <Section
        title="What survives the correction"
        gloss="the bar"
        note={
          <>
            The same three counts the tiles carry, drawn as rules so that their
            ordering can be seen rather than held in the head. Every figure is
            read from the file. How the rules are drawn is stated under them,
            because a picture that does not say how it was made will be read as
            a measurement.
          </>
        }
        aside={
          <>
            <ScaledCounts
              rows={[
                { label: "Cleared the nominal bar", value: d.clear_nominal_bar },
                {
                  label: "Expected by luck alone",
                  value: d.expected_false_positives_at_alpha,
                },
                { label: "Survived the correction", value: d.survive_book_level },
              ]}
            />
            {/* THE QUALIFICATION, AS A STAMP, BESIDE WHAT IT QUALIFIES.
                Published in the payload and rendered nowhere until now. It
                spends the reserved oxide because it is a fact that
                DISQUALIFIES the three rules above it — not an important one, a
                disqualifying one. Its explanation stays in the measure, where
                a hundred words of it can be read.

                THE SAME FIELD IS RENDERED ON /refused. Both read
                `deflation.gross_sharpe_fallback_rows` and neither computes it,
                so the two figures cannot drift; if this ever needs deriving, it
                needs deriving upstream, in the file both pages read. */}
            {d.gross_sharpe_fallback_rows !== undefined && (
              <div className="mt-6">
                {/* A NEUTRAL STAMP, deliberately, and the same judgement
                    /refused makes on this same field. The figure disqualifies
                    the numbers above it and the heading says so in words, but
                    the reserved oxide marks PAPER, WITHHELD, REFUSED and
                    EXCLUDED, and a gross-Sharpe fallback is none of the four.
                    The comment above promises these two surfaces cannot drift;
                    that has to cover the colour as well as the number. */}
                <Stamp
                  label="Gross-Sharpe rows"
                  value={int(d.gross_sharpe_fallback_rows)}
                  note="held to a bar that does not subtract the return on cash"
                />
              </div>
            )}
          </>
        }
      >
        <p className="text-body text-fg-muted">
          Search enough strategies and some will look significant by chance
          alone. Every headline is therefore re-derived against the whole
          book&rsquo;s effective number of trials, not against its own small
          grid. That is a far harsher test, and it is the one that decides what
          appears on this site.
        </p>
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Figure
            value={int(d.clear_nominal_bar)}
            label={`Clear the nominal bar (α = ${d.alpha})`}
            note="Significant judged on their own, before any correction for how much was searched."
          />
          <Figure
            value={int(d.expected_false_positives_at_alpha)}
            label="Would clear it by luck alone"
            note="At this significance level, given how much was searched. Read it against the count that actually cleared the bar before reading that count as a result."
          />
          <Figure
            value={int(d.survive_book_level)}
            label="Survive the book-level correction"
            note="Deflated against the whole book. This is the number that matters, and it is deliberately small."
          />
        </div>

        {/* The published note, verbatim, because it is the one that gets the
            ordering right: the expected-by-luck count EXCEEDS the nominal
            count, which is the opposite of the shape most such sentences
            assume. Ours must not quietly assume it either. */}
        {d.note && <p className="text-body text-fg-muted">{prose(d.note)}</p>}

        <Note tone="plain">
          {int(d.demoted_by_book_level)} strategies that looked significant on
          their own do not survive this correction. They were demoted by our own
          gate, before anything was published.
        </Note>

        {d.gross_sharpe_fallback_rows !== undefined && (
          <p className="text-small leading-relaxed text-fg-faint">
            Every headline is meant to be re-derived <em>excess</em> of the
            risk-free rate. Interest on cash is not alpha. For{" "}
            {int(d.gross_sharpe_fallback_rows)} of the rows entering the
            correction above (the count stamped in the margin) the excess figure
            was not available in the committed record and the gross one was used
            instead, so those rows were not held to quite the same bar as the
            rest. The count is published as its own field rather than
            folded into the others, and it is printed here for the same reason:
            a correction is worth what the rows it actually reached are worth.
          </p>
        )}
      </Section>

      {/* ─── 5. OUR OWN KNOWN VIOLATIONS ──────────────────────────────────*/}
      {r.gate_debt && (
        <Section
          title="Our own known violations"
          gloss="what the gates still owe"
          note={
            <>
              A grandfathered list may only ever shrink. The rule behind a check
              is never loosened and a check is never silenced, so the debt is
              published rather than cleared by exception.
            </>
          }
        >
          {/* No count. "Eight checks block our build" was a literal that
              nothing in the published payload supports — `gate_debt` lists only
              the checks with outstanding debt, so deriving a number from it
              would be a different, smaller number wearing the same words. */}
          <p className="text-body text-fg-muted">
            A set of checks blocks our build. Where the catalogue still violates
            one, the offending strategies are grandfathered in a dated list that
            may only ever shrink. The rule is never loosened. The checks that
            currently carry debt are listed here, because a reader who can see
            the debt can believe the gates. The dates in the last column are the
            third clock named at the top of this page.
          </p>
          <div className="scroll-x">
            {/* A MINIMUM WIDTH, so the table scrolls on a phone instead of
                crushing three columns into forty pixels each. The counts stack
                one per line rather than joining on a middot: a row publishing
                four of them was the widest thing on the page, and inside the
                measure it would have forced a sideways scroll on a desktop. */}
            <table className="w-full min-w-[420px] text-small">
              <thead>
                <tr className="text-left text-caption text-fg-faint">
                  <th className="pb-2 pr-5 font-medium">Check</th>
                  {/* NOT "known violations". Most rows publish a single count
                      and that count is the debt — but the causality row
                      publishes `certified` and `n_folders` beside `leaks`, and
                      under a violations heading a reader meets "certified 618"
                      as six hundred violations. The heading names what the
                      cell is; the section head and the paragraph above say
                      what it means. */}
                  <th className="pb-2 pr-5 font-medium">Published counts</th>
                  <th className="pb-2 font-medium">Dated</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.gate_debt).map(([gate, block]) => {
                  // Only the numeric fields are counts. `generated` is the
                  // date column and `note` is prose; a row that printed every
                  // key would print both of them as if they were violations.
                  const counts = Object.entries(block).filter(
                    ([k, v]) =>
                      k !== "generated" && k !== "note" && typeof v === "number",
                  );
                  const note = typeof block.note === "string" ? block.note : null;
                  return (
                    <tr key={gate} className="border-t hairline align-top">
                      <td className="py-2.5 pr-5">
                        {gate.replace(/_/g, " ")}
                        {/* Published per check, and only one row carries one.
                            It says what an "inconclusive" is, which is the
                            difference between a count a reader can use and one
                            they will misread as a clean bill. */}
                        {note && (
                          <span className="mt-1 block text-caption leading-snug text-fg-faint">
                            {prose(note)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-5 tnum">
                        {counts.length === 0
                          ? NO_VALUE
                          : counts.map(([k, v]) => (
                              <span key={k} className="block whitespace-nowrap">
                                {counts.length > 1 && (
                                  <span className="text-fg-faint">{k} </span>
                                )}
                                {int(v as number)}
                              </span>
                            ))}
                      </td>
                      <td className="py-2.5 tnum whitespace-nowrap text-fg-faint">
                        {typeof block.generated === "string"
                          ? date(block.generated)
                          : NO_VALUE}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ─── 6. THE OTHER END OF THE SAME CATALOGUE ───────────────────────
          No margin beyond the gloss, deliberately. This section is a pointer,
          it is four lines long, and a figure hung beside it would be a figure
          repeated from the section above for the sake of filling a column. */}
      <Section
        title="What was refused"
        gloss="the same catalogue, from the other end"
      >
        <p className="text-body text-fg-muted">
          This page counts the search. Everything the same catalogue holds
          that is not presented as an edge is set out under{" "}
          <Link href="/refused" className="text-accent hover:underline">
            refused
          </Link>
          . It reads the same published file as this page, so no count on the
          one can disagree with a count on the other.
        </p>
      </Section>

      {/* ─── 7. PROVENANCE ────────────────────────────────────────────────
          A SECTION LIKE THE REST OF THEM. This was a bare `<section>` with a
          rule and a paragraph starting at the page's left edge, which put the
          last block of text on the page half a column out of line with every
          block above it. */}
      <Section
        title="Provenance"
        gloss="where the figures come from"
        aside={
          <dl className="text-caption">
            {/* STACKED, NOT A TWO-COLUMN ROW. At the `lg` breakpoint the
                margin track is about 140px, and a schema id is an unbreakable
                mono literal: beside its own label it has nowhere to go. There
                is no second column in a 140px margin; there is a line, and then
                the next line. */}
            <div className="border-t hairline py-2">
              <dt className="text-fg-muted">Schema</dt>
              {/* A REGISTERED IDENTIFIER, so it keeps the mono: it is a string
                  a reader would compare character by character against the
                  file, not a phrase the firm wrote. */}
              <dd className="mt-0.5 min-w-0 break-all mono text-fg">
                {r.schema || NO_VALUE}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 border-t hairline py-2">
              <dt className="text-fg-muted">Generated</dt>
              <dd className="tnum text-fg">{date(r.generated_at)}</dd>
            </div>
          </dl>
        }
      >
        <p className="text-small leading-relaxed text-fg-faint">
          Every figure above is a field of{" "}
          <a
            className="text-accent hover:underline"
            href={`${DATA_REPO_URL}/blob/main/research.json`}
            target="_blank"
            rel="noreferrer noopener"
          >
            research.json
          </a>
          , read and not recomputed. The schema it was published under and the
          moment it was generated are in the margin.
          {/* THE PATH IS NOT SET IN THE MONO, and the comment that used to sit
              here claimed it was. The published string is a filename followed
              by a parenthesis of prose — "… .json (committed, regenerated
              deliberately)" — so the mono would either set the firm's own words
              in a typeface reserved for literals, or force this page to split a
              string it promises elsewhere it does not rewrite. It stays in the
              one typeface, a shade darker than the sentence around it. */}
          {r.source && (
            <>
              {" "}
              Generated upstream from{" "}
              <span className="text-fg-muted">{prose(r.source)}</span>.
            </>
          )}
        </p>
      </Section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PIECES
   ───────────────────────────────────────────────────────────────────── */

function Masthead() {
  return (
    <>
      <h1 className="text-title">Research</h1>
      {/* The one width cap left on this page. It is genuinely outside the
          section grid — nothing owns the measure above the first Section — so
          the alternative is a lede running the full 1080px of the container. */}
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        A track record shows what was kept. This page shows how much was
        searched to produce it, and against what bar the survivors were judged.
        That is the denominator that makes every other figure on this site
        readable.
      </p>
    </>
  );
}

/**
 * The governing section, and the first thing under the masthead.
 *
 * It is rendered on the absence branch too. What this page is not does not
 * depend on whether the summary loaded — and a page that says "could not load"
 * with no frame around it invites the reader to assume the missing thing was a
 * performance figure.
 */
function WhatThisIsNot({
  index,
  note,
}: {
  index: Awaited<ReturnType<typeof getIndex>>;
  note: string | undefined;
}) {
  return (
    <Section
      first
      title="What this page is not"
      gloss="read this first"
      /* The rule quoted from the file rather than asserted about it. A page
         claiming "the data names no strategy" is worth less than the data
         saying so in its own header, where anyone can check that it does — and
         a quotation backing up the paragraph beside it is exactly what a margin
         is for. */
      note={
        note ? (
          <>
            The file behind this page says so itself: &ldquo;{prose(note)}
            &rdquo;
          </>
        ) : undefined
      }
    >
      <p className="text-body text-fg-muted">
        <span className="text-fg">
          There is no performance figure on this page.
        </span>{" "}
        Not one of the counts below is a return, and none of them says a
        strategy will make money. They say how many things were tried, how many
        were thrown away, and against what bar the rest were judged. A ratio
        elsewhere on this site can then be read for what it is worth.
      </p>
      <p className="text-body text-fg-muted">
        <span className="text-fg">No strategy is named here.</span> Not on this
        page and not in the file behind it, for the same reason holdings are
        shown by category rather than by name: the catalogue is the work.
      </p>
      {/* THE SITE-WIDE DISQUALIFIER, in the one section on this page whose
          subject is what these numbers are not. Rendered from the shared
          component rather than written out, so it cannot drift from the copy on
          the other pages, and only when the index actually loaded: `hasLive` is
          DERIVED from the books, and deriving it from nothing would assert
          "every portfolio is a paper account" on no evidence. */}
      {index && (
        <div className="border-t hairline pt-5">
          <AccountDisclosureText
            hasLive={index.books.some((b) => b.capital_at_risk)}
          />
        </div>
      )}
    </Section>
  );
}

/** A count and what it counts. A rule above it, nothing around it. */
function Figure({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="border-t hairline pt-4">
      <div className="text-heading tnum leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-small font-medium">{label}</div>
      {note && (
        <div className="mt-1.5 text-small leading-relaxed text-fg-faint">
          {note}
        </div>
      )}
    </div>
  );
}

/** A head for something in the margin. Same size and colour as a stamp's
 *  label, in the one typeface: an eyebrow is not a literal string and does not
 *  get the mono. */
function MarginHead({ children }: { children: ReactNode }) {
  return (
    <div className="text-label font-semibold uppercase tracking-[0.16em] text-fg-faint">
      {children}
    </div>
  );
}

/**
 * THE CATALOGUE, AS FILED. Every cell is `catalogue.by_tier[tier][verdict]`,
 * printed under the keys it was published with. Nothing is totalled, nothing is
 * divided, and a verdict a tier publishes no cell for is not listed — which is
 * not a claim that the tier has none of them. Baseline has no rejects because
 * it is never graded, and that is a different statement from zero rejects.
 *
 * IT TAKES ROWS, NOT THE PAYLOAD. Reading `catalogue?.by_tier` is the page's
 * job, because the page is the only thing holding both optional levels and the
 * only thing that can decide whether there is a margin at all. By the time a
 * row reaches here it is resolved: the tier exists, and every value printed is
 * a number the file published. An empty list never arrives, because the caller
 * drops the note along with the aside when there is nothing to file.
 */
function TierMatrix({
  rows,
}: {
  rows: { tier: string; verdicts: { verdict: string; value: number }[] }[];
}) {
  return (
    <div>
      <MarginHead>The catalogue, as filed</MarginHead>
      <dl className="mt-3">
        {rows.map(({ tier, verdicts }) => (
          <div key={tier} className="border-t hairline py-2.5">
            <dt className="text-caption font-semibold text-fg">
              {slugLabel(tier)}
            </dt>
            {verdicts.length === 0 ? (
              <dd className="mt-1 text-caption text-fg-faint">{NO_VALUE}</dd>
            ) : (
              verdicts.map(({ verdict, value }) => (
                <dd
                  key={verdict}
                  className="mt-1 flex items-baseline justify-between gap-3 text-caption text-fg-muted"
                >
                  <span>{verdict.replace(/_/g, " ")}</span>
                  <span className="tnum text-fg">{int(value)}</span>
                </dd>
              ))
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * THREE PUBLISHED COUNTS, DRAWN TO ONE SCALE.
 *
 * The scale is set by the LARGEST of the three, selected from the published
 * values — a selection, not a derivation. The only arithmetic is the width of a
 * rule, which is a drawing operation over published numbers in the same sense
 * as scaling a chart axis: no ratio is printed, no quantity is invented, and
 * every rule is labelled with its own published figure so the picture says
 * nothing the file does not.
 *
 * `max(1px, …)` is why the smallest rule is visible at all: 13 against 10,300
 * is a third of a pixel, and a rule rounded away to nothing reads as a
 * rendering fault rather than as a very small number. The track behind it is
 * drawn full width either way, so a nearly-empty track is the picture.
 *
 * AND THE BLOCK SAYS BOTH OF THOSE THINGS OUT LOUD. A length is a quantity
 * whether or not a number is printed beside it: against live data these rules
 * assert a 792:1 relation between three figures the file states separately,
 * and the one-pixel floor means the shortest rule deliberately overstates its
 * own share so that it can be seen at all. On a site whose whole grammar is
 * that the desk computes and the browser prints, a picture allowed to be read
 * as a measured proportion is the same fault as a computed figure. So the
 * caption under the rules names the scale and names the floor, which is what
 * turns the drawing back into what it is: an ordering, next to the counts.
 */
function ScaledCounts({
  rows,
}: {
  rows: { label: string; value: number | null | undefined }[];
}) {
  const drawn = rows.map((row) =>
    typeof row.value === "number" && Number.isFinite(row.value)
      ? row.value
      : null,
  );
  const scale = drawn.reduce<number>((m, v) => (v !== null && v > m ? v : m), 0);
  return (
    <div>
      <MarginHead>The three counts, one scale</MarginHead>
      <div className="mt-3">
        {rows.map((row, i) => {
          const v = drawn[i];
          return (
            <div key={row.label} className="border-t hairline pt-2.5 pb-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-caption leading-snug text-fg-muted">
                  {row.label}
                </span>
                <span className="tnum text-small text-fg">{int(row.value)}</span>
              </div>
              <div className="mt-2 h-[6px] w-full bg-bg-subtle" aria-hidden="true">
                {v !== null && scale > 0 && (
                  <div
                    className="h-full"
                    style={{
                      background: "var(--fg)",
                      width: `max(1px, ${((v / scale) * 100).toFixed(4)}%)`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
        {/* THE CAPTION IS PART OF THE PICTURE, not an optional gloss on it.
            Without it the rules read as a measured proportion, and the floored
            one reads as a true short bar rather than as a bar that was given a
            minimum so it would exist. It is drawn only when a rule is: with no
            published value there is no picture, and a caption explaining how
            nothing was drawn is worse than the counts standing on their own. */}
        {scale > 0 && (
          <p className="border-t hairline pt-2.5 text-caption leading-snug text-fg-faint">
            Drawn to the largest of the three. A rule too short to see is
            floored to a hairline, so a rule shows the ordering and is not a
            proportion to measure; the figure beside it is the published count.
          </p>
        )}
      </div>
    </div>
  );
}

/** The date first, in tabular figures: these rows exist to be compared with
 *  each other, and a column of dates is what makes three months of difference
 *  visible at a glance. */
function Clocks({
  rows,
}: {
  rows: { value: string; label: ReactNode; note: ReactNode }[];
}) {
  return (
    <ul>
      {rows.map((row, i) => (
        <li
          key={i}
          className="border-t hairline py-4 sm:flex sm:items-baseline sm:gap-6"
        >
          <div className="tnum text-small text-fg sm:w-[180px] sm:shrink-0">
            {row.value}
          </div>
          <div className="mt-1.5 min-w-0 sm:mt-0">
            <div className="text-body leading-snug text-fg">{row.label}</div>
            <div className="mt-1.5 text-small leading-relaxed text-fg-faint">
              {row.note}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
