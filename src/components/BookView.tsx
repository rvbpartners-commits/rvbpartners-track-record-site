"use client";

import { useMemo } from "react";
import type {
  AnalyticsPayload,
  BenchmarkPoint,
  BookMeta,
  BookSummary,
  DailyPoint,
  DetailPayload,
  IntradayPoint,
  MetricsPayload,
  NavPoint,
  SnapshotRecord,
} from "@/lib/data";
import { DATA_REPO_URL, accountKindLabel, feedLabel, taglineOf } from "@/lib/data";
import {
  date,
  marketTime,
  money,
  pct,
  prose,
  sessionZone,
  signedPct,
} from "@/lib/format";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { ChartLegend, PerformanceChart, type ChartPoint } from "./PerformanceChart";
import { DailyPnlChart } from "./DailyPnlChart";
import { ExposureSection } from "./ExposureSection";
import { HoldingsTable } from "./HoldingsTable";
import { Note } from "./Note";
import { RoundTripStats } from "./RoundTripStats";
import { Section } from "./Section";
import { PortfolioSelect, type PortfolioOption } from "./PortfolioSelect";
import { LEDGER_METRIC_KEYS, StatisticsLedger } from "./StatisticsLedger";

export type BookBundle = {
  summary: BookSummary;
  meta: BookMeta | null;
  metrics: MetricsPayload | null;
  analytics: AnalyticsPayload | null;
  nav: NavPoint[];
  benchmark: BenchmarkPoint[];
  intraday: IntradayPoint[];
  benchIntraday: Map<string, { spy: number | null; cash: number | null }>;
  detail: DetailPayload | null;
  daily: DailyPoint[];
  /** What this book's own chain entries say about WHEN the record was written.
   *
   *  `backfilled` counts records whose chain timestamp falls on a different day
   *  from the session they describe. It is the single most damaging thing a
   *  sceptic can find unaided — a genesis entry dated after the record begins
   *  looks like a rewrite — and it is entirely benign once stated, because the
   *  chain publishes the recording date for every entry. Null when the chain
   *  could not be read: the page then claims nothing about it. */
  chain?: {
    records: number;
    backfilled: number;
    /** The one day every late record joined on, when there is only one. */
    recordedOn: string | null;
  } | null;
  /** The last record in this book's chain, read from the chain's own path.
   *  The page prints a headline and says it is the chained figure; this is what
   *  lets it check rather than assert. */
  lastSnapshot?: SnapshotRecord | null;
  lastSnapshotSession?: string | null;
  /** The parent book of a capital twin, when both are published. Resolved by
   *  the page from the index so the header can say what the selector already
   *  knows. */
  variantParentLabel?: string | null;
  variantSize?: string | null;
  /** The parent's inception. The twins were funded later than the books they
   *  copy, so the pair differs in measurement window as well as in capital. */
  variantParentInception?: string | null;
  /** The earliest inception among the published paper books. */
  paperRecordStart?: string | null;
};

/** How far behind the publish a broker reading may be and still be called
 *  "live". One session plus slack: a reading refreshed on the publishing run is
 *  hours old, and anything the publisher could not refresh is not a live
 *  reading whatever the field is named. */
const LIVE_MAX_AGE_HOURS = 36;

/** One line for a declared capital movement, built from its published kind
 *  and evidence fields. */
function describeMovement(e: {
  kind?: string;
  amount_usd: number;
  evidence?: Record<string, unknown> | null;
}): string {
  const symbol = e.evidence?.symbol;
  const qty = e.evidence?.qty;
  if (e.kind === "broker_adjustment" && typeof symbol === "string" && typeof qty === "number") {
    const shares = qty.toLocaleString("en-US", { maximumFractionDigits: 6 });
    return `${shares} ${symbol} ${e.amount_usd < 0 ? "removed" : "returned"} by the broker without a transaction`;
  }
  if (e.kind === "deposit") return "Deposit";
  if (e.kind === "withdrawal") return "Withdrawal";
  if (e.kind === "broker_adjustment") return "Broker adjustment";
  return e.amount_usd < 0 ? "Withdrawal" : "Deposit";
}

/**
 * Is the published `live` block actually current?
 *
 * The header used to lead with `live` unconditionally. On a book whose desk had
 * published nothing for five days that rendered a stale, unchained, unhashed
 * reading under the word "live" — and it was the largest of the three competing
 * figures on the page. So the reading has to earn the label: it is measured
 * against the moment the payload was written, not against the reader's clock,
 * because the question is whether the publisher refreshed it on this run.
 *
 * Fails CLOSED. If either instant is missing or unparseable we cannot establish
 * freshness, so the reading is treated as stale and the chained figure leads.
 */
function liveIsFresh(at: string | undefined, publishedAt: string | undefined): boolean {
  if (!at || !publishedAt) return false;
  const read = new Date(at).getTime();
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(read) || Number.isNaN(published)) return false;
  return published - read <= LIVE_MAX_AGE_HOURS * 3600 * 1000;
}

/** A plural unit published by the desk ("marked sessions", "round trips"),
 *  made singular for a count of one. */
function countUnit(n: number, unit: string): string {
  return n === 1 ? unit.replace(/s$/, "") : unit;
}

/** The leading ISO date of a rejection label such as
 *  `"2026-08-11 (max deviation 100.3% from published NAV)"`. */
