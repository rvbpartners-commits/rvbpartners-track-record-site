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
 * Every `metrics.values` key this ledger has a row for.
 *
 * IT EXISTS SO A PROMISE CAN BE CHECKED INSTEAD OF REPEATED. The withholding
 * banner tells the reader that each suppressed figure "keeps its row in the
 * ledger and names itself" — a claim about THIS component, made in another
 * one, with nothing connecting them. It was false by two: fifteen names were
 * suppressed and thirteen rows rendered, because `sortino_gross` and
 * `calmar_gross` had no line.
 *
 * The banner now subtracts this set from the suppressed list and names whatever
 * is left over, so the next metric the desk adds to `suppressed` cannot quietly
 * falsify the sentence — it will be printed instead. Keep it in step with the
 * rows below; a key added here without a row is the bug this set exists to
 * catch, pointed the wrong way.
 */
export const LEDGER_METRIC_KEYS: ReadonlySet<string> = new Set([
  "cumulative_return",
  "n_obs",
  "cagr",
  "ev_excess_annual",
  "best_day",
  "worst_day",
  "positive_days",
  "negative_days",
  "flat_days",
  "win_rate",
  "volatility",
  "max_drawdown",
  "var_normal_95",
  "skew",
  "kurtosis",
  "sharpe",
  "sharpe_gross",
  "sharpe_autocorr_adj",
  "sortino",
  "sortino_gross",
  "calmar",
  "calmar_gross",
]);

/**
 * The statistics ledger. Figures are tabular so decimals line up; a withheld
 * statistic keeps its row and says why rather than disappearing.
 */
export function StatisticsLedger({
  metrics,
  analytics,
  currency = "USD",
  nav,
}: {
  metrics: MetricsPayload | null;
  analytics: AnalyticsPayload | null;
  currency?: string;
  nav: number | null;
}) {
  const v = metrics?.values ?? {};
  const gate = metrics?.insufficient_history;
  const s = analytics?.summary ?? {};
  const held = gate ? `withheld · ${gate.have}/${gate.need}` : undefined;
  const hasDrawdownPath =
    (analytics?.drawdown ?? []).some((d) => d.drawdown !== null) ||
    (analytics?.drawdown_episodes ?? []).length > 0;

  const position: Row[] = [
    { label: "Net asset value", value: money(nav, currency, 2) },
    {
      label: "Cumulative return",
      value: signedPct(v.cumulative_return ?? null, 3),
      sign: v.cumulative_return ?? null,
    },
    { label: "Marked sessions", value: v.n_obs === null ? "—" : String(v.n_obs) },
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
      // THE BROWSER IS NOT ENTITLED TO INVENT THE DENOMINATOR. This used to
      // render `positive of (positive + negative)`, which reads as a total —
      // and on a book with nine flat sessions it printed "4 of 7" beside a row
      // saying the book has 16 observations. Up and down are published; the
      // total is not the sum of them, so no total is stated unless the desk
      // publishes the flat count too.
      //
      // NOR TO INVENT A COUNT. The fix above still reached this row through
      // `?? 0` on both halves, and the row renders whenever EITHER count is
      // published — so a book publishing four up sessions and withholding the
      // down count printed "4 up · 0 down", a fabricated zero in the ledger,
      // under a section note promising nothing here is computed in the
      // browser. Each half is now printed only if it exists, and a half that
      // does not simply contributes nothing.
      label: "Winning sessions",
      value:
        [
          typeof v.positive_days === "number" ? `${v.positive_days} up` : null,
          typeof v.negative_days === "number" ? `${v.negative_days} down` : null,
          typeof v.flat_days === "number" ? `${v.flat_days} flat` : null,
        ]
          .filter(Boolean)
          .join(" · ") || "—",
      // "…; the rest were flat" was a THIRD count, derived by subtraction from
      // two published ones and stated as fact. A session the desk did not
      // classify is a session this page knows nothing about, so the note now
      // states only the published denominator — and only when both halves are
      // present, or the comparison it rests on is itself made of a `?? 0`.
      note:
        typeof v.n_obs === "number" &&
        typeof v.positive_days === "number" &&
        typeof v.negative_days === "number" &&
        v.positive_days + v.negative_days < v.n_obs
          ? `of ${v.n_obs} observations`
          : undefined,
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
      // Withheld here, and drawn in full two panels below — which reads as a
      // contradiction unless the row says which is which. The gated field is
      // the single `max_drawdown` number in metrics.json; the realised path and
      // its episodes are statements of what happened and are not gated. Same
      // definition, one of them released.
      label: "Maximum drawdown",
      value: pct(v.max_drawdown),
      withheld: v.max_drawdown === null ? held : undefined,
      note:
        v.max_drawdown === null && hasDrawdownPath
          ? "the realised path is published below, ungated"
          : undefined,
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
      note: metrics ? `risk-free ${pct(metrics.risk_free_annual)}` : undefined,
    },
    // THE GROSS TWINS HAD NO ROW, AND THE BANNER ABOVE PROMISED THEY DID. The
    // gate suppresses fifteen names and says each "keeps its row in the ledger
    // and names itself"; thirteen rows rendered. `sortino_gross` and
    // `calmar_gross` are published in `values` on every book, exactly as their
    // Sharpe counterpart is, and were simply never given a line here. Adding
    // them is the fix that makes the sentence true rather than the one that
    // waters the sentence down — and `LEDGER_METRIC_KEYS` below keeps it true.
    {
      label: "Sortino, gross",
      value: ratio(v.sortino_gross),
      withheld: v.sortino_gross === null ? held : undefined,
      note: "before subtracting cash",
    },
    {
      label: "Calmar",
      value: ratio(v.calmar),
      withheld: v.calmar === null ? held : undefined,
      note: metrics ? `risk-free ${pct(metrics.risk_free_annual)}` : undefined,
    },
    {
      label: "Calmar, gross",
      value: ratio(v.calmar_gross),
      withheld: v.calmar_gross === null ? held : undefined,
      note: "before subtracting cash",
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
      <h3 className="text-small font-semibold tracking-tight border-b hairline pb-2">
        {title}
      </h3>
      <dl>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline gap-4 border-b hairline py-2.5"
          >
            <dt className="text-small text-fg-muted">
              {r.label}
              {r.note && (
                <span className="text-fg-faint text-caption"> · {r.note}</span>
              )}
            </dt>
            <dd className="ml-auto text-right shrink-0">
              {r.withheld ? (
                <span className="text-small text-fg-faint">{r.withheld}</span>
              ) : (
                <span
                  className={`text-small tnum ${
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
