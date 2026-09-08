import Link from "next/link";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import {
  OverviewChart,
  OverviewLegend,
  type OverviewSeries,
} from "@/components/OverviewChart";
import { Stamp } from "@/components/Stamp";
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
  // Same source as every list on this page, so a book withheld from the index
  // rewrites the prose that describes it rather than leaving it dangling.
  const hasLive = live.length > 0;
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
      {/* ─── 1. WHO, BEFORE ANY FIGURE ────────────────────────────────────
          The page used to open with the chart and a headline about method.
          A visitor who had never heard of the firm met a rising curve before
          they met a sentence saying what they were looking at, which is the
          reading order of a pitch, not of a record. The chart now sits below
          the fold and this is the first thing on the page.

          NO HEADCOUNT IS CLAIMED HERE. The obvious sentence to write is "a
          one-person systematic trading firm", and it is not this firm's to
          write: nothing on this site states how many people RVB is, and the
          corporate site names three. "In France" is claimed because the
          disclosures page already states it ("RVB is a French entity") — a
          fact the register carries, not one invented for a headline. */}
      <section className="pt-4 lg:pt-10">
        <h1 className="max-w-[26ch] text-[31px] sm:text-[42px] leading-[1.14] tracking-[-0.014em]">
          RVB Partners is a systematic trading firm in France.
        </h1>
        <p className="mt-5 max-w-[44ch] text-[19px] sm:text-[21px] leading-[1.48] text-fg-muted">
          This site is the public register of what we trade, how it was tested,
          and what we{" "}
          <Link href="/refused" className="underline underline-offset-4 decoration-hairline hover:decoration-current">
            refused
          </Link>
          .
        </p>
      </section>

      {/* ─── 2. THE DISQUALIFIER, AHEAD OF THE FIRST NUMBER ───────────────
          Same component the other pages render in their footer, placed here
          instead of below. A disclosure a reader reaches only after scrolling
          past the returns has already failed at its job; this one is read
          before there is a single figure on the page to qualify. */}
      <div className="mt-9 border-t hairline pt-6">
        <AccountDisclosureText hasLive={hasLive} />
      </div>

      {/* ─── 3. THE STAMP BAND — THIS IS THE FOLD ─────────────────────────
          Four, never more: past four a band of stamps is a dashboard, and the
          reader stops reading them. The first one spends the reserved oxide
          when every account is simulated, because that is the fact which
          disqualifies every number below it, and it should be the loudest
          thing on the page rather than the quietest. */}
      {index && (
        <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {hasLive ? (
            <Stamp
              label="Portfolios"
              value={String(index.books.length)}
              note={
                `${index.books.length - live.length} paper · ${live.length} real capital` +
                (realCapitalFunded !== null
                  ? ` (${money(realCapitalFunded, "USD", 0)} funded)`
                  : "")
              }
            />
          ) : (
            <Stamp
              label="Paper accounts"
              value={String(index.books.length)}
              tone="negative"
              note="broker-simulated; no capital at risk in any of them"
            />
          )}
          <Stamp
            label="Chained records"
            value={String(index.chain.entries)}
            note="each one hashed and timestamped"
          />
          <Stamp
            label="Longest record"
            value={String(longestRecord)}
            note="sessions, on the oldest portfolio"
          />
          <Stamp
            label="Curve resolution"
            value="5 min"
            /* Was "paper books, broker equity; the real-capital book is
               event-driven" on the hasLive branch. Dead today, and prose about
               a book the site does not publish — but it would have rendered
               itself the moment one reached the payload. The derived branch is
               what makes the sentence honest; the sentence still has to be one
               the firm is willing to publish. */
            note={
              hasLive
                ? "broker equity; books marked on their own calendars"
                : "broker equity, not interpolation"
            }
          />
        </div>
      )}

      {/* ─── 4. THE RECORD ────────────────────────────────────────────────
          The chart, now with a section head above it saying what it is. It
          was the first thing on the page and carried no label at all. */}
      <section className="mt-16 lg:mt-24 border-t hairline pt-7">
        <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
          The record
        </h2>
        <div className="mt-6">
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

        <p className="mt-7 text-[12px] leading-relaxed text-fg-faint max-w-[80ch]">
          The lines above are Alpaca paper accounts: fills are simulated and no
          capital is at risk.{" "}
          {index && drawn.length < index.books.length && (
            <>
              Not drawn here: capital variants, which would repeat a line already
              on the chart
              {live.length > 0 && (
                <>
                  , and {live.length === 1 ? "a book" : "books"} trading real
                  capital, which a rebased axis would invite you to compare with
                  a simulated one
                </>
              )}
              .{" "}
              {/* This used to say "both are on the portfolios page" while that
                  address was a redirect into one book's dossier — a pointer at
                  nothing. /portfolios is now a real index of every book, so the
                  naming and linking here is belt-and-braces rather than the only
                  route to them, and it stays for readers who never leave this
                  page. */}
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
          opening equity, so accounts of different sizes are comparable. Each
          line begins at that account&rsquo;s first traded session; the return is
          still measured from the capital it was funded with. No benchmark is
          drawn here; past performance is not indicative of future results.{" "}
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
      </section>

      {/* ─── 5. THE METHOD ───────────────────────────────────────────────── */}
      <section className="mt-16 lg:mt-24 border-t hairline pt-7">
        <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
          The method
        </h2>
        <div className="mt-6 grid lg:grid-cols-2 gap-x-14 gap-y-6 max-w-[104ch]">
          <p className="text-[15px] leading-[1.62] text-fg-muted">
            RVB is research-driven end to end. Every strategy is built and tested
            inside the same framework that later executes it live. There is no
            separate &ldquo;live&rdquo; version of a strategy, only the one that
            survived research. What performs well once is not enough; what earns
            capital is what holds up when tested against everything we know about
            how results deceive their own authors. That framework applies
            identical rules from research to execution: one cost structure, one
            execution delay, one computation for every metric, with no discretion
            to choose which number gets shown.
          </p>
          {/* "AT THE MOMENT THEY HAPPEN" WAS NOT TRUE OF EVERY RECORD. A
              real-capital book's first fifteen sessions joined the chain on
              one later day, and the chain publishes that: each entry carries
              the day it was recorded beside the session it describes, and the
              verify table prints both columns. The strong claim survives —
              nothing can be edited or dropped afterwards — and the weak part
              of it is replaced by the thing that is actually better, which is
              that the lag is a published number rather than an assumption. */}
          <p className="text-[15px] leading-[1.62] text-fg-muted">
            Sessions are hash-chained as they are marked, each record
            cryptographically linked to the one before it and stamped with the
            day it joined the chain — so where a record was written later, the
            lag is published rather than assumed. Change one number after the
            fact and the chain breaks; that&rsquo;s what makes the record
            something you can check rather than something you have to take our
            word for.
          </p>
        </div>

        {/* TWO NOUNS, DEFINED ONCE. There used to be three, and the third —
            "the operator", an individual who ran the desk and whose own capital
            a real-capital book traded — is gone. No register records that role,
            it was invented to explain a GitHub handle, and it put a person
            between the reader and the company that actually answers for these
            claims. RVB Partners is a registered company; its officers are named
            on the legal notice. */}
        <p className="mt-7 text-[12px] text-fg-faint leading-relaxed max-w-[80ch]">
          Two words recur on these pages and mean different things:{" "}
          <span className="text-fg-muted">RVB Partners</span> is the company,
          registered in Paris and identified in full on the{" "}
          <Link href="/legal" className="underline underline-offset-2">
            legal notice
          </Link>
          ; <span className="text-fg-muted">the desk</span> is the system it runs
          — the software that stages orders, marks every session and archives the
          result.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href="/portfolios"
            className="inline-flex items-center gap-2 border hairline px-5 py-2.5 font-figure text-[11px] uppercase tracking-[0.14em] hover:bg-bg-subtle transition-colors"
          >
            The portfolios
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/verify"
            className="font-figure text-[11px] uppercase tracking-[0.14em] text-fg-muted hover:text-fg transition-colors underline underline-offset-4 decoration-hairline"
          >
            Verify it yourself
          </Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-figure text-[11px] uppercase tracking-[0.14em] text-fg-muted hover:text-fg transition-colors underline underline-offset-4 decoration-hairline"
          >
            Contact
          </a>
        </div>
      </section>
    </>
  );
}
