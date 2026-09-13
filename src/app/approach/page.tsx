import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Next } from "@/components/Next";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { SITE_ORIGIN, getIndex, getResearch } from "@/lib/data";
import { NO_VALUE } from "@/lib/format";

/**
 * WHAT THE FIRM OPTIMISES FOR, AND HOW A RESULT BECOMES A PORTFOLIO.
 *
 * THE PAGE THE EVIDENCE WAS MISSING. This site could show a reader every
 * backtest it had ever run and every hash behind every session, and still not
 * answer *what are you trying to build*. The counts on /research are a picture
 * of a philosophy; without the philosophy stated somewhere they are just a
 * large number, and a large number is the one thing a track record does not
 * need more of.
 *
 * BEYOND RETURN, AND IT IS NOT A SLOGAN. Every dimension below is a decision
 * already visible elsewhere on this site — the risk-free rate subtracted before
 * a Sharpe ratio is quoted, the whole-catalogue correction on /research, the
 * execution delay and the cost floor in the accounting engine, the withholding
 * gate on every young book. The page's job is to say what those add up to, not
 * to introduce anything new. If a line here is not evidenced by a page this
 * site already publishes, it does not belong on it.
 *
 * MARKETS ARE SPLIT IN TWO, DELIBERATELY. What is traded today is a fact the
 * portfolios page can be checked against; what the firm is building towards is
 * an intention. Printing them in one list would make the second read as the
 * first, which is the single most common way a firm's site stops being true.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "How RVB Partners builds systematic strategies: what it optimises for " +
    "beyond return, how a result becomes a portfolio, and which markets it " +
    "trades today.",
  alternates: { canonical: `${SITE_ORIGIN}/approach` },
};

/** The six standards, and where each is already visible in the record.
 *
 *  A standard with no page behind it is a claim, which is what this page
 *  exists not to make. `cite` is the link, `href` the anchor it lands on.
 *
 *  THEY ARE STANDARDS, NOT OBJECTIVES. Calling them "dimensions" of
 *  performance put diversification and evidence beside return as though a
 *  reader were being promised six outcomes. They are six things a result is
 *  held to at each stage of the process, which is both what the firm actually
 *  does and the weaker, checkable claim.
 */
const STANDARDS: { name: string; body: string; href: string; cite: string }[] = [
  {
    name: "Return",
    body:
      "Measured net of costs and after a one-bar execution delay, on the " +
      "weights a strategy actually held rather than the ones it would have " +
      "wanted. The other five standards qualify this one.",
    href: "/methodology#returns",
    cite: "How a return is defined",
  },
  {
    name: "Risk",
    body:
      "A return is quoted against what it cost to earn. Sharpe, Sortino and " +
      "Calmar are published in excess of the risk-free rate, so a strategy " +
      "that returns less than cash is recorded as doing so.",
    href: "/methodology#metrics",
    cite: "What is computed, and what is withheld",
  },
  {
    name: "Robustness",
    body:
      "A result has to survive the search that found it. Every strategy is " +
      "re-measured against the whole catalogue's recorded trials, and most " +
      "results that clear the standard bar do not clear that one.",
    href: "/research",
    cite: "The whole-catalogue bar",
  },
  {
    name: "Diversification",
    body:
      "The unit the firm funds is a portfolio; a strategy is one component " +
      "of it. Ideas are clustered into families by correlation and by shared " +
      "code, so a sweep of forty variants counts as one family rather than " +
      "as forty independent results.",
    href: "/portfolios",
    cite: "The published portfolios",
  },
  {
    name: "Execution",
    body:
      "A strategy is measured on the costs and delays it would actually " +
      "meet. The same logic that was measured in research runs on the " +
      "account, through the same engine, and the difference between the two " +
      "is measured.",
    href: "/methodology#costs",
    cite: "What a fill costs",
  },
  {
    name: "Evidence",
    body:
      "Every published figure has to be re-derivable by a reader who does " +
      "not trust the firm. That constrains what can be claimed: a number " +
      "that cannot be checked is not presented as a result.",
    href: "/verify",
    cite: "How to check the record",
  },
];

