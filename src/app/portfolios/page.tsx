import type { Metadata } from "next";
import Link from "next/link";
import { GatedLink } from "@/components/GatedLink";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import {
  OverviewChart,
  OverviewLegend,
  type OverviewSeries,
} from "@/components/OverviewChart";
import {
  type BookCategory,
  type BookSummary,
  bookSlug,
  getIndex,
  getResearch,
  getIntraday,
  getMeta,
  getNav,
  SITE_ORIGIN,
} from "@/lib/data";
import { NO_VALUE, date, direction, money, prose, signedPct } from "@/lib/format";
import { forOverview } from "@/lib/overview";
import { orderWithVariants, parentOf } from "@/lib/variants";

/**
 * THE INDEX OF ACCOUNTS.
 *
 * `/portfolios` used to be a redirect into whichever book the publisher happened
 * to list first, which meant no page on this site listed the books at all. The
 * only place a reader could see more than one portfolio was a collapsed selector
 * at the top of a dossier they had already been dropped into — so "how many
 * accounts are there, and what is the difference between them" had no answer
 * anywhere, and the landing page had to name the excluded ones inline because
 * the address it linked to could not.
 *
 * This page answers exactly that question and stops: WHAT ACCOUNTS EXIST, WHOSE
 * MONEY IS IN EACH, HOW DO THEY DIFFER. Performance belongs on a book's own
 * page, where the conditions attached to a number travel with it.
 *
 * Everything printed here comes out of `index.json` — one fetch, no per-book
 * files. A list of six rows that opens six dossiers to draw itself is a list
 * that will be silently wrong the day one of those files is late.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolios",
  // Deliberately promises no kind of account and no figure: the page derives
  // both from the payload, and metadata cannot. A description that said "six
  // paper accounts" would be a claim this file cannot keep true.
  description:
    "Every portfolio in RVB Partners' public record: what each account is, when it opened, how many sessions it has run, and what it has returned.",
  alternates: { canonical: `${SITE_ORIGIN}/portfolios` },
};

/** Counts, formatted like every other measured integer on the site. Absence is
 *  never a zero: a count we do not have is `—`, same as everywhere else. */
const int = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? NO_VALUE
    : n.toLocaleString("en-US");

/**
 * How many strategies a book holds: the SUM of the per-category counts the
 * record publishes for it.
 *
 * This is arithmetic over published integers — a table's own rows added into
 * its total — not a metric, and not an identity. `categories[].strategies` is
 * an integer count on every book and never a list: no strategy is named
 * anywhere in the published data, by construction, and this column must not be
 * the thing that starts naming them.
 *
 * `null` rather than 0 when a book publishes no categories. A roster of unknown
 * size and a roster of nothing are different facts, and only one of them is
 * true of a funded account.
 */
function rosterSize(b: BookSummary): number | null {
  const cats = b.categories ?? [];
  if (cats.length === 0) return null;
  let total = 0;
  for (const c of cats) {
    if (!Number.isFinite(c.strategies)) return null;
    total += c.strategies;
  }
  return total;
}

/**
 * Do two books publish the same composition — same categories, same counts,
 * same weights?
 *
 * Used for one sentence only, about the capital twins. The claim "same roster
 * and weights" is the firm's, and it is worth something more than a sentence
 * repeating it: this checks the published category vectors against each other
 * so the page states it only while the payload still agrees. Two empty lists
 * are not evidence of sameness, so they answer `false`.
 *
 * The weights are compared with a tolerance rather than by `===`. They arrive
 * as identical JSON numbers today and would compare exactly, but a publisher
 * that ever renormalises one side to a different rounding would flip an exact
 * test on the last bit and silently retract a true sentence.
 */
function sameComposition(a: BookCategory[], b: BookCategory[]): boolean {
  if (a.length === 0 || a.length !== b.length) return false;
  const key = (c: BookCategory) => `${c.category}|${c.code}|${c.strategies}`;
  const other = new Map(b.map((c) => [key(c), c.weight]));
  return a.every((c) => {
    const w = other.get(key(c));
    return w !== undefined && Math.abs(w - c.weight) < 1e-9;
  });
}

