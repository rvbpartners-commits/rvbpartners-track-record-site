import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Stamp } from "@/components/Stamp";
import {
  DATA_REPO_URL,
  SITE_ORIGIN,
  getIndex,
  getMetrics,
  getResearch,
} from "@/lib/data";
import { date, prose } from "@/lib/format";

// Every figure on this page moves when the catalogue does. A prerender would
// serve last month's denominator under a heading that says it is the count.
export const dynamic = "force-dynamic";

/**
 * REFUSED — the negative half of the record.
 *
 * The home page says this site publishes "what we trade, how it was tested,
 * and what we refused". The first two had pages. This is the third.
 *
 * THE REGISTER OF THIS PAGE IS DECLARATIVE, NOT DEFENSIVE. An earlier draft
 * opened by asking the reader's question for them — "what are they not telling
 * me?" — which manufactures a suspicion nobody arrived with and makes the firm
 * look braced for an accusation. The page states counts instead. Most of what
 * was tested did not work; that is an ordinary fact about systematic research
 * and it is the most informative thing on the site.
 *
 * NOTHING HERE IS COMPUTED. Every figure comes from `research.json`,
 * `index.json` or a book's own `metrics.json`. The only arithmetic is summing a
 * table's own rows into its own total, and two RECONCILIATION checks that
 * decide whether a sentence may be printed at all — never what it says.
 */
export const metadata: Metadata = {
  title: "Refused",
  description:
    "What did not survive: the strategies tested and rejected, the statistics " +
    "withheld until there is enough history, and what this record cannot prove " +
    "about itself.",
  alternates: { canonical: `${SITE_ORIGIN}/refused` },
};

/** Counts, in the site's own locale. `—` for a value that was never published:
 *  the absence is the honest rendering and must never round to zero. */
const count = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toLocaleString("en-US");

/* THE PUBLISHED KEYS ARE NOT A FIXED SET, AND THEY ARE NOT CASE-CONSISTENT.
   `by_tier` currently ships "Baseline", "Optimized" and "Research" capitalised
   beside a lowercase "production", and a table that keys its rows off the raw
   string would print two of those as headings and drop a tier the day the
   publisher adds one. Order is a preference applied case-insensitively; an
   unknown key sorts to the end and still renders, under its own raw name. */
const TIER_ORDER = ["production", "optimized", "baseline", "research"];
const VERDICT_ORDER = ["promote", "conditional", "reject", "unfiled"];
const GATE_COUNT_ORDER = ["leaks", "inconclusive", "certified", "n_folders"];

const TIER_LABEL: Record<string, string> = {
  production: "Production",
  optimized: "Optimised",
  baseline: "Baseline",
  research: "Research",
};

const TIER_GLOSS: Record<string, string> = {
  production: "the working catalogue",
  optimized: "grid-search winners, re-run and graded on their own result",
  baseline: "the first version of a strategy, kept unedited",
  research: "archived as not an edge, and never presented as one",
};

/** Sort by a preferred order, then alphabetically. Keys outside the preference
 *  are kept, not dropped — a tier or a verdict this file has never heard of is
 *  still a fact about the catalogue. */
