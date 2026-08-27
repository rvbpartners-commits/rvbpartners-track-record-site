"use client";

import { usePathname } from "next/navigation";

/**
 * The account disclosure — what kind of money these portfolios trade.
 *
 * It lives on the landing pages and NOT on a portfolio page, because a
 * portfolio page answers the question for itself, in its own header, with its
 * own badge. Repeating a site-wide summary underneath it invites the reader to
 * apply the summary to the book they are looking at — which is exactly how the
 * previous wording went wrong: it enumerated "6 of these are paper accounts …
 * one trades real capital", which read as *only* one, and stopped being true
 * the day a second real-capital book arrived.
 *
 * So the wording no longer counts anything. It states that both kinds exist and
 * sends the reader to the page that knows. A sentence with no arithmetic in it
 * cannot go stale.
 */
const PAGES = new Set(["/", "/methodology", "/disclosures", "/verify"]);

export function AccountDisclosure() {
  const path = usePathname();
  if (!PAGES.has(path)) return null;

  return (
    <p className="text-[14px] leading-relaxed text-fg max-w-[68ch]">
      <span className="font-semibold">
        Some portfolios on this site are broker-simulated paper accounts; others
        trade the operator&rsquo;s own real capital.
      </span>{" "}
      Each portfolio&rsquo;s page states which it is. No third-party money is
      managed here, and nothing on this site is an offer or a solicitation.
    </p>
  );
}
