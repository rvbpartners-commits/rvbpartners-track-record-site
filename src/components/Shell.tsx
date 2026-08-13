import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "./Footer";

const NAV = [
  { href: "/", label: "Portfolios" },
  { href: "/verify", label: "Verify" },
  { href: "/methodology", label: "Methodology" },
  { href: "/disclosures", label: "Disclosures" },
];

/**
 * Minimal white sidebar, thin type, one hairline. The sidebar collapses to a
 * horizontal strip below `lg` rather than into a hamburger: there are four
 * links, and hiding four links behind a tap is worse than showing them.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="lg:w-60 lg:shrink-0 lg:border-r hairline lg:min-h-screen">
        <div className="px-6 py-6 lg:py-8 flex lg:block items-baseline gap-6">
          <Link href="/" className="block">
            <span className="text-[15px] font-semibold tracking-tight">
              RVB Partners
            </span>
            <span className="hidden lg:block text-[11px] uppercase tracking-[0.14em] text-fg-faint mt-1">
              Live track record
            </span>
          </Link>
          <nav className="flex lg:flex-col gap-5 lg:gap-0 lg:mt-8 text-[13px]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lg:py-1.5 text-fg-muted hover:text-fg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 px-5 sm:px-8 lg:px-12 py-8 lg:py-12 max-w-[1180px] w-full">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
