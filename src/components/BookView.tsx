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
} from "@/lib/data";
import { DATA_REPO_URL } from "@/lib/data";
import { date, marketTime, money, pct, sessionZone, signedPct } from "@/lib/format";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { ChartLegend, PerformanceChart, type ChartPoint } from "./PerformanceChart";
import { DailyPnlChart } from "./DailyPnlChart";
import { ExposureSection } from "./ExposureSection";
import { HoldingsTable } from "./HoldingsTable";
import { Note } from "./Note";
import { RoundTripStats } from "./RoundTripStats";
import { Section } from "./Section";
import { PortfolioSelect, type PortfolioOption } from "./PortfolioSelect";
import { StatisticsLedger } from "./StatisticsLedger";

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
  /** The parent book of a capital twin, when both are published. Resolved by
   *  the page from the index so the header can say what the selector already
   *  knows. */
  variantParentLabel?: string | null;
  variantSize?: string | null;
  /** The parent's inception. The twins were funded later than the books they
   *  copy, so the pair differs in measurement window as well as in capital. */
  variantParentInception?: string | null;
};

/** How far behind the publish a broker reading may be and still be called
 *  "live". One session plus slack: a reading refreshed on the publishing run is
 *  hours old, and anything the publisher could not refresh is not a live
 *  reading whatever the field is named. */
