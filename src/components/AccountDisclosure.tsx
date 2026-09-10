"use client";

import { usePathname } from "next/navigation";

/**
 * The account disclosure — what kind of money these portfolios trade.
 *
 * THE FIRM SPEAKS AS A COMPANY, NOT THROUGH AN "OPERATOR". The site used to
 * attribute the trading to an individual — "the operator's own real capital" —
 * which invented a role the register does not record and put a person between
 * the reader and the company that is actually responsible for the claims.
 *
 * It lives on the landing pages and NOT on a portfolio page, because a
 * portfolio page answers the question for itself, in its own header, with its
 * own badge. Repeating a site-wide summary underneath it invites the reader to
 * apply the summary to the book they are looking at — which is exactly how the
 * previous wording went wrong: it enumerated "6 of these are paper accounts …
 * one trades real capital", which read as *only* one, and stopped being true
 * the day a second real-capital book arrived.
 *
 * So the wording no longer counts anything. It states which kinds are PRESENT
 * and sends the reader to the page that knows.
 *
 * "No arithmetic" was not enough on its own. The sentence claimed both kinds
 * while the real-capital book was withheld from the site during its convention
 * restart, so a reader was told to look for something no page could show. What
 * keeps it true is not the absence of numbers but the fact that it is DERIVED
 * from the books actually rendered: `hasLive` comes from the same filtered
 * index every page lists from, so withholding a book rewrites this sentence in
 * the same breath.
 */
/* "/" IS ABSENT ON PURPOSE. The home page renders the same sentence ABOVE its
 * first figure rather than under the footer — a disqualifier a reader reaches
 * after scrolling past the returns has already failed at its job. It is the
 * same component, so the two placements cannot drift apart; only the position
 * differs. */
const PAGES = new Set(["/methodology", "/disclosures", "/verify"]);

export function AccountDisclosure({ hasLive }: { hasLive: boolean }) {
  const path = usePathname();
  if (!PAGES.has(path)) return null;
  return <AccountDisclosureText hasLive={hasLive} />;
}

/** The sentence itself, with no pathname gate, so a page can place it where it
 *  belongs in its own reading order. Deriving it once is what keeps the claim
 *  honest: withholding a book rewrites every copy of it in the same breath. */
export function AccountDisclosureText({ hasLive }: { hasLive: boolean }) {
  return (
    <p className="text-body leading-relaxed text-fg max-w-[68ch]">
      <span className="font-semibold">
        {hasLive
          ? "Some portfolios on this site are broker-simulated paper accounts; others trade the firm\u2019s own real capital."
          : "Every portfolio on this site is a broker-simulated paper account. No capital is at risk in any of them."}
      </span>{" "}
      {/* THE PAPER-ONLY BRANCH NO LONGER POINTS AT A BOOK NOBODY CAN SEE. It
          used to end "the operator also runs a portfolio on real capital; it is
          not shown here while its publishing convention is being reset" — a
          forward reference to something with no page, no figure and no date,
          which reads as a withheld result rather than as an absence. The firm
          publishes six paper accounts; that is the whole claim.

          The `hasLive` branch stays. It costs nothing, and it is what keeps
          this sentence true on the day a real-capital book does appear in the
          payload: the wording is DERIVED, so it rewrites itself rather than
          having to be remembered. */}
      {hasLive ? "Each portfolio\u2019s page states which it is. " : ""}
      No third-party money is managed here, and nothing on this site is an offer
      or a solicitation.
    </p>
  );
}
