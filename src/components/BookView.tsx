"use client";

import { useState } from "react";
import type {
  AnalyticsPayload,
  BenchmarkPoint,
  BookMeta,
  BookSummary,
  DetailPayload,
  MetricsPayload,
  NavPoint,
} from "@/lib/data";
import { date, money, pct, ratio, signedPct } from "@/lib/format";
import { Analytics } from "./Analytics";
import { ChartLegend, PerformanceChart } from "./PerformanceChart";
import { HoldingsTable } from "./HoldingsTable";
import { Kpi, KpiRow } from "./Kpi";
import { Note } from "./Note";
import { PortfolioSelect } from "./PortfolioSelect";

export type BookBundle = {
  summary: BookSummary;
  meta: BookMeta | null;
  metrics: MetricsPayload | null;
  analytics: AnalyticsPayload | null;
  nav: NavPoint[];
  benchmark: BenchmarkPoint[];
  detail: DetailPayload | null;
};

function BookView({
  bundle,
  minSessions,
}: {
  bundle: BookBundle;
  minSessions: number;
}) {
  const { summary, meta, metrics, analytics, nav, benchmark, detail } = bundle;
  const gate = metrics?.insufficient_history;
  const values = metrics?.values ?? {};
  const currency = meta?.currency ?? "USD";

  const benchByDate = new Map(benchmark.map((b) => [b.date, b]));
  const base = nav.length > 0 ? nav[0].equity : 0;
  const chart = nav.map((p) => {
    const b = benchByDate.get(p.date);
    return {
      date: p.date,
      book: base ? p.equity / base - 1 : null,
      spy: b?.spy_cum ?? null,
      cash: b?.cash_cum ?? null,
    };
  });

  const last = nav.length > 0 ? nav[nav.length - 1] : null;
  const cumulative = values.cumulative_return ?? null;

  return (
    <>
      <header className="mt-8">
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          {summary.label}
        </h1>
        <p className="mt-1.5 text-[14px] text-fg-muted">
          {summary.tagline_en} · Alpaca paper account · since{" "}
          {date(summary.inception)}
        </p>
      </header>

      <section className="mt-10">
        <KpiRow>
          <Kpi
            label="Net asset value"
            value={money(last?.equity, currency, 0)}
            change={cumulative}
            changeLabel={`${signedPct(cumulative)} since inception`}
          />
          <Kpi
            label="Last session"
            value={signedPct(last?.daily_return)}
            change={last?.daily_return ?? null}
            changeLabel={date(last?.date)}
          />
          <Kpi
            label="Sharpe (excess of cash)"
            value={ratio(values.sharpe)}
            gatedNote={gate ? gate.label_en : undefined}
            hint={
              metrics
                ? `risk-free ${pct(metrics.risk_free_annual, 2)} · ${metrics.risk_free_source}`
                : undefined
            }
          />
          <Kpi
            label="Maximum drawdown"
            value={pct(values.max_drawdown)}
            gatedNote={gate ? gate.label_en : undefined}
          />
        </KpiRow>
      </section>

      {gate && (
        <Note tone="warn" className="mt-8">
          <strong className="font-semibold">
            Annualised statistics are withheld — {gate.have} of {gate.need}{" "}
            sessions.
          </strong>{" "}
          Sharpe, CAGR, Calmar, volatility, maximum drawdown and win rate are not
          shown until this portfolio has {minSessions} marked sessions. On a
          handful of sessions they are not imprecise, they are meaningless.
          Cumulative return and the equity curve are shown from day one because
          those are statements of what happened.
        </Note>
      )}

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-5">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Cumulative return
          </h2>
          <ChartLegend />
        </div>
        <PerformanceChart data={chart} />
        <p className="mt-4 text-[12px] text-fg-muted max-w-[72ch] leading-relaxed">
          Sessions are joined by straight lines, not smoothed: a daily net asset
          value has no intraday path we measured, and a spline would draw one. The
          curve is anchored to funded capital
          {meta && !meta.inception_anchored_to_funded_capital
            ? ", except where the broker's history does not reach back that far — for this portfolio it starts at the first marked close, so the opening session is not represented"
            : ", so the first session's profit and loss is inside the record"}
          . SPY is a total-return series on the same dates. These portfolios carry
          short positions and are not SPY-like — the benchmark is context, not a
          like-for-like comparison.
        </p>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Holdings by category
          </h2>
          {detail && (
            <span className="text-[12px] text-fg-faint">
              {`as at ${date(detail.session_date)}`}
            </span>
          )}
        </div>
        <p className="mb-5 text-[12px] text-fg-muted max-w-[72ch] leading-relaxed">
          <strong className="font-medium text-fg">
            Grouped by strategy category, not by strategy.
          </strong>{" "}
          The style being run is published; the identity of each strategy is not.
          Profit and loss is reported per category for the same reason — a
          per-symbol line under a named style is the trade record itself. The
          split across categories is the attributed model; portfolio-level equity
          above is exact. Detail is published as soon as its cycle has executed.
        </p>
        <HoldingsTable groups={detail?.categories ?? []} currency={currency} />
      </section>

      <Analytics analytics={analytics} />

      <section className="mt-14">
        <h2 className="text-[15px] font-semibold tracking-tight mb-5">
          This portfolio
        </h2>
        <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-[13px] max-w-[820px]">
          <Row label="Account type">Alpaca paper — no capital at risk</Row>
          <Row label="Account reference">
            <span className="tnum">
              {summary.account_number ?? summary.account_ref ?? "—"}
            </span>
          </Row>
          <Row label="Inception">{date(summary.inception)}</Row>
          <Row label="Sessions published">
            <span className="tnum">{summary.sessions}</span>
          </Row>
          <Row label="Initial capital">
            <span className="tnum">
              {money(summary.initial_capital, currency, 0)}
            </span>
          </Row>
          <Row label="Strategies">
            <span className="tnum">
              {summary.categories?.reduce((s, c) => s + c.strategies, 0) || "—"}
            </span>
          </Row>
        </dl>

        {summary.categories?.length > 0 && (
          <div className="mt-8">
            <h3 className="text-[13px] font-semibold tracking-tight mb-3">
              Composition by category
            </h3>
            <div className="scroll-x">
              <table className="w-full min-w-[420px] max-w-[560px] text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.1em] text-fg-faint">
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
                        <span className="ml-2 text-[10px] tracking-[0.08em] text-fg-faint border hairline rounded px-1.5 py-0.5">
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
          </div>
        )}
      </section>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b hairline pb-3">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export function BookSwitcher({
  bundles,
  minSessions,
}: {
  bundles: BookBundle[];
  minSessions: number;
}) {
  const [current, setCurrent] = useState(bundles[0]?.summary.book ?? "");
  const bundle =
    bundles.find((b) => b.summary.book === current) ?? bundles[0] ?? null;

  if (!bundle) {
    return (
      <p className="text-[14px] text-fg-muted">
        No published data yet. The desk publishes after each session&rsquo;s close.
      </p>
    );
  }

  return (
    <>
      <PortfolioSelect
        options={bundles.map((b) => ({
          book: b.summary.book,
          label: b.summary.label,
          tagline: b.summary.tagline_en,
          cumulative: b.metrics?.values.cumulative_return ?? null,
        }))}
        value={bundle.summary.book}
        onChange={setCurrent}
      />
      <BookView bundle={bundle} minSessions={minSessions} />
    </>
  );
}
