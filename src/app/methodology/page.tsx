import type { Metadata } from "next";
import Link from "next/link";
import { Next } from "@/components/Next";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { Stamp } from "@/components/Stamp";
import {
  DATA_REPO_URL,
  REPO_URL,
  SITE_ORIGIN,
  bookSlug,
  getFeedByAccountKind,
  getIndex,
} from "@/lib/data";
import { NO_VALUE } from "@/lib/format";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Methodology",
  // The description lists the page's sections, so a section added to the page
  // is added here too — a summary that names five of six is the kind of drift
  // nothing on the page itself would ever show.
  description:
    "How every published number is produced: sources, return convention, " +
    "metric definitions, benchmark, what the fills cost, and the biases that " +
    "are known but unmeasured.",
  alternates: { canonical: `${SITE_ORIGIN}/methodology` },
};


/**
 * THE RESEARCH COST MODEL'S DEFAULTS, as a table rather than as the twelve-line
 * sentence they were buried in. A reader asking "what was an illiquid name
 * charged?" was made to parse five figures out of running prose, which is the
 * one shape a comparison cannot be read in.
 *
 * The figures are the model's own declared defaults, retyped from nowhere but
 * the paragraph they used to sit in. Nothing here is derived from anything
 * else: no figure in this table is computed from another, and the site
 * publishes no strategy-level cost total that these would have to add up to.
 *
 * Spot FX carries NO borrow line at all, which is a stated fact about the model
 * and not a missing reading, so it is the word "None" rather than the absence
 * marker — the two would be indistinguishable in a column otherwise.
 */
const COST_DEFAULTS: { cls: string; spread: string; borrow: string }[] = [
  { cls: "US equities and ETFs", spread: "2.5 bp", borrow: "50 bp" },
  { cls: "Crypto", spread: "8 bp", borrow: "300 bp" },
  { cls: "Spot FX majors", spread: "1 bp", borrow: "None" },
];

