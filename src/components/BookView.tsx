"use client";

import { useState } from "react";
import type {
  BenchmarkPoint,
  BookMeta,
  BookSummary,
  DetailPayload,
  MetricsPayload,
  NavPoint,
} from "@/lib/data";
import { date, money, pct, ratio, signedPct } from "@/lib/format";
import { ChartLegend, PerformanceChart } from "./PerformanceChart";
import { HoldingsTable } from "./HoldingsTable";
import { Kpi, KpiRow } from "./Kpi";
import { Note } from "./Note";

export type BookBundle = {
  summary: BookSummary;
  meta: BookMeta | null;
  metrics: MetricsPayload | null;
  nav: NavPoint[];
  benchmark: BenchmarkPoint[];
  detail: DetailPayload | null;
};

export function BookView({
  bundle,
  bundles,
  minSessions,
  onSelect,
}: {
  bundle: BookBundle;
  bundles: BookBundle[];
  minSessions: number;
  onSelect: (book: string) => void;
}) {
  const { summary, meta, metrics, nav, benchmark, detail } = bundle;
  const gate = metrics?.insufficient_history;
  const values = metrics?.values ?? {};

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
      <BookTabs
        bundles={bundles}
        current={summary.book}
        onSelect={onSelect}
      />

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
            value={money(last?.equity, meta?.currency ?? "USD", 0)}
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
          shown until this book has {minSessions} marked sessions. On a handful of
          sessions they are not imprecise, they are meaningless. Cumulative return
          and the equity curve are shown from day one because those are statements
          of what happened.
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
          The portfolio curve is anchored to funded capital
          {meta && !meta.inception_anchored_to_funded_capital
            ? " where the broker's history allows; for this book it starts at the first marked close, so the opening session is not represented"
            : ", so the first session's profit and loss is inside the record"}
          . SPY is shown as a total-return series on the same dates. These books
          carry short positions and are not SPY-like — the benchmark is context,
          not a like-for-like comparison.
        </p>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Holdings by strategy
          </h2>
          {detail && (
            <span className="text-[12px] text-fg-faint">
              {`as at ${date(detail.session_date)} · released on a ${detail.released_under_lag_days}-day lag`}
            </span>
          )}
        </div>
        <p className="mb-5 text-[12px] text-fg-muted max-w-[72ch] leading-relaxed">
          <strong className="font-medium text-fg">Attributed.</strong> The broker
          nets our orders, so each net fill is split back across the strategies
          that asked for it, pro-rata by requested size. Book-level equity above
          is exact; this breakdown is a model. Detail is released only once the
          cycle that produced it has actually executed.
        </p>
        <HoldingsTable
          positions={detail?.positions ?? []}
          currency={meta?.currency ?? "USD"}
        />
      </section>

      <section className="mt-14">
        <h2 className="text-[15px] font-semibold tracking-tight mb-5">
          This book
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
              {money(summary.initial_capital, meta?.currency ?? "USD", 0)}
            </span>
          </Row>
          {/* Per-strategy return attribution needs two mark dates, so it is
              absent on a book's first session. Falling back to the count in the
              released detail keeps the row informative without implying the
              attributed return series exists when it does not. */}
          <Row label="Strategies">
            {summary.strategies.length > 0
              ? summary.strategies.length
              : detail
                ? new Set(detail.positions.map((p) => p.slug)).size || "—"
                : "—"}
          </Row>
        </dl>
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

function BookTabs({
  bundles,
  current,
  onSelect,
}: {
  bundles: BookBundle[];
  current: string;
  onSelect: (book: string) => void;
}) {
  return (
    <div className="scroll-x -mx-1">
      <div className="flex gap-1 px-1 min-w-max">
        {bundles.map((b) => {
          const active = b.summary.book === current;
          const cum = b.metrics?.values.cumulative_return ?? null;
          const dir =
            cum === null ? "text-fg-faint" : cum >= 0 ? "text-up" : "text-down";
          return (
            <button
              key={b.summary.book}
              type="button"
              onClick={() => onSelect(b.summary.book)}
              aria-current={active ? "page" : undefined}
              className={[
                "text-left rounded-lg px-4 py-3 min-w-[168px] transition-colors",
                active
                  ? "bg-bg-subtle"
                  : "hover:bg-bg-subtle/60 opacity-80 hover:opacity-100",
              ].join(" ")}
            >
              <div className="text-[13px] font-medium">{b.summary.label}</div>
              <div className={`mt-1 text-[15px] font-semibold tnum ${dir}`}>
                {signedPct(cum)}
              </div>
            </button>
          );
        })}
      </div>
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
    <BookView
      bundle={bundle}
      bundles={bundles}
      minSessions={minSessions}
      onSelect={setCurrent}
    />
  );
}
