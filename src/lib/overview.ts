/**
 * Which books belong on the landing page's multi-line chart.
 *
 * The chart's whole claim is that its lines are comparable: each is a cumulative
 * return rebased on its own opening equity, so accounts of different sizes can be
 * read against one another. A line that breaks that premise does not belong on
 * it, however interesting it is on its own page.
 *
 * Capital variants break it, and they are excluded here by rule rather than by a
 * hardcoded list of book names — a list would be correct on the day it was
 * written and wrong on the day somebody adds a book.
 *
 * **Capital variants.** `best_cagr_100k` is `best_cagr` with the same strategies
 * and the same weights at a different size. Drawing both is drawing one idea
 * twice: the second line tells you about funding size, not about the portfolio,
 * and a reader scanning six lines has no way to know that two of them are pairs.
 * They remain first-class everywhere else — the selector, their own page, the
 * data — because the comparison they support is a real one; it just is not the
 * comparison this chart makes.
 *
 * A real-capital portfolio is drawn like any other: its nav.csv carries the same
 * flow and adjustment columns, so its line is a cumulative return on its own
 * opening capital, on the same footing as the rest. It starts where its record
 * starts.
 */

import { parentOf } from "@/lib/variants";

/** The minimum a book must expose for this decision. */
export type OverviewCandidate = {
  book: string;
  capital_at_risk?: boolean;
};

/**
 * True when `book` belongs on the landing chart.
 *
 * `present` is every book in the payload: a variant whose parent is NOT
 * published is not a variant of anything a reader can see, so it is treated as a
 * portfolio in its own right — the same rule `orderWithVariants` applies, and
 * for the same reason. Without it, retiring a parent would silently delete its
 * twin from the chart.
 */
export function isOnOverview(
  candidate: OverviewCandidate,
  present: readonly string[],
): boolean {
  const parent = parentOf(candidate.book);
  return parent === null || !present.includes(parent);
}

/** The subset of `items` that belongs on the landing chart. */
export function forOverview<T extends OverviewCandidate>(items: T[]): T[] {
  const present = items.map((i) => i.book);
  return items.filter((i) => isOnOverview(i, present));
}
