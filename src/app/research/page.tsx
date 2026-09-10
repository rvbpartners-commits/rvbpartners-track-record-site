import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { Stamp } from "@/components/Stamp";
import { DATA_REPO_URL, SITE_ORIGIN, getIndex, getResearch } from "@/lib/data";
import { NO_VALUE, date, prose } from "@/lib/format";

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
      ? "How much was searched to produce what is published — recorded trials, " +
        "idea families — and the bar the survivors were judged against."
      : "The research summary behind this track record.",
    alternates: { canonical: `${SITE_ORIGIN}/research` },
  };
}

/** Counts, in the figure face. Never `?? 0`: an absent count is an absence. */
const int = (n: number | null | undefined) =>
  n === null || n === undefined ? NO_VALUE : n.toLocaleString("en-US");

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
      <Section title="As of" gloss="three dates, and they are not the same">
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

      {/* ─── 3. HOW MUCH WAS SEARCHED ─────────────────────────────────────*/}
      <Section title="How much was searched" gloss="the denominator">
        <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
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
            note="Each one carries its own committed returns, report and verdict — including the ones that failed."
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
          <p className="mt-8 max-w-[72ch] border-t hairline pt-5 text-body text-fg-muted">
            {prose(s.note)}
          </p>
        )}
      </Section>

      {/* ─── 4. WHAT SURVIVES THE CORRECTION ──────────────────────────────*/}
      <Section title="What survives the correction" gloss="the bar">
        <p className="max-w-[72ch] text-body text-fg-muted">
          Search enough strategies and some will look significant by chance
          alone. Every headline is therefore re-derived against the whole
          book&rsquo;s effective number of trials, not against its own small
          grid — which is a far harsher test, and it is the one that decides
          what appears on this site.
        </p>
        <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
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
        {d.note && (
          <p className="mt-7 max-w-[72ch] text-body text-fg-muted">
            {prose(d.note)}
          </p>
        )}

        <Note tone="plain" className="mt-7">
          {int(d.demoted_by_book_level)} strategies that looked significant on
          their own do not survive this correction. They were demoted by our own
          gate, before anything was published.
        </Note>

        {/* ─── THE QUALIFICATION ON ALL OF THE ABOVE ────────────────────
            Published in the payload and rendered nowhere until now. It is the
            correction's own footnote: the count of rows the intended
            convention could not be applied to. It spends the reserved oxide
            because it is a fact that DISQUALIFIES the three figures above it —
            not an important one, a disqualifying one.

            THE SAME FIELD IS RENDERED ON /refused. Both read
            `deflation.gross_sharpe_fallback_rows` and neither computes it, so
            the two figures cannot drift; if this ever needs deriving, it needs
            deriving upstream, in the file both pages read. */}
        {d.gross_sharpe_fallback_rows !== undefined && (
          <div className="mt-7 max-w-[72ch]">
            <div className="max-w-[300px]">
              <Stamp
                label="Gross-Sharpe rows"
                value={int(d.gross_sharpe_fallback_rows)}
                tone="negative"
                note="held to a bar that does not subtract the return on cash"
              />
            </div>
            <p className="mt-4 text-small leading-relaxed text-fg-faint">
              Every headline is meant to be re-derived <em>excess</em> of the
              risk-free rate — interest on cash is not alpha. For{" "}
              {int(d.gross_sharpe_fallback_rows)} of the rows entering the
              correction above, the excess figure was not available in the
              committed record and the gross one was used instead, so those rows
              were not held to quite the same bar as the rest. The count is
              published as its own field rather than folded into the others, and
              it is printed here for the same reason: a correction is worth what
              the rows it actually reached are worth.
            </p>
          </div>
        )}
      </Section>

      {/* ─── 5. OUR OWN KNOWN VIOLATIONS ──────────────────────────────────*/}
      {r.gate_debt && (
        <Section title="Our own known violations" gloss="what the gates still owe">
          {/* No count. "Eight checks block our build" was a literal that
              nothing in the published payload supports — `gate_debt` lists only
              the checks with outstanding debt, so deriving a number from it
              would be a different, smaller number wearing the same words. */}
          <p className="max-w-[72ch] text-body text-fg-muted">
            A set of checks blocks our build. Where the catalogue still violates
            one, the offending strategies are grandfathered in a dated list that
            may only ever shrink — never a loosened rule. The checks that
            currently carry debt are listed here, because a reader who can see
            the debt can believe the gates. The dates in the last column are the
            third clock named at the top of this page.
          </p>
          <div className="mt-6 scroll-x">
            <table className="w-full text-small">
              <thead>
                <tr className="text-left text-caption text-fg-faint">
                  <th className="pb-2 pr-6 font-medium">Check</th>
                  {/* NOT "known violations". Most rows publish a single count
                      and that count is the debt — but the causality row
                      publishes `certified` and `n_folders` beside `leaks`, and
                      under a violations heading a reader meets "certified 618"
                      as six hundred violations. The heading names what the
                      cell is; the section head and the paragraph above say
                      what it means. */}
                  <th className="pb-2 pr-6 font-medium">Published counts</th>
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
                      <td className="py-2.5 pr-6">
                        {gate.replace(/_/g, " ")}
                        {/* Published per check, and only one row carries one.
                            It says what an "inconclusive" is, which is the
                            difference between a count a reader can use and one
                            they will misread as a clean bill. */}
                        {note && (
                          <span className="mt-1 block max-w-[46ch] font-[family-name:var(--font-prose)] text-caption leading-snug text-fg-faint">
                            {prose(note)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-6 tnum">
                        {counts
                          .map(([k, v]) =>
                            counts.length === 1
                              ? int(v as number)
                              : `${k} ${int(v as number)}`,
                          )
                          .join(" · ")}
                      </td>
                      <td className="py-2.5 tnum text-fg-faint">
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

      {/* ─── 6. THE OTHER END OF THE SAME CATALOGUE ───────────────────────*/}
      <Section title="What was refused" gloss="the same catalogue, from the other end">
        <p className="max-w-[72ch] text-body text-fg-muted">
          This page counts the search. The same catalogue read from the other
          end — everything it holds that is not presented as an edge — is set
          out under{" "}
          <Link href="/refused" className="text-accent hover:underline">
            refused
          </Link>
          . It reads the same published file as this page, so no count on the
          one can disagree with a count on the other.
        </p>
      </Section>

      {/* ─── 7. PROVENANCE ────────────────────────────────────────────────*/}
      <section className="mt-12 lg:mt-16 border-t hairline pt-6">
        <p className="max-w-[72ch] text-small leading-relaxed text-fg-faint">
          Every figure above is a field of{" "}
          <a
            className="text-accent hover:underline"
            href={`${DATA_REPO_URL}/blob/main/research.json`}
            target="_blank"
            rel="noreferrer noopener"
          >
            research.json
          </a>
          , read and not recomputed.
          {/* The upstream file is named in the payload, in the figure face
              because it is an identifier a reader could go and look for —
              not a phrase the firm wrote for this page. */}
          {r.source && (
            <>
              {" "}
              Generated upstream from{" "}
              <span className="tnum text-fg-muted">{prose(r.source)}</span>.
            </>
          )}{" "}
          Last generated{" "}
          <span className="tnum text-fg-muted">{date(r.generated_at)}</span>.
        </p>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PIECES
   ───────────────────────────────────────────────────────────────────── */

function Masthead() {
  return (
    <>
      <h1 className="text-title sm:text-title">
        Research
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        A track record shows what was kept. This page shows how much was
        searched to produce it, and against what bar the survivors were judged
        — the denominator that makes every other figure on this site readable.
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
    <Section title="What this page is not" gloss="read this first">
      <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
        <p>
          <span className="text-fg">
            There is no performance figure on this page.
          </span>{" "}
          Not one of the counts below is a return, and none of them says a
          strategy will make money. They say how many things were tried, how
          many were thrown away, and against what bar the rest were judged — so
          that a ratio elsewhere on this site can be read for what it is worth.
        </p>
        <p>
          <span className="text-fg">No strategy is named here.</span> Not on
          this page and not in the file behind it, for the same reason holdings
          are shown by category rather than by name: the catalogue is the work.
        </p>
      </div>
      {/* The rule quoted from the file rather than asserted about it. A page
          claiming "the data names no strategy" is worth less than the data
          saying so in its own header, where anyone can check that it does. */}
      {note && (
        <p className="mt-5 max-w-[72ch] text-small leading-relaxed text-fg-faint">
          The file behind this page says so itself: &ldquo;{prose(note)}&rdquo;
        </p>
      )}
      {/* THE SITE-WIDE DISQUALIFIER, in the one section on this page whose
          subject is what these numbers are not. Rendered from the shared
          component rather than written out, so it cannot drift from the copy on
          the other pages, and only when the index actually loaded: `hasLive` is
          DERIVED from the books, and deriving it from nothing would assert
          "every portfolio is a paper account" on no evidence. */}
      {index && (
        <div className="mt-7 border-t hairline pt-5">
          <AccountDisclosureText
            hasLive={index.books.some((b) => b.capital_at_risk)}
          />
        </div>
      )}
    </Section>
  );
}

/** Same shape as the legal notice's sections: a rule, a small figure-face head,
 *  and a gloss saying what the section is for. */
function Section({
  title,
  gloss,
  children,
}: {
  title: string;
  gloss: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12 lg:mt-16 border-t hairline pt-6">
      <h2 className="font-figure text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
        {title}
        <span className="ml-3 normal-case tracking-normal text-fg-faint/70">
          {gloss}
        </span>
      </h2>
      <div className="mt-6">{children}</div>
    </section>
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

/** The date first, in the figure face: these rows exist to be compared with
 *  each other, and a column of dates is what makes three months of difference
 *  visible at a glance. */
function Clocks({
  rows,
}: {
  rows: { value: string; label: ReactNode; note: ReactNode }[];
}) {
  return (
    <ul className="max-w-[76ch]">
      {rows.map((row, i) => (
        <li
          key={i}
          className="border-t hairline py-4 sm:flex sm:items-baseline sm:gap-8"
        >
          <div className="font-figure tnum text-small text-fg sm:w-[190px] sm:shrink-0">
            {row.value}
          </div>
          <div className="mt-1.5 sm:mt-0">
            <div className="text-body leading-snug text-fg">{row.label}</div>
            <div className="mt-1.5 max-w-[64ch] text-small leading-relaxed text-fg-faint">
              {row.note}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
