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
 * DERIVED, NEVER ASSERTED: `hasLive` comes from the published index, so the
 * sentence changes by itself when the set of account kinds does.
 */
function placedInBody(path: string): boolean {
  return path === "/" || path === "/portfolios" || path.startsWith("/portfolios/");
}

export function AccountDisclosure({ hasLive }: { hasLive: boolean }) {
  const path = usePathname();
  if (placedInBody(path)) return null;
  return <AccountDisclosureText hasLive={hasLive} />;
}

export function AccountDisclosureText({ hasLive }: { hasLive: boolean }) {
  return (
    <p className="text-body leading-relaxed text-fg">
      {hasLive
        ? "Some portfolios on this site are broker-simulated paper accounts; others trade the firm\u2019s own capital. Each portfolio\u2019s page states which it is. "
        : "Every portfolio on this site is a broker-simulated paper account; no capital is at risk in any of them. "}
      The firm manages no third-party money.
    </p>
  );
}
