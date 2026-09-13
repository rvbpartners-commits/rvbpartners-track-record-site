import Link from "next/link";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Hero } from "@/components/Hero";
import { Note } from "@/components/Note";
import { CONTACT_EMAIL, getIndex, getResearch } from "@/lib/data";
import { NO_VALUE, date } from "@/lib/format";

/**
 * THE FRONT PAGE.
 *
 * THE ORDER IS THE ARGUMENT, AND IT USED TO BE BACKWARDS. The page opened on
 * the firm's name and, four lines later, on 528,527 — then an account
 * disclosure, then how the work is done, then how current the record is. Every
 * figure was true and none was a performance claim, and a first-time reader
 * still left with "RVB has run a lot of backtests" rather than with "RVB has
 * built a rigorous way of finding, selecting and running systematic
 * strategies". The evidence was arriving before the thing it is evidence for.
 *
 * So: WHO, then WHAT WE BELIEVE, then HOW WE WORK, then THE RECORD.
 *
 *   the hero        the claim, and two doors
 *   who we are      one paragraph, and the people behind it
 *   beyond return   what is optimised for besides the return
 *   how we work     five steps, each handing off to the page that shows it
 *   the record      the counts, the account statement, the portfolios
 *
 * Nothing was removed to make room and nothing was softened. The record is
 * still the longest part of this page — it is the second half of it now
 * instead of the first, which is what makes the counts read as proof of a
 * method rather than as the method itself.
 *
 * NO RETURN FIGURE APPEARS HERE. The curves are on /portfolios, beside the
 * conditions attached to them. The counts below are counts of work —
 * strategies researched, backtests recorded, what survived the correction,
 * accounts published — not performance.
 */
export const dynamic = "force-dynamic";

/** Big integers, grouped: an ungrouped six-digit run is unreadable. */
function int(n: number | null | undefined): string {
  return n === null || n === undefined || !Number.isFinite(n)
    ? NO_VALUE
    : n.toLocaleString("en-US");
}

/** The six standards, in the order /approach argues them. Names and one line
 *  each: this is the short form, and the page that sets out each one is a link
 *  away. They are STANDARDS APPLIED TO A PROCESS, not six investment
 *  objectives ranked against each other, and the wording has to keep saying so
 *  or "Diversification" reads as a promise about outcomes. */
const STANDARDS = [
  { name: "Return", line: "Measured net of costs, after an execution delay." },
  { name: "Risk", line: "Quoted in excess of the risk-free rate." },
  { name: "Robustness", line: "Re-measured against every trial recorded." },
  { name: "Diversification", line: "Portfolios of strategies, not single strategies." },
  { name: "Execution", line: "The same logic research measured, on the account." },
  { name: "Evidence", line: "Every figure re-derivable from published files." },
];

