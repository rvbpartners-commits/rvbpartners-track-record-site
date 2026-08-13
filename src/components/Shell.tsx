import Link from "next/link";
import type { ReactNode } from "react";
import { Footer } from "./Footer";

const NAV = [
  { href: "/", label: "Track record" },
  { href: "/verify", label: "Verify" },
  { href: "/methodology", label: "Methodology" },
  { href: "/disclosures", label: "Disclosures" },
];

/**
 * A ruled page rather than a set of panels: one hairline under the masthead,
 * one above the footer, and nothing boxed in between. Hierarchy comes from
 * weight and spacing.
 *
 * Nothing is set in capitals. Uppercase reads as a system label — a machine
 * shouting a field name — and on a page that is otherwise an accounts document
 * it fights the tone rather than reinforcing it. Small, quiet, sentence case
 * does the same job without the shouting.
 */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b hairline">
        {/* `mx-auto` is what centres the column. A `max-w-*` on its own only
            caps the width — the block stays flush left, which on a wide screen
            leaves the whole site pinned to one edge. Every container that caps
            its width at MEASURE below does both, and they all use the same
            token so the masthead, the body and the footer share one edge. */}
        <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-4 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          <Link href="/" className="text-[15px] font-semibold tracking-tight">
            RVB Partners
          </Link>
          <nav className="flex gap-6 text-[13px]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-fg-muted hover:text-fg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="ml-auto text-[12px] text-fg-faint">
            Live paper-trading record
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
