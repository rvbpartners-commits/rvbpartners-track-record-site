import { direction, NO_VALUE } from "@/lib/format";

/**
 * A KPI card: label, big value, and the change beneath in green or red.
 *
 * The third state matters as much as up and down. When the desk withholds a
 * statistic (too little history), the card does NOT show a dash and move on —
 * it shows *why*, in place of the number, at full contrast. A greyed-out "—"
 * reads as "zero" or "loading"; "insufficient history — 2/60" reads as a
 * decision somebody made, which is what it is.
 */
export function Kpi({
  label,
  value,
  change,
  changeLabel,
  gatedNote,
  hint,
}: {
  label: string;
  value: string;
  change?: number | null;
  changeLabel?: string;
  gatedNote?: string;
  hint?: string;
}) {
  const dir = direction(change);
  const colour =
    dir === "up" ? "text-up" : dir === "down" ? "text-down" : "text-fg-faint";

  return (
    <div className="min-w-0">
      <div className="text-[11px] text-fg-faint">
        {label}
      </div>

      {gatedNote ? (
        <>
          <div className="mt-2 text-[15px] leading-snug text-warn-fg font-medium">
            {gatedNote}
          </div>
          <div className="mt-1 text-[12px] text-fg-faint">
            withheld until there is enough history
          </div>
        </>
      ) : (
        <>
          <div className="mt-2 text-[26px] sm:text-[30px] font-semibold tracking-tight tnum leading-none">
            {value}
          </div>
          {change !== undefined && (
            <div className={`mt-2 text-[13px] font-medium tnum ${colour}`}>
              {changeLabel ?? NO_VALUE}
            </div>
          )}
          {hint && <div className="mt-1 text-[12px] text-fg-faint">{hint}</div>}
        </>
      )}
    </div>
  );
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
      {children}
    </div>
  );
}
