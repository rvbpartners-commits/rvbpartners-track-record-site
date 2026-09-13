/**
 * THE CATALOGUE, TO SCALE.
 *
 * /selection has the tier × verdict grid, which is the right table and answers
 * "how many of each". It cannot answer the question a reader asks first, which
 * is "how much of this is presented as a result" — that one is a proportion,
 * and a proportion read off eight cells is a proportion nobody reads.
 *
 * One bar. Four segments in a fixed order, darkest first, so the 42 the firm
 * stands behind sit at the left edge where the eye starts and the 831 it has
 * not graded trail off pale at the right.
 *
 * NO OXIDE HERE, DELIBERATELY. The reserved colour marks a negative fact, and
 * "not promoted" is one — but rejects are 47% of the catalogue, and 47% of a
 * bar in the one saturated colour on the site is not a marker, it is a paint
 * job. Spent at that volume the colour stops meaning anything for the stamps
 * that carry it elsewhere. The four steps are a lightness ramp out of the
 * site's own greys instead, which is also the honest encoding: this is one
 * ordered quantity, not four categories.
 *
 * Every figure is summed from the published `catalogue.by_tier` cells. A
 * verdict this file has never heard of still renders, under its own name, at
 * the pale end — the published grid is not this component's to curate.
 */

/** Darkest to palest. Fixed order, never sorted by size: a filter or a new
 *  tier must never repaint the segments a reader has already learned. */
const RAMP: { key: string; label: string; className: string }[] = [
  { key: "promote", label: "Promoted", className: "bg-fg" },
  { key: "conditional", label: "Conditional", className: "bg-fg-muted" },
  { key: "reject", label: "Not promoted", className: "bg-bench" },
  { key: "unfiled", label: "Not graded", className: "bg-hairline" },
];

export function CatalogueMosaic({
  byTier,
  presented,
}: {
  /** `research.json` → `catalogue.by_tier`: tier → verdict → count. */
  byTier: Record<string, Record<string, number>>;
  /** `catalogue.presented_folders`, stated rather than re-derived. */
  presented: number | undefined;
}) {
  // Sum each verdict across every tier. One strategy can hold an entry in
  // several tiers at once, so these are ENTRIES, and the caption says so.
  const totals = new Map<string, number>();
  for (const cells of Object.values(byTier ?? {})) {
    for (const [verdict, n] of Object.entries(cells ?? {})) {
      if (typeof n !== "number" || !Number.isFinite(n)) continue;
      const k = verdict.toLowerCase();
      totals.set(k, (totals.get(k) ?? 0) + n);
    }
  }

  const known = RAMP.map((r) => ({ ...r, count: totals.get(r.key) ?? 0 }));
  // Anything the published grid carries that this file does not name. Kept at
  // the pale end rather than dropped: a silently missing segment would make the
  // bar lie about its own total.
  const extra = [...totals.entries()]
    .filter(([k]) => !RAMP.some((r) => r.key === k))
    .map(([k, count]) => ({
      key: k,
      label: k.charAt(0).toUpperCase() + k.slice(1),
      className: "bg-bg-raised",
      count,
    }));

  const segments = [...known, ...extra].filter((s) => s.count > 0);
  const total = segments.reduce((n, s) => n + s.count, 0);
  if (total === 0) return null;

  const int = (n: number) => n.toLocaleString("en-US");

  return (
    <figure className="m-0">
      {/* `gap-[2px]` rather than borders between segments: a rule would add
          width that is not in the data, and at these proportions the thinnest
          segment is already only a few pixels. */}
      <div
        className="flex h-9 w-full gap-[2px]"
        role="img"
        aria-label={segments
          .map((s) => `${s.label}: ${int(s.count)} of ${int(total)} entries`)
          .join(". ")}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className={`${s.className} min-w-[2px]`}
            style={{ width: `${((s.count / total) * 100).toFixed(3)}%` }}
          />
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.key} className="border-t hairline pt-3">
            <dt className="flex items-center gap-2 text-caption text-fg-muted">
              <span
                aria-hidden="true"
                className={`${s.className} inline-block h-2.5 w-2.5 shrink-0`}
              />
              {s.label}
            </dt>
            <dd className="mt-1.5 tnum text-subhead leading-none text-fg">
              {int(s.count)}
            </dd>
            <dd className="mt-1 tnum text-caption text-fg-faint">
              {((s.count / total) * 100).toFixed(1)}%
            </dd>
          </div>
        ))}
      </dl>

      <figcaption className="mt-5 text-small leading-relaxed text-fg-muted">
        {int(total)} catalogue entries across every tier
        {presented !== undefined && (
          <>
            , of which <span className="tnum text-fg">{int(presented)}</span> are
            presented as a result
          </>
        )}
        . One strategy can hold an entry in several tiers at once — its
        production version, its original baseline, its optimised twin — so
        entries are not strategies.
      </figcaption>
    </figure>
  );
}
