import Link from "next/link";
import { Note } from "@/components/Note";
import {
  OverviewChart,
  OverviewLegend,
  type OverviewSeries,
} from "@/components/OverviewChart";
import {
  bookSlug,
  CONTACT_EMAIL,
  getIndex,
  getIntraday,
  getMeta,
  getNav,
} from "@/lib/data";
import { money } from "@/lib/format";
import { forOverview } from "@/lib/overview";

// Same reasoning as the portfolios page: rendered per request, because the
// curve below is the live one and a cached landing page is a stale claim.
export const dynamic = "force-dynamic";

export default async function Home() {
  const index = await getIndex();

  // The chart draws only what is comparable on one rebased axis: capital
  // variants would repeat a line, and a book trading real capital is not a
  // paper book with a different label. Both stay first-class everywhere else.
  const drawn = index ? forOverview(index.books) : [];
  const live = index?.books.filter((b) => b.capital_at_risk) ?? [];
  // The capital actually at risk, summed from the published funding of the
  // real-capital books. Null rather than 0 if any of them does not publish one:
  // a partial sum printed as a total is the kind of number this record exists
  // not to print.
  const realCapitalFunded =
    live.length > 0 && live.every((b) => Number.isFinite(b.initial_capital))
      ? live.reduce((s, b) => s + b.initial_capital, 0)
      : null;

  const drawnMeta = index
    ? await Promise.all(
        drawn.map(async (summary) => {
          // `meta` only for the live adjustment factor and the declared capital
          // movements. Today's session has no NAV row until the desk marks
          // after the close, so a capital event declared today reaches this
          // chart through nothing else.
          const [nav, intraday, meta] = await Promise.all([
            getNav(summary.book),
            getIntraday(summary.book),
            getMeta(summary.book),
          ]);
          return { summary, nav, intraday, meta };
        }),
      )
    : [];

  const series: OverviewSeries[] = drawnMeta.map(
    ({ summary, nav, intraday, meta }) => ({
      book: summary.book,
      label: summary.label,
      nav,
      intraday,
      liveFactor: meta?.capital_events?.live_factor ?? 1,
    }),
  );

  // A LINE ON THIS CHART CAN HAVE AN EXCLUSION IN IT. Where a drawn book has
  // declared capital movements, its curve measures the capital actually
  // managed and leaves those movements out — which is the correct treatment
  // and is invisible unless the chart under it says so. Counted from the
  // books drawn here, never asserted, so the sentence disappears by itself on
  // the day no drawn book has one.
  const withEvents = drawnMeta.filter(
    ({ meta }) => (meta?.capital_events?.events?.length ?? 0) > 0,
  );

  // The books this chart leaves out, named so the caption can link them.
  const drawnBooks = new Set(drawn.map((b) => b.book));
  const undrawn = (index?.books ?? []).filter((b) => !drawnBooks.has(b.book));

  // The MAXIMUM across books, not a total — labelled accordingly below. It was
  // captioned "Sessions published", which reads as the site-wide count and is
  // 112, the figure already shown in the next tile as chained records.
  const longestRecord =
    index?.books.reduce((n, b) => Math.max(n, b.sessions), 0) ?? 0;

  return (
    <>
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center pt-2 lg:pt-6">
        {/* Chart first on a wide screen, second on a phone: the paragraph is
            what orients a reader, and a chart with no caption above it is
            decoration until you have been told what it is. */}
        <div className="order-2 lg:order-1">
          {index ? (
            <>
              <OverviewChart series={series} />
              <div className="mt-4">
                <OverviewLegend series={series} />
              </div>
            </>
          ) : (
            <Note tone="warn">
              The published data could not be loaded. Nothing is being shown
              rather than a stale or partial figure.
            </Note>
          )}
        </div>

        <div className="order-1 lg:order-2 max-w-[52ch]">
          <h1 className="text-[30px] sm:text-[38px] font-semibold tracking-tight leading-[1.12]">
            Method, and the record it produces.
          </h1>

          <div className="mt-6 space-y-4 text-[14.5px] leading-relaxed text-fg-muted">
            <p>
              RVB is research-driven end to end. Every strategy is built and
              tested inside the same framework that later executes it live.
              There is no separate &ldquo;live&rdquo; version of a strategy, only
              the one that survived research. What performs well once is not
              enough; what earns capital is what holds up when tested against
              everything we know about how results deceive their own authors.
            </p>
            <p>
              That framework applies identical rules from research to execution:
              one cost structure, one execution delay, one computation for every
              metric, with no discretion to choose which number gets shown.
            </p>
            {/* "AT THE MOMENT THEY HAPPEN" WAS NOT TRUE OF EVERY RECORD. A
                real-capital book's first fifteen sessions joined the chain on
                one later day, and the chain publishes that: each entry carries
                the day it was recorded beside the session it describes, and the
                verify table prints both columns. The strong claim survives —
                nothing can be edited or dropped afterwards — and the weak part
                of it is replaced by the thing that is actually better, which is
                that the lag is a published number rather than an assumption. */}
            <p>
              Sessions are hash-chained as they are marked, each record
              cryptographically linked to the one before it and stamped with the
              day it joined the chain — so where a record was written later,
              the lag is published rather than assumed. Change one number after
              the fact and the chain breaks; that&rsquo;s what makes the record
              something you can check rather than something you have to take our
              word for.
            </p>
          </div>

          {/* FOUR NOUNS, DEFINED ONCE. The pages say "RVB", "the desk", "the
              operator" and "the publisher", and they are four different things
              — but a reader meeting them scattered across five pages cannot
              tell that from a party hedging its own identity. One line, where
              a reader meets the first of them. */}
          <p className="mt-6 text-[12px] text-fg-faint leading-relaxed">
            Three words recur on these pages and mean three different things:{" "}
            <span className="text-fg-muted">RVB</span> is the firm;{" "}
            <span className="text-fg-muted">the desk</span> is the system that
            trades, marks and archives every session; and{" "}
            <span className="text-fg-muted">the operator</span> is the individual
            who runs it and whose own capital the real-capital portfolio trades.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link
              href="/portfolios"
              className="inline-flex items-center gap-2 border hairline px-5 py-2.5 text-[14px] font-medium hover:bg-bg-subtle transition-colors"
            >
              Discover our portfolios
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/verify"
              className="text-[13.5px] text-fg-muted hover:text-fg transition-colors underline underline-offset-4 decoration-hairline"
            >
              Verify it yourself
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[13.5px] text-fg-muted hover:text-fg transition-colors underline underline-offset-4 decoration-hairline"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>

      {index && (
        <dl className="mt-14 lg:mt-20 border-t hairline pt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
          {/* "LIVE" IS RESERVED FOR REAL CAPITAL ON EVERY SURFACE. Six paper
              books are live too — they run every session — so the word marked
              the one distinction it was not making, while the distinction it
              WAS making (whose money) went unnamed. And the size belongs beside
              the count: a real-capital book of a few hundred dollars is a very
              different claim from a real-capital book of a few million, and the
              figure is published. */}
          <Stat
            label="Portfolios"
            value={String(index.books.length)}
            note={
              live.length > 0
                ? `${index.books.length - live.length} paper · ${live.length} real capital` +
                  (realCapitalFunded !== null
                    ? ` (${money(realCapitalFunded, "USD", 0)}, the operator's own money)`
                    : "")
                : undefined
            }
          />
          <Stat
            label="Longest record"
            value={String(longestRecord)}
            note="sessions, on the oldest portfolio"
          />
          <Stat
            label="Chained records"
            value={String(index.chain.entries)}
            note="each one timestamped"
          />
          <Stat
            label="Curve resolution"
            value="5 min"
            note={
              live.length > 0
                ? "paper books, broker equity; the real-capital book is event-driven"
                : "broker equity, not interpolation"
            }
          />
        </dl>
      )}

      <p className="mt-8 text-[12px] text-fg-faint max-w-[80ch]">
        The lines above are Alpaca paper accounts: fills are simulated and no
        capital is at risk.{" "}
        {index && drawn.length < index.books.length && (
          <>
            Not drawn here: capital variants, which would repeat a line already on
            the chart
            {live.length > 0 && (
              <>
                , and {live.length === 1 ? "a book" : "books"} trading real
                capital, which a rebased axis would invite you to compare with a
                simulated one
              </>
            )}
            .{" "}
            {/* "BOTH ARE ON THE PORTFOLIOS PAGE" POINTED AT NOTHING. There is
                no portfolios page: the address redirects to whichever book is
                published first, and the books this sentence is about are the
                ones NOT on that chart — reachable only by opening a collapsed
                selector a reader has not been told about. Every excluded book
                is named and linked here instead, so the sentence delivers what
                it promises without a page that does not exist. */}
            {undrawn.length > 0 ? (
              <>
                {undrawn.length === 1 ? "It has" : "They each have"} a page of{" "}
                {undrawn.length === 1 ? "its" : "their"} own:{" "}
                {undrawn.map((b, i) => (
                  <span key={b.book}>
                    {i > 0 ? (i === undrawn.length - 1 ? " and " : ", ") : ""}
                    <Link
                      href={`/portfolios/${bookSlug(b)}`}
                      className="underline underline-offset-2"
                    >
                      {b.label}
                    </Link>
                  </span>
                ))}
                , and the selector at the top of any portfolio page lists all{" "}
                {index.books.length}.{" "}
              </>
            ) : null}
          </>
        )}
        Cumulative return since each account was funded, rebased on its own
        opening equity, so accounts of different sizes are comparable. Each line
        begins at that account&rsquo;s first traded session; the return is still
        measured from the capital it was funded with. No benchmark is drawn here;
        past performance is not indicative of future results.{" "}
        {withEvents.length > 0 && (
          <>
            {withEvents.map(({ summary }, i) => (
              <span key={summary.book}>
                {i > 0 ? (i === withEvents.length - 1 ? " and " : ", ") : ""}
                <Link
                  href={`/portfolios/${bookSlug(summary)}`}
                  className="underline underline-offset-2"
                >
                  {summary.label}
                </Link>
              </span>
            ))}
            {withEvents.length === 1 ? " is" : " are"} drawn with declared
            capital movements excluded, so{" "}
            {withEvents.length === 1
              ? "that line measures"
              : "those lines measure"}{" "}
            the return on the capital actually managed rather than the size of
            the account. Every movement is listed with its date, its amount and
            its evidence on the portfolio&rsquo;s own page.
          </>
        )}
      </p>
    </>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-fg-faint">{label}</dt>
      <dd className="mt-1 text-[19px] tnum tracking-tight">{value}</dd>
      {note && <div className="text-[11.5px] text-fg-faint mt-0.5">{note}</div>}
    </div>
  );
}
