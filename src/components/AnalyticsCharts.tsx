"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPayload, RollingPoint } from "@/lib/data";
import { useNarrow } from "@/lib/useNarrow";
import { date, pct, ratio, signedPct } from "@/lib/format";

/**
 * The chart suite under the ledger, drawn from series the desk computed -
 * including the rolling windows. A withheld chart keeps its frame and states the
 * threshold rather than disappearing.
 */
export function AnalyticsCharts({
  analytics,
}: {
  analytics: AnalyticsPayload | null;
}) {
  if (!analytics) return null;
  const held = analytics.gated
    ? `withheld · ${analytics.sessions}/${analytics.min_sessions_for_annualised} sessions`
    : undefined;

  return (
    <div className="mt-10 grid xl:grid-cols-2 gap-x-12 gap-y-10">
      <DailyBars analytics={analytics} />
      <DrawdownPath analytics={analytics} />
      <Rolling
        title="Rolling Sharpe"
        note="Excess of cash, annualised, over a trailing window."
        series={analytics.rolling_sharpe}
        held={held}
        format={(v) => ratio(v)}
      />
      <Rolling
        title="Rolling volatility"
        note="Annualised standard deviation over the same window."
        series={analytics.rolling_volatility}
        held={held}
        format={(v) => pct(v)}
        asPercent
      />
      <Rolling
        title="Rolling Sortino"
        note="Downside deviation only — a violent good month is not penalised like a bad one."
        series={analytics.rolling_sortino}
        held={held}
        format={(v) => ratio(v)}
      />
      <Distribution analytics={analytics} />
      <Quantiles analytics={analytics} />
      <MonthlyHeatmap analytics={analytics} />
      <div className="xl:col-span-2">
        <DrawdownEpisodes analytics={analytics} />
      </div>
    </div>
  );
}

function Plot({
  title,
  note,
  held,
  empty,
  children,
}: {
  title: string;
  note?: string;
  held?: string;
  empty?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <figure className="m-0">
      <figcaption>
        <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
        {note && (
          <p className="mt-1 text-[11.5px] text-fg-muted leading-relaxed">{note}</p>
        )}
      </figcaption>
      <div className="mt-3">
        {held || empty ? (
          <div className="flex items-center justify-center border hairline text-[12px] text-fg-faint h-[150px] sm:h-[176px] px-4 text-center">
            {held ?? "not enough sessions yet"}
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  );
}

const axis = { fill: "var(--fg-faint)", fontSize: 11 };
const axisNarrow = { fill: "var(--fg-faint)", fontSize: 10 };

/** One chart box. Shorter on a phone; the axis gutter shrinks with it. */
function ChartBox({ children }: { children: React.ReactNode }) {
  return <div className="w-full h-[150px] sm:h-[176px]">{children}</div>;
}
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
  payload?: { value?: number | null }[];
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
  const narrow = useNarrow();
  const data = analytics.daily_returns.filter((d) => d.return !== null);
  return (
    <Plot
      title="Daily returns"
      note="Every session since inception. Not gated — this is what happened, not an estimate of anything."
      empty={data.length === 0}
    >
      <ChartBox>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={narrow ? axisNarrow : axis} minTickGap={narrow ? 52 : 30} />
            <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(narrow ? 1 : 2)}%`}
                   tickLine={false} axisLine={false} width={narrow ? 40 : 58} tick={narrow ? axisNarrow : axis} />
            <Tooltip content={<TinyTooltip format={(v) => signedPct(v ?? null, 3)} />}
                     cursor={{ fill: "var(--bg-subtle)" }} />
            <ReferenceLine y={0} stroke="var(--hairline)" />
            <Bar dataKey="return" isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.date}
                      fill={(d.return ?? 0) >= 0 ? "var(--up)" : "var(--down)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartBox>
    </Plot>
  );
}

function DrawdownPath({ analytics }: { analytics: AnalyticsPayload }) {
  const narrow = useNarrow();
  const data = analytics.drawdown.filter((d) => d.drawdown !== null);
  return (
    <Plot
      title="Drawdown"
      note="Equity against its own running maximum. The minimum of this path is the maximum drawdown in the ledger — the same definition, not a second one."
      empty={data.length === 0}
    >
      <ChartBox>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--down)" stopOpacity={0.02} />
                <stop offset="100%" stopColor="var(--down)" stopOpacity={0.18} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={narrow ? axisNarrow : axis} minTickGap={narrow ? 52 : 30} />
            <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(narrow ? 1 : 2)}%`}
                   tickLine={false} axisLine={false} width={narrow ? 40 : 58} tick={narrow ? axisNarrow : axis} />
            <Tooltip content={<TinyTooltip format={(v) => pct(v ?? null, 3)} />}
                     cursor={{ stroke: "var(--hairline)" }} />
            <Area type="linear" dataKey="drawdown" stroke="var(--down)"
                  strokeWidth={1.4} fill="url(#ddFill)" dot={false}
                  connectNulls={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartBox>
    </Plot>
  );
}