/** Research to monitoring, in the order the work actually happens. */
const PIPELINE: { n: string; name: string; body: string }[] = [
  {
    n: "01",
    name: "Research",
    body: "An idea is written as a strategy in a standard shape and backtested inside the firm's framework. Every run is recorded, including the ones that go nowhere.",
  },
  {
    n: "02",
    name: "Validation",
    body: "The result is put through the anti-overfit battery, then re-measured against every trial the firm has ever recorded. Most results stop here.",
  },
  {
    n: "03",
    name: "Selection",
    body: "What survives is graded and filed by verdict. Nothing the grading rejects is presented as an edge anywhere, on any surface.",
  },
  {
    n: "04",
    name: "Portfolio",
    body: "Surviving strategies are assembled into a fixed portfolio: a committed set of strategies and target weights, not re-chosen between sessions.",
  },
  {
    n: "05",
    name: "Live execution",
    body: "The portfolio is funded on its own broker account and traded by the desk, which re-uses the research path rather than re-implementing it.",
  },
  {
    n: "06",
    name: "Monitoring",
    body: "Each account is marked after its close, the session is hashed into a chain, and the live result is measured against the simulation that argued for it.",
  },
];

export default async function ApproachPage() {
  const [index, research] = await Promise.all([getIndex(), getResearch()]);
  const books = index?.books ?? [];
  const trials = research?.search?.recorded_trials ?? null;
  const presented = research?.catalogue?.presented_folders ?? null;

  return (
    <div className="pt-2 lg:pt-6">
      <header>
        <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
          Approach
        </h1>
        <p className="mt-3 text-body text-fg-muted leading-relaxed">
          RVB builds diversified portfolios of systematic strategies. This page
          sets out the standards a result is held to, how an idea becomes a
          funded account, and which markets the firm trades today. Each section
          links to the page where the claim can be checked.
        </p>
      </header>

      <div className="text-body">
        {/* WIDE, BECAUSE SIX CARDS ARE NOT A PARAGRAPH. Inside the measure
            track they laid out two abreast and left the whole 20rem margin
            holding a two-line note — the empty right-hand column this grid was
            rebuilt to stop drawing. Spanning both tracks gives three abreast
            and puts the note in the head, where a wide section's note goes. */}
        <Section
          first
          wide
          id="beyond-return"
          title="Beyond return"
          gloss="Six standards, applied at every stage."
          note={
            <>
              These are standards applied to a process, not six investment
              objectives ranked against one another. Each links to the page
              where it is already visible in the record.
            </>
          }
        >
          <p>
            The six below are applied throughout research, selection and
            execution rather than checked once at the end, and a failure against
            any one of them is enough to stop a result. A strategy that earns
            well on paper but does not survive the search that found it, the
            costs of trading it, or the execution it would require, is not
            carried into a portfolio.
          </p>
          <ul className="mt-2 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {STANDARDS.map((d) => (
              <li key={d.name} className="border-t hairline pt-4">
                <h3 className="text-subhead font-semibold text-fg">{d.name}</h3>
                <p className="mt-2 text-small leading-relaxed text-fg-muted">
                  {d.body}
                </p>
                <Link
                  href={d.href}
                  className="mt-2.5 inline-block text-caption text-accent hover:underline"
                >
                  {d.cite} &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="rejection"
          title="Why the search is published"
          gloss="The denominator behind every result."
          aside={
            <MarginBlock label="The search, as published">
              <Fact
                label="Backtests recorded"
                value={trials === null ? NO_VALUE : trials.toLocaleString("en-US")}
              />
              <Fact
                label="Presented as an edge"
                value={
                  presented === null || presented === undefined
                    ? NO_VALUE
                    : presented.toLocaleString("en-US")
                }
              />
              <Fact
                label="Portfolios published"
                value={books.length > 0 ? String(books.length) : NO_VALUE}
              />
            </MarginBlock>
          }
        >
          <p>
            Search enough and something will look significant by chance. That is
            the central problem of systematic research, and the only defence is
            to count every search and correct each result for it.
          </p>
          <p>
            Every backtest, sweep and grid cell is recorded in an append-only
            ledger, and a strategy&rsquo;s result is deflated by how much was
            searched before it. The size of the search is published alongside
            what survived it, so a reader can apply the same correction.
          </p>
        </Section>

        <Section
          id="pipeline"
          title="How a result becomes a portfolio"
          gloss="Six steps, and most ideas stop at the second."
          wide
        >
          <ol className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {PIPELINE.map((s) => (
              <li key={s.n} className="border-t hairline pt-4">
                <span className="text-label tnum text-fg-faint">{s.n}</span>
                <h3 className="mt-2 text-subhead font-semibold text-fg">
                  {s.name}
                </h3>
                <p className="mt-2 text-small leading-relaxed text-fg-muted">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="diversification"
          title="Portfolio construction"
          gloss="The unit the firm builds and funds."
        >
          <p>
            The unit RVB builds and funds is a portfolio: a committed set of
            strategies and target weights, assembled from the surviving
            catalogue and traded on its own account until it is deliberately
            changed. A single strategy is a component of a portfolio rather
            than something the firm runs on its own, which limits how much any
            one result can matter.
          </p>
          <p>
            That is also why the research counts ideas in families rather than
            one by one. Forty variants of the same template swept across forty
            instruments are not forty independent edges, however uncorrelated
            their returns happen to look, and a portfolio built as though they
            were would be concentrated in exactly the way it claims not to be.
          </p>
        </Section>

        <Section
          id="markets"
          wide
          title="Markets"
          gloss="What is traded today, and what is not."
          note={
            <>
              The first list can be checked against the published accounts. The
              second is where the firm is taking the same research platform
              next, and nothing in it is traded today.
            </>
          }
        >
          <div className="grid gap-x-14 gap-y-8 sm:grid-cols-2">
            <div>
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                Current focus
              </h3>
              <ul className="mt-3 border-t hairline">
                <Market name="US markets" what="Equities and ETFs, on paper accounts at a US broker." />
                <Market name="Crypto" what="Including the portfolio that trades the firm's own real capital." />
              </ul>
              <p className="mt-3 text-caption leading-relaxed text-fg-muted">
                Every account behind these is listed, with its kind and its
                record, under{" "}
                <Link href="/portfolios" className="text-accent hover:underline">
                  portfolios
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                Areas of expansion
              </h3>
              <ul className="mt-3 border-t hairline">
                <Market name="Commodities" what="Not traded today." />
                <Market name="Electricity and power markets" what="Not traded today." />
                <Market name="Further geographies" what="Including emerging and African markets. Not traded today." />
                <Market name="Further instruments" what="Not traded today." />
              </ul>
            </div>
          </div>
          <p>
            The framework, the validation battery and the desk are not specific
            to an asset class, so extending the research platform to a new
            market is a matter of a data source and a cost model rather than a
            separate research process.
          </p>
        </Section>

        <Section
          id="objective"
          title="Long-term objective"
          gloss="An ambition, not a current activity."
        >
          <p>
            RVB&rsquo;s long-term objective is to build an institutional
            investment platform around a diversified portfolio of systematic
            strategies. That is a direction of travel; it describes no current
            activity, and the paragraph below is what holds today.
          </p>
          <Note tone="warn" className="mt-1">
            The firm trades its own capital. It manages no third-party money, is
            not authorised to, and nothing on this site is an offer, a
            solicitation, or an invitation to invest. The accounts published here
            are broker-simulated except where a portfolio states otherwise on its
            own page.
          </Note>
        </Section>
      </div>

      <Next
        items={[
          {
            href: "/research",
            label: "See the research record",
            question:
              "How much was searched, and the correction every result is measured against.",
          },
          {
            href: "/portfolios",
            label: "See the portfolios",
            question:
              "The accounts these strategies are traded on, and what each has returned.",
          },
          {
            href: "/team",
            label: "Meet the team",
            question: "Who answers for the research, the framework and the record.",
          },
        ]}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PIECES
   ───────────────────────────────────────────────────────────────────── */

function MarginBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="border-b hairline pb-2 text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
        {label}
      </h3>
      <dl className="mt-3">{children}</dl>
    </div>
  );
}

/** A published count, or the absence marker. Never a zero standing in for a
 *  figure that could not be read. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b hairline py-2 last:border-b-0">
      <dt className="text-caption leading-snug text-fg-faint">{label}</dt>
      <dd className="mt-0.5 tnum text-small leading-snug text-fg">{value}</dd>
    </div>
  );
}

function Market({ name, what }: { name: string; what: string }) {
  return (
    <li className="border-b hairline py-2.5 last:border-b-0">
      <span className="block text-small font-medium text-fg">{name}</span>
      <span className="block text-caption leading-snug text-fg-muted">
        {what}
      </span>
    </li>
  );
}
