"use client";

import { useMemo } from "react";
import type {
  AnalyticsPayload,
  BenchmarkPoint,
  BookMeta,
  BookSummary,
  DailyPoint,
  DetailPayload,
  EventsPayload,
  IntradayPoint,
  MetricsPayload,
  NavPoint,
} from "@/lib/data";
import { date, marketTime, money, pct, signedPct } from "@/lib/format";
import { AnalyticsCharts } from "./AnalyticsCharts";
import { ChartLegend, PerformanceChart, type ChartPoint } from "./PerformanceChart";
import { DailyPnlChart } from "./DailyPnlChart";
import { EventLog } from "./EventLog";
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
  events: EventsPayload | null;
};

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
): { points: ChartPoint[]; granular: boolean } {
  const base = nav.length > 0 ? nav[0].equity : 0;
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
          book: p.equity / base - 1,
          spy: b?.spy_cum ?? null,
          cash: b?.cash_cum ?? null,
          close: p.equity / base - 1,
        };
      }),
    };
  }

  // The last intraday point of each session is where the daily figures attach.
  const lastOfSession = new Map<string, string>();
  for (const p of intraday) lastOfSession.set(p.session_date, p.timestamp);

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
      book: p.equity / base - 1,
      spy: b?.spy ?? null,
      cash: b?.cash ?? null,
      // The official published NAV: the desk's after-close mark, a few basis
      // points off the broker's 16:00 intraday figure.
      close: navPoint ? navPoint.equity / base - 1 : null,
    };
  });
  return { points, granular: true };
}

