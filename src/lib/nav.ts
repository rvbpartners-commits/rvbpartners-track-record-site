/**
 * THE CONTENTS OF THE REGISTER, IN ONE PLACE.
 *
 * ORDER IS THE ARGUMENT: identity, then what is traded, then the denominator
 * that makes those figures readable, then what was thrown away, then how to
 * check any of it, then the reference, then the standing caveats.
 *
 * IT LIVES HERE BECAUSE THE GATE WAS ONLY HONOURED ONCE. `/research` and
 * `/selection` render nothing without `research.json`, so the masthead filters
 * them out when that file is absent — a primary navigation item with nothing
 * behind it is a promise the record cannot keep. But the masthead was the only
 * surface that knew. The home page's contents list was a second hardcoded array
 * of the same seven routes, the footer linked `/selection` unconditionally, and
 * `sitemap.xml` emitted both — while already holding the payload that would
 * have told it not to. With the file gone, one surface kept the promise and
 * three advertised it anyway.
 *
 * A rule enforced in one of the four places it applies is not a rule. Every
 * surface now reads this list and applies the same gate, so the next route with
 * a condition on it cannot be added to one and forgotten in the others.
 */
export type NavItem = {
  href: string;
  label: string;
  /** Rendered only while `research.json` is published. */
  needsResearch?: boolean;
  /** The question the page answers, printed by the home page's contents list.
   *  Kept beside the route so the two cannot drift out of order. */
  question: string;
};

export const NAV: readonly NavItem[] = [
  {
    href: "/firm",
    label: "The firm",
    question: "The company, its registered details, and the terms used on the site.",
  },
  {
    href: "/portfolios",
    label: "Portfolios",
    question: "Every published portfolio, its account and its record.",
  },
  {
    href: "/research",
    label: "Research",
    needsResearch: true,
    question: "How much was searched, and the bar every result is measured against.",
  },
  {
    href: "/selection",
    label: "Selection",
    needsResearch: true,
    question: "How the strategy catalogue is graded, and what it presents.",
  },
  {
    href: "/verify",
    label: "Verify",
    question: "Every snapshot, and the checks anyone can run on the record.",
  },
  {
    href: "/methodology",
    label: "Methodology",
    question: "How every published figure is produced.",
  },
  {
    href: "/disclosures",
    label: "Disclosures",
    question: "The conditions attached to the figures on this site.",
  },
];

/** The routes a reader may actually be sent to, given what is published.
 *
 *  `hasResearch` is passed rather than fetched so the caller decides when the
 *  payload is read: a server component awaits it once and hands the answer
 *  down, and the sitemap reads the same file it already reads for `lastmod`. */
export function visibleNav(hasResearch: boolean): readonly NavItem[] {
  return NAV.filter((item) => !item.needsResearch || hasResearch);
}
