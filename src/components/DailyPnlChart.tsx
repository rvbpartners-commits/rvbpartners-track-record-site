"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/data";
import { useNarrow } from "@/lib/useNarrow";

/**
 * The daily result, and its running total.
 *
 * Two charts rather than one, because they answer two questions that a single
 * axis cannot hold together: "what happened on this day" and "where does the
 * book stand". The bars are the answer to the first — a day that did nothing is
 * a bar of zero height sitting on the axis, present and legible, which is the
 * whole point of publishing every calendar day rather than only the days that
 * traded.
 *
 * The percentage toggle divides the running total by the capital at inception.
 * It is a reading axis, NOT a metric: it does not compound, and it is not the
 * time-weighted return published above. Labelling it plainly is cheaper than
 * having a reader discover the difference themselves.
 */

const fmtDay = (v: string) => {
  const [, m, d] = v.split("-");
  return `${d}/${m}`;
};

type Mode = "usd" | "pct";

export function DailyPnlChart({
  data,
  currency,
  initialCapital,
}: {
  data: DailyPoint[];
  currency: string;
  initialCapital: number | null;
}) {
  const narrow = useNarrow();
  const [mode, setMode] = useState<Mode>("usd");

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[13px] text-fg-faint h-[200px]">
        No daily series published for this book.
      </div>
    );
  }

  const pct = mode === "pct" && initialCapital ? 1 / initialCapital : null;
  const cumulative = data.map((d) => ({
    date: d.date,
    value: d.cumulative === null ? null : pct ? d.cumulative * pct : d.cumulative,
  }));

  const fmtValue = (v: number) =>
    pct ? `${(v * 100).toFixed(2)}%` : `${v.toFixed(2)}`;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight mb-3">
          Daily result{" "}
          <span className="font-normal text-fg-faint">({currency})</span>
        </h3>
        <div className="w-full h-[150px] sm:h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDay}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
                minTickGap={narrow ? 26 : 16}
              />
              <YAxis
                tickFormatter={(v: number) => v.toFixed(1)}
                tickLine={false}
                axisLine={false}
                width={narrow ? 34 : 46}
                tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
              />
              <Tooltip
                cursor={{ fill: "var(--hairline)", fillOpacity: 0.35 }}
                content={<DayTooltip currency={currency} />}
              />
              <ReferenceLine y={0} stroke="var(--fg-faint)" strokeDasharray="3 3" />
              <Bar dataKey="pnl" isAnimationActive={false} maxBarSize={narrow ? 8 : 14}>
                {/* La couleur se decide par barre, et `Cell` est la seule
                    facon dont recharts la prend. Vert au-dessus de zero, rouge
                    en dessous -- meme convention de signe que partout ailleurs
                    sur le site. */}
                {data.map((d) => (
                  <Cell
                    key={d.date}
                    fill={(d.pnl ?? 0) >= 0 ? "var(--up)" : "var(--down)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4 mb-3">
          <h3 className="text-[13px] font-semibold tracking-tight">
            Cumulative result
          </h3>
          <div className="flex items-center gap-1 text-[11.5px]">
            <Toggle active={mode === "usd"} onClick={() => setMode("usd")}>
              {currency}
            </Toggle>
            <Toggle
              active={mode === "pct"}
              onClick={() => setMode("pct")}
              disabled={!initialCapital}
            >
              %
            </Toggle>
          </div>
        </div>
        <div className="w-full h-[180px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={cumulative}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDay}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
                minTickGap={narrow ? 26 : 16}
              />
              <YAxis
                tickFormatter={fmtValue}
                tickLine={false}
                axisLine={false}
                width={narrow ? 44 : 62}
                tick={{ fill: "var(--fg-faint)", fontSize: narrow ? 10 : 11 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--hairline)", strokeWidth: 1 }}
                content={
                  <CumulativeTooltip
                    fmt={fmtValue}
                    currency={pct ? "" : currency}
                  />
                }
              />
              <ReferenceLine y={0} stroke="var(--fg-faint)" strokeDasharray="3 3" />
              <Line
                type="linear"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={1.6}
                dot={{ r: 2, fill: "var(--accent)", stroke: "none" }}
                activeDot={{ r: 3.5 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-[3px] rounded-[3px] border hairline transition-colors ${
        active ? "text-fg bg-[var(--hairline)]" : "text-fg-faint hover:text-fg-muted"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function DayTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { value: number | null }[];
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const v = payload[0]?.value;
  return (
    <Panel date={label}>
      <span className="tnum">
        {v === null || v === undefined
          ? "—"
          : `${v >= 0 ? "+" : ""}${v.toFixed(4)} ${currency}`}
      </span>
    </Panel>
  );
}

function CumulativeTooltip({
  active,
  payload,
  label,
  fmt,
  currency,
}: {
  active?: boolean;
  payload?: { value: number | null }[];
  label?: string;
  fmt: (v: number) => string;
  currency: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const v = payload[0]?.value;
  return (
    <Panel date={label}>
      <span className="tnum">
        {v === null || v === undefined
          ? "—"
          : `${v >= 0 ? "+" : ""}${fmt(v)}${currency ? ` ${currency}` : ""}`}
      </span>
    </Panel>
  );
}

function Panel({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[4px] border hairline bg-bg px-3 py-2 text-[12px] shadow-sm">
      <div className="text-fg-faint text-[11px]">{date}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
