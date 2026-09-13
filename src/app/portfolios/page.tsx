import type { Metadata } from "next";
import Link from "next/link";
import { GatedLink } from "@/components/GatedLink";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
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
 *
 * ON THE GRID. This page was the last one carrying a private `Section` of its
 * own: a rule, a head, and a gloss set inline at `text-fg-faint/70` (#9e9e9c,
 * 2.68:1 on white — a failing contrast on the only words naming each part of
 * the page). It now uses the shared primitive (src/components/Section.tsx):
 * rail, measure, margin. The gloss moved into the rail at a colour a reader can
 * see, the hand-written `max-w-[Nch]` caps on the prose went with it because
 * the grid owns the measure, and the two margins this page had the data for
 * all along are filled: the published taglines beside the section that is about
 * them, and the published session counts beside the section that says why no
 * annualised figure appears.
 *
 * THE REGISTER ITSELF IS THE ONE THING THAT DOES NOT FIT THE MEASURE. Seven
 * columns do not reflow, so the table sits below its section head at the full
 * width of the page rather than scrolling sideways inside 33rem. What moves
 * into the measure above it is the column glossary, which is the right order
 * anyway on a page that puts a qualifier ahead of the figure it qualifies.
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

  // A LINE ON THIS CHART CAN HAVE AN EXCLUSION IN IT. Where a drawn book has
  // declared capital movements its curve measures the capital actually managed
  // and leaves those movements out — the correct treatment, and invisible
  // unless the chart says so. Counted from the books actually drawn.
  const withEvents = drawnSeries.filter(
    ({ meta }) => (meta?.capital_events?.events?.length ?? 0) > 0,
  );
  const capitalNote = withEvents.length
    ? `${withEvents.map(({ summary }) => summary.label).join(", ")} ${
        withEvents.length === 1 ? "excludes its" : "exclude their"
      } declared capital movements, which are listed on ${
        withEvents.length === 1 ? "its page" : "their pages"
      }.`
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

  // WHAT IS NOT DRAWN, BY NAME OF KIND. The note used to explain only the
  // capital twins, so with the real-capital portfolio also left off the chart a
  // reader counting seven portfolios found four lines and one unexplained gap.
  const undrawnTwins = undrawn.filter((b) => parentOfRow(b) !== null).length;
  const undrawnReal = undrawn.filter(
    (b) => b.capital_at_risk && parentOfRow(b) === null,
  ).length;
  const undrawnParts = [
    undrawnTwins > 0 ? (undrawnTwins === 1 ? "the capital twin" : "the capital twins") : null,
    undrawnReal > 0
      ? undrawnReal === 1
        ? "the real-capital portfolio"
        : "the real-capital portfolios"
      : null,
  ].filter((s): s is string => s !== null);
  const undrawnNote = undrawnParts.length
    ? `${undrawnParts.join(" and ").replace(/^./, (c) => c.toUpperCase())} ${
        undrawnTwins + undrawnReal === 1 ? "is" : "are"
      } not drawn; every portfolio is listed below.`
    : "";

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
  const laterTwins =
    twins.length > 0 && twins.every(({ twin, parent }) => twin.inception > parent.inception);


  return (
    <div className="pt-2 lg:pt-6">
      {/* ─── THE HEAD ────────────────────────────────────────────────────
          THE LIST CAME OUT. Naming all seven books beside the lede put the
          contents of the page into its own header, twenty lines above a table
          that says the same names with their funding and their inception. Two
          copies of one list, and the upper one had nothing the lower one
          lacked, so the white around it was doing nothing either.

          One way in, instead. The reader who wants to know what a portfolio is
          reads the lede; the reader who came to open one takes the link and
          skips everything between here and the accounts. */}
      {/* THE LEAD, AND THE WAY IN BESIDE IT. The link sat under the paragraph,
          which is where a reader who has finished reading finds it — and the
          reader who came to open a portfolio has not come to read. Across from
          the lede it is the first thing on the page that is not prose, on the
          side of the column that was empty. */}
      <div className="grid gap-x-11 gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--margin))]">
        <div>
          <h1 className="text-title">Portfolios</h1>
          <p className="mt-5 text-body text-fg-muted">
            Every portfolio RVB Partners publishes, what kind of account each
            one is, and how they differ from one another. Each has its own page,
            where the curve, the holdings and the chained evidence for it live.
          </p>
        </div>
        {loaded && (
          /* THE ONE THING ON THIS PAGE A READER IS ASKED TO PRESS.

             It was a hairline rectangle with a small line of text and a small
             arrow, on a site built entirely out of hairline rectangles, so it
             read as one more note rather than as a control. It is a block of
             ink now: the invitation at subhead size in the band's own light
             type, what is at the other end underneath it, and the arrow at
             title size in the bottom corner where the eye finishes.

             `self-stretch` so it stands the full height of the lede beside it
             rather than floating at one end of the row, and `justify-between`
             so the label sits at the top and the arrow at the foot. The ink is
             the hero band's, not a fourth black.

             (`lg:col-start-3` used to be here, left over from the three-track
             grid. With two columns defined, starting an item at column 3 makes
             the browser invent an IMPLICIT third track to hold it, and that
             track's width comes out of the first one — which is why the lede
             wrapped at 340px with a gap beside it.) */
          <a
            href="#portfolios"
            className="group flex flex-col justify-between self-stretch bg-[#0c0d0e] p-6 text-[#f2f0ec] transition-colors hover:bg-[#1e1f21]"
          >
            <span className="text-subhead font-semibold leading-snug">
              Discover the portfolios in depth
            </span>
            <span className="mt-6 flex items-end justify-between gap-5">
              <span className="text-caption leading-snug text-[#b9b4ab]">
                Every published account, what it was funded with, and when it
                opened.
              </span>
              <span
                aria-hidden="true"
                className="shrink-0 text-title leading-none transition-transform duration-150 group-hover:translate-y-1"
              >
                &darr;
              </span>
            </span>
          </a>
        )}
      </div>

      <Section
        title="What a portfolio is"
        aside={
          loaded && index ? (
            /* THE REGISTER'S OWN SHAPE, beside the definition of what is in it.
               Every value is read or selected from the published index: a
               count of the books listed below, the earliest inception among
               them, and the threshold the record publishes for withholding an
               annualised figure. Nothing is divided, averaged or derived. */
            <MarginList label="The register">
              <MarginPair
                label="Portfolios"
                value={int(books.length)}
                figure
              />
              <MarginPair
                label="Earliest opened"
                value={
                  books
                    .map((b) => b.inception)
                    .filter(Boolean)
                    .sort()[0]
                    ? date(
                        books
                          .map((b) => b.inception)
                          .filter(Boolean)
                          .sort()[0],
                      )
                    : NO_VALUE
                }
                figure
              />
              <MarginPair
                label="Sessions to annualise"
                value={int(index.min_sessions_for_annualised)}
                figure
              />
            </MarginList>
          ) : undefined
        }
      >
        <p className="text-body text-fg-muted">
          A portfolio is a fixed set of strategies held at target weights and
          traded on its own broker account. The strategies are drawn from the{" "}
          <GatedLink href="/research" available={hasResearch}>
            research
          </GatedLink>{" "}
          catalogue, the set is not re-chosen between sessions, and each
          portfolio&rsquo;s description names the objective it was selected for.
          The real-capital portfolio is a separate two-venue strategy, described
          on its own page.
        </p>
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
        <Section title="The record" wide>
          {/* ONE CHILD OF THE MEASURE, deliberately. The grid sets the rhythm
              between the parts of a section at 1rem; the chart, its legend and
              the qualifications are one part, and their own spacing is set
              inside this wrapper. */}
          <div>
            <OverviewChart series={series} />
            <div className="mt-4">
              <OverviewLegend series={series} />
            </div>

            <p className="mt-6 text-small leading-relaxed text-fg-muted">
              Each line is an account&rsquo;s return since it was funded,
              measured on its own opening capital, so accounts of different
              sizes share one axis.{undrawnNote ? ` ${undrawnNote}` : ""}
              {capitalNote ? ` ${capitalNote}` : ""}
            </p>
          </div>
        </Section>
      )}

      {/* ─── THE INDEX ──────────────────────────────────────────────────────
          THE COLUMN GLOSSARY MOVED ABOVE THE TABLE, and the table out of the
          measure. Seven columns do not reflow: inside a 33rem track the
          register this page exists for would meet every reader as a sideways
          scrollbar. It sits under its own section head at the full width of the
          page instead, and what takes its place in the measure is the paragraph
          saying what each column is. That is the order this page argues for
          everywhere else — the sentence that qualifies a figure is worth
          nothing once the figure has been read. */}
      <Section
        id="portfolios"
        title="The portfolios"
        wide
      >
        {loaded && index ? (
          <p className="text-small leading-relaxed text-fg-muted">
            Return is cumulative since the account was funded and covers a
            different period for each portfolio. Strategies is the number of
            strategies held, by category.
          </p>
        ) : (
          <Note tone="warn">
            The published index could not be read, so no portfolio is listed
            here. Nothing is shown rather than a stale or partial figure.
          </Note>
        )}
      </Section>

      {/* THE REGISTER, at the width of the page rather than of the measure. */}
      {loaded && index && (
        <div className="mt-7">
          <div className="scroll-x">
            <table className="w-full text-small">
              <thead>
                <tr className="text-left text-fg-faint">
                  <Th>Portfolio</Th>
                  <Th>Account</Th>
                  <Th align="right">Funded with</Th>
                  <Th align="right">Opened</Th>
                  <Th align="right">Marked sessions</Th>
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
                        {int(b.marked_sessions)}
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
        </div>
      )}


      {/* ─── THE CAPITAL TWINS ────────────────────────────────────────────
          Rendered only where the payload actually has a pair. The prose is
          guarded on checks against the published composition rather than
          asserting the relationship, so the section cannot go on describing an
          experiment the data has stopped running. */}
      {twins.length > 0 && (
        <Section
          title="Capital twins"
        >
          <p className="text-body text-fg-muted">
            {twins.map(({ twin }) => twin.label).join(" and ")}{" "}
            {twins.length === 1 ? "runs" : "run"} the same strategies and weights
            as {twins.length === 1 ? "its parent" : "their parents"}
            {allTenths ? " at a tenth of the capital" : " at a smaller size"}, to
            measure the effect of account size.
            {laterTwins
              ? ` ${twins.length === 1 ? "It" : "They"} opened later, so ${
                  twins.length === 1 ? "its return covers" : "their returns cover"
                } a shorter period.`
              : ""}
          </p>
        </Section>
      )}

    </div>
  );
}

