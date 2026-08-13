import type { Metadata } from "next";
import { Note } from "@/components/Note";
import { REPO_URL, getIndex } from "@/lib/data";

// Next.js requires this to be a statically analysable literal, so it cannot
// be the REVALIDATE_SECONDS constant. 900s = 15 min; the desk publishes daily.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How every published number is produced: sources, return convention, " +
    "metric definitions, benchmark, and the biases that are known but unmeasured.",
};

export default async function MethodologyPage() {
  const index = await getIndex();
  const minSessions = index?.min_sessions_for_annualised ?? 60;
  const lag = index?.detail_lag_days ?? 1;

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
            Four Alpaca paper accounts run a fixed daily cycle: after the close
            the desk computes signals and nets them into an order plan; at the
            next open it submits that plan; after that close it sweeps late fills,
            marks positions and snapshots account equity; then it archives
            everything with an internal hash chain. A separate publisher reads
            that archive — never the live database — and writes the public
            repository.
          </p>
          <p>
            <strong className="font-medium">Book equity is read from the broker.</strong>{" "}
            Each session&rsquo;s net asset value is Alpaca&rsquo;s account equity
            taken at the after-close mark. It is not modelled or reconstructed
            from our own fill records.
          </p>
        </Section>

        <Section title="Returns">
          <p>
            Daily return is <Em>NAV today ÷ NAV yesterday − 1</Em>. Returns are
            time-weighted; with a single opening deposit and no later cash flows
            that reduces exactly to compounding those daily returns, so there is
            nothing for a money-weighted variant to disagree about.
          </p>
          <p>
            <strong className="font-medium">The curve starts at funded capital.</strong>{" "}
            The desk&rsquo;s first equity snapshot is taken after the first
            trading day&rsquo;s close, so it already contains that day&rsquo;s
            profit and loss — starting the curve there would silently delete the
            opening session. Each book is instead anchored to the broker&rsquo;s
            own equity on the last day before it traded, with the account fully in
            cash.
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
            open&rdquo; can be a fact rather than a claim.
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
            Sharpe, CAGR, Calmar, volatility, maximum drawdown, VaR and win rate
            are suppressed below that threshold. On a handful of sessions they are
            not imprecise estimates, they are meaningless ones. Cumulative return
            and the equity curve appear from day one, because those are statements
            of what happened rather than estimates of anything.
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
            size. It is internally consistent and sums to the book, but a
            different rule would give different per-strategy numbers from the same
            fills.
          </p>
        </Section>

        <Section title="The benchmark">
          <p>
            SPY total return — split- and dividend-adjusted — on the same dates,
            plus a cash line accrued at the risk-free rate.
          </p>
          <p>
            <strong className="font-medium">These books are not SPY-like.</strong>{" "}
            They carry shorts and multi-asset legs. The benchmark answers
            &ldquo;versus just holding the index?&rdquo; and should not be read as
            a like-for-like comparison.
          </p>
        </Section>

        <Section title="Known biases and limits">
          <Note tone="warn">
            <strong className="font-semibold">
              Limit-order fills are biased low, so these results understate.
            </strong>{" "}
            The desk uses Alpaca&rsquo;s free IEX feed, roughly 2–3% of
            consolidated US equity volume, so the daily range the paper fill
            engine sees is narrower than the real tape and resting limit orders
            the consolidated market would have touched are recorded as expired.
            Measured over the first sessions: market orders filled 100% (72 of
            72), limit orders 6% (7 of 120), and of 18 expired limit orders not
            one had touched its IEX bar. The direction of the bias is certain. The
            magnitude has not been measured and is not stated here.
          </Note>
          <p>
            <strong className="font-medium">Two broker endpoints disagree slightly.</strong>{" "}
            Alpaca&rsquo;s account equity (our published NAV) and its daily
            portfolio-history series do not share a timing basis; on 12 August
            2026 they differed by about 17 basis points for one book. Both are
            broker figures. Every record publishes ours, theirs, and the
            difference — neither is adjusted to match the other.
          </p>
          <p>
            <strong className="font-medium">Gaps are gaps.</strong> If the box was
            down, the series has a hole. Nothing is interpolated across it, the
            chart line breaks, and no value is carried forward to hide it.
          </p>
        </Section>

        <Section title="Publication timing">
          <p>
            Net asset value, daily returns, metrics and benchmarks are published
            with no lag. Orders, fills and positions are held back for {lag}{" "}
            {lag === 1 ? "day" : "days"}.
          </p>
          <p>
            The day count is a floor; the binding rule is stricter. A
            cycle&rsquo;s detail is released only once that cycle has{" "}
            <strong className="font-medium">actually executed</strong>. The desk
            stages a plan after the close for the next open, and a stage can also
            sit unexecuted for days if something failed — a pure date rule would
            eventually publish an order plan that had never been sent.
          </p>
          <p className="text-fg-muted">
            Residual limitation, stated plainly: these books hold positions for
            more than one day, so lagged holdings still approximate current ones.
            The lag closes the window on new orders; it does not hide the
            portfolio.
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