function Rolling({
  title,
  note,
  series,
  held,
  format,
  asPercent = false,
}: {
  title: string;
  note: string;
  series: Record<string, RollingPoint[]>;
  held?: string;
  format: (v: number | null) => string;
  asPercent?: boolean;
}) {
  const narrow = useNarrow();
  const windows = Object.keys(series ?? {}).sort((a, b) => Number(a) - Number(b));
  const data = windows.length > 0 ? series[windows[0]] : [];
  return (
    <Plot
      title={windows.length ? `${title} · ${windows[0]} sessions` : title}
      note={note}
      held={held}
      empty={data.length === 0}
    >
      <ChartBox>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tickFormatter={fmtDay} tickLine={false}
                   axisLine={false} tick={narrow ? axisNarrow : axis} minTickGap={narrow ? 52 : 30} />
            <YAxis
              tickFormatter={(v: number) =>
                asPercent ? `${(v * 100).toFixed(1)}%` : v.toFixed(1)}
              tickLine={false} axisLine={false} width={narrow ? 40 : 58} tick={narrow ? axisNarrow : axis} />
            <Tooltip content={<TinyTooltip format={(v) => format(v ?? null)} />}
                     cursor={{ stroke: "var(--hairline)" }} />
            <ReferenceLine y={0} stroke="var(--hairline)" />
            <Line type="linear" dataKey="value" stroke="var(--accent)"
                  strokeWidth={1.4} dot={false} connectNulls={false}
                  isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
    </Plot>
  );
}

function Distribution({ analytics }: { analytics: AnalyticsPayload }) {
  const narrow = useNarrow();
  const bins = analytics.distribution?.bins ?? [];
  const data = bins.map((b) => ({
    label: `${(b.from * 100).toFixed(2)}%`,
    from: b.from,
    count: b.count,
  }));
  return (
    <Plot
      title="Distribution of daily returns"
      note="The raw shape behind skew and kurtosis — how fat the tails are, rather than one number describing them."
      empty={data.length === 0}
    >
      <ChartBox>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 6, bottom: 0, left: 0 }}>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={narrow ? axisNarrow : axis}
                   minTickGap={narrow ? 40 : 18} />
            <YAxis tickLine={false} axisLine={false} width={narrow ? 30 : 40} tick={narrow ? axisNarrow : axis}
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
      </ChartBox>
    </Plot>
  );
}

/** Quantile spread per horizon, drawn with plain elements: it is five numbers
 *  per row, and a chart library's box plot needs a candlestick shim to exist. */
