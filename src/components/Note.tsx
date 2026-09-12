import type { ReactNode } from "react";

/**
 * An inline note. `warn` is used for things a reader must not miss (a withheld
 * statistic, a measured bias); `plain` for context.
 *
 * No icons, no alert boxes with heavy borders — the page carries its
 * contrast in weight and colour, and a shouting callout beside every honest
 * caveat would train people to skip them.
 *
 * NO WIDTH OF ITS OWN. It carried `max-w-[80ch]`, which is one of the caps the
 * grid was built to retire (see `Section.tsx`): the container already owns the
 * measure, so a second cap inside it can only ever be narrower — and it was.
 * The withholding notice on a book page is the one a reader must not miss, and
 * it stopped two thirds of the way across a page whose tables ran the full
 * width, so the most important paragraph on the page was the one that looked
 * unfinished. `ch` compounded it: it is the width of a ZERO, so `80ch` at
 * `text-small` renders narrower than `72ch` at `text-body` — the caps did not
 * even order the way they read.
 */
export function Note({
  tone = "plain",
  className = "",
  children,
}: {
  tone?: "warn" | "plain";
  className?: string;
  children: ReactNode;
}) {
  const styles =
    tone === "warn"
      ? "bg-warn-bg text-warn-fg border-warn-line"
      : "bg-bg-subtle text-fg-muted hairline";
  return (
    <div
      className={`border px-4 py-3.5 text-small leading-relaxed ${styles} ${className}`}
    >
      {children}
    </div>
  );
}
