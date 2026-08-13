import Link from "next/link";
import { REPO_URL } from "@/lib/data";

/**
 * The paper-account disclosure lives here, in the footer, by the operator's
 * decision — and it is written to survive that placement.
 *
 * A disclosure in a footer is only honest if it is still *read as one*: normal
 * body size (14px, the same as the tables above it), full foreground colour
 * rather than a grey wash, plain wording in the first sentence, and no
 * competing links above it. It is deliberately the first thing in the footer
 * and not the last line of a legal stack. If someone later shrinks this to 10px
 * grey, the disclosure has been removed in everything but name.
 */
export function Footer() {
  return (
    <footer className="mt-16 border-t hairline">
      <div className="px-5 sm:px-8 lg:px-12 py-8 max-w-[1180px]">
        <p className="text-[14px] leading-relaxed text-fg max-w-[68ch]">
          <span className="font-semibold">
            These results come from Alpaca paper-trading accounts.
          </span>{" "}
          No real money is invested, no capital is at risk, and every fill is
          simulated by the broker&rsquo;s paper engine. Results are a
          live-execution rehearsal of the strategies, not a record of managing
          client money. Limit-order fills are biased low by the free market-data
          feed used, so these figures understate the limit-order strategies by an
          amount that has not been measured.
        </p>
        <p className="text-[14px] leading-relaxed text-fg-muted max-w-[68ch] mt-3">
          Past performance is not indicative of future results. Nothing on this
          site is investment advice, an offer, or a solicitation to buy or sell
          any financial instrument.
        </p>

        <div className="mt-8 pt-6 border-t hairline flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-fg-muted">
          <Link href="/disclosures" className="hover:text-fg transition-colors">
            Full disclosures
          </Link>
          <Link href="/methodology" className="hover:text-fg transition-colors">
            Methodology
          </Link>
          <Link href="/verify" className="hover:text-fg transition-colors">
            Verify the record
          </Link>
          <a
            href={REPO_URL}
            className="hover:text-fg transition-colors"
            rel="noreferrer noopener"
            target="_blank"
          >
            Data repository
          </a>
          <span className="ml-auto text-fg-faint">
            &copy; {new Date().getFullYear()} RVB Partners
          </span>
        </div>
      </div>
    </footer>
  );
}
