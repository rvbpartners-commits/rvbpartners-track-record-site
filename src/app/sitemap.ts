import type { MetadataRoute } from "next";
import { SITE_ORIGIN, bookSlug, getIndex, getResearch } from "@/lib/data";
import { visibleNav } from "@/lib/nav";

// Generated per request, like every page it lists. A sitemap fixed at deploy
// time freezes the portfolio list at whatever the payload said that morning —
// and the books are published UPSTREAM, so the list can change without this
// repository changing at all. That is precisely the case a build-time list
// cannot see, and it fails silently: the file keeps serving, it is simply wrong.
export const dynamic = "force-dynamic";

/** An absolute URL for a route of this site.
 *
 *  Absolute because a sitemap has no base to resolve against — every `<loc>`
 *  must be a full URL on the site's own host. `SITE_ORIGIN` is that host, named
 *  once in `lib/data`, because it has moved once already. */
function abs(path: string): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

/** A published timestamp, and only if it really is one.
 *
 *  Next serialises whatever it is handed straight into `<lastmod>`, so an
 *  unparseable value produces a malformed sitemap — in the one file whose whole
 *  purpose is to be machine-read. An absent or unreadable date becomes
 *  `undefined`, which omits the element: a permitted absence, and a true one. */
function when(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? undefined : at;
}


/**
 * THE ROUTES OF THIS SITE, AND WHEN EACH LAST CHANGED.
 *
 * Two rules, and both are about not stating a date this file does not have.
 *
 * 1. A `lastModified` is set only where the page's CONTENT comes from the
 *    published record, and it is that record's own clock. `/firm`,
 *    `/methodology` and `/legal` are prose: they change when this repository
 *    changes, and a sitemap rendered at request time has no honest date for
 *    that. Borrowing the publisher's timestamp would date a document by the
 *    clock of something that did not write it, so those three carry no
 *    `<lastmod>` at all.
 *
 * 2. A portfolio is dated by its OWN last published session, never by the
 *    publisher's run. `published_at` says when the publisher last ran, which is
 *    not the same claim and is the flattering one — a publisher that runs
 *    nightly reports today even for a book that stopped a week ago. (The
 *    masthead makes the same choice for the same reason; see `Shell`.)
 *
 * No `changeFrequency` and no `priority`: the major crawlers say they ignore
 * both, and a number nobody reads is still a number this file would have to
 * justify.
 *
 * The static routes come out of `lib/nav` in that file's own order — the firm,
 * then the record, then the legal notice. Crawlers do not care; a reader
 * opening /sitemap.xml gets the site's contents order rather than a shuffle,
 * and this file can no longer describe a different site from the masthead.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Neither fetch depends on the other, and both fail soft to null — a sitemap
  // that throws is worse than one carrying the static routes alone.
  const [index, research] = await Promise.all([getIndex(), getResearch()]);

  // The record's publish clock, and the research summary's own. Both are
  // `undefined` when their file could not be read, which quietly drops the
  // `<lastmod>` rather than dating anything by the render clock — `new Date()`
  // here would claim every page changed the moment a crawler asked.
  const record = when(index?.published_at);
  const searched = when(research?.generated_at);

  // THE SAME GATE THE MASTHEAD APPLIES. /research and /selection render nothing
  // without research.json, and this file emitted both unconditionally while
  // already holding the payload that says so — two lines above, for `searched`.
  // A sitemap is a list of addresses a crawler is told exist, so it was the one
  // surface making the promise to machines rather than to readers.
  const hasResearch = research !== null;

  // THE ROUTE LIST IS NOT TYPED HERE. It used to be: a hand-written array of
  // the same nine addresses `lib/nav` already holds, in the file that module's
  // own comment names as the surface that forgot the gate. Two copies of one
  // list is how the gate was forgotten the first time, and adding /team,
  // /approach and /contact to a masthead would have left this file describing
  // a smaller site than the one it serves — silently, because a sitemap that
  // is merely incomplete still validates and still serves.
  //
  // `dated` carries the second rule with it. A route whose CONTENT comes from
  // the published record is dated by that record's clock; a route that is
  // prose carries no `<lastmod>` at all, because a page rendered at request
  // time has no honest date for when this repository last changed.
  const routes: MetadataRoute.Sitemap = visibleNav(hasResearch).map((item) => ({
    url: abs(item.href),
    lastModified:
      item.dated === "record"
        ? record
        : item.dated === "research"
          ? searched
          : undefined,
  }));
  // The front page is not a navigation item — it is what the navigation sits
  // on — so it is the one address this file still names.
  routes.unshift({ url: abs("/"), lastModified: record });

  // ONE ENTRY PER PUBLISHED PORTFOLIO, DERIVED — never a list typed here. A
  // hardcoded set of slugs goes stale the moment a book is added, renamed or
  // withheld, and it goes stale without any symptom: the pages still work, the
  // sitemap simply stops describing them.
  //
  // `getIndex` rather than the raw payload, deliberately. It applies this
  // site's own withholding, and the portfolio route resolves its slug against
  // that same filtered list — a book withheld here 404s. Reading around the
  // filter would advertise addresses the site itself answers "not found" to,
  // which is the one thing a sitemap must never do.
  const seen = new Set<string>();
  for (const book of index?.books ?? []) {
    const url = abs(`/portfolios/${bookSlug(book)}`);
    // Two books resolving to one slug is an upstream naming collision, not
    // something to publish twice: a repeated `<loc>` is an invalid sitemap.
    // First wins, which is the same book the route itself would serve.
    if (seen.has(url)) continue;
    seen.add(url);
    routes.push({ url, lastModified: when(book.last_session) });
  }

  return routes;
}
