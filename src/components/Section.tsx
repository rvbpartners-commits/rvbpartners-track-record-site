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
 * THE RAIL CAME OUT. The first version put the section's name in a 172px column
 * down the left. It named the part, which was the job, and it cost every
 * section a permanent empty strip at the left margin: beside a chart it was
 * three words over 600px of nothing, and the chart was squeezed into the
 * middle to pay for it. A section's name goes ABOVE its content now, across
 * the full width, so the content starts at the left edge of the page and ends
 * at the right.
 *
 * THE TWO TRACKS UNDER THE HEAD:
 *
 *   MEASURE  `--measure`, 33rem. Running prose, and nothing else. The cap is
 *            owned by the GRID rather than restated per element, which is what
 *            retired 58 of the 92 hand-written `max-w-[Nch]` classes the site
 *            carried in fourteen different values. The remaining 34 are in
 *            components that do not sit in a Section at all — BookView, Note,
 *            the charts, the footer, the home page — and they are the next
 *            thing to move, not an exception to the rule. `ch` was never the right unit for this: it is
 *            the width of a ZERO, so `max-w-[72ch]` renders about 96 characters
 *            in Inter, and because `ch` scales with the element's own font-size
 *            the caps did not even order the way they read — `80ch` at
 *            `text-small` was NARROWER than `72ch` at `text-body`. That is why
 *            the right edge of this site is ragged rather than a line.
 *   MARGIN   20rem, pinned to the RIGHT edge. Figures read from the payload, a
 *            schematic, a marginal note. This is the column that was white.
 *
 * The gutter between them is elastic, so the prose keeps its measure at the
 * left edge and the margin keeps its width at the right edge, and the space a
 * wider screen adds falls between the two rather than after both.
 *
 * `fill` IS FOR A CHART THAT STILL WANTS ITS ANNOTATION. A book page's curve is
 * the product, and capping it at a reading measure drew a 528px chart with a
 * 296px note beside it inside a 1180px column: the one figure a reader came for,
 * squeezed to fit a rule written for sentences. A filled section gives the
 * content every pixel the note does not need, and the note keeps a real column
 * rather than a sliver.
 *
 * `wide` IS FOR CONTENT THAT IS NOT PROSE. A chart, a seven-column table or a
 * glossary has no business being capped at a reading measure: 33rem is the
 * width at which a SENTENCE stops being comfortable, and applying it to a
 * table just crushes the table and leaves 296px of white beside it. A wide
 * section spans the measure and the margin together, so the rail still names
 * the part and the content gets the whole column. Its note moves into the rail,
 * because there is no margin left to put it in.
 *
 * AN EMPTY MARGIN NEEDS A REASON. The third track is not slack to be left
 * lying around: nearly always either something published belongs beside the
 * prose, or the content was never prose and the section wants `wide`. Of the
 * site's 58 sections, 56 take one of those two. The two that do not are four
 * lines long apiece and a pointer each, and a figure hung beside them would be
 * a figure repeated from the section above for the sake of filling a column.
 * Both say so in a comment where they stand. That is the bar: an empty margin
 * is a decision that has been written down, not a section nobody finished.
 *
 * The rule above each section spans the full width either way, which on its own
 * is most of why a page stopped looking like it ended in the middle.
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
  wide = false,
  fill = false,
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
  /** Content spans the measure AND the margin. For wide tables and glossaries:
   *  things that are not sentences and must not be measured like one. */
  wide?: boolean;
  /** Content takes every pixel the margin does not need. For a chart that still
   *  has a note to carry. Ignored when `wide` is set. */
  fill?: boolean;
}) {
  // `note || aside`, NOT `|| gloss`: the gloss is rendered in the RAIL, so
  // counting it here rendered an empty div in the third track and called the
  // section finished.
  const hasMargin = Boolean(note || aside) && !wide;
  return (
    <section
      id={id}
      className={[
        "section-grid",
        fill && !wide ? "section-grid--fill" : "",
        "scroll-mt-8",
        first
          ? "mt-8 lg:mt-10"
          : "mt-12 border-t hairline pt-7 lg:mt-16",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* THE NAME OF THE PART, ACROSS THE WHOLE WIDTH. */}
      <div className="section-head flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
          {title}
        </h2>
        {/* The gloss sat inline beside the heading at `text-fg-faint/70`, which
            composites to #9e9e9c — 2.68:1 on white, a failing contrast on the
            only words naming the section. Same place, a colour a reader can
            actually see. */}
        {gloss && <p className="text-caption text-fg-muted">{gloss}</p>}
        {/* A wide section has no third track to annotate from, so its note
            joins the head. */}
        {wide && note && (
          <div className="w-full text-caption leading-relaxed text-fg-muted">
            {note}
          </div>
        )}
      </div>

      <div
        className={`min-w-0 ${wide ? "section-measure section-wide" : "section-measure"}`}
      >
        {children}
      </div>

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