function rejectedDate(label: string): string | null {
  const m = label.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

/**
 * Build the chart series.
 *
 * The portfolio line comes from the 5-minute broker equity where it exists, so
 * the curve has the shape the sessions actually had. The benchmark is only
 * published daily, so its points are attached to the LAST intraday point of each
 * session rather than spread across it — inventing intraday SPY values to match
 * our resolution would be drawing data we do not have.
 */
function buildChart(
  nav: NavPoint[],
  benchmark: BenchmarkPoint[],
  intraday: IntradayPoint[],
  benchIntraday: Map<string, { spy: number | null; cash: number | null }>,
  liveFactor = 1,
): { points: ChartPoint[]; granular: boolean } {
  const base = nav.length > 0 ? nav[0].equity_adj : 0;
  if (!base) return { points: [], granular: false };

  const bench = new Map(benchmark.map((b) => [b.date, b]));
  const navByDate = new Map(nav.map((p) => [p.date, p]));

  // A STALE INTRADAY FILE MUST NOT TRUNCATE THE CURVE. The intraday branch maps
  // over the intraday points alone, so any marked session the broker feed never
  // reached is simply absent from the chart — the line stops, and nothing on the
  // page says why. Measured 2026-09-12: four books published marks through
  // 09-11 while their intraday file ended 2026-09-09T20:00Z, so the chart read
  // +1.13% against a published +2.07% beside it.
  //
  // The rule is the one the comment below already states, taken to its
  // conclusion: ONE resolution per line. Five-minute points are used when they
  // cover the record; when they fall short the daily marks are used ENTIRELY,
  // because a complete curve at lower resolution says more than a detailed one
  // that stops two days ago. Mixing the two would put points of different
  // meaning on one line, which is the thing being avoided, not a way out of it.
  const derniereMarque = nav.length ? nav[nav.length - 1].date : null;
  const derniereIntraday = intraday.reduce(
    (max, p) => (p.session_date > max ? p.session_date : max), "");
  const intradayCouvre =
    intraday.length > 0 && derniereMarque !== null
    && derniereIntraday >= derniereMarque;

  if (!intradayCouvre) {
    return {
      granular: false,
      points: nav.map((p) => {
        const b = bench.get(p.date);
        return {
          t: p.date,
          date: p.date,
          book: p.equity_adj / base - 1,
          spy: b?.spy_cum ?? null,
          cash: b?.cash_cum ?? null,
          close: p.equity_adj / base - 1,
        };
      }),
    };
  }

  // The last intraday point of each session is where the daily figures attach.
  const lastOfSession = new Map<string, string>();
  for (const p of intraday) lastOfSession.set(p.session_date, p.timestamp);

  // The intraday file holds RAW broker readings, so each one is placed on the
  // adjusted index by its session's own factor. Today's session has no NAV row
  // yet — the desk marks after the close — and that is exactly the window where
  // a capital event is already in the broker's equity and not yet in the marked
  // curve. `liveFactor` covers it; without it the chart would draw a step the
  // rest of the page has excluded, on the one part a reader is watching.
  const factorFor = (session: string) =>
    navByDate.get(session)?.adj_factor ?? liveFactor;

  const points: ChartPoint[] = intraday.map((p) => {
    const isSessionEnd = lastOfSession.get(p.session_date) === p.timestamp;
    const navPoint = isSessionEnd ? navByDate.get(p.session_date) : undefined;
    // Benchmarks come stamped on the SAME instants as the equity. Attaching the
    // DAILY benchmark to session ends instead would give the line a value at 3
    // of 237 x-positions, and the chart would join them into long straight
    // segments hanging across the plot — the "horizontal rules from nowhere".
    const b = benchIntraday.get(p.timestamp);
    return {
      t: p.timestamp,
      date: p.session_date,
      book: (p.equity * factorFor(p.session_date)) / base - 1,
      spy: b?.spy ?? null,
      cash: b?.cash ?? null,
      // The official published NAV: the desk's after-close mark, a few basis
      // points off the broker's 16:00 intraday figure.
      close: navPoint ? navPoint.equity_adj / base - 1 : null,
    };
  });
  return { points, granular: true };
}

function BookView({
  bundle,
  publishedAt,
}: {
  bundle: BookBundle;
  /** When the payload this page is rendering was written. Used only to decide
   *  whether the book's `live` block was refreshed on that run. */
  publishedAt: string | undefined;
}) {
  const { summary, meta, metrics, analytics, nav, benchmark, intraday: intradayRaw,
          benchIntraday, detail, daily } = bundle;
  const gate = metrics?.insufficient_history;
  // The unit the gate counts in, from the payload. Absent means marked
  // sessions — what every book counted in before a 24/7 book started counting
  // round trips. Rendering the payload's own unit is what keeps one page from
  // stating two different bars as though both were binding.
  const gateUnit = gate?.unit ?? "marked sessions";
  // Suppressed names the ledger has no row for. Empty on every book today;
  // computed rather than assumed so it stays empty or says so.
  const unrenderedSuppressed = (gate?.suppressed ?? []).filter(
    (name) => !LEDGER_METRIC_KEYS.has(name),
  );
  const currency = meta?.currency ?? "USD";
  const last = nav.length > 0 ? nav[nav.length - 1] : null;
  const cumulative = metrics?.values.cumulative_return ?? null;
  const observations = metrics?.values.n_obs ?? gate?.have ?? null;
  const rawLive = meta?.live ?? summary.live ?? null;
  // Against the INDEX's publish time, never the book's own. A book that stopped
  // publishing carries a stale `published_at` too, so measuring its reading
  // against its own clock declares every stale reading fresh — the reading and
  // the timestamp went stale together. The index is the moment the payload this
  // page renders was written.
  const liveFresh = liveIsFresh(rawLive?.at, publishedAt);
  // A stale reading is still shown — dated, and labelled as the last reading
  // rather than a live one — but it no longer displaces the chained figures in
  // the two headline fields.
  const live = liveFresh ? rawLive : null;
  const zone = sessionZone(
    (meta?.session_close ?? summary.session_close)?.label,
  );
  // Did this book publish on the run that produced the payload? Its own
  // `published_at` against the index's answers that with no threshold guessing
  // about calendars: a book that published on this run carries the same
  // instant, and one that did not is behind by however long it has been silent.
  // The page then stops promising "the next close" for a book that has stopped
  // producing closes.
  const bookBehind =
    publishedAt !== undefined &&
    meta?.published_at !== undefined &&
    !liveIsFresh(meta.published_at, publishedAt);

  // A SESSION THE DESK DECLARED IMPOSSIBLE IS NOT DRAWN. The publisher measured
  // these sessions' broker feed at ~100% deviation from the published NAV and
  // listed them as rejected — but they are still in the accumulated
  // intraday.csv, so the curve drew them under a note claiming they were
  // excluded. Withholding is the fail-closed reading of a rejection, and the
  // note below states that the published file still contains them so the
  // divergence stays visible rather than being papered over.
  const rejectedLabels = useMemo(
    () => meta?.intraday_sessions_rejected ?? [],
    [meta?.intraday_sessions_rejected],
  );
  const rejectedDates = useMemo(
    () =>
      new Set(
        rejectedLabels
          .map(rejectedDate)
          .filter((d): d is string => d !== null),
      ),
    [rejectedLabels],
  );
  const intraday = useMemo(
    () =>
      rejectedDates.size === 0
        ? intradayRaw
        : intradayRaw.filter((p) => !rejectedDates.has(p.session_date)),
    [intradayRaw, rejectedDates],
  );
  const rejectedDrawnCount = intradayRaw.length - intraday.length;
  // Non-zero only where a capital event is declared, so every other book
  // renders exactly the header it rendered before.
  //
  // A book that declares no capital events can still carry flows in its own
  // nav.csv `flow` column — the real-capital book does (−$17.79 on 10 Sept), and
  // its page showed a balance below its funding next to a positive return with
  // nothing to reconcile the two. The published column is read as the fallback.
  const navFlow = nav.reduce((s, p) => s + (p.flow ?? 0), 0);
  const capitalFlow =
    meta?.capital_events?.cumulative_flow_usd ??
    (Math.abs(navFlow) >= 0.005 ? navFlow : 0);
  const capitalEvents = meta?.capital_events?.events ?? [];
  const capitalEventCount = capitalEvents.length;

  const { points, granular } = useMemo(
    () =>
      buildChart(nav, benchmark, intraday, benchIntraday,
                 meta?.capital_events?.live_factor ?? 1),
    [nav, benchmark, intraday, benchIntraday, meta?.capital_events?.live_factor],
  );

  // Does the drawn curve actually end on the published cumulative return? On
  // most books it does to the last digit. Where it does not, the page says so
  // rather than showing two numbers a reader has to catch themselves. The
  // tolerance is a drawing tolerance (a tenth of a basis point), not a
  // statistical one — a disagreement smaller than the third decimal both
  // figures are printed to is not a disagreement a reader can see.
  const chartMismatch = useMemo(() => {
    if (cumulative === null || points.length === 0) return null;
    const chartEnd = points[points.length - 1]?.close ?? null;
    if (chartEnd === null) return null;
    return Math.abs(chartEnd - cumulative) > 1e-5
      ? { chartEnd, published: cumulative }
      : null;
  }, [points, cumulative]);

  // Does the published headline match the number in the last CHAINED record?
  // Same tolerance and same reasoning as the chart check above: a disagreement
  // below the last printed digit is not one a reader can see. Fails closed in
  // the honest direction — a missing chain, record or figure renders nothing
  // rather than an unearned "these agree".
  const snapshotMismatch = useMemo(() => {
    const chained = bundle.lastSnapshot?.cumulative_return;
    if (cumulative === null || chained === null || chained === undefined) {
      return null;
    }
    return Math.abs(chained - cumulative) > 1e-5
      ? { chained, published: cumulative }
      : null;
  }, [bundle.lastSnapshot, cumulative]);

  // Whether to draw an equity index is decided by the DATA, not by the book's
  // name. A book that publishes an empty `spy_cum` column is saying it has no
  // equity benchmark; drawing a flat line, or a legend that names one, would
  // put a comparison on the page the data explicitly refuses to make. It also
  // means the rule keeps working for the next such book without an edit here.
  const showEquityBenchmark = points.some((p) => p.spy !== null);
  const showCash = points.some((p) => p.cash !== null);
  // A MISSING INDEX COLUMN IS NOT A STRATEGY. A paper book whose first sessions
  // have no SPY data draws no index line too, and was being called
  // market-neutral for it. The word is used only where the book's own published
  // description says it is hedged against the market.
  const exposureStructure = (meta?.exposure ?? summary.exposure)?.structure ?? "";
  const marketNeutral = /market[\s-]neutral|delta[\s-]hedged/i.test(
    `${summary.tagline_en ?? ""} ${exposureStructure}`,
  );
  const roundTrips = meta?.round_trips ?? null;
  // Un book qui publie `exposure` n'a pas de holdings a publier -- c'est la
  // donnee qui decide de la section, pas une liste de noms de books dans la
  // page. « Que detient ce portefeuille » n'a pas de reponse ici : il tient une
  // position 93 minutes en mediane et passe l'essentiel de son temps a plat.
  const exposure = meta?.exposure ?? summary.exposure ?? null;
  // Whole days between the parent's inception and this book's. Null when
  // either date is missing or unparseable — an unstated caveat is better than
  // a wrong number, and the sentence simply does not render.
  const laterStart = (() => {
    const a = bundle.variantParentInception;
    const b = summary.inception;
    if (!a || !b) return null;
    const t0 = Date.parse(`${a}T00:00:00Z`);
    const t1 = Date.parse(`${b}T00:00:00Z`);
    if (!Number.isFinite(t0) || !Number.isFinite(t1)) return null;
    const days = Math.round((t1 - t0) / 86_400_000);
    return days > 0 ? days : null;
  })();

  // The market-data feed named in this book's own last chained record. A
  // string or nothing: an absent field is an absent field, and a book whose
  // fills were executed rather than simulated has no feed to disclose here.
  const rawFeed = bundle.lastSnapshot?.disclosure?.market_data_feed;
  const marketDataFeed = typeof rawFeed === "string" ? feedLabel(rawFeed) : rawFeed;

  // Material only. A healthy book leaves tens of dollars to rounding and mark
  // timing; a real divergence is orders of magnitude larger. The bar is a share
  // of the invested balance, so it means the same thing on a $1M book and a
  // $100k one.
  const reconciliationGap = (() => {
    const r = detail?.reconciliation;
    if (!r?.comparable) return null;
    const held = r.positions_market_value;
    const invested = r.account_invested;
    const gap = r.unreconciled_usd;
    if (held == null || invested == null || gap == null) return null;
    if (!Number.isFinite(invested) || invested <= 0) return null;
    if (Math.abs(gap) / invested < 0.01) return null;
    return { held, invested, gap, session: r.as_of_nav_session ?? null };
  })();

  const accountLabel = accountKindLabel(summary);
  const isPaper =
    (summary.account_kind ?? (summary.capital_at_risk ? "real_capital" : "paper")) ===
    "paper";
  // Jusqu'ou va la courbe, lu dans la donnee. « Pourquoi les trades de cette
  // nuit ne sont pas dessus ? » est une question d'etiquette absente, pas un
  // bug : le site trace des seances CLOSES. L'heure de cloture vient du book —
  // chacun ferme a la sienne, et une page qui en devine une se trompe sur tous
  // les autres.
  const sessionClose = meta?.session_close ?? summary.session_close ?? null;
  const lastSession = summary.last_session ?? last?.date ?? null;
  // Une position portee au-dela de la cloture repond a la MEME question que
  // l'etiquette ci-dessus — « pourquoi les trades de cette nuit n'y sont
  // pas ? ». Elle est divulguee, jamais marquee : son resultat paraitra au jour
  // ou elle se verrouillera, et le dire ici evite au lecteur de conclure que la
  // courbe a rate quelque chose.
  const openAtLast = meta?.open_at_close?.sessions_with_open_exposure?.find(
    (x) => x.session === lastSession,
  );

  // THE CONTENTS OF THIS PAGE, DERIVED FROM WHAT IT WILL ACTUALLY DRAW.
  // Four of the seven parts below are conditional on the payload — a book with
  // no daily grid, no round trips or no exposure block simply does not render
  // them — so a hardcoded row of six anchors would be a set of links into
  // nothing on exactly the books that publish least. Each entry is guarded by
  // the same expression that guards its section; when one moves, both move.
  // `exposure` and the composition block are mutually exclusive by
  // construction below, which is why they share one entry.
  const hasComposition =
    (summary.categories?.length ?? 0) > 0 ||
    (detail?.categories?.length ?? 0) > 0;
  const contents = [
    { id: "at-a-glance", label: "At a glance" },
    { id: "performance", label: "Performance" },
    daily.length > 0 ? { id: "daily", label: "Daily result" } : null,
    roundTrips ? { id: "round-trips", label: "Round trips" } : null,
    { id: "risk", label: "Risk" },
    exposure
      ? { id: "exposure", label: "Exposure" }
      : hasComposition
        ? { id: "holdings", label: "Holdings" }
        : null,
    { id: "evidence", label: "Evidence" },
  ].filter((part): part is { id: string; label: string } => part !== null);

  return (
    <>
      {/* Identity row — the account header of a ledger page. */}
      <header id="at-a-glance" className="mt-8 border-b hairline pb-6 scroll-mt-8">
        <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
          {summary.label}
        </h1>
        <p className="mt-1.5 text-body text-fg-muted">{taglineOf(summary)}</p>
        {/* Le badge est une DONNEE du book, jamais une phrase en dur : celle qui
            enumerait « 6 comptes papier et 1 reel » est devenue fausse le jour
            ou un second book en capital reel est arrive.

            Et le MEME traitement visuel pour les deux natures -- casse normale,
            pas de couleur d'alerte. Un bandeau rouge en capitales sur l'un des
            deux est du theatre la ou il faut de l'information : le lecteur qui a
            besoin de savoir a besoin de le LIRE, et crier sous-entend en plus un
            avertissement que le capital propre de l'operateur ne justifie pas.
            Seul le texte differe. */}
        <p className="mt-3 inline-block border hairline px-1.5 py-px text-caption leading-[1.6] text-fg-faint">
          {accountLabel}
        </p>
        {isPaper && bundle.paperRecordStart && (
          <p className="mt-2 text-small text-fg-muted">
            The paper portfolios&rsquo; published record begins on{" "}
            {date(bundle.paperRecordStart)}.
          </p>
        )}
        {/* A capital twin is not a fifth portfolio, and the relationship was
            visible only in the collapsed selector — inferred there from a name
            suffix. Stated here, so a reader landing on the twin's own page
            knows what they are looking at. */}
        {bundle.variantParentLabel && (
          <p className="mt-2 text-small text-fg-muted">
            Capital twin of {bundle.variantParentLabel}, funded with{" "}
            {money(summary.initial_capital, currency, 0)} and run with the same
            strategies and weights to measure the effect of account size.
            {laterStart !== null
              ? ` It was funded ${laterStart} day${laterStart === 1 ? "" : "s"} later, so it covers a shorter period.`
              : ""}
          </p>
        )}

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          {/* The LIVE reading leads WHEN IT IS ACTUALLY LIVE, because "what is
              this account worth" is the question a reader is asking, and
              answering it with the previous close while the curve below draws
              today put two clocks on one screen — the broker said +4,992 and the
              page said +4,641. The marked figure is not dropped: it is the
              chained evidence, and it sits underneath, dated.

              A reading the publisher could not refresh is a different thing
              entirely, and `liveIsFresh` demotes it: the chained figure leads
              and the old reading is shown below it with its date. Labelling a
              five-day-old number "live" was the worst of both. */}
          {/* The balance and the return answer two different questions, and
              beside each other without a word they read as a contradiction: an
              account opened at $1,000,000, now worth $980,657, above a line
              saying "+1.07% since inception". Both are right. A capital
              movement that is not a trade is excluded from the RETURN and kept
              in the BALANCE, which is the whole point of the treatment, and the
              gap between the two numbers is exactly that movement. It has to be
              said where the gap is visible, not only in the note under the
              chart. */}
          <Field
            label="Net asset value"
            value={money(live?.equity ?? last?.equity, currency, 2)}
            note={
              <>
                {/* "LIVE" IS RESERVED FOR REAL CAPITAL SITE-WIDE. This caption
                    sat over a paper account's NAV, where "live" is the word a
                    reader uses for money at risk — and six of the seven books
                    it renders on have none. What the caption is actually saying
                    is that the figure is the most recent reading rather than
                    the after-close mark, which is what it now says. */}
                {live
                  ? `latest reading · ${marketTime(live.at, zone)}`
                  : `marked ${date(last?.date)}`}
                {capitalFlow ? (
                  <span className="block">
                    {capitalEventCount > 1
                      ? `net ${money(capitalFlow, currency, 0)} across ${capitalEventCount} capital movements, excluded from the return`
                      : `after ${money(Math.abs(capitalFlow), currency, Math.abs(capitalFlow) < 100 ? 2 : 0)} ${capitalFlow < 0 ? "withdrawn from" : "added to"} the account, excluded from the return`}
                  </span>
                ) : null}
              </>
            }
          />
          <Field
            label="Since inception"
            value={signedPct(live?.cumulative_return ?? cumulative, 3)}
            sign={live?.cumulative_return ?? cumulative}
            note={
              live && cumulative !== null
                ? `${signedPct(cumulative, 3)} at the ${date(summary.last_session)} close`
                : undefined
            }
          />
          <Field
            label="Last session"
            value={signedPct(last?.daily_return, 3)}
            sign={last?.daily_return ?? null}
            note={date(last?.date)}
          />
          <Field
            label="Opened"
            value={date(summary.inception)}
            note={
              /* "17 sessions" and the gate's "16 of 60" are two different
                 counts sharing one word. The chain has 17 entries; 16 of them
                 carry a measured return, because the first is the funding
                 anchor. Both are published, so both are named. */
              observations !== null
                ? `${observations} marked session${observations === 1 ? "" : "s"} · ${money(summary.initial_capital, currency, 0)} funded`
                : `${money(summary.initial_capital, currency, 0)} funded`
            }
          />
        </dl>

        {/* The live block publishes what it is, and the page used to throw both
            fields away. `source` says in the desk's own words that the reading
            is not chained evidence; `marked: false` says it is not an
            after-close mark. Neither reached the reader. */}
        {/* A CURRENT reading is labelled as one. An old reading is not shown at
            all: the marked figures lead, and a book that has genuinely stopped
            publishing is flagged under its chart. The previous branch printed a
            warning with a second return on every paper book each weekend,
            because a Friday reading is "older than the publish" by Sunday. */}
        {live && (
          <p className="mt-5 text-caption text-fg-faint leading-relaxed">
            Latest broker reading, {marketTime(live.at, zone)}
            {live.marked ? "" : "; not yet marked"}.
          </p>
        )}
      </header>

      {/* ─── WHAT IS ON THIS PAGE, AND IN WHAT ORDER ──────────────────────
          NOTHING IS HIDDEN AND NOTHING IS MOVED. The page carries the whole
          record — the curve, the daily grid, every statistic the desk
          publishes, the exposure, the holdings and the chained evidence — and
          that volume is the firm's strongest asset, not a problem to be
          solved by a "show more" control.

          What it did not have was a SHAPE. An investor reading the first
          screen and a quant looking for the drawdown table were given the
          same undifferentiated scroll, and neither could tell how far in the
          thing they wanted was. Six anchors cost nothing, remove nothing, and
          turn one long page into a document with parts: executive reading,
          analytical reading, forensic reading, same data.

          Rendered as ordinary links to ordinary ids: no JavaScript, no
          accordion, and every one of them citable. A reader can send someone
          else straight to this book's risk table. */}
      <nav
        aria-label="Sections of this portfolio"
        className="mt-6 -mx-5 sm:mx-0 px-5 sm:px-0 scroll-x"
      >
        <ul className="flex min-w-max items-baseline gap-x-6 gap-y-2 text-small">
          <li className="text-fg-faint">On this page</li>
          {contents.map((part) => (
            <li key={part.id}>
              <a href={`#${part.id}`} className="text-accent hover:underline">
                {part.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* THE GATE, FROM THE BOOK'S OWN PAYLOAD.
          Both numbers used to be wrong in the same direction: the threshold was
          the index-wide one rather than this book's, and the list of withheld
          names was a hardcoded sentence that drifted from
          `insufficient_history.suppressed`. And when `metrics.json` failed to
          fetch, the whole banner vanished while the charts kept rendering — a
          withholding notice that disappears on a fetch error is not a gate. It
          fails closed now: no payload, no statistics, and the page says why. */}
      {/* THE RULE, STATED ONCE, IN THE PAGE'S OWN VOICE. The ledger below marks
          each annualised row with a dash rather than repeating the rule on every
          row. */}
      {metrics === null ? (
        <Note tone="warn" className="mt-8">
          The statistics for this portfolio could not be loaded. The equity curve
          below is read from a separate file and is unaffected.
        </Note>
      ) : gate ? (
        <p className="mt-8 border-t hairline pt-5 text-body text-fg-muted">
          Annualised statistics, such as the Sharpe ratio, volatility and annual
          return, are published once an account has{" "}
          {gate.gates && gate.gates.length > 1
            ? gate.gates.map((g) => `${g.need} ${g.unit}`).join(" and ")
            : `${gate.need} ${gateUnit}`}
          ; this one has {observations ?? gate.have}{" "}
          {countUnit(
            observations ?? gate.have,
            gate.gates && gate.gates.length > 1 ? "marked sessions" : gateUnit,
          )}
          .
          Cumulative return, daily returns and the drawdown path are shown in
          full below.
          {unrenderedSuppressed.length > 0
            ? ` Also published from then: ${unrenderedSuppressed.join(", ")}.`
            : ""}
        </p>
      ) : null}

      <Section
        id="performance"
        title="Performance"
        first
        note={
          <>
            {granular ? (
              <>
                {/* The count is the one DRAWN, not the one in the metadata. The
                    two disagree on four books, and printing the metadata figure
                    beside a chart holding a different number of points is a
                    caption about a chart that is not there. Where they differ,
                    both are named — the divergence is a signal, not something to
                    reconcile away. */}
                {/* THE RESOLUTION IS THE BOOK'S OWN. "5-minute resolution" was
                    hardcoded and printed on the real-capital book, which reads
                    its equity once per round trip and at each close — 30
                    readings over two days. */}
                Account equity from {points.length} broker reading
                {points.length === 1 ? "" : "s"}
                {meta?.intraday_resolution && !/5.?min/i.test(meta.intraday_resolution)
                  ? ` (${prose(meta.intraday_resolution)})`
                  : " at 5-minute resolution"}
                {typeof meta?.intraday_points === "number" &&
                meta.intraday_points !== points.length
                  ? `; the published metadata counts ${meta.intraday_points}`
                  : ""}
                . Dots mark each session&rsquo;s official closing value.
              </>
            ) : (
              <>
                One point per session, joined by straight lines. A daily net asset
                value has no intraday path we measured.
              </>
            )}{" "}
            {showEquityBenchmark ? (
              <>
                The S&amp;P 500 is shown for context.{" "}
                {granular ? (
                  <>
                    {/* NAME THE ANCHOR. The index line is measured from SPY's
                        level when this account was funded — the same moment its
                        own curve starts from — so every account funded on the
                        same day draws the same line, and a twin funded later
                        draws its own. */}
                    The index line is SPY&rsquo;s 5-minute price, measured from
                    its level when this account was funded
                    {summary.inception ? `, ${date(summary.inception)}` : ""}.
                    Dividends are not applied intraday, so it ends a few basis
                    points from the daily total-return series.
                  </>
                ) : (
                  <>
                    The index line is SPY total return, split- and
                    dividend-adjusted, on the same dates.
                  </>
                )}
              </>
            ) : (
              <>
                {/* Deliberately NOT "cash at the risk-free rate". This book
                    publishes every calendar day, and its cash line is accrued on
                    a different grid from the trading-day books' — so the drawn
                    line and the annual rate printed in the ledger are not the
                    same statement, and the page must not weld them together.
                    The rate is named as what it is: a published field. */}
                {showCash
                  ? marketNeutral
                    ? "The comparison line is cash, accrued on this account’s own calendar; an equity index is not a like-for-like comparison for a market-neutral portfolio."
                    : "The comparison line is cash, accrued on this account’s own calendar."
                  : null}
              </>
            )}
            {rejectedLabels.length ? (
              <>
                {" "}
                {rejectedLabels.length} session
                {rejectedLabels.length === 1 ? " is" : "s are"} excluded from the
                intraday line because the broker feed contradicted the published
                closing value: {rejectedLabels.join("; ")}.
                {rejectedDrawnCount > 0 ? (
                  <>
                    {" "}
                    Those readings are still present in the published{" "}
                    <code>intraday.csv</code> ({rejectedDrawnCount} row
                    {rejectedDrawnCount === 1 ? "" : "s"}); this page withholds
                    them rather than drawing a session the desk has declared
                    impossible.
                  </>
                ) : null}
              </>
            ) : null}
          </>
        }
      >
        <div className="flex justify-end mb-4">
          <ChartLegend
            showEquityBenchmark={showEquityBenchmark}
            granular={granular}
          />
        </div>
        <PerformanceChart
          data={points}
          granular={granular}
          showEquityBenchmark={showEquityBenchmark}
          zone={zone}
        />
        {/* THE CURVE AND THE HEADLINE MUST NOT DISAGREE IN SILENCE.
            The curve is a rebase of the published NAV column onto its own first
            row. On a book funded intraday, that first row is not the denominator
            of the first session's return — the desk measures it against an
            opening balance nav.csv does not carry — so the curve's last point
            sits below the published cumulative return by exactly that session.
            Nothing here invents the missing base; the two published figures are
            named, and the ledger's is the one that counts. */}
        {chartMismatch && (
          <p className="mt-4 text-small text-fg-faint leading-relaxed">
            <span className="text-warn-fg">
              This curve does not end on the published cumulative return.
            </span>{" "}
            It is a rebase of the <code>equity</code> column on its first
            published row and ends at {signedPct(chartMismatch.chartEnd, 3)},
            while the figure published in the ledger is{" "}
            {signedPct(chartMismatch.published, 3)}.
            {meta?.opening_capital !== undefined ? (
              <>
                {" "}
                The difference is the inception session, whose return this book
                measures against its opening balance of{" "}
                {money(meta.opening_capital, currency, 2)}. This book&rsquo;s{" "}
                <code>nav.csv</code> does not carry that number, so the rebase
                cannot reproduce it.
                {/* "The desk states why:" was answered by a NOUN PHRASE — the
                    published note begins "the equity at the OPEN of the
                    inception session", which is a thing, not a reason — so the
                    sentence never landed. The lead-in now frames the note as
                    the apposition it actually is, and `prose` fixes the ASCII
                    double hyphens inside it. */}
                {meta.opening_capital_note
                  ? ` That balance is the desk's own: ${prose(meta.opening_capital_note)}.`
                  : ""}
              </>
            ) : null}{" "}
            The published figure is the one in the ledger; the curve&rsquo;s
            shape is unaffected.
          </p>
        )}

        {/* IS THE HEADLINE THE NUMBER IN THE CHAINED RECORD? The page used to
            assert that it was, in the sentence just above, with nothing on the
            page able to check. On a book whose final session was corrected
            after it was chained, it is not: the record carries the figure as
            published that day, and the ledger carries the corrected one. That
            is the right treatment — a write-once record is not rewritten
            because a later correction would look tidier — but it has to be
            SAID, because a reader who does the check the verify page invites
            them to do will otherwise find the discrepancy alone.

            Read from the chain's own entry for the last session, so nothing
            here is a guess about where a record lives, and the block simply
            does not render when the chain, the record or either figure is
            missing. */}
        {snapshotMismatch && (
          <p className="mt-4 text-small text-fg-faint leading-relaxed">
            <span className="text-warn-fg">
              The headline above is not the figure in this book&rsquo;s final
              chained record.
            </span>{" "}
            The record for the {date(bundle.lastSnapshotSession)} session was
            written and hashed with a cumulative return of{" "}
            {signedPct(snapshotMismatch.chained, 4)}; the ledger and this
            page&rsquo;s header publish {signedPct(snapshotMismatch.published, 4)}
            , which is the corrected figure. Chained records are never amended,
            so both numbers are published: the chained one in{" "}
            <code>snapshots/</code>, the corrected one in{" "}
            <code>metrics.json</code>.
          </p>
        )}
        {lastSession && (
          <p className="mt-4 text-small text-fg-muted">
            Last point: session of{" "}
            {date(lastSession)}
            {sessionClose ? ` (close ${sessionClose.label})` : ""}.{" "}
            {/* "Next point at the next close" is a promise, and it was being
                made on a book that had published nothing for five days. Where
                the book is behind the record's own publish, the page says the
                record stops there instead — and nothing is carried forward to
                fill the gap. */}
            {bookBehind ? (
              <span className="text-warn-fg">
                This portfolio has published no session since then, while the
                rest of the record has moved on
                {summary.record_last_session
                  ? ` (to ${date(summary.record_last_session)})`
                  : ""}
                .{" "}
                {/* The publisher's OWN staleness verdict, printed where it is
                    about. The site derived a near-identical judgement from
                    publish timestamps and never rendered the published field
                    beside it; when the two agree the reader should see the
                    declared one, not only our inference from a clock. */}
                {summary.stale && summary.stale_since
                  ? `The publisher marks this book stale since ${date(summary.stale_since)}. `
                  : ""}
                The curve stops where the record stops: no value is carried
                forward and no session is estimated.
              </span>
            ) : (
              "Next point at the next close."
            )}
            {openAtLast ? (
              <span className="block text-caption text-fg-faint mt-1">
                A position was still open at this close
                {openAtLast.tickets === 1
                  ? " (1 ticket"
                  : ` (${openAtLast.tickets} tickets`}
                , net {openAtLast.net_volume > 0 ? "+" : ""}
                {openAtLast.net_volume}); its result appears on the session it
                closes.
              </span>
            ) : null}
          </p>
        )}

        {/* Each declared movement, one row: what it was, read from the
            published kind and evidence fields, and a link to the chained
            snapshot that carries the full evidence. */}
        {capitalEvents.length ? (
          <div className="mt-6">
            <h3 className="text-small font-semibold tracking-tight">
              Capital movements excluded from the return
            </h3>
            <div className="scroll-x mt-3">
              <table className="w-full sm:min-w-[520px] text-small">
                <thead>
                  <tr className="border-b hairline text-left text-caption text-fg-faint">
                    <th className="pb-2 pr-4 font-normal">Date</th>
                    <th className="pb-2 pr-4 font-normal">Movement</th>
                    <th className="pb-2 pr-4 text-right font-normal">Amount</th>
                    <th className="pb-2 text-right font-normal">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {capitalEvents.map((e) => (
                    <tr key={e.date} className="border-b hairline">
                      <td className="py-2.5 pr-4 tnum whitespace-nowrap">
                        {date(e.date)}
                      </td>
                      <td className="py-2.5 pr-4 text-fg-muted">
                        {describeMovement(e)}
                      </td>
                      <td className="py-2.5 pr-4 text-right tnum whitespace-nowrap">
                        {money(e.amount_usd, currency, 2)}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <a
                          className="text-accent hover:underline"
                          href={`${DATA_REPO_URL}/blob/main/books/${summary.book}/snapshots/${e.date}.json`}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          Snapshot
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-caption text-fg-muted">
              Raw broker equity stays in <code>nav.csv</code> beside each
              adjustment.
            </p>
          </div>
        ) : null}
      </Section>

      {daily.length > 0 && (
        <Section
          id="daily"
          title="Daily and cumulative result"
          note={
            <>
              {/* The calendar rule is the book's own and is set out in its
                  methodology note (linked under Account); this caption states
                  only what holds for any such book. */}
              The combined result of both legs, in {currency}, one row per day of
              this account&rsquo;s own calendar
              {sessionClose ? ` (day ends ${sessionClose.label})` : ""}. The
              percentage view is the running total against the capital at
              inception
              {meta?.initial_capital
                ? ` (${money(meta.initial_capital, currency, 2)})`
                : ""}
              , not the compounded return above.
            </>
          }
        >
          <DailyPnlChart data={daily} currency={currency} />
        </Section>
      )}

      {roundTrips && (
        <Section
          id="round-trips"
          title="Round trips"
          note={
            <>
              {/* "NOTHING HERE IS A RATIO THAT NEEDS A DISTRIBUTION" sat
                  directly above a hit rate of 100% on six observations, which
                  is exactly such a ratio — and the strongest-looking number on
                  the page. The sentence was the licence the panel used to
                  publish it under the same gate that withholds a Sharpe. The
                  claim is dropped, and the hit rate is shown as the count it
                  honestly is. */}
              A round trip is a position opened and closed, with both legs
              combined.
            </>
          }
        >
          <RoundTripStats rt={roundTrips} />
        </Section>
      )}

      <Section
        id="risk"
        title="Risk and statistics"
        note={
          <>
            Computed by the firm&rsquo;s metrics module and published as data.
            {gate ? (
              " Annualised figures are added here once they are published."
            ) : (
              <>
                {" "}Sharpe, Sortino and Calmar are measured in excess of the
                3-month Treasury yield
                {metrics
                  ? ` (${pct(metrics.risk_free_annual)}, ${metrics.risk_free_source})`
                  : ""}
                .
              </>
            )}
          </>
        }
      >
        {metrics === null ? (
          <p className="text-small text-fg-muted">
            The statistics ledger could not be loaded from the data repository.
            Nothing is shown here rather than a partial ledger with no way to
            tell a withheld figure from an absent one.
          </p>
        ) : (
          <StatisticsLedger
            metrics={metrics}
            analytics={analytics}
            currency={currency}
            nav={last?.equity ?? null}
          />
        )}
        {/* One denominator per book. The chart frames used to read their own
            session count out of analytics.json, which disagrees with
            metrics.json by one on a book whose analytics window drops the
            inception return — so a page showed "16 observations" in the ledger
            and "withheld · 15/60" in the frame beside it. */}
        <AnalyticsCharts
          analytics={analytics}
          gate={gate ? { have: gate.have, need: gate.need, unit: gateUnit } : null}
          observations={observations}
          headline={cumulative}
        />
      </Section>

      {exposure ? (
        <Section
          id="exposure"
          title="Exposure"
          note={
            <>
              Published data, computed by the desk. The instrument, venues and
              position size are not published.
            </>
          }
        >
          <ExposureSection exposure={exposure} />
        </Section>
      ) : (summary.categories?.length ?? 0) > 0 ||
        (detail?.categories?.length ?? 0) > 0 ? (
      <Section
        id="holdings"
        title="Composition and holdings"
        note={
          <>
            Positions are grouped by the category of strategy holding them;
            individual strategies are not named. Each position shows its
            quantity, cost basis and mark. Profit and loss by category is an
            attribution model, while the account equity above is read from the
            broker.
          </>
        }
      >
        {summary.categories?.length > 0 && (
          <div className="scroll-x mb-9">
            <table className="w-full sm:min-w-[420px] max-w-[600px] text-small">
              <thead>
                <tr className="text-caption text-fg-faint">
                  <th className="text-left font-normal pb-2">Category</th>
                  <th className="text-right font-normal pb-2">Strategies</th>
                  <th className="text-right font-normal pb-2">Target weight</th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((c) => (
                  <tr key={c.category} className="border-t hairline">
                    <td className="py-2">
                      {c.label}
                      <span className="ml-2 text-label text-fg-faint">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-2 text-right tnum text-fg-muted">
                      {c.strategies}
                    </td>
                    <td className="py-2 text-right tnum">{pct(c.weight, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
          <h3 className="text-small font-semibold tracking-tight">
            Open positions
          </h3>
          {/* A DETAIL FILE IS KEYED BY THE CYCLE, NOT BY THE DAY IT WAS HELD.
              The desk stages a plan after one session's close and executes it at
              the next open, so these positions were held from that next open —
              labelling them "as at <cycle date>" dated them a session early on
              every book. `positions_as_of` is rendered when the publisher emits
              it; without it the label says which cycle staged them instead of
              asserting a date the file does not carry. */}
          {detail && (
            <span className="text-small text-fg-faint">
              {detail.positions_as_of
                ? `as at ${date(detail.positions_as_of)}`
                : `from the cycle staged ${date(detail.session_date)}, held from the following open`}
            </span>
          )}
        </div>
        <HoldingsTable groups={detail?.categories ?? []} currency={currency} />
        {/* DOES THIS TABLE ADD UP TO THE ACCOUNT IT DESCRIBES?
            The publisher answers that and the page was not asking. A book whose
            position records disagree with the broker's invested balance shows a
            complete, internally consistent, WRONG table — which is precisely
            the shape of thing this record exists to make impossible.

            Only material gaps are surfaced. Rounding and mark timing leave a
            few tens of dollars on a healthy book; a real divergence is a
            different order of magnitude, so the bar is a share of the invested
            balance rather than a flat number that would mean different things
            on a $1M book and a $100k one. Below the bar there is nothing worth
            a reader's attention; above it, the number is theirs to see. */}
        {reconciliationGap && (
          <p className="mt-4 text-small leading-relaxed text-fg-faint">
            <span className="text-warn-fg">
              These holdings do not reconcile with the account.
            </span>{" "}
            The categories above total{" "}
            <span className="tnum">
              {money(reconciliationGap.held, currency)}
            </span>{" "}
            at market, while the broker reports{" "}
            <span className="tnum">
              {money(reconciliationGap.invested, currency)}
            </span>{" "}
            invested on {date(reconciliationGap.session)}. The difference is{" "}
            <span className="tnum text-fg">
              {money(reconciliationGap.gap, currency)}
            </span>
            . The account value and every return on this page are read from the
            broker and are unaffected; the difference is in the position record.
          </p>
        )}
      </Section>
      ) : null}

      <Section id="evidence" title="Account and evidence">
        <dl className="grid sm:grid-cols-2 gap-x-14 gap-y-3 text-small">
          <Line label="Type">{accountLabel}</Line>
          <Line label="Reference">
            <span className="tnum">
              {summary.account_number ?? summary.account_ref ?? "—"}
            </span>
          </Line>
          <Line label="Currency">{currency}</Line>
          {/* A book with no intraday file is not a "daily" book by default —
              one of them publishes "per closed round trip". The published
              resolution string is used whenever there is one; the literal is the
              last resort, not the first branch. */}
          <Line label="Equity resolution">
            {typeof meta?.intraday_points === "number" && meta.intraday_points > 0
              ? `${meta.intraday_resolution} · ${meta.intraday_points} reading${meta.intraday_points === 1 ? "" : "s"}`
              : (meta?.intraday_resolution ?? "daily")}
          </Line>
          <Line label="Record">
            <span className="tnum">
              {summary.sessions} chained snapshot{summary.sessions === 1 ? "" : "s"}
            </span>
          </Line>
          {/* THE FEED BEHIND THE FILLS. It is stamped into every snapshot's
              disclosure block and reaches no other published file — not the
              index's disclosure list, not meta.json — so it was true, evidenced,
              and invisible. On a paper book it is the single most material
              caveat there is: a simulated fill is only as good as the tape it
              was simulated against. Disclosing it strengthens the record. */}
          {typeof marketDataFeed === "string" ? (
            <Line label="Market data">{marketDataFeed}</Line>
          ) : null}
          {/* `|| "—"` CONFLATED A ZERO WITH AN ABSENCE. The sum of a table's
              own rows is a drawing operation the doctrine allows, but a
              falsy-test on the result does not distinguish "no category list
              was published" from "the categories published sum to nothing" —
              and the second is a fact, printed here as a missing value. The
              list's presence decides whether there is anything to say; the
              total is then printed whatever it comes to. */}
          {/* NAMED AS A SUM. Every other value in this list is a published
              scalar; this one is added up here, from a table that sits in the
              PREVIOUS section, so under a bare label it reads as a published
              field. /portfolios prints the same total and names it a sum twice.
              Grouped, like every other count on the site. */}
          {summary.categories && summary.categories.length > 0 ? (
            <Line label="Strategies">
              <span className="tnum">
                {summary.categories
                  .reduce((s, c) => s + c.strategies, 0)
                  .toLocaleString("en-US")}
              </span>
            </Line>
          ) : null}
          {summary.paths?.methodology ? (
            <Line label="Methodology">
              <a
                className="text-accent hover:underline"
                href={`${DATA_REPO_URL}/blob/main/${summary.paths.methodology}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Methodology note
              </a>
            </Line>
          ) : null}
        </dl>

        {/* WHEN THESE RECORDS JOINED THE CHAIN. A book whose earlier sessions
            were written in one later batch has a genesis entry dated after its
            record begins — which, found unaided in the verify table, is the
            single most damaging inference a sceptic can draw about a hash
            chain. It costs nothing to pre-empt, because the chain's own
            Recorded column already says it entry by entry. Stated here, on the
            book it is about, as well as on the verify page where the restart is
            declared. Counted from the chain, never asserted. */}
        {bundle.chain && bundle.chain.backfilled > 0 && (
          <p className="mt-6 text-small text-fg-faint leading-relaxed">
            {bundle.chain.backfilled} of this portfolio&rsquo;s{" "}
            {bundle.chain.records} chained records were added to the chain
            {bundle.chain.recordedOn
              ? ` on ${date(bundle.chain.recordedOn)}`
              : " later"}
            , after the sessions they describe. Each entry in{" "}
            <a
              className="text-accent hover:underline"
              href={`${DATA_REPO_URL}/blob/main/CHAIN.jsonl`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <code>CHAIN.jsonl</code>
            </a>{" "}
            records both dates.
          </p>
        )}
      </Section>
    </>
  );
}

function Field({
  label,
  value,
  note,
  sign,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  sign?: number | null;
}) {
  const colour =
    sign === undefined || sign === null
      ? ""
      : sign > 0
        ? "text-up"
        : sign < 0
          ? "text-down"
          : "";
  return (
    <div>
      <dt className="text-caption text-fg-faint">{label}</dt>
      <dd className={`mt-1 text-subhead tnum tracking-tight ${colour}`}>{value}</dd>
      {note && <div className="text-caption text-fg-faint mt-0.5">{note}</div>}
    </div>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b hairline pb-2.5">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export function BookPage({
  bundle,
  options,
  publishedAt,
}: {
  bundle: BookBundle;
  options: PortfolioOption[];
  publishedAt: string | undefined;
}) {
  return (
    <>
      <PortfolioSelect options={options} value={bundle.summary.book} />
      <BookView bundle={bundle} publishedAt={publishedAt} />
    </>
  );
}
