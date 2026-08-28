import type { Exposure } from "@/lib/data";
import { date } from "@/lib/format";

/**
 * What "composition" means for a book that does not hold anything for long.
 *
 * An equity portfolio publishes its positions grouped by style, because "what
 * does this portfolio hold" is a question with an answer. This one holds a
 * position for minutes and is flat most of the time: a holdings table would be
 * empty on almost every session, and an empty table reads as "nothing to show"
 * rather than as the answer to a question that does not apply.
 *
 * The question that does apply: how much of the time is this book exposed, and
 * was it exposed at the last close. Every figure below is published data.
 *
 * The instrument, the venues and the size are not here, and will not be: they
 * are the strategy.
 */
export function ExposureSection({ exposure }: { exposure: Exposure }) {
  const flat = exposure.sessions_flat_at_close;
  const checked = exposure.sessions_checked;
  const carried = exposure.carried_past_close ?? [];

  return (
    <>
      <p className="text-[13px] text-fg-muted mb-6">{exposure.structure}.</p>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
        <Stat
          label="Sessions traded"
          value={`${exposure.sessions_traded} of ${exposure.sessions_published}`}
          note="counted from executions, not from non-zero returns"
        />
        <Stat
          label="Flat at the close"
          value={`${flat} of ${checked}`}
          note={checked ? `${((flat / checked) * 100).toFixed(0)}% of published sessions` : undefined}
        />
        <Stat
          label="Median time in a position"
          value={duration(exposure.median_holding_seconds)}
          note="per round trip"
        />
      </dl>

      <div className="mt-9">
        <h3 className="text-[13px] font-semibold tracking-tight mb-3">
          Positions carried past a close
        </h3>
        {carried.length === 0 ? (
          <p className="text-[13px] text-fg-muted">
            None. Every published session ended with no open exposure on either
            venue.
          </p>
        ) : (
          <div className="scroll-x">
            <table className="w-full sm:min-w-[420px] max-w-[560px] text-[13px]">
              <thead>
                <tr className="text-[11.5px] text-fg-faint">
                  <th className="text-left font-normal pb-2">Session</th>
                  <th className="text-right font-normal pb-2">Unmatched tickets</th>
                  <th className="text-right font-normal pb-2">Net volume</th>
                </tr>
              </thead>
              <tbody>
                {carried.map((x) => (
                  <tr key={x.session} className="border-t hairline">
                    <td className="py-2">{date(x.session)}</td>
                    <td className="py-2 text-right tnum text-fg-muted">
                      {x.tickets}
                    </td>
                    <td className="py-2 text-right tnum">
                      {x.net_volume > 0 ? "+" : ""}
                      {x.net_volume}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-[12.5px] leading-relaxed text-fg-muted max-w-[72ch]">
          {exposure.note}. A position still open at a close carries the only
          market risk in the book and none of the published profit: it is
          disclosed here and marked nowhere, and its result appears on the
          session it is closed out against.
        </p>
      </div>
    </>
  );
}

/** Minutes up to two hours, then hours. "5575 s" is a number the reader has to
 *  divide themselves, and "1.5 h" throws away the precision that makes a
 *  93-minute median mean something on a book whose whole point is being brief. */
function duration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = seconds / 60;
  if (minutes < 120) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-fg-faint">{label}</dt>
      <dd className="mt-1 text-[17px] tnum tracking-tight">{value}</dd>
      {note && <div className="text-[11.5px] text-fg-faint mt-0.5">{note}</div>}
    </div>
  );
}
