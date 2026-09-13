import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, LINKEDIN_URL } from "@/lib/data";
import { navGroup, type NavItem } from "@/lib/nav";
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
 *  THE FOOTER IS A SECOND CONTENTS AGAIN, AND THIS TIME IT HAS A REASON TO BE.
 *  It carried eight links back into the site and they were struck out on the
 *  grounds that the masthead already offered every one of them. That argument
 *  held while the masthead WAS the whole site: seven routes, all of them in the
 *  row at the top.
 *
 *  It stopped holding the moment the site grew a half the masthead does not
 *  carry. `/selection`, `/disclosures` and `/contact` are published pages with
 *  no seat in the contents row — deliberately, because a contents row with ten
 *  items is not a contents row. A footer is where a reader looks for exactly
 *  that: everything else, grouped, at the end of the document.
 *
 *  So the columns mirror the document's own split rather than repeating the
 *  masthead in a smaller size — THE FIRM (who we are, what we believe, how to
 *  reach us) and THE RECORD (what is traded, how it was searched, how to check
 *  it) — and both are read from `lib/nav`, so a route can never appear in one
 *  surface and be forgotten in the other. The standing obligations keep the
 *  last row to themselves.
 *
 *  `/legal` STAYS, and it is the one internal link that has to. A French
 *  company publishing a website must make its mentions légales reachable
 *  (LCEN art. 6-III), and the footer is where a reader looks for them. The
 *  cookies entry points into the same document, at the section that says the
 *  site stores nothing at all: an absent cookie notice and a cookie notice
 *  saying there are none read very differently to someone checking.
 */
export function Footer({
  hasLive,
  hasResearch,
}: {
  hasLive: boolean;
  /** Gates `/selection` in the footer exactly as it is gated in the masthead
   *  and in the sitemap. A footer that links a page rendering nothing is the
   *  reason the gate now lives in one file. */
  hasResearch: boolean;
}) {
  const firm = navGroup("firm", hasResearch);
  const record = navGroup("record", hasResearch);

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

      <div className="mx-auto max-w-[var(--column)] w-full px-5 sm:px-8 lg:px-12 py-10">
        <AccountDisclosure hasLive={hasLive} />
        {/* The line directly under the account statement, in the same
           measure as it: two disclaimers stacked with different right edges
           look like one of them was cut off. */}
        <p className="text-body leading-relaxed text-fg-muted mt-3">
          Past performance is not indicative of future results. Nothing on this
          site is investment advice, an offer, or a solicitation to buy or sell
          any financial instrument.
        </p>

        {/* THE CONTENTS, GROUPED THE WAY THE DOCUMENT IS.
            The firm's name and its one line lead, because a footer that opens
            on a column of links is a sitemap; one that opens on who published
            the page is a colophon, which is what this is. */}
        <div className="mt-10 border-t hairline pt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-small font-semibold text-fg">RVB Partners</p>
            <p className="mt-2 text-small leading-relaxed text-fg-muted">
              Systematic trading, built on research and verifiable in public.
            </p>
          </div>
          <FooterColumn heading="Firm" items={firm} />
          <FooterColumn heading="Record" items={record} />
          <div>
            <p className="text-label font-medium uppercase tracking-[0.14em] text-fg-faint">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {/* Legally required of a French company publishing a website
                  (LCEN art. 6-III). */}
              <FooterLink href="/legal">Legal notice</FooterLink>
              <FooterLink href="/legal#cookies">Cookies</FooterLink>
            </ul>
          </div>
        </div>

        <nav
          aria-label="Contact and legal"
          className="mt-10 pt-6 border-t hairline flex flex-wrap items-center gap-x-7 gap-y-3 text-small text-fg-muted"
        >
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

/** One column of routes, read from the navigation list rather than typed here.
 *
 *  A column that renders nothing is not rendered at all: with `research.json`
 *  withheld the record column loses two of its entries, and an empty heading
 *  over an empty list is the same broken promise the gate exists to prevent. */
function FooterColumn({
  heading,
  items,
}: {
  heading: string;
  items: readonly NavItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-label font-medium uppercase tracking-[0.14em] text-fg-faint">
        {heading}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <FooterLink key={item.href} href={item.href}>
            {item.label}
          </FooterLink>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-small text-fg-muted hover:text-fg transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