function Quantiles({ analytics }: { analytics: AnalyticsPayload }) {
  const rows = analytics.quantiles ?? [];
  const span = Math.max(
    ...rows.flatMap((r) => [Math.abs(r.min ?? 0), Math.abs(r.max ?? 0)]),
    0.0001,
  );
  const x = (v: number) => (v / span) * 50 + 50;
  return (
    <Plot
      title="Return spread by horizon"
      note="Where the shape changes with horizon — a book that looks calm daily and lumpy monthly gives itself away here. Whiskers are min and max; the box is the interquartile range; the line is the median."
      empty={rows.length === 0}
    >
      <div className="space-y-4 pt-1">
        {rows.map((r) => (
          <div key={r.horizon}>
            <div className="flex items-baseline justify-between text-[11.5px] mb-1.5">
              <span className="text-fg-muted">
                {r.horizon}
                <span className="text-fg-faint"> · {r.n} observations</span>
              </span>
              <span className="tnum text-fg-faint">
                {signedPct(r.min, 2)} … {signedPct(r.max, 2)}
              </span>
            </div>
            <div className="relative h-5 border-b hairline">
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{ left: "50%", background: "var(--hairline)" }}
              />
              <div
                className="absolute top-1/2 h-px"
                style={{
                  left: `${x(r.min ?? 0)}%`,
                  width: `${x(r.max ?? 0) - x(r.min ?? 0)}%`,
                  background: "var(--bench)",
                }}
              />
              <div
                className="absolute top-1 bottom-1 border hairline"
                style={{
                  left: `${x(r.q25 ?? 0)}%`,
                  width: `${Math.max(x(r.q75 ?? 0) - x(r.q25 ?? 0), 0.4)}%`,
                  background: "var(--bg-subtle)",
                }}
              />
              <div
                className="absolute top-0.5 bottom-0.5 w-px"
                style={{ left: `${x(r.median ?? 0)}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </Plot>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthlyHeatmap({ analytics }: { analytics: AnalyticsPayload }) {
  const rows = analytics.monthly_returns ?? [];
  const years = [...new Set(rows.map((r) => r.year))].sort();
  const peak = Math.max(...rows.map((r) => Math.abs(r.return ?? 0)), 0.0001);

  return (
    <Plot
      title="Monthly returns"
      note="Shaded against the largest month so far. A month with fewer than 15 sessions is marked partial — a three-day August beside a full July invites a comparison that is not there."
      empty={rows.length === 0}
    >
      <div className="scroll-x">
        <table className="w-full min-w-[540px] text-[11.5px]">
          <thead>
            <tr className="text-fg-faint">
              <th className="text-left font-normal pb-1.5">Year</th>
              {MONTHS.map((m) => (
                <th key={m} className="text-right font-normal pb-1.5">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year}>
                <td className="py-1 tnum text-fg-muted pr-2">{year}</td>
                {MONTHS.map((_, i) => {
                  const cell = rows.find((r) => r.year === year && r.month === i + 1);
                  if (!cell || cell.return === null) {
                    return <td key={i} className="py-1 text-right text-fg-faint">·</td>;
                  }
                  const intensity = Math.min(Math.abs(cell.return) / peak, 1) * 20;
                  return (
                    <td
                      key={i}
                      className="py-1 px-1 text-right tnum"
                      style={{
                        background: `color-mix(in srgb, var(--${
                          cell.return >= 0 ? "up" : "down"
                        }) ${intensity.toFixed(0)}%, transparent)`,
                      }}
                      title={
                        cell.partial ? `${cell.sessions} sessions (partial)` : undefined
                      }
                    >
                      {signedPct(cell.return, 2)}
                      {cell.partial && <span className="text-fg-faint">*</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plot>
  );
}

function DrawdownEpisodes({ analytics }: { analytics: AnalyticsPayload }) {
  const rows = analytics.drawdown_episodes ?? [];
  return (
    <Plot
      title="Worst drawdowns"
      note="A single maximum-drawdown number hides whether it was one bad week or nine months under water."
      empty={rows.length === 0}
    >
      <div className="scroll-x">
        <table className="w-full sm:min-w-[540px] text-[13px]">
          <thead>
            <tr className="text-[11.5px] text-fg-faint">
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
                <td className="py-2 text-right tnum text-down">{pct(e.depth, 3)}</td>
                <td className="py-2 text-right tnum text-fg-muted">{e.sessions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Plot>
  );
}
