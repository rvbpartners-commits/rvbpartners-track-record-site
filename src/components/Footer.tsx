import Link from "next/link";
import { CONTACT_EMAIL, DATA_REPO_URL, SITE_REPO_URL } from "@/lib/data";
import { AccountDisclosure } from "./AccountDisclosure";

/** The account disclosure sits here at body size and full contrast, first in the
 *  footer. Shrinking or greying it removes it in all but name.
 *
 *  It no longer counts anything. The previous wording read "6 of these
 *  portfolios are Alpaca paper-trading accounts ... X trades real capital",
 *  which a reader takes as *only* X — and it became false the day a second
 *  real-capital book arrived. A sentence with arithmetic in it goes stale; one
 *  that names both kinds and points at the page that knows does not.
 *
 *  It is also hidden on the portfolio pages, where each book states its own
 *  kind in its own header. See `AccountDisclosure`. */
export function Footer() {
  return (
    <footer className="mt-16 border-t hairline">
      <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-8">
        <AccountDisclosure />
        <p className="text-[14px] leading-relaxed text-fg-muted max-w-[68ch] mt-3">
          Past performance is not indicative of future results. Nothing on this
          site is investment advice, an offer, or a solicitation to buy or sell
          any financial instrument.
        </p>

        <div className="mt-8 pt-6 border-t hairline grid grid-cols-2 sm:flex sm:flex-wrap gap-x-6 gap-y-2.5 sm:gap-y-2 text-[13px] text-fg-muted">
          <Link href="/disclosures" className="hover:text-fg transition-colors">
            Disclosures
          </Link>
          <Link href="/methodology" className="hover:text-fg transition-colors">
            Methodology
          </Link>
          <Link href="/verify" className="hover:text-fg transition-colors">
            Verify
          </Link>
          <a
            href={DATA_REPO_URL}
            className="hover:text-fg transition-colors"
            rel="noreferrer noopener"
            target="_blank"
          >
            Data
          </a>
          <a
            href={SITE_REPO_URL}
            className="hover:text-fg transition-colors"
            rel="noreferrer noopener"
            target="_blank"
          >
            Source
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="col-span-2 sm:col-span-1 hover:text-fg transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <span className="col-span-2 sm:col-span-1 sm:ml-auto text-fg-faint mt-2 sm:mt-0">
            &copy; {new Date().getFullYear()} RVB
          </span>
        </div>
      </div>
    </footer>
  );
}
