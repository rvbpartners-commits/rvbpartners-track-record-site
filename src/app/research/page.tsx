import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { DATA_REPO_URL, SITE_ORIGIN, getResearch } from "@/lib/data";
import { NO_VALUE, date } from "@/lib/format";

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
 *  for `null` and `undefined`, while the identical `count()` on /selection tested
 *  for all three — so a `NaN` reaching this page (a JSON `null` that survived a
 *  cast, an arithmetic accident upstream) printed the literal string "NaN" here
 *  and printed the absence marker there, from the same published file. Two
 *  pages disagreeing about the same field is the one thing this register cannot
 *  afford. */
const int = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? NO_VALUE
    : n.toLocaleString("en-US");


/**
 * RESEARCH: how much was searched to produce what is published, and the bar
 * every result is measured against.
 *
 * Every figure is a field of `research.json`, regenerated from the committed
 * catalogue. How the catalogue is graded, tier by tier, is on /selection.
 */
export default async function ResearchPage() {
  const r = await getResearch();

  if (!r) {
    return (
      <div className="pt-2 lg:pt-6">
        <Masthead asOf={null} />
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

  // The presented figure's own composition, read off the published grid: the
  // promote and conditional cells, summed. It is what reconciles "42 presented"
  // with "13 clear the whole-catalogue bar" further down — only a promoted
  // strategy has to clear that bar.
  const cells = Object.values(r.catalogue?.by_tier ?? {});
  const sumOf = (verdict: string) =>
    cells.reduce(
      (n, c) => n + (typeof c?.[verdict] === "number" ? c[verdict] : 0),
      0,
    );
  const promoted = cells.length > 0 ? sumOf("promote") : null;
  const conditional = cells.length > 0 ? sumOf("conditional") : null;
  const composition =
    presented !== undefined &&
    promoted !== null &&
    conditional !== null &&
    promoted + conditional === presented
      ? `${int(promoted)} promoted and ${int(conditional)} conditional.`
      : null;

  return (
    <div className="pt-2 lg:pt-6">
      <Masthead asOf={r.generated_at} />

      <Section first title="How much was searched">
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Figure
            value={int(s.recorded_trials)}
            label="Backtests recorded"
            note={`Every backtest, parameter sweep and grid cell, across ${int(
              s.ledger_entries,
            )} entries of an append-only ledger.`}
          />
          <Figure
            value={int(s.strategies_researched)}
            label="Strategies researched"
            note="Each with its own committed returns, report and verdict."
          />
          <Figure
            value={int(s.idea_families)}
            label="Idea families"
            note="Strategies grouped by correlation and by shared code."
          />
          <Figure
            value={int(s.effective_independent_trials)}
            label="Effective independent trials"
            note="The backtest count after collapsing repeated ideas: the number the correction below uses."
          />
          <Figure
            value={int(s.effective_independent_strategies)}
            label="Effective independent strategies"
            note="The same collapse, counted in strategies."
          />
          {presented !== undefined && (
            <Figure
              value={int(presented)}
              label="Presented as an edge"
              note={composition ?? "Catalogue entries presented as a result."}
            />
          )}
        </div>
      </Section>

      <Section title="The bar">
        <p className="text-body text-fg-muted">
          Search enough and something will look significant by chance. So every
          result is measured twice: on its own, and against the whole
          catalogue&rsquo;s search. The second is the bar a strategy must clear
          to be promoted.
        </p>
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <Figure
            value={int(d.clear_nominal_bar)}
            label={`Clear the standard bar (α = ${d.alpha})`}
            note="Significant on their own results."
          />
          <Figure
            value={int(d.survive_book_level)}
            label="Clear the whole-catalogue bar"
            note="Significant after correcting for every trial run."
          />
        </div>
        <p className="text-body text-fg-muted">
          The difference is the point of the correction. At α = {d.alpha},
          chance alone would produce about{" "}
          {int(d.expected_false_positives_at_alpha)} false positives among{" "}
          {int(s.effective_independent_trials)} effective trials, so clearing
          the standard bar is not, by itself, evidence of an edge.
        </p>
        {d.gross_sharpe_fallback_rows !== undefined && (
          <p className="text-small leading-relaxed text-fg-muted">
            {int(d.gross_sharpe_fallback_rows)} of the rows in this correction use
            a Sharpe ratio before the risk-free rate is subtracted, because their
            committed records predate that adjustment.
          </p>
        )}
      </Section>

      <Section title="Selection">
        <p className="text-body text-fg-muted">
          How the catalogue is graded, tier by tier, and what that grading
          presents, is set out under{" "}
          <Link href="/selection" className="text-accent hover:underline">
            selection
          </Link>
          . Both pages read the same published file.
        </p>
      </Section>

      <Section title="Source">
        <p className="text-small leading-relaxed text-fg-muted">
          Every figure on this page is read from{" "}
          <a
            className="text-accent hover:underline"
            href={`${DATA_REPO_URL}/blob/main/research.json`}
            target="_blank"
            rel="noreferrer noopener"
          >
            research.json
          </a>
          , generated {date(r.generated_at)}.
        </p>
      </Section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PIECES
   ───────────────────────────────────────────────────────────────────── */

function Masthead({ asOf }: { asOf: string | null }) {
  return (
    <>
      <h1 className="text-title">Research</h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        How much was searched to produce what is published, and the bar every
        result is measured against.
        {asOf ? <> Figures as of {date(asOf)}.</> : null}
      </p>
    </>
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




