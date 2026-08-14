/**
 * Capital variants — the one place that knows a book can be another book run at
 * a different size.
 *
 * `best_cagr_100k` is not a fifth portfolio. It is `best_cagr` with the same
 * strategies and the same weights funded with $100,000 instead of $1,000,000, so
 * that the pair measures capital sensitivity and nothing else. Presenting it as a
 * peer would invite a reader to compare two lines that differ in one variable as
 * though they were two different ideas.
 *
 * So a variant inherits its parent's identity in the UI: the SAME series colour,
 * drawn softer, and a position directly beneath its parent in any ordered list.
 *
 * The relationship is derived from the name rather than configured, so adding a
 * `_50k` twin later needs no edit here beyond the suffix list.
 */

/** Suffixes that mark a book as a capital variant of the name before them. */
const VARIANT_SUFFIXES = ["_100k", "_50k", "_10k"] as const;

/** Opacity a variant's line/swatch is drawn at. Low enough to read as secondary,
 *  high enough to stay legible against the page on a phone. */
export const VARIANT_OPACITY = 0.5;

/** The book this one is a capital variant of, or null if it is not one. */
export function parentOf(book: string): string | null {
  for (const suffix of VARIANT_SUFFIXES) {
    if (book.endsWith(suffix)) return book.slice(0, -suffix.length);
  }
  return null;
}

/** The capital label a variant carries ("100k"), or null. */
export function variantSize(book: string): string | null {
  for (const suffix of VARIANT_SUFFIXES) {
    if (book.endsWith(suffix)) return suffix.slice(1);
  }
  return null;
}

/**
 * Reorder so every variant sits immediately after its parent, parents keeping
 * their published order.
 *
 * A variant whose parent is NOT in the list is treated as a portfolio in its own
 * right and keeps its place — otherwise it would silently vanish from the chart
 * and the selector the day its parent stopped being published.
 */
export function orderWithVariants<T>(
  items: T[],
  bookOf: (item: T) => string,
): T[] {
  const present = new Set(items.map(bookOf));
  const isOrphan = (b: string) => {
    const p = parentOf(b);
    return p === null || !present.has(p);
  };

  const out: T[] = [];
  for (const item of items) {
    const book = bookOf(item);
    if (!isOrphan(book)) continue; // placed by its parent, below
    out.push(item);
    for (const other of items) {
      if (parentOf(bookOf(other)) === book) out.push(other);
    }
  }
  return out;
}

/**
 * Colour index for a book: a variant borrows its parent's slot, so the pair is
 * drawn in one hue. Parents are numbered by their order in `ordered`.
 */
export function colourIndex(book: string, ordered: string[]): number {
  const parents = ordered.filter((b) => {
    const p = parentOf(b);
    return p === null || !ordered.includes(p);
  });
  const parent = parentOf(book);
  const key = parent && ordered.includes(parent) ? parent : book;
  const i = parents.indexOf(key);
  return i < 0 ? 0 : i;
}

/** Stroke/fill opacity for a book's series. */
export function seriesOpacity(book: string, ordered: string[]): number {
  const parent = parentOf(book);
  return parent && ordered.includes(parent) ? VARIANT_OPACITY : 1;
}
