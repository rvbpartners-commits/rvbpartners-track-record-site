import type { AnalyticsPayload, MetricsPayload } from "@/lib/data";
import { money, pct, ratio, signedPct } from "@/lib/format";

type Row = {
  label: string;
  value: string;
  /** Set when the figure is withheld rather than absent. */
  withheld?: string;
  note?: string;
  sign?: number | null;
};

/**
 * The statistics ledger — a ruled account of everything measured, on the page
 * rather than behind a disclosure triangle.
 *
 * Two rules make it read as an accounts page rather than a dashboard. Every
 * figure sits in a fixed column so the decimal points line up down the whole
 * table (`tabular-nums`), and a withheld statistic keeps its row: it is struck
 * with *why* it is withheld instead of disappearing, so the count of things
 * measured stays the same whether or not there is enough history yet. A table
 * that silently gets longer as the record matures hides how much was missing.
 */
export function StatisticsLedger({
  metrics,
  analytics,
  currency = "USD",
  nav,
  sessions,
}: {
  metrics: MetricsPayload | null;
  analytics: AnalyticsPayload | null;
  currency?: string;
  nav: number | null;
  sessions: number;
}) {
  const v = metrics?.values ?? {};
  const gate = metrics?.insufficient_history;
  const s = analytics?.summary ?? {};
  const held = gate ? `withheld · ${gate.have}/${gate.need}` : undefined;

  const position: Row[] = [
    { label: "Net asset value", value: money(nav, currency, 2) },
    {
      label: "Cumulative return",
      value: signedPct(v.cumulative_return ?? null, 3),
      sign: v.cumulative_return ?? null,
    },
    { label: "Sessions published", value: String(sessions) },
    { label: "Observations", value: v.n_obs === null ? "—" : String(v.n_obs) },
  ];

  const performance: Row[] = [
    {
      label: "Annualised return (CAGR)",
      value: pct(v.cagr),
      withheld: v.cagr === null ? held : undefined,
      sign: v.cagr ?? null,
    },
    {
      label: "Expected excess return, annualised",
      value: pct(s.ev_excess_annual ?? v.ev_excess_annual),
      withheld: (s.ev_excess_annual ?? v.ev_excess_annual) === null ? held : undefined,
    },
    { label: "Best session", value: signedPct(v.best_day, 3), sign: v.best_day ?? null },
    { label: "Worst session", value: signedPct(v.worst_day, 3), sign: v.worst_day ?? null },
    {
      label: "Winning sessions",
      value:
        v.positive_days === null
          ? "—"
          : `${v.positive_days} of ${(v.positive_days ?? 0) + (v.negative_days ?? 0)}`,
    },
    {
      label: "Win rate",
      value: pct(v.win_rate),
      withheld: v.win_rate === null ? held : undefined,
    },
  ];

  const risk: Row[] = [
    {
      label: "Volatility, annualised",
      value: pct(v.volatility),
      withheld: v.volatility === null ? held : undefined,
    },
    {
      label: "Maximum drawdown",
      value: pct(v.max_drawdown),
      withheld: v.max_drawdown === null ? held : undefined,
      sign: v.max_drawdown ?? null,
    },
    {
      label: "Value at risk, 95% daily",
      value: pct(v.var_normal_95),
      withheld: v.var_normal_95 === null ? held : undefined,
    },
    {
      label: "Skew",
      value: ratio(v.skew),
      withheld: v.skew === null ? held : undefined,
    },
    {
      label: "Excess kurtosis",
      value: ratio(v.kurtosis),
      withheld: v.kurtosis === null ? held : undefined,
    },
  ];

  const ratios: Row[] = [
    {
      label: "Sharpe, excess of cash",
      value: ratio(v.sharpe),
      withheld: v.sharpe === null ? held : undefined,
      note: metrics ? `risk-free ${pct(metrics.risk_free_annual)}` : undefined,
    },
    {
      label: "Sharpe, gross",
      value: ratio(v.sharpe_gross),
      withheld: v.sharpe_gross === null ? held : undefined,
      note: "before subtracting cash",
    },
    {
      label: "Sharpe, autocorrelation-adjusted",
      value: ratio(v.sharpe_autocorr_adj),
      withheld: v.sharpe_autocorr_adj === null ? held : undefined,
      note: "Lo (2002)",
    },
    {
      label: "Sortino",
      value: ratio(v.sortino),
      withheld: v.sortino === null ? held : undefined,
    },
    {
      label: "Calmar",
      value: ratio(v.calmar),
      withheld: v.calmar === null ? held : undefined,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-x-14 gap-y-10">
      <Block title="Position" rows={position} />
      <Block title="Return" rows={performance} />
      <Block title="Risk" rows={risk} />
      <Block title="Risk-adjusted" rows={ratios} />
    </div>
  );
}

function Block({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold tracking-tight border-b hairline pb-2">
        {title}
      </h3>
      <dl>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline gap-4 border-b hairline py-2.5"
          >
            <dt className="text-[13px] text-fg-muted">
              {r.label}
              {r.note && (
                <span className="text-fg-faint text-[11.5px]"> · {r.note}</span>
              )}
            </dt>
            <dd className="ml-auto text-right shrink-0">
              {r.withheld ? (
                <span className="text-[12px] text-fg-faint">{r.withheld}</span>
              ) : (
                <span
                  className={`text-[13.5px] tnum ${
                    r.sign === undefined || r.sign === null
                      ? ""
                      : r.sign > 0
                        ? "text-up"
                        : r.sign < 0
                          ? "text-down"
                          : ""
                  }`}
                >
                  {r.value}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
