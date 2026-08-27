import Link from "next/link";
import type { ReactNode } from "react";
import { getIndex } from "@/lib/data";
import { Footer } from "./Footer";

const NAV = [
  { href: "/portfolios", label: "Portfolios" },
  { href: "/verify", label: "Verify" },
  { href: "/methodology", label: "Methodology" },
  { href: "/disclosures", label: "Disclosures" },
];

/** A ruled page, not a set of panels. Nothing is set in capitals. */
export async function Shell({ children }: { children: ReactNode }) {
  // The masthead tagline described every book here as paper. It is read from the
  // payload for the same reason the footer disclosure is: a standing claim about
  // what the accounts ARE cannot be a constant once one of them changes.
  const index = await getIndex();
  const hasLive = (index?.books ?? []).some((b) => b.capital_at_risk);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b hairline">
        {/* `mx-auto` is what centres the column. A `max-w-*` on its own only
            caps the width — the block stays flush left, which on a wide screen
            leaves the whole site pinned to one edge. Every container that caps
            its width at MEASURE below does both, and they all use the same
            token so the masthead, the body and the footer share one edge. */}
        <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-3 sm:py-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            RVB
          </Link>
          {/* On a phone the four links wrap onto a second row and the masthead
              doubles in height. Below `sm` they scroll sideways on one line
              instead; `-mx-5 px-5` lets the row bleed to the screen edge so the
              last link is visibly cut off rather than looking like the end. */}
          <nav className="order-3 sm:order-none w-full sm:w-auto -mx-5 sm:mx-0 px-5 sm:px-0 scroll-x">
            <div className="flex gap-6 text-[13px] min-w-max py-1 sm:py-0">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-fg-muted hover:text-fg transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
          <span className="ml-auto text-[12px] text-fg-faint">
            {hasLive ? "Live record · paper and real capital" : "Live paper-trading record"}
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-8 lg:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