export default async function Portfolios() {
  // `getResearch` is read for one reason: the paragraph below links to
  // /research, and that route is not rendered when the summary is absent.
  // Memoised for 60s and already fetched by three other routes.
  const [index, research] = await Promise.all([getIndex(), getResearch()]);
  const hasResearch = research !== null;

  // A capital twin sits directly beneath the book it copies, in the publisher's
  // order otherwise. `orderWithVariants` is the one place that knows the rule,
  // and it already handles the case this page must not get wrong: a twin whose
  // parent is not published is nobody's twin and keeps its own place.
  const books = index ? orderWithVariants(index.books, (b) => b.book) : [];
  const published = new Set(books.map((b) => b.book));
  const loaded = books.length > 0;

  // DERIVED, NOT ASSERTED. The account-kind sentence below rewrites itself from
  // the same filtered index this table lists from, so a book withheld from the
  // site cannot leave the prose describing an account no page can show.
  const hasLive = books.some((b) => b.capital_at_risk);

  // ── THE OVERVIEW CURVE ────────────────────────────────────────────────────
  // `forOverview` is the one place that decides what may share a rebased axis:
  // capital variants are excluded because they would repeat a line already
  // drawn. Reused rather than re-derived — the rule belongs in one file.
  const drawn = index ? forOverview(index.books) : [];
  const drawnSeries = await Promise.all(
    drawn.map(async (summary) => {
      // `meta` for the live adjustment factor and the declared capital
      // movements: today's session has no NAV row until the desk marks after
      // the close, so an event declared today reaches this chart through
      // nothing else.
      const [nav, intraday, meta] = await Promise.all([
        getNav(summary.book),
        getIntraday(summary.book),
        getMeta(summary.book),
      ]);
      return { summary, nav, intraday, meta };
    }),
  );
  const series: OverviewSeries[] = drawnSeries.map(
    ({ summary, nav, intraday, meta }) => ({
      book: summary.book,
      label: summary.label,
      nav,
      intraday,
      liveFactor: meta?.capital_events?.live_factor ?? 1,
    }),
  );

  // WHICH ACCOUNTS ARE NOT ON THE CHART, counted rather than asserted, so the
  // note disappears by itself on the day every book is drawn.
  const drawnIds = new Set(drawn.map((b) => b.book));
  const undrawn = books.filter((b) => !drawnIds.has(b.book));
  const undrawnNote = undrawn.length
    ? `Capital variants are not drawn: each one repeats a line already on the chart at a different size. ${
        undrawn.length === 1 ? "It is" : "They are"
      } listed in the table below and ${
        undrawn.length === 1 ? "has its own page" : "each has its own page"
      }.`
    : "";

  // A LINE ON THIS CHART CAN HAVE AN EXCLUSION IN IT. Where a drawn book has
  // declared capital movements its curve measures the capital actually managed
  // and leaves those movements out — the correct treatment, and invisible
  // unless the chart says so. Counted from the books actually drawn.
  const withEvents = drawnSeries.filter(
    ({ meta }) => (meta?.capital_events?.events?.length ?? 0) > 0,
  );
  const capitalNote = withEvents.length
    ? `${withEvents
        .map(({ summary }) => summary.label)
        .join(", ")} ${
        withEvents.length === 1 ? "is" : "are"
      } drawn with declared capital movements excluded, so ${
        withEvents.length === 1 ? "that line measures" : "those lines measure"
      } the return on the capital actually managed rather than the size of the account. Every movement is listed with its date, its amount and its evidence on the portfolio\u2019s own page.`
    : "";

  // The parent of each row, preferring the publisher's own statement of the
  // relationship over the name-suffix inference. Same order of preference as a
  // book's own page: a relationship read off a string suffix is a guess that
  // happens to be right, and stops being right the day a book is renamed.
  const parentOfRow = (b: BookSummary): BookSummary | null => {
    const name = b.variant_of ?? parentOf(b.book);
    if (!name || !published.has(name)) return null;
    return books.find((x) => x.book === name) ?? null;
  };

  const twins = books
    .map((b) => {
      const parent = parentOfRow(b);
      if (!parent) return null;
      const ratio =
        Number.isFinite(parent.initial_capital) &&
        Number.isFinite(b.initial_capital) &&
        b.initial_capital > 0
          ? parent.initial_capital / b.initial_capital
          : null;
      return {
        twin: b,
        parent,
        ratio,
        matched: sameComposition(parent.categories ?? [], b.categories ?? []),
      };
    })
    .filter((t): t is NonNullable<typeof t> => t !== null);

  // Every twin funded at exactly a tenth of its parent. Checked rather than
  // written down, because "one tenth" is a figure and a figure this page prints
  // has to come from the payload like any other.
  const allTenths =
    twins.length > 0 &&
    twins.every((t) => t.ratio !== null && Math.abs(t.ratio - 10) < 1e-9);
  const allMatched = twins.length > 0 && twins.every((t) => t.matched);

  // Whether any annualised statistic could be shown at all. Read off the books'
  // own gate flags, never from a session count compared against the threshold
  // here: the record publishes what the gate counts in, and this page is not
  // entitled to re-decide it.
  const allGated = loaded && books.every((b) => b.annualised_gated);

  return (
    <div className="pt-2 lg:pt-6">
      {/* ─── THE HEAD, AND THE REGISTER BESIDE IT ─────────────────────────
          A reader arriving here wants one of two things: to know what a
          portfolio is, or to open one. The page answered the first and made
          the second a scroll past four sections and a chart to a table at the
          foot — on the page whose whole job is to list the accounts.

          They are now side by side. The lead keeps the measure; the right
          column is the register itself, every book named and linked, with its
          published account kind against it. It is the contents of this page
          and the call to action at once, which is the only kind this site's
          voice can carry: a list of what is here, not a button.

          Rendered only when the index loaded. With no books there is nothing
          to list, and an empty rail beside the lead would read as a column
          that failed rather than as a record with nothing in it. */}
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,var(--measure))_minmax(0,1fr)]">
        <div>
          <h1 className="text-title">Portfolios</h1>
          <p className="mt-5 text-body text-fg-muted">
            Every portfolio RVB Partners publishes, what kind of account each
            one is, and how they differ from one another. Each has its own
            page, where the curve, the holdings and the chained evidence for it
            live.
          </p>
        </div>

        {loaded && (
          <nav aria-label="The portfolios" className="lg:pt-2">
            <h2 className="border-b hairline pb-2 text-label font-semibold uppercase tracking-[0.13em] text-fg">
              The accounts
            </h2>
            <ul>
              {books.map((b) => (
                <li key={b.book} className="border-b hairline">
                  <Link
                    href={`/portfolios/${bookSlug(b)}`}
                    className="group flex items-baseline justify-between gap-3 py-2"
                  >
                    <span className="text-small text-accent group-hover:underline">
                      {b.label}
                    </span>
                    {/* The book's own published wording, never a sentence
                        decided here. Both kinds get the same treatment; the
                        difference is the text. */}
                    <span className="shrink-0 text-caption text-fg-faint">
                      {b.account_kind_label ??
                        (b.capital_at_risk
                          ? "Capital at risk"
                          : "Paper")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="#accounts"
              className="mt-3 inline-block text-caption text-accent hover:underline"
            >
              Funding and inception, in full{" "}
              <span aria-hidden="true">&darr;</span>
            </a>
          </nav>
        )}
      </div>

      {/* ─── WHAT A PORTFOLIO IS ──────────────────────────────────────────
          This paragraph exists nowhere else on the site. Every other page
          assumes the reader already knows what a "book" is, and a reader who
          does not has been looking at a column of labelled returns without
          knowing what was being returned. It carries no figure, so it is safe
          above the account statement below. */}
      <Section title="What a portfolio is here" gloss="Before the figures">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          <p>
            A portfolio here is a fixed roster of strategies held at target
            weights and traded on one broker account by the desk. The record
            calls it a <span className="text-fg">book</span>. Its members are
            assembled out of the research catalogue, the same catalogue whose
            search and deflation are set out
            under{" "}
            <GatedLink href="/research" available={hasResearch}>
              research
            </GatedLink>
            . The roster is fixed: the desk stages orders towards those weights,
            marks the account after each close and archives the result, and the
            book itself is not re-chosen between marks.
          </p>
          <p>
            Each book has its own account, its own funding and its own chain of
            marked sessions, which is why they are listed here as separate
            records rather than added into one.{" "}
            <span className="text-fg">
              None of them is offered to anyone.
            </span>{" "}
            The company trades its own account; this page is a register, not a
            menu.
          </p>
        </div>
      </Section>

      {/* ─── THE ACCOUNT STATEMENT, AHEAD OF THE FIRST FIGURE ─────────────
          The same component the home page places above its stamp band and the
          other pages carry in their footer — one sentence, one source, so the
          placements cannot drift apart. It sits here, above the table and above
          the reserved chart below, because a disqualifier a reader reaches
          after scrolling past the returns has already failed at its job.

          Rendered only when the index actually loaded: the sentence is DERIVED
          from the books listed below it, so with no books there is nothing it
          can honestly say — and the failure is then reported once, in the
          section that was going to hold the figures, rather than twice. */}
      {loaded && (
        <div className="mt-12 lg:mt-16 border-t hairline pt-6">
          <AccountDisclosureText hasLive={hasLive} />
        </div>
      )}

      {/* ─── THE RECORD ──────────────────────────────────────────────────
          Moved here from the home page. It sits BELOW the account statement
          above and deliberately so: a curve a reader meets before the sentence
          saying the accounts are simulated is a figure that has escaped its own
          disqualifier. And it belongs on this page rather than the front one —
          a rising line on the apex domain makes the site's opening job "show
          the returns", which is the reading order of a pitch. */}
      {loaded && index && series.length > 0 && (
        <Section title="The record" gloss="Every drawn account, rebased on its own opening equity">
          <OverviewChart series={series} />
          <div className="mt-4">
            <OverviewLegend series={series} />
          </div>

          {/* THE FIVE QUALIFICATIONS, BROKEN OUT. They used to run together in
              a single 12px paragraph under the chart on the home page, which is
              where a caveat goes to be skipped. Each is now its own ruled note
              at a size a reader can actually read. */}
          <div className="mt-8 grid gap-px border hairline bg-hairline sm:grid-cols-2">
            {[
              [
                "Simulated fills",
                "Every line is a broker-simulated paper account. No capital is at risk in any of them.",
              ],
              [
                "Not every account is drawn",
                undrawnNote,
              ],
              [
                "Rebased, not comparable in size",
                "Cumulative return since each account was funded, rebased on its own opening equity, so accounts funded with different capital can share an axis. Each line begins at that account\u2019s first traded session.",
              ],
              [
                "No benchmark is drawn here",
                "There is no index on this chart. A benchmark appears on a portfolio\u2019s own page, named, against that book\u2019s own dates. Past performance is not indicative of future results.",
              ],
              [
                "Declared capital movements",
                capitalNote,
              ],
            ]
              .filter(([, body]) => Boolean(body))
              // An odd number of notes leaves a hole in a two-column grid, and
              // an empty ruled cell reads as a note that failed to load. The
              // last one spans the row instead.
              .map(([head, body], i, all) => (
                <div
                  key={head as string}
                  className={`bg-bg p-4 ${
                    i === all.length - 1 && all.length % 2 === 1
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <div className="text-label uppercase tracking-[0.14em] text-fg-faint">
                    {head}
                  </div>
                  <p className="mt-2 text-small leading-relaxed text-fg-muted">
                    {body}
                  </p>
                </div>
              ))}
          </div>
        </Section>
      )}

      {/* ─── THE INDEX ────────────────────────────────────────────────────── */}
      <Section id="accounts" title="The accounts" gloss="One row per portfolio">
        {loaded && index ? (
          <>
            <div className="scroll-x">
              <table className="w-full text-small">
                <thead>
                  <tr className="text-left text-fg-faint">
                    <Th>Portfolio</Th>
                    <Th>Account</Th>
                    <Th align="right">Funded with</Th>
                    <Th align="right">Opened</Th>
                    <Th align="right">Sessions</Th>
                    <Th align="right">Strategies</Th>
                    <Th align="right">Return</Th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((b) => {
                    const parent = parentOfRow(b);
                    const roster = rosterSize(b);
                    const cats = b.categories ?? [];
                    // `direction` treats a withheld return as its own case
                    // rather than as flat, which is why the colour is taken
                    // from it instead of from `>= 0`.
                    const dir = direction(b.cumulative_return);
                    const colour =
                      dir === "up"
                        ? "text-up"
                        : dir === "down"
                          ? "text-down"
                          : "text-fg-faint";
                    // The tagline is the book's own words, and the twin marker
                    // is this page's. Both under the label, so the row reads as
                    // one thing rather than as two columns of small print.
                    const notes = [
                      parent ? `Capital twin of ${parent.label}` : null,
                      b.tagline_en ? prose(b.tagline_en) : null,
                    ].filter((n): n is string => n !== null);

                    return (
                      <tr key={b.book} className="border-t hairline align-top">
                        <td className="py-3 pr-6">
                          {/* Indented and tied to the row above with a rule:
                              a twin is not another portfolio, it is one of the
                              books above at a different size. */}
                          <div className={parent ? "pl-5" : ""}>
                            <Link
                              href={`/portfolios/${bookSlug(b)}`}
                              className="text-small text-accent hover:underline"
                            >
                              {parent && (
                                <span
                                  aria-hidden="true"
                                  className="mr-1.5 text-fg-faint"
                                >
                                  └
                                </span>
                              )}
                              {b.label}
                            </Link>
                            {notes.length > 0 && (
                              /* Set in the prose face on purpose: everything
                                 inside a table is mono by default, and these
                                 are sentences, not measurements. */
                              <div className="mt-1 max-w-[40ch] font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
                                {notes.join(" · ")}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-6 whitespace-nowrap">
                          <KindBadge book={b} />
                        </td>
                        <td className="py-3 pr-6 text-right tnum whitespace-nowrap">
                          {money(b.initial_capital, "USD", 0)}
                        </td>
                        <td className="py-3 pr-6 text-right tnum whitespace-nowrap">
                          {date(b.inception)}
                        </td>
                        <td className="py-3 pr-6 text-right tnum">
                          {int(b.sessions)}
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <span className="tnum">{int(roster)}</span>
                          {cats.length > 0 && (
                            <div className="mt-1 text-caption leading-snug text-fg-faint">
                              {cats
                                .map((c) => `${c.code} ${int(c.strategies)}`)
                                .join(" · ")}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right whitespace-nowrap">
                          <span className={`tnum ${colour}`}>
                            {signedPct(b.cumulative_return)}
                          </span>
                          {/* A RETURN LISTED BESIDE CURRENT ONES IS A CLAIM
                              ABOUT TODAY. The publisher marks a book stale and
                              names the session it stopped at; no book is stale
                              today, so this renders nothing — and does not have
                              to be remembered on the day one is. */}
                          {b.stale && (
                            <div className="mt-1 text-label tnum text-fg-faint">
                              as of {date(b.stale_since)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 max-w-[80ch] space-y-2 text-small leading-relaxed text-fg-faint">
              <p>
                <span className="text-fg-muted">Return</span> is cumulative
                since the account was funded, as published by the desk. It is
                not annualised, and covers a different window for each book.{" "}
                <span className="text-fg-muted">Funded with</span> is the
                capital the account was opened with, which on a simulated
                account is simulated capital.{" "}
                <span className="text-fg-muted">Sessions</span> is the count of
                sessions published for that book, each one marked after its own
                close.
              </p>
              <p>
                <span className="text-fg-muted">Strategies</span> is the sum of
                the per-category counts the record publishes for the book; the
                categories are listed beneath it. Holdings are published by
                category and no strategy is named anywhere in this record.
                That is why this column is a count and never a list.
              </p>
            </div>
          </>
        ) : (
          <Note tone="warn">
            The published index could not be read, so no portfolio is listed
            here. Nothing is shown rather than a stale or partial figure.
          </Note>
        )}
      </Section>

      {/* ─── HOW THESE WERE CHOSEN ────────────────────────────────────────
          The selection objective is NOT withheld: every book publishes it in
          its own `tagline_en`, which the table above prints verbatim. This
          section says so in words rather than enumerating the objectives here,
          because an enumeration written into this file goes stale against the
          payload and the payload is the thing a reader can check. */}
      {/* Guarded on the index, because its first sentence points AT the table:
          "printed against its name above" is a promise, and with no rows above
          it there is nothing to point at. */}
      {loaded && (
        <Section
          title="How these were chosen"
          gloss="What each book was selected for"
        >
          <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
            <p>
              Each book carries a one-line description, published with the
              record and printed against its name above. That line is not
              decoration: it names the objective the book&rsquo;s roster was
              selected for. All of them are drawn from the same catalogue; what
              differs between them is what the selection was aiming at. The
              criterion is published rather than withheld, so a reader can see
              what an account was built to do before looking at what it has
              done.
            </p>
            <p>
              The selection happened once, when the book was constructed, and
              the roster has been fixed since. Nothing on this page re-ranks
              them afterwards, and the objective a book was selected for is a
              statement about how it was built, never a prediction of what it
              will do.
            </p>
          </div>
        </Section>
      )}

      {/* ─── THE CAPITAL TWINS ────────────────────────────────────────────
          Rendered only where the payload actually has a pair. The prose is
          guarded on checks against the published composition rather than
          asserting the relationship, so the section cannot go on describing an
          experiment the data has stopped running. */}
      {twins.length > 0 && (
        <Section
          title="The capital twins"
          gloss={twins.length === 1 ? "One pair" : `${twins.length} pairs`}
        >
          <div className="scroll-x">
            <table className="w-full text-small">
              <thead>
                <tr className="text-left text-fg-faint">
                  <Th>Pair</Th>
                  <Th align="right">Funded with</Th>
                  <Th align="right">Opened</Th>
                </tr>
              </thead>
              <tbody>
                {twins.map(({ twin, parent }) => (
                  // Two rows per pair, the twin beneath the book it copies, so
                  // the two figures that differ sit directly above one another.
                  <TwinRows key={twin.book} parent={parent} twin={twin} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 max-w-[72ch] space-y-4 text-body text-fg-muted">
            <p>
              A twin is not another portfolio. It is one of the books above run
              at a smaller size, so that the pair measures capital sensitivity
              and nothing else.
              {allTenths
                ? " The smaller size is a tenth of the capital, in every pair here."
                : ""}
              {allMatched
                ? " The category counts and weights published for the two sides of each pair are identical, which is what makes a pair one experiment rather than two ideas."
                : ""}
            </p>
            <p>
              {/* THE PART THAT IS EASY TO MISS, AND THE REASON THE DATES ARE IN
                  THE TABLE ABOVE. The twins were funded later than the books
                  they copy, so the two returns do not cover the same window and
                  the difference between them is not a capital effect alone. */}
              They were not opened on the same day. The dates above are the
              record&rsquo;s own, and the twin&rsquo;s return covers a shorter
              window than its parent&rsquo;s. The gap between their two returns
              in the index above is therefore a difference of capital{" "}
              <em>and</em> of measurement window. Read a pair as one experiment
              with two readings, never as two records to rank against each
              other.
            </p>
          </div>
        </Section>
      )}

      {/* ─── WHAT THIS PAGE IS NOT ────────────────────────────────────────── */}
      <Section title="What this page is not" gloss="The limits of the list">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          <p>
            <span className="text-fg">It is not a ranking.</span> The rows
            follow the order the record publishes them in, with each capital
            twin moved beneath the book it copies; nothing here is sorted by
            result and none of these books is the best of the others. The
            returns cover different windows and different funding, which is
            exactly the comparison a league table would invite and this one does
            not support.
          </p>
          {allGated && index && (
            <p>
              There is no annualised return and no risk statistic on this page.
              The record withholds every annualised figure until a book has{" "}
              <span className="tnum">
                {int(index.min_sessions_for_annualised)}
              </span>{" "}
              marked sessions, and every book listed here is still under that
              bar. What the last column carries is a cumulative return since
              funding, which is not a rate of return and cannot be read as one.
            </p>
          )}
          <p>
            No benchmark is compared on this page, and nothing on it is
            investment advice, an offer, or a solicitation. Past performance is
            not indicative of future results. What each figure means and how it
            is computed is set out under{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              methodology
            </Link>
            , the conditions attached to it under{" "}
            <Link href="/disclosures" className="text-accent hover:underline">
              disclosures
            </Link>
            , and the steps for checking any of it yourself under{" "}
            <Link href="/verify" className="text-accent hover:underline">
              verify
            </Link>
            .
          </p>
        </div>
      </Section>
    </div>
  );
}

/** The two rows of one capital pair. A fragment rather than a component with a
 *  wrapper, because a `<tbody>` may only contain rows. */
function TwinRows({
  parent,
  twin,
}: {
  parent: BookSummary;
  twin: BookSummary;
}) {
  return (
    <>
      <tr className="border-t hairline">
        <td className="py-3 pr-6">
          <Link
            href={`/portfolios/${bookSlug(parent)}`}
            className="text-accent hover:underline"
          >
            {parent.label}
          </Link>
        </td>
        <td className="py-3 pr-6 text-right tnum whitespace-nowrap">
          {money(parent.initial_capital, "USD", 0)}
        </td>
        <td className="py-3 text-right tnum whitespace-nowrap">
          {date(parent.inception)}
        </td>
      </tr>
      <tr>
        <td className="py-3 pr-6 pl-5">
          <Link
            href={`/portfolios/${bookSlug(twin)}`}
            className="text-accent hover:underline"
          >
            <span aria-hidden="true" className="mr-1.5 text-fg-faint">
              └
            </span>
            {twin.label}
          </Link>
        </td>
        <td className="py-3 pr-6 text-right tnum whitespace-nowrap">
          {money(twin.initial_capital, "USD", 0)}
        </td>
        <td className="py-3 text-right tnum whitespace-nowrap">
          {date(twin.inception)}
        </td>
      </tr>
    </>
  );
}

/**
 * Paper or real capital, on EVERY row rather than only on an exception.
 *
 * Marking one kind and leaving the other bare makes the unmarked rows readable
 * only by inference, and a reader who does not know what the default is cannot
 * infer it. The wording is the book's own published label; the fallback states
 * only what the flag itself carries, so this badge can never describe an
 * account the record does not publish.
 *
 * Identical styling for both kinds, deliberately — the same judgment the
 * selector makes. A shouted banner on one of them is theatre where information
 * is wanted.
 */
function KindBadge({ book }: { book: BookSummary }) {
  const label =
    book.account_kind_label ??
    (book.capital_at_risk ? "Capital at risk" : "Paper (broker-simulated)");
  return (
    <span className="inline-block border hairline px-1.5 py-px align-middle text-label leading-[1.5] text-fg-faint">
      {label}
    </span>
  );
}

/** Column head. Set in the figure face in small caps like every other index on
 *  the site: a table header is something read off a file, not the firm talking. */
function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`pb-3 text-label font-medium uppercase tracking-[0.14em] ${
        align === "right" ? "pr-6 text-right last:pr-0" : "pr-6"
      }`}
    >
      {children}
    </th>
  );
}

/** Section rule + head, matching the legal notice: the house pattern is a
 *  hairline, a small-caps mono head and a gloss saying what the section is for. */
function Section({
  id,
  title,
  gloss,
  children,
}: {
  /** Anchor target. `scroll-mt` keeps the heading clear of the viewport edge
   *  when the jump from the header lands on it. */
  id?: string;
  title: string;
  gloss?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-12 scroll-mt-8 border-t hairline pt-6 lg:mt-16">
      <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
        {title}
        {gloss && (
          <span className="ml-3 normal-case tracking-normal text-fg-faint/70">
            {gloss}
          </span>
        )}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
