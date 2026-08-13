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

export type ChartPoint = {
  date: string;
  book: number | null;
  spy: number | null;
  cash: number | null;
};

const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;

const fmtAxisDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border hairline bg-bg-raised px-3 py-2 shadow-sm">
      <div className="text-[11px] text-fg-faint mb-1.5">
        {label ? fmtAxisDate(label) : ""}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-3 text-[12px] tnum leading-5"
        >
          <span
            className="inline-block h-[2px] w-3 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-fg-muted">{entry.name}</span>
          <span className="ml-auto font-medium">
            {/* A null is a gap in the published series, not a zero — it is
                rendered as absent here for the same reason the line breaks. */}
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
 * Cumulative return: the book as a filled area, the benchmarks as thin lines.
 *
 * `connectNulls` is deliberately OFF. If the desk was down and a session has no
 * value, the line breaks there. Bridging the gap would draw a performance path
 * that was never measured — the one thing a track record chart must not do.
 */
export function PerformanceChart({
  data,
  height = 320,
}: {
  data: ChartPoint[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[13px] text-fg-faint"
        style={{ height }}
      >
        No published sessions yet.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="bookFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tickFormatter={fmtAxisDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--fg-faint)", fontSize: 11 }}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--fg-faint)", fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="book"
            name="Portfolio"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="url(#bookFill)"
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="spy"
            name="SPY total return"
            stroke="var(--bench)"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="cash"
            name="Cash (risk-free)"
            stroke="var(--bench)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
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
    <div className="flex flex-wrap items-center gap-5 text-[12px] text-fg-muted">
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-[2px] w-4 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        Portfolio
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-[2px] w-4 rounded-full"
          style={{ background: "var(--bench)" }}
        />
        SPY total return
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          className="inline-block h-[1px] w-4"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, var(--bench) 0 3px, transparent 3px 6px)",
            height: 1,
          }}
        />
        Cash (risk-free)
      </span>
    </div>
  );
}
