import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { DATA_REPO_URL, REPO_URL, bookSlug, getIndex } from "@/lib/data";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How every published number is produced: sources, return convention, " +
    "metric definitions, benchmark, and the biases that are known but unmeasured.",
};

export default async function MethodologyPage() {
  const index = await getIndex();
  const minSessions = index?.min_sessions_for_annualised ?? 60;
  // `?? null`, never `?? 1`. A failed fetch used to invent a one-day lag policy
  // and print it as fact; an unknown lag is an unknown lag and the paragraph
  // says so instead.
  const lag = index?.detail_lag_days ?? null;
  // Books trading real capital, read from the payload. The sentence that used
  // to sit here counted "four Alpaca paper accounts" and was wrong by three
  // books and one account kind; nothing on this page counts anything now.
  const realCapital = (index?.books ?? []).filter((b) => b.capital_at_risk);

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Methodology
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
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

      <div className="mt-12 space-y-12 max-w-[80ch] text-[14px] leading-relaxed">
        <Section title="Where the numbers come from">
          <p>
            Each Alpaca paper account runs a fixed daily cycle: after the close
            the desk computes signals and nets them into an order plan; at the
            next open it submits that plan; after that close it sweeps late fills,
            marks positions and snapshots account equity; then it archives
            everything with an internal hash chain. A separate publisher reads
            that archive — never the live database — and writes the public
            repository. Which portfolios exist, and how many, is published in{" "}
            <a
              className="text-accent hover:underline"
              href={`${REPO_URL}/blob/main/index.json`}
              target="_blank"
              rel="noreferrer noopener"
            >
              index.json
            </a>{" "}
            rather than counted in a sentence here — a sentence with arithmetic in
            it goes stale, and this one did.
          </p>
          {realCapital.length > 0 && (
            <p>
              <strong className="font-medium">
                Not every portfolio here is a paper account.
              </strong>{" "}
              {realCapital.length === 1
                ? "One book on this site trades"
                : "Some books on this site trade"}{" "}
              the operator&rsquo;s own real capital, on a different venue pair and
              a different calendar, and{" "}
              {realCapital.length === 1 ? "its" : "their"} conventions differ from
              the paper desk&rsquo;s in ways that matter — the calendar, the cash
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

        <Section title="Returns">
          <p>
            Daily return is <Em>NAV today ÷ (NAV yesterday + flow today) − 1</Em>,
            where <Em>flow</Em> is any declared external capital movement on that
            date. Returns are time-weighted: a movement of money that is not a
            trade is excluded from the return and kept in the balance, so the
            curve measures the return on the capital actually managed rather than
            on the size of the account.
          </p>
          <p>
            <strong className="font-medium">Capital events are declared, not smoothed.</strong>{" "}
            Each book&rsquo;s <Em>nav.csv</Em> carries four columns for this:{" "}
            <Em>equity</Em> exactly as the broker reported it, <Em>flow</Em>,{" "}
            <Em>adj_factor</Em>, and <Em>equity_adj</Em> — the flow-adjusted index
            every published metric is computed on and every curve is drawn from.
            A book that has never had a movement has <Em>adj_factor</Em> of 1 and
            the two equity columns are identical. Where a book has had one, its
            own page lists every event with its date, its amount, how it was
            derived and the evidence for it, and the full evidence sits inside the
            write-once snapshot for that session. An earlier version of this page
            said these accounts had a single opening deposit and no later flows.
            That stopped being true on 28 August 2026, and the convention above is
            the one the published data has always used.
          </p>
          <p>
            <strong className="font-medium">The curve starts at funded capital.</strong>{" "}
            The desk&rsquo;s first equity snapshot is taken after the first
            trading day&rsquo;s close, so it already contains that day&rsquo;s
            profit and loss — starting the curve there would silently delete the
            opening session. Each book is instead anchored to a broker equity
            reading taken before it traded, with the account funded and fully in
            cash. The exact date is each book&rsquo;s published inception, and it
            is not always the trading day immediately before the first fill — an
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

        <Section title="Metrics">
          <p>
            Every metric is computed by one function in the firm&rsquo;s metrics
            module and by nothing else — not in the publisher, and not in your
            browser. That is the only way &ldquo;our calculation source is
            open&rdquo; can be a fact rather than a claim. Your browser still does
            arithmetic to <em>draw</em> — it scales an axis, sums a table&rsquo;s
            own rows into its total row, and rebases a published equity column
            onto the axis a chart uses — and none of that produces a statistic
            reported anywhere on this site.
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
              Annualised statistics are withheld until {minSessions} sessions.
            </strong>{" "}
            Each book publishes the exact list of names it is suppressing, and
            its page renders that list rather than a copy of it kept here. On a
            handful of sessions those figures are not imprecise estimates, they
            are meaningless ones. Cumulative return, the daily returns and the
            realised drawdown path appear from day one, because those are
            statements of what happened rather than estimates of anything — so a
            page can show the shape of a drawdown while the single{" "}
            <Em>max_drawdown</Em> field in <Em>metrics.json</Em> is still
            withheld under the gate. The two are the same definition, not two
            different ones, and the page says which is which.
          </p>
        </Section>

        <Section title="Book level versus per strategy">
          <p>
            These are not equally hard numbers and are never presented as though
            they were. <strong className="font-medium">Book level is exact</strong>{" "}
            — broker equity, broker fills.{" "}
            <strong className="font-medium">Per strategy is an attributed model</strong>:
            the broker nets our orders, so a single net fill is attributed back to
            the strategies whose intents contributed to it, pro-rata by requested
            size. A different rule would give different per-strategy numbers from
            the same fills.
          </p>
          <p>
            <strong className="font-medium">
              The attribution does not close on the book.
            </strong>{" "}
            This page used to say it summed to the book. It does not: the
            per-category contributions published in <Em>attributed.csv</Em> are
            weighted per-strategy returns, and on every dated set they add up to
            something other than the broker&rsquo;s own daily return for that
            book — sometimes with the opposite sign. The account-level figures are
            unaffected, because they are read from the broker and never
            reconstructed from the attribution. Read the split as a model of where
            the result came from, never as a decomposition that adds up.
          </p>
        </Section>

        <Section title="The benchmark">
          <p>
            <strong className="font-medium">Two different SPY series, labelled apart.</strong>{" "}
            The daily file (<Em>benchmark.csv</Em>) is SPY total return —
            split- and dividend-adjusted — on the same dates as the book. The
            line drawn across an intraday chart is a different measurement: the
            last 5-minute price bar at or before each instant, with no dividend
            adjustment applied intraday and nothing interpolated between bars.
            The two will not agree to the basis point — single-digit basis points
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
            neutral to the market has no meaningful comparison to an index — its
            opportunity cost is cash, and cash is the only line drawn beside it.
            That is decided by the published data, not by the page: a book whose
            benchmark file carries no index column is drawn without one, legend
            included. Each book&rsquo;s own methodology note, published in the data
            repository, states the conventions that are specific to it.
          </p>
        </Section>

        <Section title="Known biases and limits">
          <p>
            <strong className="font-medium">Two broker endpoints disagree.</strong>{" "}
            Alpaca&rsquo;s account equity (our published NAV) and its daily
            portfolio-history series do not share a timing basis, so they differ
            on most sessions. This page used to illustrate that with one
            session&rsquo;s figure — &ldquo;about 17 basis points&rdquo; — which
            was the smallest of the four books&rsquo; readings that day and well
            below the worst in the record. No typical figure is quoted here now,
            because the site does not compute one: both are broker figures, every
            snapshot publishes ours, theirs and the difference in basis points,
            and the distribution is there to be read rather than summarised for
            you.
          </p>
          <p>
            <strong className="font-medium">Gaps are gaps.</strong> If the box was
            down, the series has a hole. Nothing is interpolated across it, the
            chart line breaks, and no value is carried forward to hide it.
          </p>
        </Section>

        <Section title="Publication timing">
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
              the cycle that produced them has actually executed — there is no
              additional waiting period, and the consequence is deliberate:
              current holdings are public.
            </p>
          ) : (
            <p>
              Net asset value, daily returns, metrics and benchmarks are published
              with no lag. Orders, fills and positions are held back for {lag}{" "}
              {lag === 1 ? "day" : "days"} — a floor, not the binding rule.
            </p>
          )}
          <p>
            The binding rule is execution, not the calendar. A cycle&rsquo;s
            detail is released only once that cycle has{" "}
            <strong className="font-medium">actually executed</strong>. The desk
            stages a plan after the close for the next open, and a stage can also
            sit unexecuted for days if something failed — a pure date rule would
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t hairline pt-6">
      <h2 className="text-[18px] font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Em({ children }: { children: React.ReactNode }) {
  return <span className="tnum text-fg-muted">{children}</span>;
}
