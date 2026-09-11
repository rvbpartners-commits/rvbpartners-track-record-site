import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { Stamp } from "@/components/Stamp";
import {
  DATA_REPO_URL,
  REPO_URL,
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
            states the grid's: `--measure`, the same 33rem every paragraph
            below it is set to. The `72ch` it used to carry ran about 680px,
            ending some 150px to the right of everything under it, which is the
            ragged right edge the measure track exists to retire. */}
        <p className="mt-2 text-body text-fg-muted max-w-[var(--measure)] leading-relaxed">
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
            </a>{" "}
            rather than counted in a sentence here: a sentence with arithmetic in
            it goes stale.
          </p>
          {realCapital.length > 0 && (
            <p>
              <strong className="font-medium">
                Not every portfolio here is a paper account.
              </strong>{" "}
              {realCapital.length === 1
                ? "One book on this site trades"
                : "Some books on this site trade"}{" "}
              the firm&rsquo;s own real capital, on a different venue pair and
              a different calendar, and{" "}
              {realCapital.length === 1 ? "its" : "their"} conventions differ from
              the paper desk&rsquo;s in ways that matter: the calendar, the cash
              comparator&rsquo;s accrual grid, and the unit the withholding gate
              counts in. They are published per book:{" "}
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
                        its own methodology note
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
            <strong className="font-medium">Book equity is read from the broker.</strong>{" "}
            Each session&rsquo;s net asset value is the broker&rsquo;s own account
            equity taken at the after-close mark. It is not modelled or
            reconstructed from our own fill records.
          </p>
        </Section>

        <Section
          id="returns"
          title="Returns"
          gloss="How a daily return is defined."
          note="Both conventions are time-weighted, reached two different ways. Each book publishes which one it uses."
          aside={
            <MarginBlock label="What a book’s nav.csv carries">
              <MarginRows
                rows={[
                  {
                    k: "Broker equity, flow adjusted",
                    v: (
                      <>
                        <Em>equity</Em>, <Em>flow</Em>, <Em>adj_factor</Em>,{" "}
                        <Em>equity_adj</Em>. The last is the index every
                        published metric is computed on and every curve is drawn
                        from.
                      </>
                    ),
                  },
                  {
                    k: "Unitised",
                    v: "No flow columns at all. A deposit buys units at that day’s price, so it moves the balance and never the price.",
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
          {/* THE FOUR-COLUMN CLAIM WAS FALSE OF ONE BOOK, and it was stated of
              "each book". The paper desk's files carry equity, flow, adj_factor
              and equity_adj; the real-capital book's nav.csv carries date,
              equity, cash and daily_return, because it handles capital
              movements by unitisation — a deposit buys units at the day's
              price, so it moves equity and never the unit price, which is the
              same time-weighted treatment reached a different way. Its own
              snapshots say so. The convention is stated as what it is, and the
              exception is named rather than papered over by a plural. */}
          <p>
            <strong className="font-medium">Capital events are declared, not smoothed.</strong>{" "}
            On the paper desk this is carried in four columns of each
            book&rsquo;s <Em>nav.csv</Em>: <Em>equity</Em> exactly as the broker
            reported it, <Em>flow</Em>, <Em>adj_factor</Em>, and{" "}
            <Em>equity_adj</Em>. A book that has never had a movement has{" "}
            <Em>adj_factor</Em> of 1 and the two equity columns are identical. A
            book that reconstructs its own curve rather than reading a
            broker&rsquo;s equity does it by{" "}
            <strong className="font-medium">unitisation</strong> instead, and its{" "}
            <Em>nav.csv</Em> carries no flow columns because the flow never
            entered the return in the first place. Where a book has had a
            movement, its own page lists every event with its date, its amount,
            how it was derived and the evidence for it, and the full evidence
            sits inside the write-once snapshot for that session.
          </p>
          <p>
            <strong className="font-medium">The curve starts at funded capital.</strong>{" "}
            The desk&rsquo;s first equity snapshot is taken after the first
            trading day&rsquo;s close, so it already contains that day&rsquo;s
            profit and loss. Starting the curve there would silently delete the
            opening session. Each book is instead anchored to a broker equity
            reading taken before it traded, with the account funded and fully in
            cash. The exact date is each book&rsquo;s published inception, and it
            is not always the trading day immediately before the first fill. An
            account funded over a weekend anchors on the day it was funded. That
            anchor row is a starting point, not a measured session: each book
            publishes both counts, and its page shows them separately.
          </p>
          <Note>
            This presentation is GIPS-informed and <strong>not</strong>{" "}
            GIPS-compliant. Compliance requires third-party verification, which
            has not been performed. No such claim is made anywhere on this site.
          </Note>
        </Section>

        <Section
          id="metrics"
          title="Metrics"
          gloss="Who computes them, and what is withheld."
          aside={
            <>
              {/* THE PAGE EVIDENCES ITS OWN CLAIM. The gate was described in
                  prose and its threshold read from the payload two lines apart;
                  printed as a figure it is the same reading, in the form a
                  reader can check against a book's page. */}
              {minSessions === null ? (
                <div className="border hairline px-4 py-3.5">
                  <div className="text-label font-semibold uppercase tracking-[0.16em] text-fg-faint">
                    Annualised gate
                  </div>
                  <div className="mt-2 tnum text-small leading-snug text-fg-faint">
                    {NO_VALUE}
                  </div>
                  <div className="mt-2 text-caption leading-snug text-fg-faint">
                    The threshold could not be read from the published index just
                    now, so none is stated.
                  </div>
                </div>
              ) : (
                <Stamp
                  tone="negative"
                  label="Annualised gate"
                  value={`${minSessions} ${minSessions === 1 ? "session" : "sessions"}`}
                  note="Nothing annualised is published before that. Cumulative return, the daily returns and the realised drawdown path appear from day one."
                />
              )}
              <div className="mt-6">
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
                            Beside every number it produced, in each book&rsquo;s{" "}
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
            module. Neither the publisher nor your browser computes any of
            them. That module is not published, so the check on offer is not
            &ldquo;read our code&rdquo;: it is that the input is published in
            full. <Em>nav.csv</Em> is the entire equity curve, every figure is
            published beside the convention and the risk-free rate it used, and
            the definitions are the standard ones, so any number here can be
            recomputed independently and a disagreement is a fact about the
            numbers rather than about whose code you trust. Your browser still
            does arithmetic to <em>draw</em>: it scales an axis, sums a
            table&rsquo;s own rows into its total row, and rebases a published
            equity column onto the axis a chart uses. None of that produces a
            statistic reported anywhere on this site.
          </p>
          <p>
            <strong className="font-medium">
              Sharpe, Sortino and Calmar are excess of the risk-free rate.
            </strong>{" "}
            Interest on cash is not alpha. The rate is the 3-month Treasury
            constant-maturity yield, averaged over the window the ratio covers
            rather than taken as today&rsquo;s print, and the exact rate used is
            published beside every number so it can be reproduced.
          </p>
          <p>
            <strong className="font-medium">
              {minSessions === null
                ? "Annualised statistics are withheld until a book has enough history."
                : `Annualised statistics are withheld until ${minSessions} sessions.`}
            </strong>{" "}
            Each book publishes the exact list of names it is suppressing, and
            its page renders that list rather than a copy of it kept here. On a
            handful of sessions those figures are not imprecise estimates, they
            are meaningless ones. Cumulative return, the daily returns and the
            realised drawdown path appear from day one, because those are
            statements of what happened rather than estimates of anything, so a
            page can show the shape of a drawdown while the single{" "}
            <Em>max_drawdown</Em> field in <Em>metrics.json</Em> is still
            withheld under the gate. The two are the same definition, not two
            different ones, and the page says which is which.
          </p>
        </Section>

        <Section
          id="attribution"
          title="Book level versus per strategy"
          gloss="Exact figures, and attributed ones."
          aside={
            <MarginBlock label="Two kinds of number">
              <MarginRows
                rows={[
                  {
                    k: "Book level",
                    v: "Exact. Broker equity, broker fills, read and never reconstructed.",
                  },
                  {
                    k: "Per strategy",
                    v: "A model. One net fill attributed back pro-rata by requested size.",
                  },
                  {
                    k: "Do they add up",
                    v: (
                      <>
                        No. The contributions in <Em>attributed.csv</Em> do not
                        close on the broker&rsquo;s own daily return, and
                        sometimes carry the opposite sign.
                      </>
                    ),
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          <p>
            These are not equally hard numbers and are never presented as though
            they were. <strong className="font-medium">Book level is exact</strong>:
            broker equity, broker fills.{" "}
            <strong className="font-medium">Per strategy is an attributed model</strong>:
            the broker nets our orders, so a single net fill is attributed back to
            the strategies whose intents contributed to it, pro-rata by requested
            size. A different rule would give different per-strategy numbers from
            the same fills.
          </p>
          <p>
            {/* THE PAGE STOPS NARRATING ITS OWN EDITING HISTORY. "This page
                used to say" tells a reader what a previous draft claimed, which
                is a fact about this repository and not about the record; four
                such passages had accumulated, and their combined effect is a
                document that reads as though it is arguing with itself. The
                corrected statement is kept in full — it is the important one —
                and the retraction is dropped. If the audit trail matters it
                belongs in a dated changelog beside the data, not in the
                paragraph a reader is trying to learn the convention from. */}
            <strong className="font-medium">
              The attribution does not close on the book.
            </strong>{" "}
            The per-category contributions published in <Em>attributed.csv</Em>{" "}
            are weighted per-strategy returns, and on every dated set they add up
            to something other than the broker&rsquo;s own daily return for that
            book, and sometimes to a figure of the opposite sign. The
            account-level figures are unaffected, because they are read from the
            broker and never reconstructed from the attribution. Read the split as a model of where
            the result came from, never as a decomposition that adds up.
          </p>
        </Section>

        <Section
          id="benchmark"
          title="The benchmark"
          gloss="What is drawn beside a book."
          note="A book with no meaningful comparison to an index is drawn against cash alone. That is decided by the book’s own published benchmark file, not by this page."
          aside={
            <MarginBlock label="The lines beside a book">
              <MarginRows
                rows={[
                  {
                    k: "Daily",
                    v: (
                      <>
                        <Em>benchmark.csv</Em>. Split- and dividend-adjusted SPY
                        total return, on the same dates as the book.
                      </>
                    ),
                  },
                  {
                    k: "Intraday",
                    v: "The last 5-minute price bar at or before each instant. No dividend adjustment, nothing interpolated between bars.",
                  },
                  {
                    k: "Cash",
                    v: "Accrued at the risk-free rate, on the book’s own calendar grid.",
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          <p>
            <strong className="font-medium">Two different SPY series, labelled apart.</strong>{" "}
            The daily file (<Em>benchmark.csv</Em>) is split- and
            dividend-adjusted SPY total return, on the same dates as the book. The
            line drawn across an intraday chart is a different measurement: the
            last 5-minute price bar at or before each instant, with no dividend
            adjustment applied intraday and nothing interpolated between bars.
            The two will not agree to the basis point. Single-digit basis points
            of day-over-day difference are normal, and the intraday series is
            rebased by the publisher on its own first bar rather than on the daily
            file&rsquo;s. Neither is adjusted onto the other, and the chart legend
            names whichever one it is drawing.
          </p>
          <p>
            Beside them runs a cash line accrued at the risk-free rate on the
            book&rsquo;s own calendar. A book that publishes every calendar day
            and a book that publishes trading days do not accrue on the same grid;
            each book&rsquo;s methodology note states the grid its line uses, and
            the rate itself is published in that book&rsquo;s{" "}
            <Em>metrics.json</Em>.
          </p>
          <p>
            <strong className="font-medium">These books are not SPY-like.</strong>{" "}
            They carry shorts and multi-asset legs. The benchmark answers
            &ldquo;versus just holding the index?&rdquo; and should not be read as
            a like-for-like comparison.
          </p>
          <p>
            <strong className="font-medium">
              Not every book gets an equity benchmark.
            </strong>{" "}
            A book that holds offsetting positions on two venues and aims to be
            neutral to the market has no meaningful comparison to an index. Its
            opportunity cost is cash, and cash is the only line drawn beside it.
            That is decided by the published data, not by the page: a book whose
            benchmark file carries no index column is drawn without one, legend
            included. Each book&rsquo;s own methodology note, published in the data
            repository, states the conventions that are specific to it.
          </p>
        </Section>

        {/* "WHAT DID THE FILLS COST" HAD NO ANSWER ON THIS PAGE, and it is one
            of the first questions anyone competent asks of a track record. It
            sits here, after the sections that describe how a number is made and
            before the section that lists what those numbers do not establish,
            because it describes the instrument rather than qualifying it — and
            the qualification that follows from it is the feed paragraph that
            opens the next section.

            THE SECTION EXISTS TO KEEP TWO THINGS APART. A broker's paper
            simulator produced the fills behind the paper accounts' figures; a
            cost model in the research charged the strategies that were selected.
            Written together they read as one costed result, which would be the
            most flattering false claim available to this page. They are
            separated by paragraph, and the last one names the seam.

            NOTHING ABOUT THE PAPER SIDE IS INFERRED. The published order and
            fill records carry no commission, fee or financing field, and no
            file this site reads states a commission schedule — so the honest
            content is that it is not published. A plausible number written here
            would be indistinguishable, to a reader, from a measured one. */}
        <Section
          id="costs"
          title="Costs and fills"
          gloss="What a fill cost, and what is not published."
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
                Borrow accrues on the short leg alone. Spot FX has no borrow line
                at all: financing there sits in the swap points rather than in a
                rate. These are the defaults the research charged, never a
                statement of what an account was charged.
              </p>
            </MarginBlock>
          }
        >
          <p>
            <strong className="font-medium">
              A paper fill is a real order and a simulated execution.
            </strong>{" "}
            The account is a real broker account quoting live market prices and
            the desk sends it real orders. What does not happen is the last
            step: rather than carrying the order to a venue and matching it
            against another participant, the broker fills it from its own paper
            simulator. Each released session publishes the orders as they were
            submitted: symbol, side, quantity, filled quantity, filled average
            price, submission time, status. It publishes the fills as they came
            back: symbol, quantity, price, timestamp.
          </p>
          {paperFeed && (
            <p>
              One cost-bearing fact those records do carry is the market data
              each fill was priced against: <Em>{paperFeed}</Em>. It is stamped
              into every published record for these accounts, and what a thin
              feed does to a simulated fill is the first item under the limits
              below.
            </p>
          )}
          <p>
            <strong className="font-medium">
              What the fills cost is not in the published record.
            </strong>{" "}
            No order or fill record carries a commission, a fee or a financing
            line, and no published file states the schedule these accounts trade
            on or the rule the simulator uses to price a fill. What can be said
            is where any such charge would already be: book equity is the
            broker&rsquo;s own account equity, so whatever the paper engine
            charged is inside the published curve already, and whatever it did
            not charge is missing from that curve in exactly the same way.
            Nothing here should be read as a claim that these fills were free.
          </p>
          <Note>
            Two open items, stated as open rather than filled in: the commission
            schedule these paper accounts trade on, and the rule the
            broker&rsquo;s simulator uses to decide a fill price. Neither
            appears in any file this site reads, so neither is stated on it.
          </Note>
          <p>
            <strong className="font-medium">
              The research charged a cost model, which is a different thing.
            </strong>{" "}
            Every strategy is measured by one accounting engine that turns
            target weights into returns, and each charge falls on the weight
            actually held. That is the weight decided one bar earlier, and it
            includes the first move from flat into the book, which is the trade
            a naive accounting forgets. There are four charges: a commission in
            basis points of turnover; a half-spread crossed on every unit of that
            turnover; borrow accrued each bar on the short leg alone, at an
            annual rate; and square-root market impact against average daily
            volume. The commission is declared per strategy. A strategy
            presented as a result with no commission declared and no written
            exemption is refused by our own gate. Impact is the exception to the
            rest: it is opt-in and needs a volume panel to compute, no strategy
            in the catalogue supplies one, and so no impact cost was charged
            anywhere in the research.
          </p>
          <p>
            <strong className="font-medium">
              Spread and borrow are set by asset class, not by one number.
            </strong>{" "}
            Left unset they resolve per instrument, from a table of defaults per
            asset class. Those figures are provisional, they are one table, and a
            strategy may override any of them. Two limits of it are worth
            stating. An instrument the table does not name is charged no spread
            and no borrow, which is a fact about the table rather than about the
            instrument. And the single flat number this replaced is the setting
            under which an illiquid name looks investable, which is the reason
            the table exists.
          </p>
          <p>
            <strong className="font-medium">
              Two instruments, and a reader should know which is which.
            </strong>{" "}
            The research figures are what that cost model produced; the figures
            published for these accounts are what a broker&rsquo;s simulator
            produced. No backtested return series is published on this site.
            Every curve and every figure here is computed from an account&rsquo;s
            own published record. The cost model is part of how a strategy was
            measured and chosen, never a statement of what an account was
            charged.
          </p>
        </Section>

        <Section
          id="limits"
          title="Known biases and limits"
          gloss="What these results do not establish."
          note={
            feeds.size > 0
              ? "Each row is read from the newest chained snapshot of that kind of account, rather than typed into this page."
              : undefined
          }
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
          {/* THE FEED BEHIND A SIMULATED FILL IS THE FIRST BIAS THERE IS, and
              it was published in every snapshot and stated on no page a human
              reads. It belongs at the top of this section, and it is read out
              of the evidence rather than typed in here — a caveat this site
              asserts about itself is worth less than one it can point at. The
              readings themselves now sit in the margin, one row per kind of
              account, rather than inside a run-on clause. */}
          {feeds.size > 0 && (
            <p>
              <strong className="font-medium">
                The market data behind the fills is not the whole tape.
              </strong>{" "}
              A simulated fill is only as good as the prices it was simulated
              against, and the feed behind each one is stamped into the
              published records rather than asserted here. A feed covering a
              few percent of consolidated volume prints fewer quotes, and at
              wider spreads, than the consolidated tape a real order meets. A fill simulated against it is not
              interchangeable with one that happened. It is disclosed because it
              is a real limit on what these results demonstrate.
            </p>
          )}
          <p>
            <strong className="font-medium">Two broker endpoints disagree.</strong>{" "}
            Alpaca&rsquo;s account equity (our published NAV) and its daily
            portfolio-history series do not share a timing basis, so they differ
            on most sessions. No typical figure is quoted here, because the site
            does not compute one: both are broker figures, every snapshot
            publishes ours, theirs and the difference in basis points, and the
            distribution is there to be read rather than summarised for you.
          </p>
          <p>
            <strong className="font-medium">Gaps are gaps.</strong> If the box was
            down, the series has a hole. Nothing is interpolated across it, the
            chart line breaks, and no value is carried forward to hide it.
          </p>
        </Section>

        <Section
          id="timing"
          title="Publication timing"
          gloss="What is released, and when."
          note={
            lag === null ? (
              "The index could not be read just now, so no release rule is stated."
            ) : (
              <>
                Read from <Em>detail_lag_days</Em> in <Em>index.json</Em>, not
                fixed in this page.
              </>
            )
          }
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
                    k: "The binding rule",
                    v: "Execution, not the calendar. A cycle’s detail is released once that cycle has actually executed.",
                  },
                ]}
              />
            </MarginBlock>
          }
        >
          {/* "held back for 0 days" was literally what this rendered: the
              published lag is 0, and the paragraphs beneath it then explained a
              waiting period that does not exist. The zero case is its own
              sentence, and an unknown lag prints no policy at all. */}
          {lag === null ? (
            <p>
              Net asset value, daily returns, metrics and benchmarks are published
              with no lag. The release rule for orders, fills and positions could
              not be read from the published index just now, so it is not stated
              here.
            </p>
          ) : lag === 0 ? (
            <p>
              Net asset value, daily returns, metrics and benchmarks are published
              with no lag. Orders, fills and positions are published as soon as
              the cycle that produced them has actually executed. There is no
              additional waiting period, and the consequence is deliberate:
              current holdings are public.
            </p>
          ) : (
            <p>
              Net asset value, daily returns, metrics and benchmarks are published
              with no lag. Orders, fills and positions are held back for {lag}{" "}
              {lag === 1 ? "day" : "days"}. That is a floor, not the binding
              rule.
            </p>
          )}
          <p>
            The binding rule is execution, not the calendar. A cycle&rsquo;s
            detail is released only once that cycle has{" "}
            <strong className="font-medium">actually executed</strong>. The desk
            stages a plan after the close for the next open, and a stage can also
            sit unexecuted for days if something failed. A pure date rule would
            eventually publish an order plan that had never been sent.
          </p>
          <p className="text-fg-muted">
            A consequence worth stating: a detail file is keyed by the cycle that
            staged it, and the positions inside it are the ones held from the
            following open. A portfolio page labels them that way rather than
            dating them to the cycle&rsquo;s own session.
          </p>
        </Section>
      </div>
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

function Em({ children }: { children: React.ReactNode }) {
  return <span className="tnum text-fg-muted">{children}</span>;
}