function BookView({
  bundle,
  minSessions,
}: {
  bundle: BookBundle;
  minSessions: number;
}) {
  const { summary, meta, metrics, analytics, nav, benchmark, intraday,
          benchIntraday, detail, daily, events } = bundle;
  const gate = metrics?.insufficient_history;
  const currency = meta?.currency ?? "USD";
  const last = nav.length > 0 ? nav[nav.length - 1] : null;
  const cumulative = metrics?.values.cumulative_return ?? null;
  const live = meta?.live ?? summary.live ?? null;

  const { points, granular } = useMemo(
    () => buildChart(nav, benchmark, intraday, benchIntraday),
    [nav, benchmark, intraday, benchIntraday],
  );

  // Whether to draw an equity index is decided by the DATA, not by the book's
  // name. A book that publishes an empty `spy_cum` column is saying it has no
  // equity benchmark; drawing a flat line, or a legend that names one, would
  // put a comparison on the page the data explicitly refuses to make. It also
  // means the rule keeps working for the next such book without an edit here.
  const showEquityBenchmark = points.some((p) => p.spy !== null);
  const roundTrips = meta?.round_trips ?? null;
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

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          {/* The LIVE reading leads, because "what is this account worth" is the
              question a reader is asking, and answering it with the previous
              close while the curve below draws today put two clocks on one
              screen — the broker said +4,992 and the page said +4,641. The
              marked figure is not dropped: it is the chained evidence, and it
              sits underneath, dated. */}
          <Field
            label="Net asset value"
            value={money(live?.equity ?? last?.equity, currency, 2)}
            note={
              live
                ? `live · ${marketTime(live.at)}`
                : `marked ${date(last?.date)}`
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
            note={`${summary.sessions} sessions · ${money(summary.initial_capital, currency, 0)}`}
          />
        </dl>
      </header>

      {gate && (
        <Note tone="warn" className="mt-8">
          <strong className="font-semibold">
            Annualised statistics are withheld — {gate.have} of {gate.need}{" "}
            sessions.
          </strong>{" "}
          Sharpe, CAGR, Calmar, volatility, maximum drawdown and win rate stay
          withheld until this account has {minSessions} marked sessions. On a
          handful of sessions they are not imprecise, they are meaningless. Every
          row below keeps its place in the ledger and says so, rather than
          disappearing until it flatters us.
        </Note>
      )}

      <Section
        title="Cumulative return"
        first
        note={
          <>
            {granular ? (
              <>
                Broker account equity at 5-minute resolution —{" "}
                {meta?.intraday_points ?? points.length} readings, not
                interpolation. Dots are the official session NAV, read at the
                desk&rsquo;s after-close mark; it sits a few basis points from the
                broker&rsquo;s 16:00 figure and neither is adjusted onto the other.
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
                is context, not a comparison.
              </>
            ) : (
              <>
                The only comparator drawn is cash at the risk-free rate. An
                equity index is not the opportunity cost of a book that holds
                offsetting positions on two venues and aims to be neutral to the
                market — cash is, and it is the one line beside the book.
              </>
            )}
            {meta?.intraday_sessions_rejected?.length ? (
              <>
                {" "}
                <strong className="font-medium text-fg">
                  {meta.intraday_sessions_rejected.length} session
                  {meta.intraday_sessions_rejected.length === 1 ? "" : "s"}{" "}
                  excluded
                </strong>{" "}
                from the intraday line — the broker feed contradicted the
                published NAV: {meta.intraday_sessions_rejected.join("; ")}.
              </>
            ) : null}
          </>
        }
      >
        <div className="flex justify-end mb-4">
          <ChartLegend showEquityBenchmark={showEquityBenchmark} />
        </div>
        <PerformanceChart
          data={points}
          granular={granular}
          showEquityBenchmark={showEquityBenchmark}
        />
        {lastSession && (
          <p className="mt-4 text-[12.5px] text-fg-muted">
            Last point: session of{" "}
            <span className="text-fg">{date(lastSession)}</span>
            {sessionClose ? ` (close ${sessionClose.label})` : ""}. Next point at
            the next close.
            {sessionClose ? (
              <span className="block text-[11.5px] text-fg-faint mt-1">
                {sessionClose.note}. Nothing intraday and provisional is drawn
                here: this record publishes what is settled.
              </span>
            ) : null}
          </p>
        )}
      </Section>

      {daily.length > 0 && (
        <Section
          title="Daily and cumulative result"
          note={
            <>
              The combined result of both legs, in {currency}, on the broker&rsquo;s
              own trading day — whose midnight is 21:00 UTC. Every calendar day is
              a row: a day with no trade is a bar of zero, never a missing one, and
              weekends are flat rather than interpolated. The percentage toggle
              divides the running total by the capital at inception
              {meta?.initial_capital
                ? ` (${money(meta.initial_capital, currency, 2)})`
                : ""}
              ; it is a reading axis, not the compounded return published above.
            </>
          }
        >
          <DailyPnlChart
            data={daily}
            events={events?.events ?? []}
            currency={currency}
            initialCapital={meta?.initial_capital ?? null}
          />
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

      {events && events.events.length > 0 && (
        <Section
          title="Operational log"
          note={
            <>
              A curve that dips does not say whether the strategy lost money or
              the machine was switched off, and those are not the same fact about
              a track record. Outages, restarts and maintenance are published for
              that reason. Parameter <em>values</em> are not: the date and the
              fact that something changed are disclosure, the number would be the
              strategy.
            </>
          }
        >
          <EventLog events={events.events} />
        </Section>
      )}

      <Section
        title="Statistics"
        note={
          <>
            Every figure is computed by the firm&rsquo;s{" "}
            <span className="tnum">rvb.metrics</span> module and published as
            data; nothing here is calculated in your browser. Sharpe, Sortino and
            Calmar are excess of the 3-month Treasury yield
            {metrics
              ? ` (${pct(metrics.risk_free_annual)}, ${metrics.risk_free_source})`
              : ""}
            . A withheld figure keeps its row and says why.
          </>
        }
      >
        <StatisticsLedger
          metrics={metrics}
          analytics={analytics}
          currency={currency}
          nav={last?.equity ?? null}
          sessions={summary.sessions}
        />
        <AnalyticsCharts analytics={analytics} />
      </Section>

      <Section
        title="Composition and holdings"
        note={
          <>
            Grouped by the category of strategy holding them — the style is
            published, the strategies are not. Profit is reported per category
            for the same reason: a per-symbol line under a named style is the
            trade record itself. The split is an attributed model; account-level
            equity above is exact.
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
          {detail && (
            <span className="text-[12px] text-fg-faint">
              {`as at ${date(detail.session_date)}`}
            </span>
          )}
        </div>
        <HoldingsTable groups={detail?.categories ?? []} currency={currency} />
      </Section>

      <Section title="Account">
        <dl className="grid sm:grid-cols-2 gap-x-14 gap-y-3 text-[13px]">
          <Line label="Type">{accountLabel}</Line>
          <Line label="Reference">
            <span className="tnum">
              {summary.account_number ?? summary.account_ref ?? "—"}
            </span>
          </Line>
          <Line label="Currency">{currency}</Line>
          <Line label="Equity resolution">
            {meta?.intraday_points
              ? `${meta.intraday_resolution} · ${meta.intraday_points} readings`
              : "daily"}
          </Line>
          <Line label="Record">
            <span className="tnum">{summary.sessions} chained snapshots</span>
          </Line>
          <Line label="Strategies">
            <span className="tnum">
              {summary.categories?.reduce((s, c) => s + c.strategies, 0) || "—"}
            </span>
          </Line>
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
  note?: string;
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
  minSessions,
}: {
  bundle: BookBundle;
  options: PortfolioOption[];
  minSessions: number;
}) {
  return (
    <>
      <PortfolioSelect options={options} value={bundle.summary.book} />
      <BookView bundle={bundle} minSessions={minSessions} />
    </>
  );
}
