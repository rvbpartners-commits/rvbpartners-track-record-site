import type { ReactNode } from "react";

/**
 * THE SITE'S ONE SECTION. Rail, measure, margin.
 *
 * WHAT IT REPLACES. Seven pages each carried their own private `Section`
 * function — `/firm`, `/legal`, `/portfolios`, `/refused`, `/research`, the 404
 * page and `/methodology` — six of them byte-identical and the seventh a
 * different design entirely. Meanwhile this file existed, implemented a
 * two-column grid, and was imported by exactly one consumer. So the site had
 * eight section primitives, three competing `<h2>` treatments, and no shared
 * contract about where prose stops. That is the whole of two complaints at
 * once: the parts of a page did not read as separate parts, and the text ran
 * out halfway across the column.
 *
 * THE THREE TRACKS, and why there are three rather than two:
 *
 *   RAIL     172px. What this part of the document is, and one line saying what
 *            it is for. A reader scanning a long page reads only this column.
 *   MEASURE  `--measure`, 33rem. Running prose, and nothing else. The cap is
 *            owned by the GRID rather than restated per element, which is what
 *            retires the 92 hand-written `max-w-[Nch]` classes in fourteen
 *            different values. `ch` was never the right unit for this: it is
 *            the width of a ZERO, so `max-w-[72ch]` renders about 96 characters
 *            in Inter, and because `ch` scales with the element's own font-size
 *            the caps did not even order the way they read — `80ch` at
 *            `text-small` was NARROWER than `72ch` at `text-body`. That is why
 *            the right edge of this site is ragged rather than a line.
 *   MARGIN   whatever is left, about 296px at full width. Figures read from the
 *            payload, a schematic, a marginal note. This is the column that was
 *            white.
 *
 * A SECTION WITH AN EMPTY MARGIN IS NOT A FAILURE OF THE GRID. The gloss falls
 * into it when nothing else is there, so every section has something in its
 * third track from the first day, and the rule above each section spans the
 * full width either way — which on its own is most of why a page stopped
 * looking like it ended in the middle.
 *
 * BELOW `lg` the three tracks stack: rail, then prose, then margin. The margin
 * carries annotation rather than substance, so it reads correctly last.
 */
export function Section({
  id,
  title,
  gloss,
  note,
  aside,
  children,
  first = false,
}: {
  /** Anchor target, for in-page links. */
  id?: string;
  title: string;
  /** One short line in the rail saying what this part is for. Not a sentence
   *  of prose: it sits at 172px. */
  gloss?: string;
  /** A longer annotation, in the margin. This used to be squeezed into the
   *  190px rail, where a 200-word note ran taller than the chart it annotated. */
  note?: ReactNode;
  /** Figures, a schematic, a stamp. Also the margin, under the note. */
  aside?: ReactNode;
  children: ReactNode;
  /** The first section on a page carries no rule above it; the page title is
   *  already the boundary. */
  first?: boolean;
}) {
  const hasMargin = Boolean(note || aside || gloss);
  return (
    <section
      id={id}
      className={
        first
          ? "section-grid scroll-mt-8 mt-8 lg:mt-10"
          : "section-grid scroll-mt-8 mt-12 border-t hairline pt-7 lg:mt-16"
      }
    >
      <div className="section-rail">
        <h2 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
          {title}
        </h2>
        {/* The gloss sat inline beside the heading at `text-fg-faint/70`, which
            composites to #9e9e9c — 2.68:1 on white, a failing contrast on the
            only words naming the section. In the rail it has room to be a line
            of its own at a colour a reader can actually see. */}
        {gloss && (
          <p className="mt-2 text-caption leading-snug text-fg-muted">{gloss}</p>
        )}
      </div>

      <div className="section-measure min-w-0">{children}</div>

      {hasMargin && (
        <div className="section-margin min-w-0">
          {note && (
            <div className="text-caption leading-relaxed text-fg-muted">
              {note}
            </div>
          )}
          {aside && <div className={note ? "mt-6" : undefined}>{aside}</div>}
        </div>
      )}
    </section>
  );
}
