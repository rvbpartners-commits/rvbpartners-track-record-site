"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPayload } from "@/lib/data";
import { date, pct, ratio, signedPct } from "@/lib/format";

/**
 * The professional panel — collapsed by default.
 *
 * Two audiences, one page. Someone asking "how has it done?" is served by the
 * four KPIs and the curve above; burying them under a wall of moments would be
 * worse for them, not better. Someone asking "what is the shape of the return
 * distribution and how deep were the drawdowns?" opens this.
 *
 * Every series here is READ from `analytics.json`, which the desk computed with
 * `rvb.metrics`. Nothing on this page is calculated in the browser — including
 * the rolling Sharpe, which is a per-window call to the same `compute_sharpe`
 * that produced the headline number.
 */
export function Analytics({ analytics }: { analytics: AnalyticsPayload | null }) {
  const [open, setOpen] = useState(false);

  if (!analytics) return null;

  return (
    <section className="mt-14 border-t hairline pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-baseline gap-3 w-full text-left group"
      >
        <span
          className="text-fg-faint text-[9px] w-2.5 inline-block transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          Detailed analytics
        </span>
        <span className="text-[12px] text-fg-faint">
          rolling statistics, drawdown path, distribution, monthly returns
        </span>
      </button>

      {open && (
        <div className="mt-8 space-y-12">
          {analytics.gated && (
            <p className="text-[13px] text-warn-fg bg-warn-bg border border-warn-line px-4 py-3.5 max-w-[80ch] leading-relaxed">
              <strong className="font-semibold">
                Rolling statistics and the annualised summary are withheld —{" "}
                {analytics.sessions} of {analytics.min_sessions_for_annualised}{" "}
                sessions.
              </strong>{" "}
              What is shown below is descriptive: the daily bars and the drawdown
              path are what happened, session by session. A rolling 63-session
              Sharpe on {analytics.sessions} sessions would not be a sparse chart,
              it would be an empty one.
            </p>
          )}

          <DailyBars analytics={analytics} />
          <DrawdownPath analytics={analytics} />
          {!analytics.gated && <RollingSharpe analytics={analytics} />}
          <MonthlyTable analytics={analytics} />
          <Distribution analytics={analytics} />
          <DrawdownEpisodes analytics={analytics} />
          {!analytics.gated && <SummaryTable analytics={analytics} />}

          <p className="text-[11px] text-fg-faint">
            Computed by {analytics.computed_by}. Risk-free{" "}
            {pct(analytics.risk_free_annual)} ({analytics.risk_free_source}).
          </p>
        </div>
      )}
    </section>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
      {note && (
        <p className="mt-1 text-[12px] text-fg-muted max-w-[72ch]">{note}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

const axis = { fill: "var(--fg-faint)", fontSize: 11 };
const fmtDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

function TinyTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { value?: number | null; name?: string }[];
  label?: string;
  format: (v: number | null | undefined) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border hairline bg-bg-raised px-2.5 py-1.5 text-[12px]">
      <div className="text-fg-faint text-[11px]">{label ? fmtDay(label) : ""}</div>
      <div className="tnum font-medium">{format(payload[0]?.value)}</div>
    </div>
  );
}

function DailyBars({ analytics }: { analytics: AnalyticsPayload }) {
  const data = analytics.daily_returns.filter((d) => d.return !== null);
  if (data.length === 0) return null;
  return (
    <Panel
      title="Daily returns"
      note="Every session since inception. Green above zero, red below — no other colour is used for anything on this page."
    >
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={axis} minTickGap={28} />
            <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                   tickLine={false} axisLine={false} width={56} tick={axis} />
            <Tooltip content={<TinyTooltip format={(v) => signedPct(v ?? null)} />}
                     cursor={{ fill: "var(--bg-subtle)" }} />
            <Bar dataKey="return" isAnimationActive={false}>
              {data.map((d) => (
                <Cell
                  key={d.date}
                  fill={(d.return ?? 0) >= 0 ? "var(--up)" : "var(--down)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function DrawdownPath({ analytics }: { analytics: AnalyticsPayload }) {
  const data = analytics.drawdown.filter((d) => d.drawdown !== null);
  if (data.length === 0) return null;
  return (
    <Panel
      title="Drawdown"
      note="Equity against its own running maximum. The minimum of this path is the maximum drawdown reported above — the same definition, not a second one."
    >
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--down)" stopOpacity={0.02} />
                <stop offset="100%" stopColor="var(--down)" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={axis} minTickGap={28} />
            <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                   tickLine={false} axisLine={false} width={56} tick={axis} />
            <Tooltip content={<TinyTooltip format={(v) => pct(v ?? null)} />}
                     cursor={{ stroke: "var(--hairline)" }} />
            <Area type="linear" dataKey="drawdown" stroke="var(--down)"
                  strokeWidth={1.5} fill="url(#ddFill)" dot={false}
                  connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function RollingSharpe({ analytics }: { analytics: AnalyticsPayload }) {
  const windows = Object.keys(analytics.rolling_sharpe).sort(
    (a, b) => Number(a) - Number(b),
  );
  if (windows.length === 0) {
    return (
      <Panel title="Rolling Sharpe">
        <p className="text-[12px] text-fg-muted">
          No window has enough sessions yet
          {analytics.rolling_windows_withheld?.length
            ? ` (withheld: ${analytics.rolling_windows_withheld.join(", ")} sessions)`
            : ""}
          .
        </p>
      </Panel>
    );
  }
  const primary = windows[0];
  const data = analytics.rolling_sharpe[primary];
  return (
    <Panel
      title={`Rolling Sharpe (${primary} sessions)`}
      note="Excess of the risk-free rate, annualised, recomputed on each trailing window by the same function that produces the headline Sharpe."
    >
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={axis} minTickGap={28} />
            <YAxis tickLine={false} axisLine={false} width={56} tick={axis} />
            <Tooltip content={<TinyTooltip format={(v) => ratio(v ?? null)} />}
                     cursor={{ stroke: "var(--hairline)" }} />
            <Line type="linear" dataKey="sharpe" stroke="var(--accent)"
                  strokeWidth={1.5} dot={false} connectNulls={false}
                  isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthlyTable({ analytics }: { analytics: AnalyticsPayload }) {
  const rows = analytics.monthly_returns;
  if (rows.length === 0) return null;
  const years = [...new Set(rows.map((r) => r.year))].sort();
  return (
    <Panel
      title="Monthly returns"
      note="A month with fewer than 15 sessions is marked partial — a three-day August printed beside a full July invites a comparison that is not there."
    >
      <div className="scroll-x">
        <table className="w-full min-w-[620px] text-[12px]">
          <thead>
            <tr className="text-[11px] text-fg-faint">
              <th className="text-left font-normal pb-2">Year</th>
              {MONTHS.map((m) => (
                <th key={m} className="text-right font-normal pb-2">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year} className="border-t hairline">
                <td className="py-2 tnum text-fg-muted">{year}</td>
                {MONTHS.map((_, i) => {
                  const cell = rows.find(
                    (r) => r.year === year && r.month === i + 1,
                  );
                  if (!cell) {
                    return <td key={i} className="py-2 text-right text-fg-faint">—</td>;
                  }
                  const colour =
                    (cell.return ?? 0) > 0
                      ? "text-up"
                      : (cell.return ?? 0) < 0
                        ? "text-down"
                        : "text-fg-muted";
                  return (
                    <td key={i} className={`py-2 text-right tnum ${colour}`}>
                      {signedPct(cell.return)}
                      {cell.partial && (
                        <span className="text-fg-faint">*</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.some((r) => r.partial) && (
        <p className="mt-2 text-[11px] text-fg-faint">* partial month</p>
      )}
    </Panel>
  );
}

function Distribution({ analytics }: { analytics: AnalyticsPayload }) {
  const bins = analytics.distribution?.bins ?? [];
  if (bins.length === 0) return null;
  const data = bins.map((b) => ({
    label: `${(b.from * 100).toFixed(2)}%`,
    from: b.from,
    count: b.count,
  }));
  return (
    <Panel
      title="Distribution of daily returns"
      note="The raw shape behind skew and kurtosis — how fat the tails actually are, rather than a single moment describing them."
    >
      <div style={{ width: "100%", height: 180 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis}
                   minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} width={40} tick={axis}
                   allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--bg-subtle)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="border hairline bg-bg-raised px-2.5 py-1.5 text-[12px]">
                    <div className="text-fg-faint text-[11px]">from {label}</div>
                    <div className="tnum font-medium">
                      {payload[0].value} session
                      {payload[0].value === 1 ? "" : "s"}
                    </div>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="count" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label}
                      fill={d.from >= 0 ? "var(--up)" : "var(--down)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function DrawdownEpisodes({ analytics }: { analytics: AnalyticsPayload }) {
  const rows = analytics.drawdown_episodes;
  if (rows.length === 0) return null;
  return (
    <Panel
      title="Worst drawdowns"
      note="A single maximum-drawdown number hides whether it was one bad week or nine months under water. These are the episodes."
    >
      <div className="scroll-x">
        <table className="w-full min-w-[560px] text-[13px]">
          <thead>
            <tr className="text-[11px] text-fg-faint">
              <th className="text-left font-normal pb-2">Started</th>
              <th className="text-left font-normal pb-2">Trough</th>
              <th className="text-left font-normal pb-2">Recovered</th>
              <th className="text-right font-normal pb-2">Depth</th>
              <th className="text-right font-normal pb-2">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.start} className="border-t hairline">
                <td className="py-2 tnum">{date(e.start)}</td>
                <td className="py-2 tnum text-fg-muted">{date(e.trough)}</td>
                <td className="py-2 tnum text-fg-muted">
                  {e.ongoing ? "ongoing" : date(e.recovered)}
                </td>
                <td className="py-2 text-right tnum text-down">{pct(e.depth)}</td>
                <td className="py-2 text-right tnum text-fg-muted">{e.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

const SUMMARY_ROWS: [string, string, "pct" | "ratio"][] = [
  ["sharpe", "Sharpe (excess of cash)", "ratio"],
  ["sharpe_gross", "Sharpe (gross)", "ratio"],
  ["sharpe_autocorr_adj", "Sharpe, autocorrelation-adjusted", "ratio"],
  ["sortino", "Sortino", "ratio"],
  ["calmar", "Calmar", "ratio"],
  ["cagr", "CAGR", "pct"],
  ["volatility", "Volatility (annualised)", "pct"],
  ["max_drawdown", "Maximum drawdown", "pct"],
  ["var_normal_95", "VaR 95% (daily, Gaussian)", "pct"],
  ["win_rate", "Win rate", "pct"],
  ["skew", "Skew", "ratio"],
  ["kurtosis", "Excess kurtosis", "ratio"],
  ["ev_excess_annual", "Expected excess return (annualised)", "pct"],
];

function SummaryTable({ analytics }: { analytics: AnalyticsPayload }) {
  const s = analytics.summary ?? {};
  if (Object.keys(s).length === 0) return null;
  return (
    <Panel title="Full statistics">
      <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-3 text-[13px] max-w-[820px]">
        {SUMMARY_ROWS.filter(([k]) => s[k] !== undefined).map(([k, label, kind]) => (
          <div key={k} className="flex justify-between gap-6 border-b hairline pb-2">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="tnum">
              {kind === "pct" ? pct(s[k]) : ratio(s[k])}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
