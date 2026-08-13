import type { ReactNode } from "react";

/** Two-column section: a 190px rail for the heading and its note, then the
 *  content. Gives every block the same two vertical rules to align to. */
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
