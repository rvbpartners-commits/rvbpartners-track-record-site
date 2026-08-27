import type { BookEvent } from "@/lib/data";

/**
 * The operational log.
 *
 * A curve that dips does not say whether the strategy lost money or the machine
 * was switched off, and those are not the same fact about a track record. What
 * is published here is availability — outages, restarts, maintenance — because
 * a reader is owed it.
 *
 * What is NOT published is any parameter VALUE. Two entries in the operator's
 * own log named a grid and a clip size; they appear here as "parameter change"
 * with no number, because those numbers are the strategy itself. The date and
 * the fact that something changed are disclosure; the value would be
 * publication.
 *
 * An entry with no date is a standing rule. It has no position on the curve, so
 * it produces no marker and appears here only.
 */
const TONE: Record<string, string> = {
  inception: "text-accent",
  outage: "text-down",
  maintenance: "text-fg-muted",
  parameter: "text-fg-muted",
  policy: "text-fg-faint",
};

export function EventLog({ events }: { events: BookEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] text-fg-faint">
        No operational events published for this book.
      </p>
    );
  }

  const dated = events.filter((e) => e.at).sort((a, b) => a.at!.localeCompare(b.at!));
  const standing = events.filter((e) => !e.at);

  return (
    <div className="scroll-x">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="text-[11.5px] text-fg-faint">
            <th className="text-left font-normal pb-2 w-[150px]">When (UTC)</th>
            <th className="text-left font-normal pb-2 w-[120px]">Kind</th>
            <th className="text-left font-normal pb-2">What happened</th>
          </tr>
        </thead>
        <tbody>
          {dated.map((e) => (
            <tr key={`${e.at}-${e.label}`} className="border-t hairline align-top">
              <td className="py-2.5 tnum text-fg-muted whitespace-nowrap">
                {e.at!.slice(0, 10)}
                <span className="ml-2 text-fg-faint">{e.at!.slice(11, 16)}</span>
              </td>
              <td className={`py-2.5 ${TONE[e.kind] ?? "text-fg-muted"}`}>
                {e.kind}
              </td>
              <td className="py-2.5">
                <span className="font-medium">{e.label}</span>
                <div className="text-[12.5px] text-fg-muted mt-0.5">{e.detail}</div>
              </td>
            </tr>
          ))}
          {standing.map((e) => (
            <tr key={e.label} className="border-t hairline align-top">
              <td className="py-2.5 text-fg-faint">standing</td>
              <td className={`py-2.5 ${TONE[e.kind] ?? "text-fg-muted"}`}>
                {e.kind}
              </td>
              <td className="py-2.5">
                <span className="font-medium">{e.label}</span>
                <div className="text-[12.5px] text-fg-muted mt-0.5">{e.detail}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
