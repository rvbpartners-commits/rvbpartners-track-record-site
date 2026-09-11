import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { Stamp } from "@/components/Stamp";
import {
  DATA_REPO_URL,
  SITE_ORIGIN,
  getIndex,
  getMetrics,
  getResearch,
} from "@/lib/data";
import type { MetricsPayload } from "@/lib/data";
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
 * table's own rows and columns into its own totals, and two RECONCILIATION
 * checks that decide whether a sentence may be printed at all — never what it
 * says.
 *
 * THE THREE STATES, AND WHY THEY NOW LOOK DIFFERENT FROM EACH OTHER. This page
 * is named for one of them and used to render it in the same grey as its
 * opposite: `reject` and `promote` were both `text-fg-muted`, so the column
 * that is the whole subject of the page read as another column. The three are
 * distinct now, each by the site's own idiom rather than by a new one:
 *
 *   ABSENT    a dash, in the faintest ink. A tier that is never graded has no
 *             reject cell, and that is not a zero.
 *   WITHHELD  `withheld · have/need`, exactly as the statistics ledger and the
 *             analytics panels write it, with the unit the gate itself
 *             published.
 *   REFUSED   the reserved oxide, spent the way a Stamp spends it: the RULE
 *             carries the colour and the label carries it at full strength,
 *             while the figure stays in the page's own ink so it reads as a
 *             count and not as a warning.
 *
 * The oxide that used to sit on the gross-Sharpe stamp is gone with that last
 * move. A row deflated against a flattered input is a qualification, and a
 * serious one, but it is not PAPER, WITHHELD, REFUSED or EXCLUDED — and the
 * colour reserved for those four is worth nothing on the day it starts meaning
 * "important".
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

type Gate = NonNullable<MetricsPayload["insufficient_history"]>;

/** THE SITE'S OWN WITHHELD MARKER. `withheld · have/need` is how the statistics
 *  ledger and the analytics panels write this state, and this page held both
 *  halves for every book while writing the state out longhand. One marker, one
 *  meaning, on every surface that carries it.
 *
 *  The gate's own `label_en` stands in where a book does not publish both
 *  halves: a marker assembled around a missing number would be this page
 *  inventing one, and the desk already publishes a sentence for that case. It
 *  is quoted exactly as written, like every other published string here. */
