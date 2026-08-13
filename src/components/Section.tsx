import type { ReactNode } from "react";

/**
 * The page's spine.
 *
 * Every section is the same two-column grid: a fixed 190px rail carrying the
 * heading and its explanatory note, then the content. That gives the page two
 * vertical rules every block aligns to, which is what an accounts document has
 * and what a stack of full-width blocks does not — with mixed content widths
 * (a wide table, a narrow paragraph, a chart) a single column reads as ragged
 * even when every element is individually fine.
 *
 * It also puts the caveats where they belong. A three-line explanation of how
 * the equity series is constructed is not body copy; it is a margin note, and
 * setting it as one lets it be complete without interrupting the reader.
 */
export function Section({
  title,
  note,
  aside,
  children,
  first = false,
}: {
  title: string;
  note?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <section
      className={`grid lg:grid-cols-[190px_1fr] gap-x-10 gap-y-4 ${
        first ? "mt-10" : "mt-14 border-t hairline pt-8"
      }`}
    >
      <div>
        <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
        {note && (
          <div className="mt-2 text-[11.5px] text-fg-muted leading-relaxed">
            {note}
          </div>
        )}
        {aside && <div className="mt-3">{aside}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
