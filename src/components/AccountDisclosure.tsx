"use client";

import { usePathname } from "next/navigation";

/**
 * What kind of money these portfolios trade — stated once on every page.
 *
 * The home page and the portfolio index place it in their own body, above
 * their first figure, and a portfolio's own page states its account kind in its
 * header; the footer carries it everywhere else. It used to be placed in the
 * body of five pages AND the footer of three, so a reader met the same sentence
 * twice on some pages and not at all on others.
 *
 * It no longer says "nothing on this site is an offer or a solicitation": the
 * footer line directly under it says exactly that on every page, and the two
 * stacked read as the firm repeating itself.
 *
 * DERIVED, NEVER ASSERTED: both flags come from the published index
 * (`publishedKinds`), so the sentence changes by itself when the set of account
 * kinds does — in BOTH directions. It used to take `hasLive` alone, which cannot
 * express "no paper account is published": a record holding only the real-capital
 * book therefore read "some portfolios here are paper accounts; others trade the
 * firm's own capital" with no paper account on the site at all. Saying "paper"
 * where the money is real is the one error this sentence exists to prevent.
 */
function placedInBody(path: string): boolean {
  return path === "/" || path === "/portfolios" || path.startsWith("/portfolios/");
}

type Kinds = { hasLive: boolean; hasPaper: boolean };

export function AccountDisclosure({ hasLive, hasPaper }: Kinds) {
  const path = usePathname();
  if (placedInBody(path)) return null;
  return <AccountDisclosureText hasLive={hasLive} hasPaper={hasPaper} />;
}

export function AccountDisclosureText({ hasLive, hasPaper }: Kinds) {
  const sentence =
    hasLive && hasPaper
      ? "Some portfolios on this site are broker-simulated paper accounts; others trade the firm\u2019s own capital. Each portfolio\u2019s page states which it is. "
      : hasLive
        ? "Every portfolio on this site trades the firm\u2019s own capital; none of them is a paper account. "
        : "Every portfolio on this site is a broker-simulated paper account; no capital is at risk in any of them. ";
  return (
    <p className="text-body leading-relaxed text-fg">
      {sentence}
      The firm manages no third-party money.
    </p>
  );
}
