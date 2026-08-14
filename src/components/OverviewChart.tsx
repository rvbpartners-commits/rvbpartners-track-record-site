"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IntradayPoint, NavPoint } from "@/lib/data";
import { useNarrow } from "@/lib/useNarrow";

export const SERIES_COLOURS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];

export type OverviewSeries = {
  book: string;
  label: string;
  nav: NavPoint[];
  intraday: IntradayPoint[];
};

type Row = { t: string; [book: string]: string | number | null };

const fmtDay = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

/**
 * Cumulative return for every portfolio on one set of axes.
 *
 * Each line is rebased on its OWN inception equity, which is what makes four
 * accounts of different sizes comparable at all — and is why this chart shows
 * return and never money.
 *
 * The x-axis is the union of every book's reading instants rather than one
 * book's. Keying off a single book would silently truncate the others the day
 * an account opens later or misses a session, and the missing stretch would
 * look like flat performance instead of absence.
 */
function buildRows(series: OverviewSeries[]): Row[] {
  const byInstant = new Map<string, Row>();

  for (const s of series) {
    const base = s.nav.length > 0 ? s.nav[0].equity : 0;
    if (!base) continue;

    // Intraday where the broker gave it to us, the daily marks otherwise. Never
    // both for one book: mixing resolutions puts two points of different
    // meaning on one line.
    const points = s.intraday.length
      ? s.intraday.map((p) => ({ t: p.timestamp, equity: p.equity }))
      : s.nav.map((p) => ({ t: p.date, equity: p.equity }));

    for (const p of points) {
      const row = byInstant.get(p.t) ?? { t: p.t };
      row[s.book] = p.equity / base - 1;
      byInstant.set(p.t, row);
    }
  }

  return [...byInstant.values()].sort((a, b) => (a.t < b.t ? -1 : 1));
}

function OverviewTooltip({
  active,
  payload,
  label,
  labels,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | null; color?: string }[];
  label?: string;
  labels: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border hairline bg-bg-raised px-3 py-2">
      <div className="text-[11px] text-fg-faint mb-1.5">
        {label ? fmtDay(label) : ""}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-3 text-[12px] tnum leading-5"
        >
          <span
            className="inline-block h-[2px] w-3"
            style={{ background: entry.color }}
          />
          <span className="text-fg-muted">
            {labels.get(String(entry.name)) ?? entry.name}
          </span>
          <span className="ml-auto font-medium">
            {entry.value === null || entry.value === undefined
              ? "—"
              : `${(entry.value * 100).toFixed(2)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OverviewChart({ series }: { series: OverviewSeries[] }) {
  const narrow = useNarrow();
  const rows = useMemo(() => buildRows(series), [series]);
  const labels = useMemo(
    () => new Map(series.map((s) => [s.book, s.label])),
    [series],
  );

  // One tick per session, placed on that session's first instant. Left to pick
  // its own ticks on a category axis of 5-minute instants, recharts spaces them
  // evenly by index and lands two of them inside the same day — an axis reading
  // "11 Aug · 11 Aug · 13 Aug · 13 Aug", which looks like a duplicated day
  // rather than the intraday resolution it actually is.
  const ticks = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of rows) {
      const day = String(r.t).slice(0, 10);
      if (!seen.has(day)) {
        seen.add(day);
        out.push(String(r.t));
      }
    }
    return out;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-fg-faint h-[260px] lg:h-[380px]">
        No published sessions yet.
      </div>
    );
  }

  return (
    <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="t"
            ticks={ticks}
            tickFormatter={fmtDay}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
            minTickGap={narrow ? 56 : 24}
          />
          <YAxis
            tickFormatter={(v: number) => `${(v * 100).toFixed(narrow ? 1 : 2)}%`}
            tickLine={false}
            axisLine={false}
            width={narrow ? 42 : 58}
            tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
          />
          <Tooltip
            content={<OverviewTooltip labels={labels} />}
            cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
          />
          {series.map((s, i) => (
            <Line
              key={s.book}
              type="linear"
              dataKey={s.book}
              name={s.book}
              stroke={SERIES_COLOURS[i % SERIES_COLOURS.length]}
              strokeWidth={1.4}
              dot={false}
              activeDot={{ r: 3 }}
              // A gap is a period we did not measure. Bridging it draws a
              // straight line through nothing and reads as real, flat data.
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OverviewLegend({ series }: { series: OverviewSeries[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] sm:text-[12px] text-fg-muted">
      {series.map((s, i) => (
        <span key={s.book} className="inline-flex items-center gap-2">
          <span
            className="inline-block h-[2px] w-4"
            style={{ background: SERIES_COLOURS[i % SERIES_COLOURS.length] }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}
