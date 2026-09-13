import Link from "next/link";

/**
 * WHERE TO GO NEXT, AND WHY.
 *
 * Every page on this site was an island. They are in a deliberate order —
 * identity, then what is traded, then how it was searched, then how to check
 * it — and the only surface that expressed that order was the contents row at
 * the top, which is a list of addresses rather than an argument. A reader who
 * finished /research had no way to know that /selection continues it, that
 * /portfolios is what survived, and that /verify is how you check that claim.
 * They were expected to go back up and guess.
 *
 * This is one rule and one or two doors, at the end of a page, each labelled
 * with the QUESTION it answers rather than with its own name. "Portfolios" is
 * a destination; "See what survived the search" is a reason to open it.
 *
 * IT IS NOT A CALL TO ACTION. There is nothing to buy here and nobody to
 * convert: the firm manages no third-party money, so a button demanding a
 * decision would be selling something that does not exist. What this does is
 * the other thing a CTA does — it says what the next page is for — and it stops
 * there. No colour, no fill, no arrow bigger than the text it follows.
 *
 * AT MOST THREE. A page that ends by offering six directions has not decided
 * what it is for. Most carry one or two.
 */
export function Next({
  items,
}: {
  items: { href: string; label: string; question: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Continue"
      className="mt-14 border-t hairline pt-7 lg:mt-16"
    >
      <p className="text-label font-medium uppercase tracking-[0.14em] text-fg-faint">
        Continue
      </p>
      <ul className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="group block">
              <span className="text-subhead font-semibold text-fg group-hover:underline">
                {item.label}
                <span aria-hidden="true" className="ml-1.5 text-fg-faint">
                  &rarr;
                </span>
              </span>
              <span className="mt-1.5 block text-small leading-relaxed text-fg-muted">
                {item.question}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