/**
 * A LIST OF PUBLISHED PAIRS IN THE MARGIN, and nothing else.
 *
 * Every value that reaches it is a string already read out of the payload and
 * formatted. It cannot divide, it cannot total, and it has no tone: the margin
 * is where a page is most tempted to produce the ratio the prose refused to
 * state, so the component that fills it is not able to.
 */
function MarginList({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-label uppercase tracking-[0.14em] text-fg-faint">
        {label}
      </p>
      <dl className="mt-2 border-t hairline">{children}</dl>
    </div>
  );
}

/**
 * One pair, the name ABOVE its value.
 *
 * NOT A TWO-COLUMN ROW. At the `lg` breakpoint itself the margin track is about
 * 140px wide, and a `justify-between` row there fits a book’s name beside its
 * figure only by breaking one of the two across three lines. Stacked, both
 * survive the narrow track and read identically at full width.
 *
 * `figure` asks for tabular digits, which is the site’s treatment for a
 * quantity: the prose face with its figures lined up, never the mono, which is
 * reserved for strings a reader would retype character by character.
 */
function MarginPair({
  label,
  value,
  figure = false,
}: {
  label: string;
  /** Already formatted. A missing value arrives as the absence marker and is
   *  never turned into a zero here. */
  value: string;
  figure?: boolean;
}) {
  return (
    <div className="border-b hairline py-2 last:border-b-0">
      <dt className="min-w-0 break-words text-caption leading-snug text-fg-faint">
        {label}
      </dt>
      <dd
        className={`mt-1 min-w-0 break-words text-small leading-snug text-fg${
          figure ? " tnum" : ""
        }`}
      >
        {value}
      </dd>
    </div>
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
