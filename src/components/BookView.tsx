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
import { DATA_REPO_URL } from "@/lib/data";
import {
  date,
  dateTime,
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
};

/** How far behind the publish a broker reading may be and still be called
 *  "live". One session plus slack: a reading refreshed on the publishing run is
 *  hours old, and anything the publisher could not refresh is not a live
 *  reading whatever the field is named. */
const LIVE_MAX_AGE_HOURS = 36;

/**
 * Evidence fields that are prose written for a reader, rendered under the
 * capital movement they belong to.
 *
 * An `evidence` object is a bag of whatever the desk recorded — quantities,
 * endpoint responses, timestamps, prices — and dumping it would be noise. These
 * three are sentences, and they are the ones a sceptic needs: what the net of a
 * pair of movements actually IS, whether the broker later changed its own
 * story, and what was deliberately left inside the return. Absent keys render
 * nothing, so a book publishing none of them shows exactly what it shows today.
 */
const NARRATIVE_EVIDENCE: [key: string, label: string][] = [
  ["net_of_the_two_events", "Net of the two movements"],
  ["broker_restated_its_own_history", "The broker has since restated its own history"],
  ["not_included_here", "Not treated as a flow"],
];

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
  const marketDataFeed = bundle.lastSnapshot?.disclosure?.market_data_feed;

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
                {/* "BEFORE THE DATA ON THIS PAGE WAS PUBLISHED" NAMED NEITHER
                    SIDE OF ITS OWN COMPARISON, and the footer of this same page
                    prints a publish instant that MATCHES the reading to the
                    minute — because a book that has stopped publishing carries
                    a stale `published_at` too. The two sentences read as a flat
                    contradiction. The comparison is against the RECORD's
                    publish, which is the instant this payload was written, so
                    that is the one printed. */}
                <span className="text-warn-fg">
                  The last broker reading for this book is dated{" "}
                  {marketTime(rawLive.at, zone)} — the last reading this book
                  produced, and older than this record&rsquo;s current publish
                  {publishedAt ? ` (${dateTime(publishedAt)})` : ""}
                  {summary.last_session
                    ? `. Its last marked session is ${date(summary.last_session)}`
                    : ""}
                  .
                </span>{" "}
                It is not labelled live and does not lead the figures above:
                those are the marked, chained ones. The reading itself was{" "}
                {signedPct(rawLive.cumulative_return, 3)} on equity of{" "}
                {money(rawLive.equity, currency, 2)}
                {rawLive.source ? ` — ${rawLive.source}` : ""}.
                {/* THE TWO FIGURES IN THAT SENTENCE ARE NOT ON ONE BASIS, and
                    a reader who divides the equity by the funded capital gets a
                    third number that matches neither. That is not an error: on
                    a book with a leg quoted in another currency, the published
                    curve converts that leg once per session and never revalues
                    it, while a direct read of both accounts is at today's rate.
                    The book publishes the convention; the page renders it
                    rather than leaving the arithmetic to fail silently. */}
                {meta?.fx?.note ? (
                  <>
                    {" "}
                    The return and the equity there are not on the same basis, so
                    one does not follow from the other by division:{" "}
                    {prose(meta.fx.note)}.
                  </>
                ) : null}
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
          {/* THE PROMISE IS CHECKED, NOT REPEATED. "Each keeps its row in the
              ledger and names itself" is a claim about a different component,
              and it was false by two: fifteen suppressed, thirteen rows. The
              ledger now publishes the keys it renders, so the sentence either
              holds or names the exceptions — it can no longer be quietly
              falsified by the desk adding a name to `suppressed`. */}
          {gate.suppressed?.length ? (
            <>
              {gate.suppressed.length} figures stay withheld until this account
              has {gate.need} {gateUnit};{" "}
              {unrenderedSuppressed.length === 0 ? (
                <>each keeps its row in the ledger below and names itself.</>
              ) : (
                <>
                  {gate.suppressed.length - unrenderedSuppressed.length} of them
                  keep a row in the ledger below and name themselves, and the
                  rest are named here:{" "}
                  {unrenderedSuppressed.join(", ")}.
                </>
              )}
            </>
          ) : (
            `Annualised figures stay withheld until this account has ${gate.need} ${gateUnit}.`
          )}{" "}
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
                    {/* NAME THE ANCHOR. Two portfolio pages draw a line
                        labelled identically — "S&P 500 · price, 5-minute" —
                        that ends on two different numbers, because each is
                        rebased on the first bar of the book it sits under and
                        the books start on different days. Unnamed, that reads
                        as two contradictory measurements of one index. One
                        clause removes the whole objection. */}
                    The index line here is a 5-minute <em>price</em> path —
                    dividends are not applied intraday and it is rebased on{" "}
                    <strong className="font-medium text-fg">
                      this book&rsquo;s first published bar
                      {points.length > 0 ? `, ${date(points[0].date)}` : ""}
                    </strong>
                    , so it will not end where the daily total-return series in{" "}
                    <code>benchmark.csv</code> ends — and the same index line on
                    another portfolio&rsquo;s page is rebased on that
                    book&rsquo;s own start, not this one.
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
          <p className="mt-4 text-[12px] text-fg-faint max-w-[80ch] leading-relaxed">
            <span className="text-warn-fg">
              The headline above is not the figure in this book&rsquo;s final
              chained record.
            </span>{" "}
            The record for the {date(bundle.lastSnapshotSession)} session was
            written and hashed with a cumulative return of{" "}
            {signedPct(snapshotMismatch.chained, 4)}; the ledger and this
            page&rsquo;s header publish {signedPct(snapshotMismatch.published, 4)}
            , which is the corrected figure. The record is deliberately{" "}
            <strong className="font-medium text-fg">not amended</strong>: it
            says what was known when it was written, its hash still verifies,
            and a record that can be rewritten after the fact is not a record.
            Both numbers are published — the chained one in{" "}
            <code>snapshots/</code>, the corrected one in{" "}
            <code>metrics.json</code> — and neither is hidden behind the other.
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
                  <span className="block mt-1">{prose(e.reason_en)}</span>
                  <span className="block mt-1 text-fg-faint">
                    Derived as {prose(e.derivation)}.
                  </span>
                  {/* THE TWO THINGS A READER MOST NEEDS WERE INSIDE THE
                      EVIDENCE AND ON NO PAGE: what the net exclusion actually
                      is (not just its dollar amount, but WHICH price move it
                      is and why the account did not participate in it), and
                      that the broker has since restated its own history as
                      though nothing was ever missing. Both are published, in
                      the desk's own words, per event. Rendering them is the
                      difference between a declared adjustment and one a reader
                      has to go digging for — and leaving the retraction only
                      in the JSON is what damages credibility, not the
                      adjustment itself. Named keys only: this renders the
                      desk's narrative fields, never a dump of an evidence
                      object whose shape the site does not control. */}
                  {NARRATIVE_EVIDENCE.map(([key, label]) => {
                    const value = e.evidence?.[key];
                    return typeof value === "string" && value.length > 0 ? (
                      <span key={key} className="block mt-1 text-fg-faint">
                        <span className="text-fg-muted">{label}:</span>{" "}
                        {prose(value)}
                      </span>
                    ) : null;
                  })}
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
                <>{prose(meta.convention.calendar)}. </>
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
              {/* "NOTHING HERE IS A RATIO THAT NEEDS A DISTRIBUTION" sat
                  directly above a hit rate of 100% on six observations, which
                  is exactly such a ratio — and the strongest-looking number on
                  the page. The sentence was the licence the panel used to
                  publish it under the same gate that withholds a Sharpe. The
                  claim is dropped, and the hit rate is shown as the count it
                  honestly is. */}
              This book&rsquo;s unit of account is the round trip, not the session:
              it executed on {summary.sessions > 0 ? `${meta?.active_sessions ?? "a few"} of ${summary.sessions}` : "a few"}{" "}
              published sessions, so a session-based denominator would measure the
              calendar rather than the strategy. Most of what follows is a count
              or a measured duration, publishable on a handful of observations
              because it describes what happened rather than estimating a
              distribution; anything that does estimate one is withheld under the
              same bar as the statistics above.
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
          observations={observations}
          headline={cumulative}
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
            {/* THE CLAIM HAD TO MATCH THE TABLE. "Profit is reported per
                category so a per-symbol line is not the trade record" reads as
                a withholding, and the table underneath publishes each
                position's quantity, its cost basis and its mark — from which a
                per-symbol open result is one subtraction away. Dropping a
                column would not have made the claim true either, because cost
                basis and market value are both load-bearing. So the page states
                what is actually protected, which is the thing that matters and
                is genuinely never published: WHICH STRATEGY holds the position.
                A style is not a strategy, and the positions are visible. */}
            Grouped by the category of strategy holding them — the style is
            published, the strategies are not. That is the whole of what is
            withheld here, and it is withheld completely: no strategy identity
            appears in any published file. The positions themselves are not
            withheld — each row carries its quantity, its cost basis and its
            mark, so an individual holding&rsquo;s open result is a subtraction
            a reader can do. P&amp;L is TOTALLED per category rather than per
            symbol because the category is the unit the attribution model
            produces, and that split is a model that does not sum to the book;
            account-level equity above is exact and is read from the broker.{" "}
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
          {/* THE FEED BEHIND THE FILLS. It is stamped into every snapshot's
              disclosure block and reaches no other published file — not the
              index's disclosure list, not meta.json — so it was true, evidenced,
              and invisible. On a paper book it is the single most material
              caveat there is: a simulated fill is only as good as the tape it
              was simulated against. Disclosing it strengthens the record. */}
          {typeof marketDataFeed === "string" ? (
            <Line label="Market data">{marketDataFeed}</Line>
          ) : null}
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

        {/* WHEN THESE RECORDS JOINED THE CHAIN. A book whose earlier sessions
            were written in one later batch has a genesis entry dated after its
            record begins — which, found unaided in the verify table, is the
            single most damaging inference a sceptic can draw about a hash
            chain. It costs nothing to pre-empt, because the chain's own
            Recorded column already says it entry by entry. Stated here, on the
            book it is about, as well as on the verify page where the restart is
            declared. Counted from the chain, never asserted. */}
        {bundle.chain && bundle.chain.backfilled > 0 && (
          <p className="mt-6 text-[12px] text-fg-faint max-w-[80ch] leading-relaxed">
            {bundle.chain.backfilled} of this book&rsquo;s{" "}
            {bundle.chain.records} chained records joined the chain
            {bundle.chain.recordedOn
              ? ` on ${date(bundle.chain.recordedOn)}`
              : " later"}
            , after the sessions they describe
            {bundle.chain.backfilled === bundle.chain.records - 1
              ? "; only the last was recorded on its own day"
              : ""}
            . That is published, not inferred: every entry carries the day it
            was recorded beside the session it covers, and{" "}
            <a
              className="text-accent hover:underline"
              href={`${DATA_REPO_URL}/blob/main/CHAIN.jsonl`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <code>CHAIN.jsonl</code>
            </a>{" "}
            prints both columns. A timestamp proof bounds a record from above
            only, so a record written in a batch carries a proof for the day it
            was stamped rather than for its session — which is why the recording
            date is published rather than left to be assumed zero.
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
