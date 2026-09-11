import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/lib/data";
import { AccountDisclosure } from "./AccountDisclosure";

/** The account disclosure sits here at body size and full contrast, first in the
 *  footer. Shrinking or greying it removes it in all but name.
 *
 *  It no longer counts anything, and it is DERIVED from the books actually
 *  rendered — withholding one rewrites the sentence rather than leaving it
 *  claiming something no page can show. The previous wording read "6 of these
 *  portfolios are Alpaca paper-trading accounts ... X trades real capital",
 *  which a reader takes as *only* X — and it became false the day a second
 *  real-capital book arrived. A sentence with arithmetic in it goes stale; one
 *  that names both kinds and points at the page that knows does not.
 *
 *  It is also hidden on the portfolio pages, where each book states its own
 *  kind in its own header. See `AccountDisclosure`.
 *
 *  THE FOOTER IS NOT A SECOND CONTENTS. It carried eight links back into the
 *  site — the firm, refused, disclosures, methodology, verify, plus both
 *  repositories — every one of which the masthead already offers on every page,
 *  and none of which a reader comes to a footer looking for. A footer is where
 *  the standing obligations live: who to write to, where the company is
 *  identified, what is stored about you, and where the firm can be found
 *  elsewhere. That is what is left.
 *
 *  `/legal` STAYS, and it is the one internal link that has to. A French
 *  company publishing a website must make its mentions légales reachable
 *  (LCEN art. 6-III), and the footer is where a reader looks for them. The
 *  cookies entry points into the same document, at the section that says the
 *  site stores nothing at all: an absent cookie notice and a cookie notice
 *  saying there are none read very differently to someone checking.
 */
export function Footer({ hasLive }: { hasLive: boolean }) {
  return (
    <footer className="mt-16">
      {/* THE CLOSING BAND. The page opens on ink and now closes on it, so the
          document has two ends rather than trailing off into white. The image
          is the firm's own: overlapping return distributions, which is what
          this record is a picture of.

          `aria-hidden` and empty alt — it carries no information a reader
          needs, and describing it would be describing decoration. */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#0c0d0e]">
        <Image
          src="/banner-distributions.png"
          alt=""
          aria-hidden="true"
          width={4200}
          height={700}
          sizes="100vw"
          className="h-[90px] w-full object-cover object-bottom sm:h-[130px]"
        />
      </div>

      <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-10">
        <AccountDisclosure hasLive={hasLive} />
        <p className="text-body leading-relaxed text-fg-muted max-w-[68ch] mt-3">
          Past performance is not indicative of future results. Nothing on this
          site is investment advice, an offer, or a solicitation to buy or sell
          any financial instrument.
        </p>

        <nav
          aria-label="Legal and contact"
          className="mt-8 pt-6 border-t hairline flex flex-wrap items-center gap-x-7 gap-y-3 text-small text-fg-muted"
        >
          {/* Legally required of a French company publishing a website
              (LCEN art. 6-III). */}
          <Link href="/legal" className="hover:text-fg transition-colors">
            Legal notice
          </Link>
          <Link href="/legal#cookies" className="hover:text-fg transition-colors">
            Cookies
          </Link>
          <a
            href={LINKEDIN_URL}
            className="hover:text-fg transition-colors"
            rel="noreferrer noopener"
            target="_blank"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-fg transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <span className="w-full text-fg-faint sm:ml-auto sm:w-auto">
            &copy; {new Date().getFullYear()} RVB Partners
          </span>
        </nav>
      </div>
    </footer>
  );
}