export default async function MethodologyPage() {
  const index = await getIndex();
  // The market-data feed each kind of account was priced against, read from the
  // newest chained record of each. Empty if it cannot be read, and the
  // paragraph that uses it simply does not render.
  const feeds = await getFeedByAccountKind(index?.books ?? []);
  // The feed for the PAPER accounts specifically, read by key rather than by
  // iterating the map. The costs section below describes one kind of account
  // and names the data its fills were priced against; a loop there would
  // silently widen a sentence that is only true of that kind. Absent when no
  // paper record carries the field, and the sentence then does not render —
  // this page never states a feed it could not read.
  const paperFeed = feeds.get("paper") ?? null;
  // `?? null`, for the same reason `lag` above is. 60 is the threshold the
  // publisher happens to emit today, and hardcoding it here meant that with the
  // index unreachable this page went on stating a policy as fact — printing a
  // number it had not read, on the page whose whole subject is where the
  // numbers come from. An unknown threshold is an unknown threshold.
  const minSessions = index?.min_sessions_for_annualised ?? null;
  // `?? null`, never `?? 1`. A failed fetch used to invent a one-day lag policy
  // and print it as fact; an unknown lag is an unknown lag and the paragraph
  // says so instead.
  const lag = index?.detail_lag_days ?? null;
  // Books trading real capital, read from the payload. The sentence that used
  // to sit here counted "four Alpaca paper accounts" and was wrong by three
  // books and one account kind; nothing on this page counts anything now.
  const realCapital = (index?.books ?? []).filter((b) => b.capital_at_risk);
  // The chain header as published: a count the publisher wrote, read out and
  // printed, never a length measured here. Absent with the index unread, and
  // the margin figure then does not render at all rather than showing a zero.
  const chain = index?.chain ?? null;
  // READ THE FIELD, NOT THE TYPE. `getIndex` validates nothing past
  // `index.books`, so the declared shape of `chain` is a claim about the
  // publisher rather than a guarantee about the bytes: an index publishing
  // `chain: {}` — or a `file` with no `entries` — used to throw inside render
  // and take the whole page down, and a missing `file` printed the string
  // "undefined". Same defensive read as /firm and /verify give the same two
  // fields. A Stamp carries a real number by contract, so a count that is not
  // a number is no stamp at all rather than a stamp with a dash in it.
  const chainEntries =
    typeof chain?.entries === "number" && Number.isFinite(chain.entries)
      ? chain.entries
      : null;
  const chainFile = typeof chain?.file === "string" ? chain.file : null;

  // The release rule for order and fill detail, as one published value. The
  // three states stay apart: an unread index is the absence marker, a published
  // zero is a stated policy of no lag, and a positive lag is a floor in days.
  const detailRelease =
    lag === null
      ? NO_VALUE
      : lag === 0
        ? "No lag"
        : `${lag} ${lag === 1 ? "day" : "days"}`;

  return (
    <>
      <header>
        <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
          Methodology
        </h1>
        {/* The lede sits above the first Section, outside the grid, so it is
            the one line of prose here that has to state its own width. It
            states the grid's, the same width every paragraph
            below it is set to. The `72ch` it used to carry ran about 680px,
            ending some 150px to the right of everything under it, which is the
            ragged right edge the measure track exists to retire. */}
        <p className="mt-2 text-body text-fg-muted leading-relaxed">
          How every number here is produced. The full version, kept beside the
          data, is in{" "}
          <a
            className="text-accent hover:underline"
            href={`${REPO_URL}/blob/main/METHODOLOGY.md`}
            target="_blank"
            rel="noreferrer noopener"
          >
            METHODOLOGY.md
          </a>
          .
        </p>
      </header>

      {/* No `max-w` and no `space-y`. The blanket `max-w-[80ch]` that used to
          wrap this whole body stopped the page 428px short of the column it
          was given — on the page whose own subject is that a stated width
          should be read from one place — and every section's rule ended in
          mid-air with it. The grid owns the measure now, and each Section owns
          the space above itself. */}
      <div className="text-body">
        <Section
          first
          id="sources"
          title="Where the numbers come from"
          gloss="The daily cycle, and who writes the public files."
          aside={
            <>
              <MarginBlock label="What each step writes">
                <StepColumn
                  steps={[
                    "The order plan, netted from that close’s signals",
                    "The orders as they were submitted",
                    "The fills as they came back, the marked positions, the equity snapshot",
                    "That session’s record, hashed into the chain",
                    "The public repository, written from the archive alone",
                  ]}
                />
              </MarginBlock>
              {chainEntries !== null && (
                <div className="mt-6">
                  <Stamp
                    label="Records in the chain"
                    value={chainEntries.toLocaleString("en-US")}
                    note={chainFile ? `Published in ${chainFile}` : undefined}
                  />
                </div>
              )}
            </>
          }
        >
          <p>Each Alpaca paper account runs a fixed daily cycle:</p>
          <ol>
            {[
              "After the close, the desk computes signals and nets them into an order plan.",
              "At the next open it submits that plan.",
              "After that close it sweeps late fills, marks positions and snapshots account equity.",
              "It then archives the session with an internal hash chain.",
              "A separate publisher reads that archive and writes the public repository. That publisher never reads the live database.",
            ].map((step, i) => (
              <li
                key={step}
                className={
                  i > 0 ? "mt-2.5 flex gap-3 border-t hairline pt-2.5" : "flex gap-3"
                }
              >
                <span className="tnum w-3 shrink-0 text-fg-faint">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p>
            Which portfolios exist, and how many, is published in{" "}
            <a
              className="text-accent hover:underline"
              href={`${REPO_URL}/blob/main/index.json`}
              target="_blank"
              rel="noreferrer noopener"
            >
              index.json
            </a>
            .
          </p>
          {realCapital.length > 0 && (
            <p>
              {realCapital.length === 1
                ? "One portfolio on this site trades"
                : "Some portfolios on this site trade"}{" "}
              the firm&rsquo;s own capital, on two venues and a calendar of its
              own. Where{" "}
              {realCapital.length === 1 ? "its" : "their"} conventions differ from
              the paper accounts&rsquo; (the calendar, the grid the cash line
              accrues on, and the unit annualised statistics are counted in), they
              are published with the portfolio:{" "}
              {realCapital.map((b, i) => (
                <span key={b.book}>
                  {i > 0 ? ", " : ""}
                  <Link
                    className="text-accent hover:underline"
                    href={`/portfolios/${bookSlug(b)}`}
                  >
                    {b.label}
                  </Link>
                  {b.paths?.methodology ? (
                    <>
                      {" ("}
                      <a
                        className="text-accent hover:underline"
                        href={`${DATA_REPO_URL}/blob/main/${b.paths.methodology}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        methodology note
                      </a>
                      {")"}
                    </>
                  ) : null}
                </span>
              ))}
              .
            </p>
          )}
          <p>
            For the paper accounts, each session&rsquo;s net asset value is the
            broker&rsquo;s own account equity taken at the after-close mark. It is
            not modelled or reconstructed from the desk&rsquo;s fill records.
          </p>
        </Section>

        <Section
          id="returns"
          title="Returns"
          gloss="How a daily return is defined."
          aside={
            <MarginBlock label="What nav.csv carries">
              <MarginRows
                rows={[
                  {
                    k: "Columns",
                    v: (
                      <>
                        <Em>equity</Em>, <Em>flow</Em>, <Em>adj_factor</Em>,{" "}
                        <Em>equity_adj</Em>. The last is the series every
                        published metric is computed on and every curve is drawn
                        from.
                      </>
                    ),
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          <p>
            Daily return is <Em>NAV today ÷ (NAV yesterday + flow today) − 1</Em>,
            where <Em>flow</Em> is any declared external capital movement on that
            date. Returns are time-weighted: a movement of money that is not a
            trade is excluded from the return and kept in the balance, so the
            curve measures the return on the capital actually managed rather than
            on the size of the account.
          </p>
          <p>
            Capital events are carried in four columns of each portfolio&rsquo;s{" "}
            <Em>nav.csv</Em>: <Em>equity</Em> as reported, <Em>flow</Em>,{" "}
            <Em>adj_factor</Em> and <Em>equity_adj</Em>. A portfolio that has
            never had a movement has an <Em>adj_factor</Em> of 1 and identical
            equity columns. Where a portfolio has had a movement, its page lists
            each event with its date and amount, and the full evidence sits in the
            write-once snapshot for that session.
          </p>
          <p>
            The curve starts at funded capital. The first equity snapshot is
            taken after the first trading day&rsquo;s close and already contains
            that day&rsquo;s result, so each portfolio is anchored instead to a
            broker equity reading taken before it traded, with the account funded
            and fully in cash. That date is the portfolio&rsquo;s published
            inception. The anchor is a starting point, not a marked session.
          </p>
          <Note>
            This presentation is GIPS-informed, not GIPS-compliant. Compliance
            requires third-party verification, which has not been performed.
          </Note>
        </Section>

        <Section
          id="metrics"
          title="Metrics"
          gloss="How they are computed, and when they are published."
          aside={
            <>
              {/* THE PAGE EVIDENCES ITS OWN CLAIM. The gate was described in
                  prose and its threshold read from the payload two lines apart;
                  printed as a figure it is the same reading, in the form a
                  reader can check against a book's page. */}
              {minSessions !== null && (
                <Stamp
                  label="Annualised statistics from"
                  value={`${minSessions} ${minSessions === 1 ? "session" : "sessions"}`}
                />
              )}
              <div className={minSessions !== null ? "mt-6" : undefined}>
                <MarginBlock label="The rate behind every ratio">
                  <MarginRows
                    rows={[
                      {
                        k: "Series",
                        v: "3-month Treasury constant-maturity yield.",
                      },
                      {
                        k: "Window",
                        v: "Averaged over the window the ratio covers, not today’s print.",
                      },
                      {
                        k: "Where it is published",
                        v: (
                          <>
                            Beside every number it produced, in each portfolio&rsquo;s{" "}
                            <Em>metrics.json</Em>.
                          </>
                        ),
                      },
                    ]}
                  />
                </MarginBlock>
              </div>
            </>
          }
        >
          {/* "OUR CALCULATION SOURCE IS OPEN" WAS NOT TRUE. The metrics module
              is the firm's and is published nowhere; a reader cannot read it.
              The claim that IS true is the one that does the work anyway — the
              INPUT is published in full and every figure names its convention
              and its rate — because that lets a sceptic recompute with their
              own code rather than audit ours. Stating the weaker true thing and
              the stronger true thing together, rather than the false one. */}
          <p>
            Every metric is computed by one function in the firm&rsquo;s metrics
            module, with standard definitions. The input is published in full:{" "}
            <Em>nav.csv</Em> is the entire equity curve, and every figure is
            published beside the convention and the risk-free rate it used, so
            any number here can be recomputed independently.
          </p>
          <p>
            Sharpe, Sortino and Calmar are measured in excess of the risk-free
            rate: the 3-month Treasury constant-maturity yield, averaged over the
            window each ratio covers.
          </p>
          <p>
            {minSessions === null
              ? "Annualised statistics are published once a portfolio has enough history."
              : `Annualised statistics are published once a portfolio has ${minSessions} marked sessions.`}{" "}
            Cumulative return, daily returns and the drawdown path are published
            from the first session.
          </p>
        </Section>

        <Section
          id="attribution"
          title="Account level and per strategy"
          gloss="Reported figures, and attributed ones."
          aside={
            <MarginBlock label="Two kinds of figure">
              <MarginRows
                rows={[
                  {
                    k: "Account level",
                    v: "Broker equity and broker fills, as reported.",
                  },
                  {
                    k: "Per strategy",
                    v: "Each net fill attributed back pro-rata by requested size.",
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          <p>
            Account-level figures are exact: broker equity and broker fills.
            Per-strategy figures are an attributed model: the broker nets the
            desk&rsquo;s orders, so each net fill is attributed back to the
            strategies that contributed to it, pro-rata by requested size.
          </p>
          <p>
            The per-category contributions in <Em>attributed.csv</Em> are
            weighted per-strategy returns, so they do not sum exactly to the
            account&rsquo;s daily return. They show where a result came from; the
            account-level figures are read from the broker and do not depend on
            them.
          </p>
        </Section>

        <Section
          id="benchmark"
          title="The benchmark"
          gloss="What is drawn beside a portfolio."
          aside={
            <MarginBlock label="The lines beside a portfolio">
              <MarginRows
                rows={[
                  {
                    k: "Daily",
                    v: (
                      <>
                        <Em>benchmark.csv</Em>. Split- and dividend-adjusted SPY
                        total return, on the same dates as the portfolio.
                      </>
                    ),
                  },
                  {
                    k: "Intraday",
                    v: "The last 5-minute price bar at or before each instant. No dividend adjustment, nothing interpolated between bars.",
                  },
                  {
                    k: "Cash",
                    v: "Accrued at the risk-free rate, on the portfolio’s own calendar.",
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          <p>
            The daily benchmark (<Em>benchmark.csv</Em>) is split- and
            dividend-adjusted SPY total return, on the same dates as the
            portfolio. The line on an intraday chart is SPY&rsquo;s 5-minute
            price, the last bar at or before each instant, with no dividend
            adjustment and nothing interpolated between bars. Both are measured
            from SPY&rsquo;s level when the account was funded, so every
            portfolio funded on the same day shows the same SPY line. The two
            series can differ by a few basis points.
          </p>
          <p>
            Beside them runs a cash line accrued at the risk-free rate on the
            portfolio&rsquo;s own calendar; the rate is published in its{" "}
            <Em>metrics.json</Em>.
          </p>
          <p>
            The portfolios carry short positions and several asset classes, so
            the index is shown for context rather than as a like-for-like
            comparison.
          </p>
          <p>
            A portfolio whose benchmark file carries no index data is compared
            with cash alone, and its chart draws no index line.
          </p>
        </Section>

        {/* Two instruments are kept apart here: the broker's paper simulator
            produced the fills behind the paper accounts, and the research cost
            model charged the strategies when they were selected. The published
            order and fill records carry no commission or fee field, so no
            schedule is stated. */}
        <Section
          id="costs"
          title="Costs and fills"
          gloss="How fills are priced, and how research was costed."
          aside={
            <MarginBlock label="Research cost model, defaults">
              <div className="scroll-x">
                <table className="w-full min-w-[13rem] text-caption">
                  <thead>
                    <tr className="border-b hairline text-left text-label uppercase tracking-[0.12em] text-fg-faint">
                      <th className="pb-2 pr-3 font-medium">Asset class</th>
                      <th className="pb-2 pr-3 text-right font-medium">
                        Half-spread
                      </th>
                      <th className="pb-2 text-right font-medium">Borrow a year</th>
                    </tr>
                  </thead>
                  <tbody className="text-fg-muted">
                    {COST_DEFAULTS.map((row) => (
                      <tr key={row.cls} className="border-b hairline last:border-b-0">
                        <td className="py-2 pr-3 leading-snug">{row.cls}</td>
                        <td className="py-2 pr-3 text-right text-fg">
                          {row.spread}
                        </td>
                        <td className="py-2 text-right text-fg">{row.borrow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-caption leading-snug text-fg-faint">
                Borrow accrues on the short leg only. Spot FX financing sits in
                the swap points rather than in a borrow rate.
              </p>
            </MarginBlock>
          }
        >
          <p>
            A paper account is a real broker account quoting live market prices,
            and the desk sends it real orders. The broker fills them from its
            paper simulator rather than routing them to a venue. Each released
            session publishes the orders as submitted (symbol, side, quantity,
            filled quantity, average fill price, submission time, status) and the
            fills as they came back (symbol, quantity, price, timestamp)
            {paperFeed ? (
              <>
                , along with the market data each fill was priced against:{" "}
                <Em>{paperFeed}</Em>
              </>
            ) : null}
            .
          </p>
          <p>
            Published equity is the broker&rsquo;s own account equity, so any
            charge the broker applied is already inside the published curve. The
            order and fill records carry no separate commission or fee line.
          </p>
          <p>
            Research is costed differently. Every strategy is measured by one
            accounting engine that turns target weights into returns, with each
            charge applied to the weight actually held, the weight decided one bar
            earlier, including the first move from flat. The charges are a
            commission in basis points of turnover, declared per strategy; a
            half-spread on turnover; and borrow on short positions, at an annual
            rate. Spread and borrow default by asset class, as shown in the
            margin, and a strategy may override them. Square-root market impact
            is available but was not applied, as it requires volume data no
            strategy supplies.
          </p>
          <p>
            No backtested return series is published on this site. Every curve
            and figure for a portfolio is computed from that account&rsquo;s own
            published record.
          </p>
        </Section>

        <Section
          id="limits"
          title="Known limits"
          gloss="What to bear in mind when reading the figures."
          aside={
            feeds.size > 0 ? (
              <MarginBlock label="Feed behind the fills">
                <MarginRows
                  rows={[...feeds].map(([kind, feed]) => ({
                    k: kindLabel(kind),
                    v: <Em>{feed}</Em>,
                  }))}
                />
              </MarginBlock>
            ) : undefined
          }
        >
          {feeds.size > 0 && (
            <p>
              Simulated fills are priced against the market data feed shown in
              the margin. A feed covering part of consolidated volume shows fewer
              quotes, at wider spreads, than the full tape a live order meets, so
              a simulated fill is not identical to a live one.
            </p>
          )}
          <p>
            Alpaca&rsquo;s account equity, the published NAV, and its daily
            portfolio-history series are timed differently and can differ on a
            given session. Each snapshot publishes both and the difference in
            basis points.
          </p>
          <p>
            If a session was not recorded, the series has a gap: nothing is
            interpolated or carried forward, and the chart line breaks.
          </p>
        </Section>

        <Section
          id="timing"
          title="Publication timing"
          gloss="What is released, and when."
          aside={
            <MarginBlock label="Release">
              <MarginRows
                rows={[
                  {
                    k: "NAV, returns, metrics, benchmarks",
                    v: "No lag.",
                  },
                  {
                    k: "Orders, fills, positions",
                    v: (
                      <span
                        className={
                          lag === null ? "tnum text-fg-faint" : "tnum text-fg"
                        }
                      >
                        {detailRelease}
                      </span>
                    ),
                  },
                  {
                    k: "Condition",
                    v: "A cycle’s detail is released once that cycle has executed.",
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          {/* The zero-lag case is its own sentence ("held back for 0 days"
              describes a waiting period that does not exist), and an unread
              index states no policy. */}
          <p>
            Net asset value, daily returns, metrics and benchmarks are published
            with no lag.{" "}
            {lag === null
              ? null
              : lag === 0
                ? "Orders, fills and positions are published as soon as the cycle that produced them has executed."
                : `Orders, fills and positions are held back for at least ${lag} ${lag === 1 ? "day" : "days"}, and until the cycle that produced them has executed.`}
          </p>
          <p>
            Release follows execution rather than the calendar: the desk stages a
            plan after the close for the next open, and that plan is published
            only once it has been sent. A detail file is keyed by the cycle that
            staged it, so the positions inside it are those held from the
            following open, and a portfolio page labels them that way.
          </p>
        </Section>
      </div>

      <Next
        items={[
          {
            href: "/verify",
            label: "Check it yourself",
            question:
              "Re-derive every published number from a clone of the public repository.",
          },
          {
            href: "/portfolios",
            label: "See the portfolios",
            question:
              "The accounts these conventions are applied to, and what each has returned.",
          },
          {
            href: "/disclosures",
            label: "The conditions attached",
            question:
              "What this record does not establish, stated per portfolio and per figure.",
          },
        ]}
      />
    </>
  );
}

/**
 * A BLOCK IN THE MARGIN: a ruled label, then the thing it names.
 *
 * The margin runs 296px at full width and 140px at the breakpoint itself, so
 * nothing in here is laid out in two columns and nothing assumes a width. The
 * one exception is the cost table, which is genuinely tabular and scrolls
 * inside its own container.
 */
function MarginBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="border-b hairline pb-2 text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
        {label}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Key above value, a hairline between pairs. Stacked rather than two columns:
 *  the keys here are phrases, not words, and a 140px margin has no second
 *  column to give them. */
function MarginRows({
  rows,
}: {
  rows: { k: string; v: React.ReactNode }[];
}) {
  return (
    <dl>
      {rows.map((row, i) => (
        <div
          key={row.k}
          className={i > 0 ? "mt-3 border-t hairline pt-3" : undefined}
        >
          <dt className="text-label uppercase tracking-[0.12em] text-fg-faint">
            {row.k}
          </dt>
          <dd className="mt-1.5 text-caption leading-snug text-fg-muted">
            {row.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The cycle, numbered to match the list in the measure: what happens is in the
 *  prose, what it leaves behind is here. */
function StepColumn({ steps }: { steps: string[] }) {
  return (
    <ol>
      {steps.map((step, i) => (
        <li
          key={step}
          className={
            i > 0
              ? "mt-2.5 flex gap-3 border-t hairline pt-2.5"
              : "flex gap-3"
          }
        >
          <span className="tnum w-3 shrink-0 text-caption leading-snug text-fg-faint">
            {i + 1}
          </span>
          <span className="text-caption leading-snug text-fg-muted">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** The account kinds this site publishes, in the words the prose uses for them.
 *  An unrecognised kind is printed as the payload spells it rather than guessed
 *  at: a kind nobody has named yet is not "other". */
function kindLabel(kind: string): string {
  if (kind === "paper") return "Paper accounts";
  if (kind === "real_capital") return "Real capital";
  return kind;
}

/** A file or field name. Set in the mono face at the surrounding text's own
 *  colour, so a sentence never changes contrast halfway through. */
function Em({ children }: { children: React.ReactNode }) {
  return <code className="text-[0.9em]">{children}</code>;
}