const withheldMarker = (gate: Gate | undefined): string | null => {
  if (!gate) return null;
  if (Number.isFinite(gate.have) && Number.isFinite(gate.need)) {
    return `withheld · ${count(gate.have)}/${count(gate.need)}`;
  }
  return gate.label_en ? prose(gate.label_en) : null;
};

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
   CHECK the published `presented_folders` against the grid printed beside it —
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
  // though it governed all of them. Written as raw identifiers — a prettified
  // label ("value at risk") would be this repository translating the desk's
  // vocabulary into something a reader cannot grep the published data for.
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

  // WHAT THE GATE COUNTS IN, FROM THE GATE. This page hardcoded "marked
  // sessions" in the one sentence that states the bar, while `BookView` reads
  // `insufficient_history.unit` — so the day a book starts counting round trips
  // the two surfaces disagree about what the same gate measures. The unit is
  // read here, and only stated as governing every book while every book agrees
  // on it: where they differ the sentence names no unit and each row in the
  // margin carries its own. Absent means marked sessions, which is what every
  // book counted in before the field existed.
  const units = [
    ...new Set(
      metrics
        .map((m) => m?.insufficient_history?.unit)
        .filter((u): u is string => typeof u === "string" && u.length > 0),
    ),
  ];
  const gateUnit =
    units.length === 0 ? "marked sessions" : units.length === 1 ? units[0] : null;

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

  // THE REJECT COLUMN, BY WHATEVER NAME IT IS PUBLISHED UNDER, and its own
  // total: the same arithmetic the tier totals already do, down a column of the
  // printed grid rather than across a row. A cell no tier publishes contributes
  // nothing rather than a zero, so this is a sum of what is there and never a
  // count padded out with absences.
  //
  // IT GOES IN THE MATRIX, AS THE MATRIX'S OWN TOTAL ROW, under the blocks it
  // adds up and labelled as their sum. It was a headline stamp, which is the
  // one thing this number must never be: the catalogue publishes the cells and
  // publishes no count of refusals, so a stamp reading "REJECTED / 268" prints
  // a published figure that does not exist. Adding a printed table's own rows
  // into its own total is the only arithmetic this page may do, and the total
  // row of that table is the only place the answer may stand.
  const rejectKey = verdictCols.find((v) => v.toLowerCase() === "reject") ?? null;
  const rejectTotal =
    rejectKey === null
      ? null
      : tierRows.reduce((s, t) => {
          const cell = byTier?.[t]?.[rejectKey];
          return typeof cell === "number" ? s + cell : s;
        }, 0);

  // Does the grid beside the prose add up to the published "presented" figure?
  // It should: presented = promote + conditional, in the two tiers that can be
  // deployed. Checked rather than asserted — the day the publisher changes what
  // counts as presented, the explanatory sentence disappears instead of going
  // quietly wrong beside a number that did not.
  const presentedFromGrid = Object.entries(byTier ?? {})
    .filter(([tier]) => DEPLOYABLE_TIERS.has(tier.toLowerCase()))
    .flatMap(([, row]) => Object.entries(row))
    .filter(([verdict]) => PRESENTED_VERDICTS.has(verdict.toLowerCase()))
    .reduce((s, [, n]) => s + n, 0);
  const presentedReconciles =
    presented !== undefined && presented > 0 && presentedFromGrid === presented;

  const s = research?.search;
  const d = research?.deflation;

  // WHEN THE GRANDFATHERED LISTS WERE DRAWN. Selected, not computed: the oldest
  // and the newest of the dates the rows already publish, sorted as ISO strings.
  // A list that has stopped shrinking is an old date, and an old date is the
  // only thing on that table a reader can catch without our help.
  const listDates = Object.values(research?.gate_debt ?? {})
    .map((block) => (typeof block.generated === "string" ? block.generated : null))
    .filter((g): g is string => g !== null)
    .sort();
  const oldestList = listDates.length > 0 ? listDates[0] : null;
  const newestList =
    listDates.length > 0 ? listDates[listDates.length - 1] : null;

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
      {/* The page header sits above the first Section and so outside the grid
          that owns the measure. It is the one place on this page that still
          states a width, and it states the grid's own. */}
      <h1 className="text-title">Refused</h1>
      <p className="mt-5 max-w-[var(--measure)] text-body text-fg-muted">
        Most of what we tested did not work. This page is the count: the
        strategies that failed, the figures the record suppresses, and the
        limits of what it can prove about itself. It carries no performance
        figure, and every number on it is regenerated from the published
        catalogue.
      </p>

      {/* ─── 1. THE SHAPE OF THE BOOK ─────────────────────────────────────
          The catalogue as it is filed, tier by tier and verdict by verdict.
          The matrix is in the margin rather than in the measure: it is a grid
          of figures, not running prose, and at 620px of minimum width it was
          the thing forcing a horizontal scrollbar under a paragraph. */}
      <Section
        first
        title="The shape of the book"
        gloss="Every folder, by how it was graded"
        note={
          byTier
            ? "A tier carries only the verdicts it is graded on, and one it never carries reads as a dash rather than as a zero. Baseline has no rejects because nothing in it is graded, which is not the same as having none."
            : undefined
        }
        aside={
          byTier ? (
            <TierMatrix
              tiers={tierRows}
              verdicts={verdictCols}
              byTier={byTier}
              total={rowTotal}
              rejectKey={rejectKey}
              rejectTotal={rejectTotal}
            />
          ) : undefined
        }
      >
        {byTier ? (
          <>
            <p className="text-body text-fg-muted">
              A strategy is filed under the verdict it earned, and the verdict
              is part of the path on disk. Nothing is deleted when it fails: the
              code, the returns and the report card stay exactly where they
              were, auditable, and stop being presented as a result. The
              rejects are not a backlog to be worked through. They are the
              outcome.
            </p>

            {/* THE UNIT IS THE FOLDER, NOT THE STRATEGY, and the two totals on
                this page differ by more than rounding. One strategy owns a
                folder in several tiers at once — its production version, the
                unedited baseline it started as, the champion a grid search
                found — so adding the tiers gives folders, and the count of
                strategies is a different, smaller number published beside it. A
                page that printed the folder total under the word "strategies"
                would roughly double the book, on the one page whose subject is
                how carefully the firm counts. */}
            <p className="text-small leading-relaxed text-fg-faint">
              <span className="tnum text-fg-muted">{count(folderTotal)}</span>{" "}
              folders in all, added up from the cells above rather than published
              as a total. That is not a count of strategies. One strategy
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
              <p className="text-small leading-relaxed text-fg-faint">
                <span className="tnum text-fg">{count(presented)}</span> of those
                folders are presented as an edge anywhere on this site.
                {presentedReconciles
                  ? " Those are the promote and conditional cells of the two tiers that can be deployed, and nothing else."
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

      {/* ─── 2. WHAT THE CORRECTION REMOVED ─────────────────────────────────
          The four counts are the section's substance and stay in the measure.
          The margin carries the denominator they were corrected against, which
          reached this page only inside a sentence, and the desk's own note on
          why the effective figures are the ones used. */}
      <Section
        title="What the correction removed"
        gloss="Search enough and something looks significant"
        note={s?.note ? prose(s.note) : undefined}
        aside={
          s ? (
            <div>
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                The denominator
              </h3>
              <div className="mt-3 flex flex-col gap-3">
                <MarginFigure
                  value={count(s.strategies_researched)}
                  label="Strategies researched"
                />
                <MarginFigure
                  value={count(s.recorded_trials)}
                  label="Recorded trials"
                />
                <MarginFigure value={count(s.idea_families)} label="Idea families" />
                <MarginFigure
                  value={count(s.effective_independent_strategies)}
                  label="Effective independent strategies"
                />
                <MarginFigure
                  value={count(s.effective_independent_trials)}
                  label="Effective independent trials"
                />
              </div>
            </div>
          ) : undefined
        }
      >
        {d ? (
          <>
            <p className="text-body text-fg-muted">
              A strategy that clears a significance bar on its own has cleared a
              bar that was set for one test. It was not one test. Every headline
              is therefore re-derived against the whole book&rsquo;s effective
              number of independent trials, which is a far harsher standard, and
              it is the one that decides what appears on this site.
            </p>

            <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
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
              <p className="text-small leading-relaxed text-fg-faint">
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
          A neutral stamp, deliberately. The figure disqualifies the numbers
          above it and the heading says so in words, but the reserved oxide
          marks PAPER, WITHHELD, REFUSED and EXCLUDED and this is none of the
          four. It spent the page's whole colour budget on a qualification while
          the reject column — the subject of the page — was rendered in the same
          grey as promote. */}
      {d?.gross_sharpe_fallback_rows !== undefined && (
        <Section
          title="The qualification on that number"
          gloss="Where the correction ran on a flattered input"
          aside={
            <Stamp
              label="Rows on a gross Sharpe"
              value={count(d.gross_sharpe_fallback_rows)}
              note="deflated against a figure that has not had the cash rate taken out of it"
            />
          }
        >
          <p className="text-body text-fg-muted">
            Our headline Sharpe is excess of the risk-free rate: the return on
            cash is subtracted before the ratio is taken, because interest on a
            balance is not a result of trading it. A gross Sharpe keeps that
            interest, and a strategy can be carried over a bar by it alone.
          </p>
          <p className="text-body text-fg-muted">
            That many rows of the correction above ran on the gross figure,
            because the record each was re-derived from predates the point at
            which the rate was threaded through. Those rows were deflated
            against an input that flatters them. They are counted and published
            as their own number rather than blended into the total, which is why
            it is possible to say this at all. It belongs on the page that
            qualifies the figure, not in a footnote somewhere else.
          </p>
        </Section>
      )}

      {/* ─── 4. ARCHIVED, BUT STILL IN THE DENOMINATOR ────────────────────── */}
      {archivedTier && (
        <Section
          title="Archived, and still counted"
          gloss="De-presenting is not un-searching"
          note="The tier is read from the catalogue by the name it is published under. Renamed, this section disappears rather than printing a count that no longer means what it says."
          aside={
            /* NAMED AS A SUM. This page bans a browser-computed total standing
               as a headline figure, and moved the reject total into the matrix
               for that reason: the catalogue publishes cells and publishes no
               count of refusals, so a figure that looks published but is not is
               the one thing this page must not print. The archived total is the
               same arithmetic, so it carries the same disclosure rather than the
               same pretence. */
            <Figure
              value={count(rowTotal(archivedTier))}
              label="Archived as not an edge"
              note="The sum of this tier's cells in the catalogue above. Broken by construction, not merely unprofitable."
            />
          }
        >
          <p className="text-body text-fg-muted">
            A strategy is archived when it fails on its own terms rather than on
            its returns: the code does not implement the thesis its name claims,
            the sample is too small to conclude anything from, or the survivor
            was chosen using the very window it was then measured on. Several
            were named for a data series their code never loaded. Archiving
            stops them being shown as an edge on any surface: the index, the
            snapshot, the portfolios. It does nothing else.
          </p>
          <p className="text-body text-fg-muted">
            <span className="text-fg">
              In particular it does not shrink the denominator.
            </span>{" "}
            Every one of those searches was still run, and a grid you have
            searched cannot be un-searched by re-filing the folder it lives in.
            The trial count that deflates every surviving strategy includes all
            of them, deliberately. That is the conservative direction, and it
            makes the surviving figures harder to clear rather than easier.
          </p>
        </Section>
      )}

      {/* ─── 5. OUR OWN KNOWN VIOLATIONS ──────────────────────────────────── */}
      {research?.gate_debt && (
        <Section
          title="Our own known violations"
          gloss="Where the catalogue fails our own checks"
          note="Each list carries the date it was drawn, because a list that may only ever shrink is checked by its date. One that has stopped shrinking shows up as an old one."
          aside={
            oldestList && newestList ? (
              <div className="flex flex-col gap-3">
                {oldestList === newestList ? (
                  <MarginFigure value={date(newestList)} label="Lists drawn" />
                ) : (
                  <>
                    <MarginFigure
                      value={date(newestList)}
                      label="Newest list drawn"
                    />
                    <MarginFigure
                      value={date(oldestList)}
                      label="Oldest list drawn"
                    />
                  </>
                )}
              </div>
            ) : undefined
          }
        >
          <p className="text-body text-fg-muted">
            A set of automated checks blocks our build. Where the catalogue
            still violates one, the offending strategies are grandfathered in a
            dated list that may only ever shrink: never a loosened rule, and
            never a silenced check. Each figure below carries the date its list
            was drawn, so a list that has stopped shrinking is visible as one.
          </p>

          <div className="scroll-x">
            <table className="w-full sm:min-w-[480px] text-small">
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
                          <span className="mt-1.5 block text-small leading-snug text-fg-faint">
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

      {/* ─── 6. NUMBERS WE WILL NOT PRINT YET ───────────────────────────────
          The per-book counters are in the margin now, in the site's own
          withheld marker. They were a third table inside the measure, under a
          heading that said "Withheld" while rendering the state in no
          particular way at all. */}
      <Section
        title="Withheld"
        gloss="What is suppressed, and the rule for each"
        note={
          metrics.some((m) => m?.insufficient_history)
            ? "The bar is published once for the record, and again by each book as the need its own gate applied. The count beside each portfolio is that gate's own numerator: the portfolio pages carry a session count under a different definition, and the two are not to be subtracted from one another."
            : undefined
        }
        aside={
          metrics.some((m) => m?.insufficient_history) ? (
            <div>
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                The gate, by portfolio
              </h3>
              <dl className="mt-3">
                {books.map((b, i) => {
                  const gate = metrics[i]?.insufficient_history;
                  const marker = withheldMarker(gate);
                  // The unit is named once under the list while every book
                  // agrees on it. Where they do not, no line can speak for all
                  // of them and each carries its own.
                  const rowUnit =
                    gateUnit === null ? gate?.unit ?? "marked sessions" : null;
                  return (
                    // THE MARKER GOES UNDER THE PORTFOLIO, NOT BESIDE IT.
                    // These two were a `justify-between` row with the marker
                    // held at `shrink-0`, so the marker kept its ~105px
                    // whatever the track was. At the `lg` breakpoint the margin
                    // is about 140px, which left the name about 23px: every
                    // label here is a hyphenated slug, the narrowest of them
                    // breaks to ~44px, and all seven rows spilled their own
                    // cells from 1024px to about 1150px. There is no second
                    // column in a 140px margin; there is a line, and then the
                    // next line.
                    <div key={b.book} className="border-t hairline py-2">
                      <dt className="min-w-0 break-words text-caption text-fg">
                        {b.label}
                      </dt>
                      {/* THREE STATES, THREE RENDERINGS. A book that publishes
                          no gate at all has not withheld anything: that is an
                          absence, and it reads as the bare dash in the faintest
                          ink this page has, which is what absence reads as
                          everywhere else on it. Withholding is the site's own
                          `withheld · have/need` marker, in the ink the page
                          sets its own quiet facts in — the two were both
                          `text-fg-faint` here, which said the same thing about
                          a book that is withholding and a book that has nothing
                          to withhold. Refusal is the oxide, and it is spent in
                          the matrix above and nowhere else on this page. */}
                      {marker === null ? (
                        <dd className="mt-1 text-caption text-fg-faint">—</dd>
                      ) : (
                        <dd className="mt-1 min-w-0 break-words tnum text-caption text-fg-muted">
                          {rowUnit ? `${marker} ${rowUnit}` : marker}
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
              {gateUnit && (
                <p className="mt-3 text-caption leading-snug text-fg-faint">
                  Counted in {gateUnit}, by the gate itself.
                </p>
              )}
            </div>
          ) : undefined
        }
      >
        <p className="text-body text-fg-muted">
          Three kinds of figure are suppressed on the portfolio pages, each
          under a standing rule, until the rule is satisfied.
        </p>

        {/* The per-portfolio counters beside this are read from the published
            index and from each book's own metrics file. Without them the rules
            still stand and the counts do not, so the section says which half it
            is missing rather than printing the rules as though they were
            sourced. */}
        {!index && (
          <Note tone="warn">
            The published index could not be loaded, so the per-portfolio
            counters behind these rules are not shown.
          </Note>
        )}

        <ol className="space-y-9">
          <Item
            n={1}
            title="Every annualised statistic"
            body={
              <>
                <p>
                  {need !== null && gateUnit ? (
                    <>
                      Suppressed until a portfolio has{" "}
                      <span className="tnum text-fg">{count(need)}</span>{" "}
                      {gateUnit}.
                    </>
                  ) : (
                    <>
                      Suppressed until a portfolio has enough history under its
                      own gate.
                    </>
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
                    {/* Named as the files name them. A prettified label ("value
                        at risk, 95%") would be this repository translating the
                        desk's vocabulary into something a reader cannot grep
                        the published data for. */}
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
          states about the limits of its own four checks. */}
      <Section
        title="Proofs we cannot offer"
        gloss="What the checks do not establish"
        note="Each of these is already stated on the verify page, beside the check it limits. They are collected here because a limit printed beside the proof it limits is the easiest thing on a page to read past."
      >
        <p className="text-body text-fg-muted">
          Four checks on the{" "}
          <Link href="/verify" className="text-accent hover:underline">
            verify
          </Link>{" "}
          page can be run by a stranger with no cooperation from us: each record
          hashes its own content, the records are chained, each carries a
          Bitcoin-anchored timestamp, and the metrics follow from a published
          input. Here is what none of that establishes.
        </p>

        <ul className="space-y-5 text-body text-fg-muted">
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

      {/* ─── PROVENANCE ─────────────────────────────────────────────────────
          Outside the section grid, so it keeps a width of its own: the grid's. */}
      <section className="mt-12 lg:mt-16 border-t hairline pt-6">
        <p className="max-w-[var(--measure)] text-small leading-relaxed text-fg-faint">
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
   The page's own `Section` is gone: it was one of six byte-identical copies,
   and the shared primitive in components/Section.tsx is the only one now. What
   is left here is what belongs to this page and nowhere else. */

/** THE TIER MATRIX, SHAPED FOR THE MARGIN. Three hundred pixels will not carry
 *  a four-verdict table, so the grid is transposed: a block per tier with its
 *  own total, then a line per verdict. Every verdict column is printed for
 *  every tier, so a cell the catalogue does not carry stays visible as a dash
 *  instead of vanishing into a shorter list.
 *
 *  THE REJECT LINE IS THE ONE THE PAGE IS NAMED FOR. It takes the Stamp's
 *  idiom exactly: the rule carries the reserved oxide at 40%, the verdict
 *  carries it at full strength, and the figure stays in the page's own ink —
 *  a count drawn in a warning colour reads as a warning rather than as a
 *  number, and the point is that this is an ordinary, enormous count. The
 *  column is found by name, so a catalogue that files rejects under another
 *  word simply gets no oxide rather than the wrong column marked.
 *
 *  AND THE TOTAL OF THAT LINE IS THE LAST ROW OF THIS TABLE, not a stamp above
 *  it. The catalogue publishes the cells; it publishes no count of refusals.
 *  Adding up the reject line of every block printed above is the one piece of
 *  arithmetic allowed here, and it is only allowed while the answer stays
 *  inside the table it was added from and says in words that it is a sum. A
 *  figure lifted out of the table and set in a stamp is read as a published
 *  one, which this is not.
 *
 *  THE LABEL ABOVE THE FIGURE, not beside it: at the `lg` breakpoint this
 *  whole column is about 140px, and a two-column row here would leave a
 *  sentence-long label about 30px to be printed in. */
function TierMatrix({
  tiers,
  verdicts,
  byTier,
  total,
  rejectKey,
  rejectTotal,
}: {
  tiers: string[];
  verdicts: string[];
  byTier: Record<string, Record<string, number>>;
  total: (tier: string) => number;
  rejectKey: string | null;
  /** The reject line of every block above, added together. `null` where the
   *  catalogue files rejects under a word this page did not find, in which
   *  case there is no line to add and no total row to print. */
  rejectTotal: number | null;
}) {
  const oxideRule = "color-mix(in srgb, var(--oxide) 40%, transparent)";
  return (
    <div>
      {tiers.map((tier) => {
        const key = tier.toLowerCase();
        return (
          <div key={tier} className="mt-6 first:mt-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                {TIER_LABEL[key] ?? tier}
              </h3>
              <span className="tnum text-caption text-fg">
                {count(total(tier))}
              </span>
            </div>
            {TIER_GLOSS[key] && (
              <p className="mt-1 text-caption leading-snug text-fg-faint">
                {TIER_GLOSS[key]}
              </p>
            )}
            <dl className="mt-2">
              {verdicts.map((v) => {
                const cell: number | undefined = byTier[tier]?.[v];
                const refused = rejectKey !== null && v === rejectKey;
                return (
                  <div
                    key={v}
                    className="flex items-baseline justify-between gap-3 border-t py-1"
                    style={{
                      borderColor: refused ? oxideRule : "var(--hairline)",
                    }}
                  >
                    <dt
                      className="text-caption"
                      style={{
                        color: refused ? "var(--oxide)" : "var(--fg-faint)",
                      }}
                    >
                      {v.replace(/_/g, " ")}
                    </dt>
                    <dd
                      className={`tnum text-caption ${
                        cell === undefined ? "text-fg-faint" : "text-fg"
                      }`}
                    >
                      {count(cell)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
      {rejectKey !== null && rejectTotal !== null && (
        <div className="mt-6 border-t pt-2" style={{ borderColor: oxideRule }}>
          <div
            className="text-label font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--oxide)" }}
          >
            {rejectKey.replace(/_/g, " ")}, all tiers
          </div>
          <div className="mt-1.5 tnum text-small leading-snug text-fg">
            {count(rejectTotal)}
          </div>
          <p className="mt-1.5 text-caption leading-snug text-fg-faint">
            The sum of the {rejectKey.replace(/_/g, " ")} lines above. The
            catalogue publishes the cells, not this total.
          </p>
        </div>
      )}
    </div>
  );
}

/** A published count, set over a rule. */
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

/** The same thing at the margin's size. `Figure` is set for the measure, where
 *  it has 250px and a note to carry; this one has 296px, no note, and sits in a
 *  stack of four or five. */
function MarginFigure({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-t hairline pt-2">
      <div className="tnum text-small leading-snug text-fg">{value}</div>
      <div className="mt-1.5 text-caption leading-snug text-fg-faint">
        {label}
      </div>
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
      <div className="min-w-0">
        <h3 className="text-body font-medium leading-snug text-fg">{title}</h3>
        <div className="mt-2 text-body text-fg-muted">{body}</div>
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