const LIVE_MAX_AGE_HOURS = 36;

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

  if (intraday.length === 0) {
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
  const capitalFlow = meta?.capital_events?.cumulative_flow_usd ?? 0;
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

  // Whether to draw an equity index is decided by the DATA, not by the book's
  // name. A book that publishes an empty `spy_cum` column is saying it has no
  // equity benchmark; drawing a flat line, or a legend that names one, would
  // put a comparison on the page the data explicitly refuses to make. It also
  // means the rule keeps working for the next such book without an edit here.
  const showEquityBenchmark = points.some((p) => p.spy !== null);
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

  const accountLabel =
    meta?.account_kind_label ??
    summary.account_kind_label ??
    (summary.capital_at_risk
      ? "Real capital (live test)"
      : "Paper (broker-simulated)");
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

  return (
    <>
      {/* Identity row — the account header of a ledger page. */}
      <header className="mt-8 border-b hairline pb-6">
        <h1 className="text-[26px] sm:text-[30px] font-semibold tracking-tight leading-tight">
          {summary.label}
        </h1>
        <p className="mt-1.5 text-[14px] text-fg-muted">{summary.tagline_en}</p>
        {/* Le badge est une DONNEE du book, jamais une phrase en dur : celle qui
            enumerait « 6 comptes papier et 1 reel » est devenue fausse le jour
            ou un second book en capital reel est arrive.

            Et le MEME traitement visuel pour les deux natures -- casse normale,
            pas de couleur d'alerte. Un bandeau rouge en capitales sur l'un des
            deux est du theatre la ou il faut de l'information : le lecteur qui a
            besoin de savoir a besoin de le LIRE, et crier sous-entend en plus un
            avertissement que le capital propre de l'operateur ne justifie pas.
            Seul le texte differe. */}
        <p className="mt-3 inline-block border hairline px-1.5 py-px text-[11px] leading-[1.6] text-fg-faint">
          {accountLabel}
        </p>
        {/* A capital twin is not a fifth portfolio, and the relationship was
            visible only in the collapsed selector — inferred there from a name
            suffix. Stated here, so a reader landing on the twin's own page
            knows what they are looking at. */}
        {bundle.variantParentLabel && (
          <p className="mt-2 text-[12px] text-fg-faint">
            Capital variant
            {bundle.variantSize ? ` (${bundle.variantSize})` : ""} of{" "}
            <span className="text-fg-muted">{bundle.variantParentLabel}</span> —
            the pair is published to measure capital sensitivity, and both
            books&rsquo; target weights are published in the index.
            {laterStart !== null && (
              <>
                {" "}
                <span className="text-fg-muted">
                  It is not a single-variable experiment:
                </span>{" "}
                this book was funded {laterStart} day
                {laterStart === 1 ? "" : "s"} after{" "}
                {bundle.variantParentLabel}, so it covers a shorter window and
                any gap between the two mixes account size with a different
                measurement period. Compare the shapes, not the headline
                difference.
              </>
            )}
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
                {live
                  ? `live · ${marketTime(live.at, zone)}`
                  : `marked ${date(last?.date)}`}
                {capitalFlow ? (
                  <span className="block">
                    {capitalEventCount > 1
                      ? `net ${money(capitalFlow, currency, 0)} across ${capitalEventCount} capital movements, excluded from the return`
                      : `after ${money(capitalFlow, currency, 0)} ${capitalFlow < 0 ? "removed from" : "added to"} the account, excluded from the return`}
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
              observations !== null && observations !== summary.sessions
                ? `${summary.sessions} snapshots · ${observations} marked sessions · ${money(summary.initial_capital, currency, 0)}`
                : `${summary.sessions} sessions · ${money(summary.initial_capital, currency, 0)}`
            }
          />
        </dl>

        {/* The live block publishes what it is, and the page used to throw both
            fields away. `source` says in the desk's own words that the reading
            is not chained evidence; `marked: false` says it is not an
            after-close mark. Neither reached the reader. */}
        {rawLive && (
          <p className="mt-5 text-[11.5px] text-fg-faint max-w-[80ch] leading-relaxed">
            {live ? (
              <>
                Latest broker reading, {marketTime(rawLive.at, zone)}
                {rawLive.marked ? "" : ", not an after-close mark"}
                {rawLive.source ? ` — ${rawLive.source}` : ""}.
              </>
            ) : (
              <>
                <span className="text-warn-fg">
                  The last broker reading for this book is dated{" "}
                  {marketTime(rawLive.at, zone)}, before the data on this page
                  was published
                  {summary.last_session
                    ? `, and its last marked session is ${date(summary.last_session)}`
                    : ""}
                  .
                </span>{" "}
                It is not labelled live and does not lead the figures above:
                those are the marked, chained ones. The reading itself was{" "}
                {signedPct(rawLive.cumulative_return, 3)} on equity of{" "}
                {money(rawLive.equity, currency, 2)}
                {rawLive.source ? ` — ${rawLive.source}` : ""}.
              </>
            )}
          </p>
        )}
      </header>

      {/* THE GATE, FROM THE BOOK'S OWN PAYLOAD.
          Both numbers used to be wrong in the same direction: the threshold was
          the index-wide one rather than this book's, and the list of withheld
          names was a hardcoded sentence that drifted from
          `insufficient_history.suppressed`. And when `metrics.json` failed to
          fetch, the whole banner vanished while the charts kept rendering — a
          withholding notice that disappears on a fetch error is not a gate. It
          fails closed now: no payload, no statistics, and the page says why. */}
      {metrics === null ? (
        <Note tone="warn" className="mt-8">
          <strong className="font-semibold">
            The statistics for this portfolio could not be loaded.
          </strong>{" "}
          They are withheld rather than shown partially: the file that says which
          figures this book is allowed to publish is the same file the figures
          come from, and without it neither can be trusted. The equity curve
          below is read from a separate file and is unaffected.
        </Note>
      ) : gate ? (
        <Note tone="warn" className="mt-8">
          <strong className="font-semibold">
            Annualised statistics are withheld — {gate.have} of {gate.need}{" "}
            {gateUnit}.
          </strong>{" "}
          {gate.suppressed?.length
            ? `${gate.suppressed.length} figures stay withheld until this account has ${gate.need} ${gateUnit}; each keeps its row in the ledger and names itself.`
            : `Annualised figures stay withheld until this account has ${gate.need} ${gateUnit}.`}{" "}
          On a handful of sessions they are not imprecise, they are meaningless.
          What actually happened is not gated and is published below: every daily
          return, and the realised drawdown path with its episodes. The ledger
          row named &ldquo;Maximum drawdown&rdquo; is the single gated field from{" "}
          <code>metrics.json</code>, not a second definition of that path.
          {roundTrips && gate.unit !== "round_trips" ? (
            <>
              {" "}
              This book also publishes its own, stricter bar: it counts in round
              trips rather than sessions, and stands at{" "}
              {roundTrips.round_trips} of{" "}
              {roundTrips.round_trips_needed_for_annualising}. Both are unmet;
              neither releases anything on its own.
            </>
          ) : null}
        </Note>
      ) : null}

      <Section
        title="Cumulative return"
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
                Broker account equity at 5-minute resolution — {points.length}{" "}
                readings, not interpolation
                {typeof meta?.intraday_points === "number" &&
                meta.intraday_points !== points.length
                  ? `; the published metadata counts ${meta.intraday_points}`
                  : ""}
                . Dots are the official session NAV, read at the desk&rsquo;s
                after-close mark; it sits a few basis points from the
                broker&rsquo;s closing intraday figure and neither is adjusted
                onto the other.
              </>
            ) : (
              <>
                One point per session, joined by straight lines. A daily net asset
                value has no intraday path we measured.
              </>
            )}{" "}
            {showEquityBenchmark ? (
              <>
                These accounts hold shorts and are not index-like: the benchmark
                is context, not a comparison.{" "}
                {granular ? (
                  <>
                    The index line here is a 5-minute <em>price</em> path —
                    dividends are not applied intraday and it is rebased on its
                    own first published bar, so it will not end where the daily
                    total-return series in <code>benchmark.csv</code> ends.
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
                The only comparator drawn is the cash line this book publishes.
                Its accrual grid is this book&rsquo;s own calendar, not the
                trading-day grid the paper desk uses, and the rule is stated in
                this book&rsquo;s own methodology note — read the line against
                that note rather than against the annual risk-free rate published
                beside it
                {metrics ? ` (${pct(metrics.risk_free_annual)})` : ""}, which is
                a separate published field. An equity index is not the
                opportunity cost of a book that holds offsetting positions on two
                venues and aims to be neutral to the market.
              </>
            )}
            {rejectedLabels.length ? (
              <>
                {" "}
                <strong className="font-medium text-fg">
                  {rejectedLabels.length} session
                  {rejectedLabels.length === 1 ? "" : "s"} excluded
                </strong>{" "}
                from the intraday line — the broker feed contradicted the
                published NAV: {rejectedLabels.join("; ")}.
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
            {capitalEventCount ? (
              <>
                {" "}
                <strong className="font-medium text-fg">
                  {capitalEventCount} capital movement
                  {capitalEventCount === 1 ? "" : "s"}
                </strong>{" "}
                {capitalEventCount === 1 ? "is" : "are"} excluded from this
                curve, net {money(capitalFlow, currency, 0)}: assets{" "}
                {capitalEventCount === 1
                  ? "moved in or out of"
                  : "left and re-entered"}{" "}
                the account by acts that were not trades. Detail below the
                chart; the raw broker equity is published unchanged in{" "}
                <code>nav.csv</code>.
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
          <p className="mt-4 text-[12px] text-fg-faint max-w-[80ch] leading-relaxed">
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
                {money(meta.opening_capital, currency, 2)} — a number this
                book&rsquo;s <code>nav.csv</code> does not carry, so the rebase
                cannot reproduce it.
                {meta.opening_capital_note
                  ? ` The desk states why: ${meta.opening_capital_note}.`
                  : ""}
              </>
            ) : null}{" "}
            The published figure is the one in the ledger and in the chained
            record; the curve&rsquo;s shape is unaffected.
          </p>
        )}
        {lastSession && (
          <p className="mt-4 text-[12.5px] text-fg-muted">
            Last point: session of{" "}
            <span className="text-fg">{date(lastSession)}</span>
            {sessionClose ? ` (close ${sessionClose.label})` : ""}.{" "}
            {/* "Next point at the next close" is a promise, and it was being
                made on a book that had published nothing for five days. Where
                the book is behind the record's own publish, the page says the
                record stops there instead — and nothing is carried forward to
                fill the gap. */}
            {bookBehind ? (
              <span className="text-warn-fg">
                This portfolio has published no session since then, while the
                rest of the record has moved on. The curve stops where the
                record stops: no value is carried forward and no session is
                estimated.
              </span>
            ) : (
              "Next point at the next close."
            )}
            {sessionClose ? (
              <span className="block text-[11.5px] text-fg-faint mt-1">
                {sessionClose.note}. Nothing intraday and provisional is drawn
                here: this record publishes what is settled.
              </span>
            ) : null}
            {openAtLast ? (
              <span className="block text-[11.5px] text-fg-faint mt-1">
                The book carried an open position past this close
                {openAtLast.tickets === 1
                  ? " (1 unmatched ticket"
                  : ` (${openAtLast.tickets} unmatched tickets`}
                , net {openAtLast.net_volume > 0 ? "+" : ""}
                {openAtLast.net_volume}). It is disclosed, not marked: its result
                will appear on the session it is closed out against, not this one.
              </span>
            ) : null}
          </p>
        )}

        {/* Folded, not hidden, and not shouted.
            A declared adjustment has to be readable on the chart it changes: an
            adjustment a reader must go hunting for is one they are entitled to
            be suspicious of. But this was a warn-toned banner sitting above the
            curve, and after the broker reversed itself the two movements net to
            0.1% of the book. A permanent alarm over a resolved bookkeeping
            round-trip is its own kind of dishonesty: it makes the page look
            wounded and it spends, on a footnote, the attention reserved for
            things a reader must not miss. So the claim goes in the rail with
            the chart's other caveats, and the evidence goes here, one click
            away, in full. Native <details>: no state, and it opens with
            JavaScript off. */}
        {capitalEvents.length ? (
          <details className="mt-4 text-[12px] text-fg-muted max-w-[80ch]">
            <summary className="cursor-pointer text-fg-faint hover:text-fg">
              {capitalEvents.length} capital movement
              {capitalEvents.length === 1 ? "" : "s"} excluded from the return
            </summary>
            <div className="mt-3 space-y-3 border-l hairline pl-4">
              {capitalEvents.map((e) => (
                <div key={e.date}>
                  <span className="text-fg tnum">{date(e.date)}</span>{" "}
                  <span className="text-fg tnum">
                    {money(e.amount_usd, currency, 2)}
                  </span>
                  <span className="block mt-1">{e.reason_en}</span>
                  <span className="block mt-1 text-fg-faint">
                    Derived as {e.derivation}.
                  </span>
                </div>
              ))}
              <p className="text-fg-faint">
                The curve measures the return on the capital actually managed.
                Nothing is hidden and nothing is rewritten: the raw broker
                equity stays in <code>nav.csv</code> beside the flow, the
                multiplier and the adjusted index, so the unadjusted curve is
                drawn from the same file. The full evidence for each movement is
                inside the write-once, hash-chained snapshot for its session.
              </p>
            </div>
          </details>
        ) : null}
      </Section>

      {daily.length > 0 && (
        <Section
          title="Daily and cumulative result"
          note={
            <>
              The combined result of both legs, in {currency}
              {sessionClose ? `, on the book's own trading day (close ${sessionClose.label})` : ""}
              .{" "}
              {/* THE CALENDAR CONVENTION IS THE BOOK'S, NOT THIS FILE'S. The
                  sentence hardcoded here said "weekends are flat rather than
                  interpolated" and rendered on the one book whose published
                  series has non-zero Saturday and Sunday rows, and whose own
                  methodology says so in terms. The published convention is
                  rendered instead; a caption in this repository cannot go stale
                  against the data if it comes from the data. */}
              {meta?.convention?.calendar ? (
                <>{meta.convention.calendar}. </>
              ) : (
                <>
                  Every calendar day is a row: a day with no trade is a bar of
                  zero, never a missing one, and a day the book did not execute
                  can still carry a non-zero value. Nothing is interpolated and
                  nothing is carried onto the next day.{" "}
                </>
              )}
              The percentage toggle shows the running total as the desk publishes
              it, against the capital at inception
              {meta?.initial_capital
                ? ` (${money(meta.initial_capital, currency, 2)})`
                : ""}
              ; it is a reading axis, not the compounded return published above.
            </>
          }
        >
          <DailyPnlChart data={daily} currency={currency} />
        </Section>
      )}

      {roundTrips && (
        <Section
          title="Round trips"
          note={
            <>
              This book&rsquo;s unit of account is the round trip, not the session:
              it executed on {summary.sessions > 0 ? `${meta?.active_sessions ?? "a few"} of ${summary.sessions}` : "a few"}{" "}
              published sessions, so a session-based denominator would measure the
              calendar rather than the strategy. Everything below is a count or a
              measured duration; nothing here is a ratio that needs a distribution.
            </>
          }
        >
          <RoundTripStats rt={roundTrips} />
        </Section>
      )}

      <Section
        title="Statistics"
        note={
          <>
            Every figure here is computed by the firm&rsquo;s{" "}
            <span className="tnum">rvb.metrics</span> module and published as
            data; no statistic in this section is calculated in your browser.
            Sharpe, Sortino and Calmar are excess of the 3-month Treasury yield
            {metrics
              ? ` (${pct(metrics.risk_free_annual)}, ${metrics.risk_free_source})`
              : ""}
            . A withheld figure keeps its row and says why.
          </>
        }
      >
        {metrics === null ? (
          <p className="text-[13px] text-fg-muted max-w-[80ch]">
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
            sessions={summary.sessions}
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
        />
      </Section>

      {exposure ? (
        <Section
          title="Exposure"
          note={
            <>
              Every figure below is published data, computed by the desk. The
              instrument, the venues and the size are not published, and will
              not be: they are the strategy.
            </>
          }
        >
          <ExposureSection exposure={exposure} />
        </Section>
      ) : (
      <Section
        title="Composition and holdings"
        note={
          <>
            Grouped by the category of strategy holding them — the style is
            published, the strategies are not. Profit is reported per category
            for the same reason: a per-symbol line under a named style is the
            trade record itself. The split is an attributed model that does not
            sum to the book; account-level equity above is exact and is read from
            the broker.{" "}
            <strong className="font-medium text-fg">
              A target weight is the plan, not the position.
            </strong>{" "}
            A sleeve declared in the table below can hold nothing on a given
            session, and the desk&rsquo;s attribution can be missing a sleeve that
            demonstrably held a position — so the two tables answer different
            questions and are not two views of one number.
          </>
        }
      >
        {summary.categories?.length > 0 && (
          <div className="scroll-x mb-9">
            <table className="w-full sm:min-w-[420px] max-w-[600px] text-[13px]">
              <thead>
                <tr className="text-[11.5px] text-fg-faint">
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
                      <span className="ml-2 text-[10.5px] text-fg-faint">
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
          <h3 className="text-[13px] font-semibold tracking-tight">
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
            <span className="text-[12px] text-fg-faint">
              {detail.positions_as_of
                ? `as at ${date(detail.positions_as_of)}`
                : `from the cycle staged ${date(detail.session_date)}, held from the following open`}
            </span>
          )}
        </div>
        <HoldingsTable groups={detail?.categories ?? []} currency={currency} />
      </Section>
      )}

      <Section title="Account">
        <dl className="grid sm:grid-cols-2 gap-x-14 gap-y-3 text-[13px]">
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
              ? `${meta.intraday_resolution} · ${meta.intraday_points} readings`
              : (meta?.intraday_resolution ?? "daily")}
          </Line>
          <Line label="Record">
            <span className="tnum">{summary.sessions} chained snapshots</span>
          </Line>
          <Line label="Strategies">
            <span className="tnum">
              {summary.categories?.reduce((s, c) => s + c.strategies, 0) || "—"}
            </span>
          </Line>
          {summary.paths?.methodology ? (
            <Line label="Methodology">
              <a
                className="text-accent hover:underline"
                href={`${DATA_REPO_URL}/blob/main/${summary.paths.methodology}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                this book&rsquo;s own note
              </a>
            </Line>
          ) : null}
        </dl>
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
      <dt className="text-[11.5px] text-fg-faint">{label}</dt>
      <dd className={`mt-1 text-[19px] tnum tracking-tight ${colour}`}>{value}</dd>
      {note && <div className="text-[11.5px] text-fg-faint mt-0.5">{note}</div>}
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
