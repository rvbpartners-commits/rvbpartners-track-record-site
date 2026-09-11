import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A reference to a route that is not always there.
 *
 * `/research` and `/refused` render nothing without `research.json`, and the
 * masthead drops them when it is absent. Prose links to them are the same
 * promise made in a sentence: three of them sit mid-paragraph on /firm and
 * /portfolios, and with the file gone they sent a reader who had just been told
 * "those counts are published under research" to a page saying the research
 * summary has not been published yet.
 *
 * The sentence is not rewritten, because the sentence is still true: the counts
 * ARE published under research, and the register simply cannot show them at
 * this moment. Only the affordance goes. The word keeps the emphasis it had, so
 * the paragraph reads the same and nothing reflows.
 */
export function GatedLink({
  href,
  available,
  className = "text-accent hover:underline",
  children,
}: {
  href: string;
  available: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (!available) return <span className="text-fg">{children}</span>;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
