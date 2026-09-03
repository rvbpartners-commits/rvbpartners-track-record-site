import type { Metadata } from "next";
import { Note } from "@/components/Note";
import { REPO_URL, getResearch } from "@/lib/data";

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
      ? "How much was searched to find what is published: recorded trials, idea " +
        "families, and how few strategies survive the book-level correction."
      : "The research summary behind this track record.",
  };
}

const int = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("en-US");

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
      <div className="text-[26px] tnum leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-[13px] font-medium">{label}</div>
      {note && (
        <div className="mt-1 text-[12px] text-fg-faint leading-relaxed">{note}</div>
      )}
    </div>
  );
}

/**
 * The denominator.
 *
 * A performance figure means nothing without the number of things that were
 * tried to find it, and that number is the one thing here a reader cannot get
 * anywhere else: it comes from a committed, append-only ledger that CI refuses
 * to let us publish artifacts without.
 *
 * Deliberately carries NO performance figure. This page exists to make the
 * numbers on the other pages readable, not to add another claim.
 */
export default async function ResearchPage() {
  const r = await getResearch();

  if (!r) {
    return (
      <>
        <header>
          <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
            Research
          </h1>
        </header>
        <Note tone="warn" className="mt-8">
          The research summary has not been published yet. Nothing is shown here
          rather than a figure that might be out of date.
        </Note>
      </>
    );
  }

  const s = r.search;
  const d = r.deflation;
  const presented = r.catalogue?.presented_folders;

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Research
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          A track record shows what was kept. This page shows what was searched
          to find it — the denominator that makes the rest of the site readable.
          There is no performance figure on this page.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold tracking-tight">
          How much was searched
        </h2>
        <div className="mt-5 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          <Figure
            value={int(s.recorded_trials)}
            label="Recorded backtests"
            note="Every backtest, sweep and grid cell, in an append-only ledger. Publishing an artifact without the trials that produced it fails our build."
          />
          <Figure
            value={int(s.strategies_researched)}
            label="Strategies researched"
            note="Each one carries its own committed returns, report and verdict — including the ones that failed."
          />
          <Figure
            value={int(s.idea_families)}
            label="Distinct idea-families"
            note="A sweep across forty country ETFs is forty trials but nowhere near forty ideas. Families cluster the book by correlation and by shared code."
          />
          <Figure
            value={int(s.effective_independent_trials)}
            label="Effective independent trials"
            note="The denominator the deflation actually uses, after collapsing repeated ideas."
          />
          <Figure
            value={int(s.effective_independent_strategies)}
            label="Effective independent strategies"
            note="The same collapse, counted in strategies rather than trials."
          />
          {presented !== undefined && (
            /* Two published counts, and no percentage derived from them here.
               The share was computed in the browser on the one page whose
               subject is how carefully the firm counts. */
            <Figure
              value={int(presented)}
              label="Presented as an edge"
              note={`Out of ${int(
                s.strategies_researched,
              )} researched. Everything else stays on disk, fully auditable, and is never shown as a result.`}
            />
          )}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What survives the correction
        </h2>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          Search enough strategies and some will look significant by chance
          alone. Every headline is therefore re-derived against the whole book&rsquo;s
          effective number of trials, not against its own small grid — which is a
          far harsher test, and it is the one that decides what appears here.
        </p>
        <div className="mt-5 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          <Figure
            value={int(d.clear_nominal_bar)}
            label={`Clear the nominal bar (α = ${d.alpha})`}
          />
          <Figure
            value={int(d.expected_false_positives_at_alpha)}
            label="Would clear it by luck alone"
            note="At this significance level, given how much was searched. A count near this number is evidence of nothing."
          />
          <Figure
            value={int(d.survive_book_level)}
            label="Survive the book-level correction"
            note="Deflated against the whole book. This is the number that matters, and it is deliberately small."
          />
        </div>
        <Note tone="plain" className="mt-7">
          {int(d.demoted_by_book_level)} strategies that looked significant on
          their own do not survive this correction. They were demoted by our own
          gate, before anything was published.
        </Note>
      </section>

      {r.gate_debt && (
        <section className="mt-14">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Our own known violations
          </h2>
          {/* No count. "Eight checks block our build" was a literal that
              nothing in the published payload supports — `gate_debt` lists only
              the checks with outstanding debt, so deriving a number from it
              would be a different, smaller number wearing the same words. */}
          <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
            A set of checks blocks our build. Where the catalogue still violates
            one, the offending strategies are grandfathered in a dated list that
            may only ever shrink — never a loosened rule. The checks that
            currently carry debt are listed here, because a reader who can see
            the debt can believe the gates.
          </p>
          <div className="mt-5 scroll-x">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] text-fg-faint">
                  <th className="pb-2 pr-6 font-medium">Check</th>
                  <th className="pb-2 pr-6 font-medium">Known violations</th>
                  <th className="pb-2 font-medium">Dated</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.gate_debt).map(([gate, block]) => {
                  const counts = Object.entries(block).filter(
                    ([k, v]) => k !== "generated" && k !== "note" && typeof v === "number",
                  );
                  return (
                    <tr key={gate} className="border-t hairline">
                      <td className="py-2 pr-6">{gate.replace(/_/g, " ")}</td>
                      <td className="py-2 pr-6 tnum">
                        {counts
                          .map(([k, v]) =>
                            counts.length === 1 ? int(v as number) : `${k} ${int(v as number)}`,
                          )
                          .join(" · ")}
                      </td>
                      <td className="py-2 text-fg-faint">
                        {String(block.generated ?? "—")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-14 border-t hairline pt-6 max-w-[80ch]">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What this page is not
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
          It is not a performance claim, and none of these figures says a
          strategy will make money. It says how many were tried, how many were
          discarded, and against what bar the survivors were judged — so that a
          Sharpe ratio elsewhere on this site can be read for what it is worth.
          The individual strategies are not named anywhere here, for the same
          reason holdings are grouped by category: the catalogue is the work.
        </p>
        <p className="mt-3 text-[13px] text-fg-faint leading-relaxed">
          Regenerated deliberately from the committed catalogue rather than
          typed, and published at{" "}
          <a
            className="text-accent hover:underline"
            href={`${REPO_URL}/blob/main/research.json`}
            target="_blank"
            rel="noreferrer noopener"
          >
            research.json
          </a>
          . Last generated {r.generated_at.slice(0, 10)}.
        </p>
      </section>
    </>
  );
}