export default async function Home() {
  const [index, research] = await Promise.all([getIndex(), getResearch()]);

  const books = index?.books ?? [];
  const hasLive = books.some((b) => b.capital_at_risk);

  const tested = research?.search?.strategies_researched ?? null;
  const backtests = research?.search?.recorded_trials ?? null;
  const presented = research?.catalogue?.presented_folders ?? null;
  const survived = research?.deflation?.survive_book_level ?? null;

  // EVERY FIGURE READ FROM THE PAYLOAD, and a count that cannot be read is left
  // out of the row rather than shown as zero. The set changed with the move
  // down the page: "presented as an edge" was replaced by what CLEARS THE
  // WHOLE-CATALOGUE BAR, because the smaller number is the one that carries the
  // argument. The 42 it replaced is not dropped — it is stated in the sentence
  // underneath, where it can be explained in the same breath.
  const counts = [
    backtests !== null ? { label: "Backtests recorded", value: int(backtests) } : null,
    tested !== null ? { label: "Strategies researched", value: int(tested) } : null,
    survived !== null && Number.isFinite(survived)
      ? {
          label: "Clear the whole-catalogue bar",
          value: int(survived),
        }
      : null,
    books.length > 0
      ? { label: "Portfolios published", value: String(books.length) }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const currentTo = books
    .map((b) => b.last_session)
    .filter(Boolean)
    .sort()
    .at(-1);

  // THE SAME SIX NAMES /approach USES, in the same order. The front page used
  // to run Research, Challenge, Select, Deploy, Verify while /approach ran
  // Research, Validation, Selection, Portfolio, Live execution, Monitoring —
  // two vocabularies for one process, which reads as two processes. Six cells
  // also fill a three-track grid exactly, where five left a hole.
  const steps = [
    {
      n: "01",
      head: "Research",
      body: "Ideas are written as strategies in one standard shape and backtested in one framework, under one cost structure and one execution delay. Every run is recorded.",
      href: research !== null ? "/research" : null,
      cta: "How much was searched",
    },
    {
      n: "02",
      head: "Validation",
      body: "Each result is put through the anti-overfit battery, then measured again against every trial the firm has recorded. Most results stop here.",
      href: research !== null ? "/research#the-bar" : null,
      cta: "The bar",
    },
    {
      n: "03",
      head: "Selection",
      body: "What survives is graded and filed by verdict. Nothing the grading rejects is presented as a result anywhere on this site.",
      href: research !== null ? "/selection" : null,
      cta: "How the catalogue is graded",
    },
    {
      n: "04",
      head: "Portfolio",
      body: "Surviving strategies are assembled into a fixed portfolio: a committed set of strategies and target weights, not re-chosen between sessions.",
      href: "/portfolios" as string | null,
      cta: "The portfolios",
    },
    {
      n: "05",
      head: "Live execution",
      body: "The portfolio is funded on its own broker account and traded by the desk, which re-uses the research path rather than re-implementing it.",
      href: "/approach#pipeline" as string | null,
      cta: "How a result becomes a portfolio",
    },
    {
      n: "06",
      head: "Monitoring",
      body: "Each account is marked after its close, the session is hashed into a chain and timestamped, and the live result is measured against the simulation behind it.",
      href: "/verify" as string | null,
      cta: "Check the record",
    },
  ];

  return (
    <>
      <Hero />

      {!index && (
        <div className="mt-9">
          <Note tone="warn">
            The published data could not be loaded. Nothing is being shown rather
            than a stale or partial figure.
          </Note>
        </div>
      )}

      {/* ─── WHO WE ARE ──────────────────────────────────────────────────
          One paragraph, and one door. The page that introduces the people is
          not this one; what this has to do is say that there ARE people, which
          the site did not say anywhere at all. */}
      <section className="mt-14 border-b hairline pb-12 lg:mt-16 lg:pb-14">
        <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
          Who we are
        </h2>
        <p className="mt-6 max-w-[78ch] text-subhead text-fg">
          RVB is a research-driven systematic trading firm. Research, strategy
          development and production infrastructure sit inside one team and one
          codebase, so a result found in research runs on an account without
          being rebuilt on the way. The difference between the simulated result
          and the live one is measured.
        </p>
        <Link
          href="/team"
          className="mt-7 inline-block text-small font-medium text-accent hover:underline"
        >
          Meet the team &rarr;
        </Link>
      </section>

      {/* ─── BEYOND RETURN ───────────────────────────────────────────────
          Six words and six lines. The argument for each is on /approach; what
          belongs here is the fact that return is not the only axis, stated
          early enough to change how the counts below are read. */}
      <section className="mt-12 border-b hairline pb-12 lg:mt-16 lg:pb-14">
        <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
          Beyond return
        </h2>
        <p className="mt-6 max-w-[74ch] text-subhead text-fg">
          Return is one of six standards a result is held to, and the six are
          applied at every stage rather than checked at the end. A strategy that
          earns well on paper but does not survive the search that found it, the
          costs of trading it, or the execution it would require, is not carried
          into a portfolio.
        </p>
        <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {STANDARDS.map((d) => (
            <li key={d.name} className="border-t hairline pt-3">
              <span className="block text-body font-semibold text-fg">
                {d.name}
              </span>
              <span className="mt-0.5 block text-small text-fg-muted">
                {d.line}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/approach"
          className="mt-7 inline-block text-small font-medium text-accent hover:underline"
        >
          How we invest &rarr;
        </Link>
      </section>

      {/* ─── HOW WE WORK ─────────────────────────────────────────────────── */}
      <section className="mt-12 border-b hairline pb-12 lg:mt-16 lg:pb-14">
        <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
          How we work
        </h2>
        <ol className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <span className="text-label tnum text-fg-faint">{s.n}</span>
              <h3 className="mt-3 text-subhead font-semibold text-fg">{s.head}</h3>
              <p className="mt-2.5 text-small leading-relaxed text-fg-muted">
                {s.body}
              </p>
              {s.href && (
                <Link
                  href={s.href}
                  className="mt-4 inline-block text-caption text-accent hover:underline"
                >
                  {s.cta} &rarr;
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ─── THE RECORD ──────────────────────────────────────────────────
          The counts, under a heading that says what they are for. Each figure
          is read from the published payload; the sentence beneath is the one
          this page is actually making, and the account statement sits with the
          figures rather than three screens above them. */}
      <section className="mt-12 lg:mt-16">
        <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
          The record
        </h2>

        {counts.length > 0 && (
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
            {counts.map((c) => (
              <div key={c.label}>
                {/* A RULE UNDER EACH LABEL. Size and colour alone are not
                    enough to read four pairs as four pairs rather than as
                    eight stacked lines. */}
                <dt className="border-b hairline pb-2.5 text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
                  {c.label}
                </dt>
                <dd className="mt-3.5 tnum text-heading leading-none sm:text-title">
                  {c.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-9 max-w-[74ch] text-subhead text-fg">
          A result cannot be judged apart from the number of ideas tested before
          it, so the firm publishes the size of its search alongside what
          survived it.
        </p>
        <p className="mt-3 max-w-[74ch] text-body text-fg-muted">
          {presented !== null && presented !== undefined ? (
            <>
              Of everything searched, {int(presented)} catalogue entries are
              presented as a result at all, and only the figure above clears the
              correction for the search that found them.{" "}
            </>
          ) : null}
          Every backtest, sweep and grid cell is recorded in an append-only
          ledger, and each result is deflated by how much was searched before
          it.{research !== null ? (
            <>
              {" "}
              <Link href="/research" className="text-accent hover:underline">
                Every figure, and how the correction is applied
              </Link>
              {"."}
            </>
          ) : null}
        </p>

        {/* The account statement, beside the figures it qualifies, with the one
            definition a reader needs to read them. */}
        <div className="mt-10 grid gap-x-16 gap-y-8 border-t hairline pt-9 lg:grid-cols-2">
          <p className="text-body text-fg-muted">
            A paper account is a real broker account trading live market prices
            with simulated money: the orders and the fills are the
            broker&rsquo;s, the money is not.
          </p>
          <div className="lg:border-l hairline lg:pl-16">
            <AccountDisclosureText hasLive={hasLive} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/portfolios"
            className="text-small font-medium text-accent hover:underline"
          >
            See every portfolio and its record &rarr;
          </Link>
          <Link
            href="/verify"
            className="text-small font-medium text-accent hover:underline"
          >
            Verify it yourself &rarr;
          </Link>
        </div>
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
