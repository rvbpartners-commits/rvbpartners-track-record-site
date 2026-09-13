/**
 * THE CONTENTS OF THE SITE, IN ONE PLACE.
 *
 * TWO FAMILIES, AND THE SPLIT IS THE ARGUMENT. The register grew into seven
 * routes that all answered the same question — *how do we know these numbers
 * are real* — and none that answered the one a reader asks first: *who is this
 * firm, and why is it interesting*. Seven links about evidence, in a row, is a
 * table of contents for an audit rather than for a company.
 *
 * So the list is grouped:
 *
 *   FIRM    who we are, what we believe, what we are building.
 *   RECORD  what we trade, how it was tested, how anyone can check it.
 *
 * Nothing was removed to make room. The proof layer is the reason this site
 * exists and it keeps every page it had; what changed is that it is now the
 * SECOND half of a document rather than the whole of one.
 *
 * IT LIVES HERE BECAUSE THE GATE WAS ONLY HONOURED ONCE. `/research` and
 * `/selection` render nothing without `research.json`, so the masthead filters
 * them out when that file is absent — a navigation item with nothing behind it
 * is a promise the record cannot keep. But the masthead was the only surface
 * that knew: the footer linked `/selection` unconditionally and `sitemap.xml`
 * emitted it while already holding the payload that says not to.
 *
 * A rule enforced in one of the places it applies is not a rule. Every surface
 * now reads this list and applies the same gate, so the next route with a
 * condition on it cannot be added to one and forgotten in the others.
 *
 * AND THE SITEMAP READS IT TOO. It used to carry its own hand-written array of
 * the same routes — the second copy the comment above warns about, in the file
 * the comment above names. `dated` is what let it stop: a route whose CONTENT
 * comes from the published record carries that record's own clock, and a route
 * that is prose carries no `<lastmod>` at all, because a page rendered at
 * request time has no honest date for when this repository last changed.
 */
export type NavGroup = "firm" | "record" | "legal";

export type NavItem = {
  href: string;
  label: string;
  /** Which half of the document this belongs to. */
  group: NavGroup;
  /** The question the page answers. Printed wherever a route needs a gloss,
   *  and kept beside the route so the two cannot drift out of order. */
  question: string;
  /** Rendered only while `research.json` is published. */
  needsResearch?: boolean;
  /** In the masthead as well as the footer. A route without it is reachable
   *  from the footer and from the page it belongs to, which is where a reader
   *  goes looking for it — the masthead is a contents row, not an index. */
  masthead?: boolean;
  /** Whose clock dates this page, for the sitemap. Prose carries neither. */
  dated?: "record" | "research";
};

export const NAV: readonly NavItem[] = [
  /* ── THE FIRM ─────────────────────────────────────────────────────────── */
  {
    href: "/firm",
    label: "The firm",
    group: "firm",
    question: "The company, its registered details, and the terms used on the site.",
    masthead: true,
  },
  {
    href: "/team",
    label: "Team",
    group: "firm",
    question: "The people who research, build and run what this site publishes.",
    masthead: true,
  },
  {
    href: "/approach",
    label: "Approach",
    group: "firm",
    question: "What the firm optimises for, how a strategy becomes a portfolio, and which markets it trades.",
    masthead: true,
  },
  {
    href: "/contact",
    label: "Contact",
    group: "firm",
    question: "How to reach the firm.",
  },

  /* ── THE RECORD ───────────────────────────────────────────────────────── */
  {
    href: "/portfolios",
    label: "Portfolios",
    group: "record",
    question: "Every published portfolio, its account and its record.",
    masthead: true,
    dated: "record",
  },
  {
    href: "/research",
    label: "Research",
    group: "record",
    question: "How much was searched, and the bar every result is measured against.",
    needsResearch: true,
    masthead: true,
    dated: "research",
  },
  {
    href: "/methodology",
    label: "Methodology",
    group: "record",
    question: "How every published figure is produced.",
    masthead: true,
  },
  {
    href: "/verify",
    label: "Verify",
    group: "record",
    question: "Every snapshot, and the checks anyone can run on the record.",
    masthead: true,
    dated: "record",
  },
  {
    /* THE ROUTE KEEPS ITS ADDRESS AND LOSES ITS AMBIGUITY. "Selection" on its
       own names four different things to a reader who has not read the page —
       asset selection, strategy selection, portfolio selection, statistical
       selection. The label says which; changing the path would break every
       link ever shared to it, for no reader's benefit. */
    href: "/selection",
    label: "Strategy selection",
    group: "record",
    question: "How the strategy catalogue is graded, and what it presents.",
    needsResearch: true,
    dated: "research",
  },
  {
    href: "/disclosures",
    label: "Disclosures",
    group: "record",
    question: "The conditions attached to the figures on this site.",
    dated: "record",
  },

  /* ── LEGAL ────────────────────────────────────────────────────────────── */
  {
    href: "/legal",
    label: "Legal notice",
    group: "legal",
    question: "The company's identification, its host, and what this site stores.",
  },
];

/** The routes a reader may actually be sent to, given what is published. */
export function visibleNav(hasResearch: boolean): readonly NavItem[] {
  return NAV.filter((item) => !item.needsResearch || hasResearch);
}

/** The contents row at the top of every page: seven items, in reading order —
 *  who we are, what we believe, what we run, how it was searched, how it is
 *  measured, how to check it. */
export function mastheadNav(hasResearch: boolean): readonly NavItem[] {
  return visibleNav(hasResearch).filter((item) => item.masthead);
}

/** The footer's columns. Everything published, grouped the way the document is.
 *
 *  `hasResearch` is passed rather than fetched so the caller decides when the
 *  payload is read: a server component awaits it once and hands the answer
 *  down, and the sitemap reads the same file it already reads for `lastmod`. */
export function navGroup(
  group: NavGroup,
  hasResearch: boolean,
): readonly NavItem[] {
  return visibleNav(hasResearch).filter((item) => item.group === group);
}
