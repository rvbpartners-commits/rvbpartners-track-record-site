import type { ReactNode } from "react";

/**
 * An inline note. `warn` is used for things a reader must not miss (a withheld
 * statistic, a measured bias); `plain` for context.
 *
 * No icons, no alert boxes with heavy borders — the page carries its
 * contrast in weight and colour, and a shouting callout beside every honest
 * caveat would train people to skip them.
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
      className={`border px-4 py-3.5 text-[13px] leading-relaxed max-w-[80ch] ${styles} ${className}`}
    >
      {children}
    </div>
  );
}
