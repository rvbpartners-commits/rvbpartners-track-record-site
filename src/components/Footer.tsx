import Link from "next/link";
import { CONTACT_EMAIL, DATA_REPO_URL, SITE_REPO_URL, getIndex } from "@/lib/data";

/** The account disclosure sits here at body size and full contrast, first in the
 *  footer. Shrinking or greying it removes it in all but name.
 *
 *  It is read from the published index rather than written into the page,
 *  because the sentence that was true of every book here — "no capital is at
 *  risk" — stops being true the day one book trades real money, and a hardcoded
 *  disclosure would go on asserting it. The wording below therefore states what
 *  the payload says, in both directions. */
export async function Footer() {
  const index = await getIndex();
  const live = index?.books.filter((b) => b.capital_at_risk) ?? [];
  const paper = (index?.books.length ?? 0) - live.length;

  return (
    <footer className="mt-16 border-t hairline">
      <div className="mx-auto max-w-[1180px] w-full px-5 sm:px-8 lg:px-12 py-8">
        {live.length === 0 ? (
          <p className="text-[14px] leading-relaxed text-fg max-w-[68ch]">
            <span className="font-semibold">
              These results come from Alpaca paper-trading accounts.
            </span>{" "}
            No real money is invested, no capital is at risk, and every fill is
            simulated by the broker&rsquo;s paper engine. Results are a
            live-execution rehearsal of the strategies, not a record of managing
            client money.
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-fg max-w-[68ch]">
            <span className="font-semibold">
              {paper} of these portfolios are Alpaca paper-trading accounts
            </span>{" "}
            — no real money is invested and every fill is simulated by the
            broker&rsquo;s paper engine.{" "}
            <span className="font-semibold">
              {live.length === 1
                ? `${live[0].label} trades real capital.`
                : `${live.length} books trade real capital.`}
            </span>{" "}
            That capital is the operator&rsquo;s own; no third-party money is
            managed here, and nothing on this site is an offer or a solicitation.
            Each portfolio&rsquo;s page states which of the two it is.
          </p>
        )}
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
