"use client";

import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNarrow } from "@/lib/useNarrow";

export type ChartPoint = {
  /** ISO instant for intraday points, ISO date for daily ones. */
  t: string;
  /** Session date, for axis labelling and tooltips. */
  date: string;
  book: number | null;
  spy: number | null;
  cash: number | null;
  /** Set only on the last point of each session — the official published NAV. */
  close: number | null;
};

const fmtPct = (v: number) => `${(v * 100).toFixed(3)}%`;

const fmtDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

const fmtInstant = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fmtDay(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
};

function ChartTooltip({
  active,
  payload,
  label,
  granular,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string }[];
  label?: string;
  granular: boolean;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.name !== "Session close");
  return (
    <div className="border hairline bg-bg-raised px-3 py-2">
      <div className="text-[11px] text-fg-faint mb-1.5">
        {label ? (granular ? fmtInstant(label) : fmtDay(label)) : ""}
        {granular && <span className="ml-1">ET</span>}
      </div>
      {rows.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-3 text-[12px] tnum leading-5"
        >
          <span
            className="inline-block h-[2px] w-3"
            style={{ background: entry.color }}
          />
          <span className="text-fg-muted">{entry.name}</span>
          <span className="ml-auto font-medium">
            {/* A null is a gap in the published series, not a zero — rendered as
                absent for the same reason the line breaks. */}
            {entry.value === null || entry.value === undefined
              ? "—"
              : fmtPct(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Cumulative return, drawn from the broker's 5-minute equity.
 *
 * `type="linear"` not `"monotone"`: a spline invents a path between marks.
 *
 * `connectNulls` is off on EVERY series, benchmarks included. Bridging a gap
 * draws a straight line across a period nothing was measured for, which is
 * exactly how a benchmark missing its older history renders as a flat line that
 * looks like real data. A gap has to look like a gap.
 * Session closes are dotted separately - the official NAV and the broker's 16:00
 * figure differ by a few basis points and neither is adjusted onto the other.
 */
export function PerformanceChart({
  data,
  granular,
}: {
  data: ChartPoint[];
  granular: boolean;
}) {
  const narrow = useNarrow();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-fg-faint h-[220px] sm:h-[340px]">
        No published sessions yet.
      </div>
    );
  }

  return (
    <div className="w-full h-[220px] sm:h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="bookFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.16} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="t"
            tickFormatter={fmtDay}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
            minTickGap={narrow ? 60 : 44}
          />
          <YAxis
            tickFormatter={(v: number) =>
              `${(v * 100).toFixed(narrow ? 1 : 2)}%`}
            tickLine={false}
            axisLine={false}
            width={narrow ? 42 : 62}
            tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
          />
          <Tooltip
            content={<ChartTooltip granular={granular} />}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
          />

          <Area
            type="linear"
            dataKey="book"
            name="Portfolio"
            stroke="var(--accent)"
            strokeWidth={1.6}
            fill="url(#bookFill)"
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="spy"
            name="S&P 500 (SPY, total return)"
            stroke="var(--bench)"
            strokeWidth={1.3}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="cash"
            name="Cash at the risk-free rate"
            stroke="var(--bench)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="close"
            name="Session close"
            stroke="none"
            legendType="none"
            dot={{ r: 2.6, fill: "var(--accent)", stroke: "none" }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-1 sm:gap-y-1.5 text-[11.5px] sm:text-[12px] text-fg-muted">
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-[2px] w-4" style={{ background: "var(--accent)" }} />
        Portfolio
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block w-[6px] h-[6px] rounded-full"
          style={{ background: "var(--accent)" }}
        />
        Session close
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-block h-[2px] w-4" style={{ background: "var(--bench)" }} />
        S&amp;P 500
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block w-4"
          style={{
            height: 1,
            backgroundImage:
              "repeating-linear-gradient(to right, var(--bench) 0 3px, transparent 3px 6px)",
          }}
        />
        Cash
      </span>
    </div>
  );
}
