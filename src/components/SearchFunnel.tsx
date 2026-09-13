import { NO_VALUE } from "@/lib/format";

/**
 * WHAT THE SEARCH LEAVES, DRAWN TO SCALE.
 *
 * /research published six figures in six boxes and never showed that three of
 * them are NESTED. A reader who did not already know what multiple testing is
 * saw 829, then 284, then 13 as three unrelated counts, and the one thing the
 * page exists to say — that almost nothing survives the correction — had to be
 * inferred by dividing in your head.
 *
 * Three bars on one scale say it without a sentence. The third is about one and
 * a half percent of the first, so it renders as a sliver. That is not a layout
 * problem to be fixed with a minimum width or a broken axis; it is the result.
 *
 * THE 10,300 IS NOT ON THIS SCALE, and putting it here would be a real error
 * rather than a stylistic one. Expected false positives are counted in TRIALS
 * (206,004 effective ones), the bars are counted in STRATEGIES, and a bar of
 * 10,300 drawn against a bar of 829 would state a comparison that does not
 * exist. It is published beside the chart, in words, with its own denominator.
 *
 * Every number is passed in from `research.json`. Nothing here is computed
 * except the three bar widths, which are each figure over the first one.
 */
export function SearchFunnel({
  researched,
  nominal,
  survivors,
  alpha,
  expectedFalse,
  effectiveTrials,
}: {
  /** `search.strategies_researched` */
  researched: number | null | undefined;
  /** `deflation.clear_nominal_bar` */
  nominal: number | null | undefined;
  /** `deflation.survive_book_level` */
  survivors: number | null | undefined;
  /** `deflation.alpha` */
  alpha: number | null | undefined;
  /** `deflation.expected_false_positives_at_alpha` */
  expectedFalse: number | null | undefined;
  /** `search.effective_independent_trials` */
  effectiveTrials: number | null | undefined;
}) {
  // A bar cannot be drawn against a denominator that was not published, and a
  // chart with one missing stage is worse than no chart: the gap between the
  // bars IS the claim. All or nothing.
  const ok = (n: number | null | undefined): n is number =>
    typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!ok(researched) || researched === 0 || !ok(nominal) || !ok(survivors)) {
    return null;
  }

  const stages = [
    {
      count: researched,
      label: "Strategies researched",
      note: "Every strategy with committed returns, a report and a verdict.",
    },
    {
      count: nominal,
      label:
        alpha !== null && alpha !== undefined
          ? `Clear the standard bar (α = ${alpha})`
          : "Clear the standard bar",
      note: "Significant measured on their own results alone.",
    },
    {
      count: survivors,
      label: "Clear the whole-catalogue bar",
      note: "Still significant after correcting for every trial recorded.",
    },
  ];

  return (
    <figure className="m-0">
      <ol className="m-0 list-none p-0">
        {stages.map((s, i) => {
          const pct = (s.count / researched) * 100;
          return (
            <li
              key={s.label}
              className={i > 0 ? "mt-6 border-t hairline pt-5" : undefined}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <span className="text-small font-medium text-fg">{s.label}</span>
                <span className="tnum text-heading leading-none text-fg">
                  {s.count.toLocaleString("en-US")}
                </span>
              </div>
              {/* The bar is a div, not an SVG: text inside a scaled viewBox
                  shrinks with the drawing, and at phone width the labels would
                  come out at five pixels. Geometry in CSS, type in the DOM, at
                  the sizes the rest of the site uses. */}
              <div className="mt-3 h-2.5 w-full bg-bg-raised">
                <div
                  className="h-full min-w-[3px] bg-fg"
                  style={{ width: `${pct.toFixed(3)}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6">
                <span className="text-caption leading-snug text-fg-muted">
                  {s.note}
                </span>
                {i > 0 && (
                  <span className="tnum text-caption text-fg-faint">
                    {pct < 10 ? pct.toFixed(1) : Math.round(pct)}% of the
                    catalogue
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {ok(expectedFalse) && ok(effectiveTrials) && (
        <figcaption className="mt-7 border-t hairline pt-4 text-small leading-relaxed text-fg-muted">
          {/* The oxide is the site's one reserved colour and it marks a negative
              fact. A count of the noise the search would produce on its own is
              exactly that, and it is the only place on this page the colour
              appears. */}
          <span className="text-oxide">
            About {expectedFalse.toLocaleString("en-US")} false positives
          </span>{" "}
          are what chance alone would produce at this threshold among{" "}
          <span className="tnum">
            {effectiveTrials.toLocaleString("en-US", {
              maximumFractionDigits: 0,
            })}
          </span>{" "}
          effective independent trials. That figure is counted in trials, not in
          strategies, so it is not drawn on the scale above.
        </figcaption>
      )}
    </figure>
  );
}

/** Formatted for a caption that has no bar behind it. */
export const funnelValue = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n)
    ? n.toLocaleString("en-US")
    : NO_VALUE;
