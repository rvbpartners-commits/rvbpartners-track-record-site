import Link from "next/link";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Hero } from "@/components/Hero";
import { Note } from "@/components/Note";
import { CONTACT_EMAIL, getIndex, getResearch } from "@/lib/data";
import { NO_VALUE, date } from "@/lib/format";

/**
 * THE FRONT PAGE.
 *
 * Four things, in the order a first-time reader needs them: who the firm is
 * and what the work amounts to (the hero), what kind of account the figures
 * come from (the account statement, above anything else), how the work is done
 * (three steps, each handing off to the page that shows it), and how current the
 * record is.
 *
 * NO RETURN FIGURE APPEARS HERE. The curves are on /portfolios, beside the
 * conditions attached to them. The counts in the hero are counts of work —
 * strategies researched, backtests recorded, strategies presented, accounts
 * published — not performance.
 */
export const dynamic = "force-dynamic";

/** Big integers, grouped: an ungrouped six-digit run is unreadable. */
function int(n: number | null | undefined): string {
  return n === null || n === undefined ? NO_VALUE : n.toLocaleString("en-US");
}

export default async function Home() {
  const [index, research] = await Promise.all([getIndex(), getResearch()]);

  const books = index?.books ?? [];
  const hasLive = books.some((b) => b.capital_at_risk);

  const tested = research?.search?.strategies_researched ?? null;
  const backtests = research?.search?.recorded_trials ?? null;
  const presented = research?.catalogue?.presented_folders ?? null;

  // Every figure read from the payload; a count that cannot be read is left out
  // of the band rather than shown as zero.
  const heroStats = [
    tested !== null ? { label: "Strategies researched", value: int(tested) } : null,
    backtests !== null ? { label: "Backtests recorded", value: int(backtests) } : null,
    presented !== null ? { label: "Presented as an edge", value: int(presented) } : null,
    books.length > 0 ? { label: "Portfolios", value: String(books.length) } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const currentTo = books
    .map((b) => b.last_session)
    .filter(Boolean)
    .sort()
    .at(-1);

  const steps = [
    {
      n: "01",
      head: "We test",
      body: "Every strategy is built and measured inside one framework, under one cost structure and one execution delay, and its result is then re-measured against everything else that was searched before it can be presented.",
      href: research !== null ? "/research" : null,
      cta: "How strategies are tested",
    },
    {
      n: "02",
      head: "We select",
      body: "Presented strategies are assembled into fixed portfolios. Each is a committed set of strategies and target weights, traded on its own broker account and not re-chosen between sessions.",
      href: "/portfolios" as string | null,
      cta: "The portfolios",
    },
    {
      n: "03",
      head: "We publish every session",
      body: "Each account is marked after its close and the result is archived. Every record is hashed, linked to the one before it and timestamped, so a published figure cannot be changed afterwards.",
      href: "/verify" as string | null,
      cta: "Verify the record",
    },
  ];

  return (
    <>
      <Hero stats={heroStats} />

      {!index && (
        <div className="mt-9">
          <Note tone="warn">
            The published data could not be loaded. Nothing is being shown rather
            than a stale or partial figure.
          </Note>
        </div>
      )}

      {/* The account statement sits directly under the hero, above every other
          figure on the page, with the one definition a reader needs to read it. */}
      <section className="mt-14 grid gap-x-16 gap-y-8 border-b hairline pb-12 lg:mt-16 lg:grid-cols-2 lg:pb-14">
        <p className="text-subhead text-fg">
          A paper account is a real broker account trading live market prices
          with simulated money: the orders and the fills are the broker&rsquo;s,
          the money is not.
        </p>
        <div className="lg:border-l hairline lg:pl-16">
          <AccountDisclosureText hasLive={hasLive} />
        </div>
      </section>

      <section className="mt-12 border-t hairline pt-7 lg:mt-16">
        <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
          How we work
        </h2>
        <ol className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="text-label text-fg-faint">{s.n}</span>
              <h3 className="mt-3 text-subhead font-semibold text-fg">{s.head}</h3>
              <p className="mt-2.5 text-body text-fg-muted">{s.body}</p>
              {s.href && (
                <Link
                  href={s.href}
                  className="mt-4 inline-block text-label uppercase text-accent hover:underline"
                >
                  {s.cta} &rarr;
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t hairline pt-7 lg:mt-16">
        <p className="text-small leading-relaxed text-fg-muted">
          {currentTo && <>This record is current to {date(currentTo)}. </>}
          Every performance and research figure on this site is read from files published in a public
          repository, where each session is hashed and chained to the one
          before it. The company is identified on the{" "}
          <Link href="/legal" className="text-accent hover:underline">
            legal notice
          </Link>{" "}
          and can be reached at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </>
  );
}