function ordered(keys: string[], preferred: string[]): string[] {
  const rank = (k: string) => {
    const i = preferred.indexOf(k.toLowerCase());
    return i === -1 ? preferred.length : i;
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/* Which cells of the tier grid are the ones the firm presents. Used only to
   CHECK the published `presented_folders` against the grid printed above it —
   if the two disagree, the sentence explaining the relation is not printed and
   the published figure stands alone. A derived number may explain a published
   one; it may never replace it. */
const DEPLOYABLE_TIERS = new Set(["production", "optimized"]);
const PRESENTED_VERDICTS = new Set(["promote", "conditional"]);

export default async function RefusedPage() {
  const [research, index] = await Promise.all([getResearch(), getIndex()]);

  // Each book's own gate counter, from the file the gate itself reads. Six
  // fetches, all memoised in the data layer for a minute.
  const books = index?.books ?? [];
  const metrics = await Promise.all(books.map((b) => getMetrics(b.book)));
  const gated = books.filter((b) => b.annualised_gated);

  // THE STATISTICS THE DESK SUPPRESSES, BY NAME, as each book publishes them.
  // A union rather than one book's list: a book with a longer history would
  // suppress fewer, and the page must not print the shortest book's list as
  // though it governed all of them. Rendered as raw identifiers in the mono
  // face — these are keys in a published file, and a prettified label ("value
  // at risk") would be this repository translating the desk's vocabulary into
  // something a reader cannot grep for.
  const suppressed: string[] = [];
  for (const m of metrics) {
    for (const key of m?.insufficient_history?.suppressed ?? []) {
      if (!suppressed.includes(key)) suppressed.push(key);
    }
  }

  // The bar, from the payload. `index.json` publishes it once for the record;
  // each metrics file republishes it as the `need` its own gate applied. The
  // index is preferred and the per-book figure is the fallback, so the page
  // still states a threshold if only one of the two files loaded.
  const need =
    index?.min_sessions_for_annualised ??
    metrics.map((m) => m?.insufficient_history?.need).find((n) => n != null) ??
    null;

  // Selected BY ID, never by iterating the list. The published disclosures
  // include items scoped to kinds of account this site does not show, and a
  // loop over them would render one.
  const findDisclosure = (id: string) =>
    index?.disclosures.find((d) => d.id === id) ?? null;
  const shortHistory = findDisclosure("short_history");
  const strategyIdentity = findDisclosure("strategy_identity");

  const byTier = research?.catalogue?.by_tier;
  const presented = research?.catalogue?.presented_folders;
  const tierRows = byTier ? ordered(Object.keys(byTier), TIER_ORDER) : [];
  const verdictCols = byTier
    ? ordered(
        [...new Set(Object.values(byTier).flatMap((r) => Object.keys(r)))],
        VERDICT_ORDER,
      )
    : [];
  const rowTotal = (tier: string) => {
    const row = byTier?.[tier];
    return row ? Object.values(row).reduce((s, n) => s + n, 0) : 0;
  };
  const folderTotal = tierRows.reduce((s, t) => s + rowTotal(t), 0);
  // The archived tier, by whatever name it is published under. Looked up rather
  // than assumed: section 4 prints a count, and a count defaulted to 0 because a
  // key was renamed would be this page inventing a figure — the one thing it
  // must never do. Absent, the section does not render.
  const archivedTier =
    tierRows.find((t) => t.toLowerCase() === "research") ?? null;

  // Does the grid above add up to the published "presented" figure? It should:
  // presented = promote + conditional, in the two tiers that can be deployed.
  // Checked rather than asserted — the day the publisher changes what counts as
  // presented, the explanatory sentence disappears instead of going quietly
  // wrong beside a number that did not.
  const presentedFromGrid = Object.entries(byTier ?? {})
    .filter(([tier]) => DEPLOYABLE_TIERS.has(tier.toLowerCase()))
    .flatMap(([, row]) => Object.entries(row))
    .filter(([verdict]) => PRESENTED_VERDICTS.has(verdict.toLowerCase()))
    .reduce((s, [, n]) => s + n, 0);
  const presentedReconciles =
    presented !== undefined && presented > 0 && presentedFromGrid === presented;

  const s = research?.search;
  const d = research?.deflation;

  // The expected-by-chance count is the significance level applied to the
  // effective number of independent trials. Saying so lets a reader multiply
  // two published numbers and land on a third, which is the best thing a page
  // like this can offer — but only while it is true. If the desk ever computes
  // it another way the product stops matching and the sentence is dropped.
  const chanceReconciles =
    !!s &&
    !!d &&
    Number.isFinite(s.effective_independent_trials) &&
    d.expected_false_positives_at_alpha > 0 &&
    Math.abs(s.effective_independent_trials * d.alpha - d.expected_false_positives_at_alpha) /
      d.expected_false_positives_at_alpha <
      0.01;

  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="text-title sm:text-title">
        Refused
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        Most of what we tested did not work. This page is the count: the
        strategies that failed, the figures the record suppresses, and the
        limits of what it can prove about itself. It carries no performance
        figure, and every number on it is regenerated from the published
        catalogue.
      </p>

      {/* ─── 1. THE SHAPE OF THE BOOK ─────────────────────────────────────
          The catalogue as it is filed, tier by tier and verdict by verdict. */}
      <Section title="The shape of the book" gloss="Every folder, by how it was graded">
        {byTier ? (
          <>
            <p className="max-w-[72ch] text-body text-fg-muted">
              A strategy is filed under the verdict it earned, and the verdict
              is part of the path on disk. Nothing is deleted when it fails: the
              code, the returns and the report card stay exactly where they
              were, auditable, and stop being presented as a result. The rejects
              below are not a backlog to be worked through. They are the
              outcome.
            </p>

            <div className="scroll-x mt-7">
              <table className="w-full sm:min-w-[620px] text-small">
                <thead>
                  <tr className="text-left text-caption text-fg-faint">
                    <th className="pb-2 pr-6 font-normal">Tier</th>
                    {verdictCols.map((v) => (
                      <th key={v} className="pb-2 pr-6 font-normal text-right">
                        {v.replace(/_/g, " ")}
                      </th>
                    ))}
                    <th className="pb-2 font-normal text-right">Folders</th>
                  </tr>
                </thead>
                <tbody>
                  {tierRows.map((tier) => {
                    const key = tier.toLowerCase();
                    return (
                      <tr key={tier} className="border-t hairline align-baseline">
                        <td className="py-2.5 pr-6">
                          <span className="text-fg">
                            {TIER_LABEL[key] ?? tier}
                          </span>
                          {TIER_GLOSS[key] && (
                            <span className="mt-0.5 block font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
                              {TIER_GLOSS[key]}
                            </span>
                          )}
                        </td>
                        {verdictCols.map((v) => {
                          // Annotated, not inferred: a tier that has no cell in
                          // this column must render as absence, and `—` is a
                          // different statement from `0`. Baseline has no
                          // rejects because it is never graded; that is not the
                          // same as having none.
                          const cell: number | undefined = byTier[tier]?.[v];
                          return (
                            <td
                              key={v}
                              className={`py-2.5 pr-6 tnum text-right ${
                                cell === undefined
                                  ? "text-fg-faint"
                                  : "text-fg-muted"
                              }`}
                            >
                              {count(cell)}
                            </td>
                          );
                        })}
                        <td className="py-2.5 tnum text-right text-fg">
                          {count(rowTotal(tier))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* THE UNIT IS THE FOLDER, NOT THE STRATEGY, and the two totals on
                this page differ by more than rounding. One strategy owns a
                folder in several tiers at once — its production version, the
                unedited baseline it started as, the champion a grid search
                found — so adding the tiers gives folders, and the count of
                strategies is a different, smaller number published beside it. A
                page that printed the folder total under the word "strategies"
                would roughly double the book, on the one page whose subject is
                how carefully the firm counts. */}
            <p className="mt-5 max-w-[72ch] text-small leading-relaxed text-fg-faint">
              <span className="tnum text-fg-muted">{count(folderTotal)}</span>{" "}
              folders in all. That is not a count of strategies. One strategy
              owns a folder in more than one tier at once: the version in
              production, the unedited baseline it started from, the champion a
              grid search found.{" "}
              {s ? (
                <>
                  The number of distinct strategies researched is{" "}
                  <span className="tnum text-fg-muted">
                    {count(s.strategies_researched)}
                  </span>
                  , published separately.
                </>
              ) : (
                <>The count of distinct strategies is published separately.</>
              )}
            </p>

            {presented !== undefined && (
              <p className="mt-3 max-w-[72ch] text-small leading-relaxed text-fg-faint">
                <span className="tnum text-fg">{count(presented)}</span> of those
                folders are presented as an edge anywhere on this site.
                {presentedReconciles
                  ? " Those are the promote and conditional cells of the two tiers above that can be deployed, and nothing else."
                  : ""}{" "}
                The rest are on disk and stay there.
              </p>
            )}
          </>
        ) : (
          <Note tone="warn">
            The catalogue breakdown has not been published. Nothing is shown
            here rather than a count that might be out of date.
          </Note>
        )}
      </Section>

      {/* ─── 2. WHAT THE CORRECTION REMOVED ───────────────────────────────── */}
      <Section
        title="What the correction removed"
        gloss="Search enough and something looks significant"
      >
        {d ? (
          <>
            <p className="max-w-[72ch] text-body text-fg-muted">
              A strategy that clears a significance bar on its own has cleared a
              bar that was set for one test. It was not one test. Every headline
              is therefore re-derived against the whole book&rsquo;s effective
              number of independent trials, which is a far harsher standard, and
              it is the one that decides what appears on this site.
            </p>

            <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
              <Figure
                value={count(d.clear_nominal_bar)}
                label={`Clear the nominal bar (α = ${d.alpha})`}
                note="Judged on their own results alone, as though each had been the only thing tried."
              />
              <Figure
                value={count(d.expected_false_positives_at_alpha)}
                label="Would clear it by chance alone"
                /* THE ORDERING IS THE POINT, AND IT IS THE WRONG WAY ROUND FROM
                   THE ONE A READER EXPECTS. Chance alone would clear this bar
                   for far MORE strategies than actually cleared it, so clearing
                   it is not a weak result — it is no result. A sentence written
                   the intuitive way ("more cleared it than chance predicts")
                   would invert the finding. */
                note={
                  chanceReconciles && s
                    ? `The significance level applied to ${count(
                        s.effective_independent_trials,
                      )} effective independent trials. Chance alone would clear the bar for far more strategies than actually did, which is what makes clearing it evidence of nothing.`
                    : "At this significance level, given how much was searched. Chance alone would clear the bar for far more strategies than actually did, which is what makes clearing it evidence of nothing."
                }
              />
              <Figure
                value={count(d.survive_book_level)}
                label="Survive the correction"
                note="Deflated against the whole book rather than their own grid. Deliberately small."
              />
              <Figure
                value={count(d.demoted_by_book_level)}
                label="Demoted by it"
                note="They looked significant on their own. Our own gate removed them before anything was published."
              />
            </div>

            {d.note && (
              <p className="mt-7 max-w-[72ch] text-small leading-relaxed text-fg-faint">
                {prose(d.note)}
              </p>
            )}
          </>
        ) : (
          <Note tone="warn">
            The deflation summary has not been published. Nothing is shown here
            rather than a figure that might be out of date.
          </Note>
        )}
      </Section>

      {/* ─── 3. THE QUALIFICATION ON THAT NUMBER ──────────────────────────
          The one place on this page that spends the reserved oxide. It marks a
          fact that disqualifies the numbers immediately above it: a share of
          the rows in that correction were deflated against a Sharpe that
          counted interest on cash as though it were skill. The figure is
          published and reaches no other surface on this site. */}
      {d?.gross_sharpe_fallback_rows !== undefined && (
        <Section
          title="The qualification on that number"
          gloss="Where the correction ran on a flattered input"
        >
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-[minmax(0,250px)_minmax(0,1fr)]">
            <Stamp
              label="Rows on a gross Sharpe"
              value={count(d.gross_sharpe_fallback_rows)}
              tone="negative"
              note="deflated against a figure that has not had the cash rate taken out of it"
            />
            <div className="max-w-[68ch] space-y-4 text-body text-fg-muted">
              <p>
                Our headline Sharpe is excess of the risk-free rate: the return
                on cash is subtracted before the ratio is taken, because
                interest on a balance is not a result of trading it. A gross
                Sharpe keeps that interest, and a strategy can be carried over a
                bar by it alone.
              </p>
              <p>
                That many rows of the correction above ran on the gross figure,
                because the record each was re-derived from predates the point
                at which the rate was threaded through. Those rows were deflated
                against an input that flatters them. They are counted and
                published as their own number rather than blended into the
                total, which is why it is possible to say this at all. It
                belongs on the page that qualifies the figure, not in a footnote
                somewhere else.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* ─── 4. ARCHIVED, BUT STILL IN THE DENOMINATOR ────────────────────── */}
      {archivedTier && (
        <Section
          title="Archived, and still counted"
          gloss="De-presenting is not un-searching"
        >
          <div className="grid gap-x-10 gap-y-6 sm:grid-cols-[minmax(0,250px)_minmax(0,1fr)]">
            <Figure
              value={count(rowTotal(archivedTier))}
              label="Archived as not an edge"
              note="Broken by construction, not merely unprofitable."
            />
            <div className="max-w-[68ch] space-y-4 text-body text-fg-muted">
              <p>
                A strategy is archived when it fails on its own terms rather
                than on its returns: the code does not implement the thesis its
                name claims, the sample is too small to conclude anything from,
                or the survivor was chosen using the very window it was then
                measured on. Several were named for a data series their code
                never loaded. Archiving stops them being shown as an edge on any
                surface: the index, the snapshot, the portfolios. It does
                nothing else.
              </p>
              <p>
                <span className="text-fg">
                  In particular it does not shrink the denominator.
                </span>{" "}
                Every one of those searches was still run, and a grid you have
                searched cannot be un-searched by re-filing the folder it lives
                in. The trial count that deflates every surviving strategy
                includes all of them, deliberately. That is the conservative
                direction, and it makes the surviving figures harder to clear
                rather than easier.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* ─── 5. OUR OWN KNOWN VIOLATIONS ──────────────────────────────────── */}
      {research?.gate_debt && (
        <Section
          title="Our own known violations"
          gloss="Where the catalogue fails our own checks"
        >
          <p className="max-w-[72ch] text-body text-fg-muted">
            A set of automated checks blocks our build. Where the catalogue
            still violates one, the offending strategies are grandfathered in a
            dated list that may only ever shrink: never a loosened rule, and
            never a silenced check. Each figure below carries the date its list
            was drawn, so a list that has stopped shrinking is visible as one.
          </p>

          <div className="scroll-x mt-7">
            <table className="w-full sm:min-w-[620px] text-small">
              <thead>
                <tr className="text-left text-caption text-fg-faint">
                  <th className="pb-2 pr-6 font-normal">Check</th>
                  <th className="pb-2 pr-6 font-normal">Known violations</th>
                  <th className="pb-2 font-normal">Dated</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(research.gate_debt).map(([gate, block]) => {
                  // `generated` and `note` are metadata about the row, not
                  // counts in it. Everything else that is a number is a count,
                  // including ones this file has never heard of.
                  const counts = ordered(
                    Object.keys(block).filter(
                      (k) =>
                        k !== "generated" &&
                        k !== "note" &&
                        typeof block[k] === "number",
                    ),
                    GATE_COUNT_ORDER,
                  );
                  const note =
                    typeof block.note === "string" ? block.note : null;
                  const generated =
                    typeof block.generated === "string" ? block.generated : null;
                  return (
                    <tr key={gate} className="border-t hairline align-baseline">
                      <td className="py-2.5 pr-6 text-fg">
                        {gate.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 pr-6">
                        <span className="tnum text-fg-muted">
                          {counts.length === 0
                            ? "—"
                            : counts.length === 1
                            ? count(block[counts[0]] as number)
                            : counts.map((k, i) => (
                                <span key={k}>
                                  {i > 0 && (
                                    <span className="px-1.5 text-fg-faint">
                                      ·
                                    </span>
                                  )}
                                  <span className="text-fg-faint">{k} </span>
                                  {count(block[k] as number)}
                                </span>
                              ))}
                        </span>
                        {/* The row's own words, where it has any. The only
                            multi-count row on this table is also the only one
                            that needs a sentence to be read correctly, and
                            paraphrasing it here would put this repository's
                            wording on the desk's finding. */}
                        {note && (
                          <span className="mt-1.5 block max-w-[52ch] font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
                            {prose(note)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 tnum text-fg-faint whitespace-nowrap">
                        {generated ? date(generated) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ─── 6. NUMBERS WE WILL NOT PRINT YET ─────────────────────────────── */}
      <Section
        title="Withheld"
        gloss="Figures the record suppresses, and the rule for each"
      >
        <p className="max-w-[72ch] text-body text-fg-muted">
          Three kinds of figure are suppressed on the portfolio pages, each
          under a standing rule, until the rule is satisfied.
        </p>

        {/* The per-portfolio counters below are read from the published index
            and from each book's own metrics file. Without them the rules still
            stand and the counts do not, so the section says which half it is
            missing rather than printing the rules as though they were sourced. */}
        {!index && (
          <Note tone="warn" className="mt-6">
            The published index could not be loaded, so the per-portfolio
            counters behind these rules are not shown.
          </Note>
        )}

        <ol className="mt-8 space-y-9">
          <Item
            n={1}
            title="Every annualised statistic"
            body={
              <>
                <p>
                  {need !== null ? (
                    <>
                      Suppressed until a portfolio has{" "}
                      <span className="tnum text-fg">{count(need)}</span> marked
                      sessions.
                    </>
                  ) : (
                    <>Suppressed until a portfolio has enough marked sessions.</>
                  )}{" "}
                  {gated.length > 0 &&
                    (gated.length === books.length ? (
                      <>
                        Every one of the {count(books.length)} portfolios
                        published here is below that bar today, so each of these
                        reads as a dash rather than as a ratio.
                      </>
                    ) : (
                      <>
                        {count(gated.length)} of the {count(books.length)}{" "}
                        portfolios published here are below that bar today.
                      </>
                    ))}
                </p>
                {shortHistory && (
                  <p className="mt-3">{prose(shortHistory.body_en)}</p>
                )}
                {suppressed.length > 0 && (
                  <>
                    {/* Named as the files name them, in the mono face. A
                        prettified label ("value at risk, 95%") would be this
                        repository translating the desk's vocabulary into
                        something a reader cannot grep the published data for. */}
                    <p className="mt-4 text-small text-fg-faint">
                      {count(suppressed.length)} statistics are withheld across
                      the portfolios, written here exactly as their metrics files
                      write them:
                    </p>
                    <p className="mt-2 text-small leading-relaxed text-fg-muted">
                      {suppressed.join(" · ")}
                    </p>
                  </>
                )}
                {/* THE PER-BOOK COUNTER, from the file the gate reads. The
                    portfolio pages print a session count of their own with a
                    different definition, and putting the two side by side under
                    a shared "needed" threshold would invite arithmetic the gate
                    does not do. This column is the gate's own numerator. */}
                {metrics.some((m) => m?.insufficient_history) && (
                  <div className="scroll-x mt-5">
                    <table className="w-full sm:min-w-[420px] text-small">
                      <thead>
                        <tr className="text-left text-caption text-fg-faint">
                          <th className="pb-2 pr-6 font-normal">Portfolio</th>
                          <th className="pb-2 pr-6 font-normal text-right">
                            Marked sessions
                          </th>
                          <th className="pb-2 font-normal text-right">
                            Needed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {books.map((b, i) => {
                          const gate = metrics[i]?.insufficient_history;
                          return (
                            <tr key={b.book} className="border-t hairline">
                              <td className="py-2 pr-6 text-small text-fg-muted">
                                {b.label}
                              </td>
                              <td className="py-2 pr-6 tnum text-right text-fg">
                                {count(gate?.have)}
                              </td>
                              <td className="py-2 tnum text-right text-fg-faint">
                                {count(gate?.need)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            }
          />

          <Item
            n={2}
            title="A hit rate"
            body={
              <p>
                {suppressed.includes("win_rate") ? (
                  <>
                    <span className="text-small text-fg-muted">
                      win_rate
                    </span>{" "}
                    is on that same suppressed list, and it is suppressed for
                    the same reason.
                  </>
                ) : (
                  <>The share of winning sessions is not published.</>
                )}{" "}
                The two counts behind it are published on every portfolio: the
                winning sessions and the losing ones, side by side. Over this
                many sessions the ratio between them is a small count wearing a
                percent sign, so it is not printed; both numbers are there to
                form it from.
              </p>
            }
          />

          <Item
            n={3}
            title="Which strategy holds which position"
            body={
              <>
                <p>
                  Holdings and attribution are published by category: mean
                  reversion, momentum, trend following, seasonal. Each category
                  carries the number of strategies in it. No strategy identifier
                  appears anywhere in the published data, and the roster of
                  names is not published at all. That is a choice, not an
                  oversight: the category says what kind of risk is being taken,
                  which is what a reader needs to judge the record; the logic is
                  the work.
                </p>
                {strategyIdentity && (
                  <p className="mt-3">{prose(strategyIdentity.body_en)}</p>
                )}
                {research?.note && (
                  <p className="mt-3 text-small text-fg-faint">
                    {prose(research.note)}
                  </p>
                )}
              </>
            }
          />
        </ol>
      </Section>

      {/* ─── 7. PROOFS WE CANNOT OFFER ────────────────────────────────────
          Nothing invented here: every item is taken from what /verify already
          states about the limits of its own four checks, collected because a
          limit printed beside the proof it limits is the easiest thing on a
          page to read past. */}
      <Section
        title="Proofs we cannot offer"
        gloss="What the checks do not establish"
      >
        <p className="max-w-[72ch] text-body text-fg-muted">
          Four checks on the{" "}
          <Link href="/verify" className="text-accent hover:underline">
            verify
          </Link>{" "}
          page can be run by a stranger with no cooperation from us: each record
          hashes its own content, the records are chained, each carries a
          Bitcoin-anchored timestamp, and the metrics follow from a published
          input. Here is what none of that establishes.
        </p>

        <ul className="mt-7 space-y-5 max-w-[74ch] text-body text-fg-muted">
          <Cannot title="That the trading was skilful">
            A chain proves a number was not edited afterwards. It says nothing
            whatever about whether the number was any good, and a short record
            of simulated fills is not evidence of an ability to repeat it.
          </Cannot>
          <Cannot title="That a simulated fill would have happened in a real market">
            Every fill behind these portfolios was simulated by the
            broker&rsquo;s paper engine against its own market data. Nothing in
            the cryptography touches that question.
          </Cannot>
          <Cannot title="That no other book exists unpublished">
            A chain proves no session was dropped <em>from that chain</em>. It
            cannot prove a chain was never restarted. Where that has happened
            it is declared on the verify page, with the withdrawn chain
            published beside the current one. No amount of hashing can testify
            about a file that was never put into it.
          </Cannot>
          <Cannot title="When a record was written, from below">
            A timestamp bounds a record from above only: it establishes that the
            file existed no later than the block it is anchored in, and says
            nothing about how much earlier. A record written in a later backfill
            carries a proof for the day it was stamped, so the chain publishes
            that day beside the session it describes rather than leaving the gap
            to be assumed away.
          </Cannot>
          <Cannot title="That the code behind the numbers is correct">
            The metrics module is the firm&rsquo;s and is not published, so
            nobody can read the code that produced these figures. What is
            published is the better check: the whole equity curve, plus the
            convention and the risk-free rate each figure used, so anyone can
            recompute from it with their own code and see whether they get the
            same answers.
          </Cannot>
          <Cannot title="That our commit signatures verify offline">
            The signer&rsquo;s public key is not published yet, so a clone
            reports <em>No principal matched</em> rather than a verified
            signature. It can see a signature is present and has nothing to
            check it against. Until that key is published beside the data, the
            commit signatures rest on GitHub&rsquo;s badge. The hash chain and
            the timestamps do not.
          </Cannot>
          <Cannot title="That a repository&rsquo;s history cannot be rewritten">
            Git history can be rewritten by whoever controls a repository. That
            is exactly why the chain, the Bitcoin timestamps, the signed commits
            and the branch ruleset are used together rather than any one of them
            being relied on.
          </Cannot>
        </ul>
      </Section>

      {/* ─── PROVENANCE ───────────────────────────────────────────────────── */}
      <section className="mt-12 lg:mt-16 border-t hairline pt-6">
        <p className="max-w-[72ch] text-small leading-relaxed text-fg-faint">
          The catalogue figures on this page come from{" "}
          <a
            className="text-accent hover:underline"
            href={`${DATA_REPO_URL}/blob/main/research.json`}
            target="_blank"
            rel="noreferrer noopener"
          >
            research.json
          </a>
          , regenerated from the committed catalogue rather than typed.
          {research ? (
            <>
              {" "}
              It was last generated{" "}
              <span className="tnum">{date(research.generated_at)}</span>.
            </>
          ) : null}{" "}
          The withheld statistics come from each portfolio&rsquo;s own metrics
          file. The denominator these corrections are applied against is set out
          under{" "}
          <Link href="/research" className="text-accent hover:underline">
            research
          </Link>
          , and the conditions attached to every figure on this site under{" "}
          <Link href="/disclosures" className="text-accent hover:underline">
            disclosures
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

/* ─── LOCAL FURNITURE ───────────────────────────────────────────────────────
   Section, Figure, Item and Cannot are local rather than shared: the section
   head is the newest house pattern (mono, 10.5px, uppercase) and the two older
   pages still carry the previous one. Lifting these into components/ would be a
   change to a file this page does not own. */

function Section({
  title,
  gloss,
  children,
}: {
  title: string;
  gloss?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 lg:mt-16 border-t hairline pt-6">
      <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
        {title}
        {gloss && (
          <span className="ml-3 normal-case tracking-normal text-fg-faint/70">
            {gloss}
          </span>
        )}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A published count, set over a rule. The figure is mono because it was
 *  measured; the label and the note are serif because they are the firm
 *  talking about it. */
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
      <div className="tnum text-heading leading-none tracking-tight text-fg">
        {value}
      </div>
      <div className="mt-2.5 text-small font-medium leading-snug">{label}</div>
      {note && (
        <div className="mt-1.5 text-small leading-relaxed text-fg-faint">
          {note}
        </div>
      )}
    </div>
  );
}

function Item({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex gap-5">
      <span className="shrink-0 w-5 pt-1 tnum text-small text-fg-faint">
        {n}
      </span>
      <div className="min-w-0 max-w-[72ch]">
        <h3 className="text-body font-medium leading-snug text-fg">{title}</h3>
        <div className="mt-2 text-body text-fg-muted">
          {body}
        </div>
      </div>
    </li>
  );
}

function Cannot({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="border-t hairline pt-4">
      <span className="text-fg">{title}.</span>{" "}
      <span className="text-fg-muted">{children}</span>
    </li>
  );
}
