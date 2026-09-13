/**
 * SIX STEPS, ON A RAIL.
 *
 * The six steps were six boxes with a rule on top, a number, a heading and a
 * paragraph — the generic three-across feature grid, which is what made the
 * section read as filler beside the rest of the page. Nothing about it said
 * SEQUENCE: the rules stopped at each box, so six ordered steps were drawn as
 * six unordered ones, and the numbers were doing all the work on their own.
 *
 * The rule is continuous now and the steps hang off it, which is the whole fix:
 * one line across the row, a node marking each stop, and the copy underneath.
 * The cells carry no horizontal gap for exactly that reason — a gap would cut
 * the rail into six pieces again — so the breathing room is padding inside each
 * cell instead.
 *
 * THE RAIL CHANGES COLOUR ONCE, AND IT MEANS SOMETHING. The first three steps
 * discard: research, validation and selection each end with less than they
 * started with. The last three operate on whatever survived. A solid rail under
 * the first phase and a hairline under the second says that without a caption,
 * and it is a fact about the process rather than a decoration.
 *
 * NO COUNTS ON THE RAIL. It was tempting to hang 829 / 284 / 13 off the first
 * three nodes, and it would have been wrong: "presented" is 42 and "clears the
 * correction" is 13, so a left-to-right sequence of figures would imply a
 * monotone funnel the published numbers do not describe. The counts live on
 * /research, drawn against one scale, where each has its denominator beside it.
 */
export function PipelineRail({
  steps,
  /** How many leading steps belong to the phase that discards results. */
  filterSteps = 3,
}: {
  steps: { n: string; name: string; body: string }[];
  filterSteps?: number;
}) {
  if (steps.length === 0) return null;

  return (
    <div>
      {/* THREE ACROSS, NOT SIX. Six columns inside a 1,184px measure leaves
          about 160px of text per step, which wraps a two-sentence body into
          seven lines of twenty characters. Three across gives each step a
          readable column AND puts the phase change on the row boundary: the
          first row is the rail that discards, the second is the rail that
          runs. The break does the work the colour change was doing alone. */}
      <ol className="m-0 grid list-none grid-cols-1 gap-x-0 gap-y-9 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => {
          const discards = i < filterSteps;
          return (
            <li key={s.n} className="relative pt-7 pr-0 sm:pr-9">
              {/* The rail segment for this stop. A div rather than a
                  `border-t` so both phases are the same 2px tall and the line
                  stays flat where the colour changes. */}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-[2px] ${
                  discards ? "bg-fg" : "bg-hairline"
                }`}
              />
              {/* The stop itself, centred on the rail. Filled while the
                  process is still discarding, hollow once it is running. */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-[1px] h-[9px] w-[9px] -translate-y-1/2 ${
                  discards ? "bg-fg" : "border border-fg-faint bg-bg"
                }`}
              />
              <span className="mono text-caption tabular-nums text-fg-faint">
                {s.n}
              </span>
              <h3 className="mt-2 text-subhead font-semibold leading-snug text-fg">
                {s.name}
              </h3>
              <p className="mt-2 text-small leading-relaxed text-fg-muted">
                {s.body}
              </p>
            </li>
          );
        })}
      </ol>

      <p className="mt-8 border-t hairline pt-4 text-caption leading-relaxed text-fg-muted">
        <span className="mr-2 inline-block h-[2px] w-6 translate-y-[-3px] bg-fg" />
        The first three steps end with less than they started with.
        <span className="ml-5 mr-2 inline-block h-[2px] w-6 translate-y-[-3px] bg-hairline" />
        The last three run whatever survived them.
      </p>
    </div>
  );
}
