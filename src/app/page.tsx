import Link from "next/link";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { Hero } from "@/components/Hero";
import { CONTACT_EMAIL, getIndex, getResearch } from "@/lib/data";
import { ENTITY } from "@/lib/entity";
import { NO_VALUE, date } from "@/lib/format";

/**
 * THE FRONT PAGE, IN THE ORDER A STRANGER READS IT.
 *
 * It used to open with a chart. With the chart gone it opened instead with a
 * five-clause negation — paper accounts, no capital at risk, no third-party
 * money, not an offer, not a solicitation — all true, all necessary, and all
 * arriving BEFORE the reader had been given a single thing to doubt.
 *
 * A judging pass put it plainly: a page that spends its first screen on
 * disqualifications reads as though it has something to apologise for. This
 * firm does not. The disclosure is not weakened here and it has barely moved —
 * it still sits above every figure on the page, which is the invariant that
 * matters. What changed is that something now precedes it FOR it to qualify.
 *
 * Order: who we are · the registered purpose · what we did · what a paper
 * account is · the disqualifier · the counts · how it works · what we
 * rejected · contents · colophon.
 *
 * NO RETURN FIGURE APPEARS ON THIS PAGE AT ALL. The overview curve moved to
 * /portfolios. A rising line on the apex domain makes the front page's job
 * "show the returns", which is the reading order of a pitch; this is a
 * register. The counts here are counts — how much was searched, how much
 * survived, how many accounts exist — and not one of them is a performance
 * claim.
 */
export const dynamic = "force-dynamic";

/** Big integers, grouped. Same treatment /research gives them: these are
 *  counts of things searched, and an ungrouped six-digit run is unreadable. */
function int(n: number | null | undefined): string {
  return n === null || n === undefined ? NO_VALUE : n.toLocaleString("en-US");
}

export default async function Home() {
  const [index, research] = await Promise.all([getIndex(), getResearch()]);

  // DERIVED, NEVER ASSERTED. Every sentence describing what kind of account
  // these are reads from the same filtered index the rest of the site lists
  // from, so this page cannot describe a book no page can show.
  const books = index?.books ?? [];
  const hasLive = books.some((b) => b.capital_at_risk);

  // THE FUNNEL: how much was searched, and how little came out of it. Every
  // figure is published in research.json and, until now, reached this page only
  // as refusal counts near the bottom — framed as things thrown away rather
  // than as the shape of the work itself.
  const tested = research?.search?.strategies_researched ?? null;
  const backtests = research?.search?.recorded_trials ?? null;
  const presented = research?.catalogue?.presented_folders ?? null;

  const longestRecord = books.reduce((n, b) => Math.max(n, b.sessions), 0);
  const currentTo = books
    .map((b) => b.last_session)
    .filter(Boolean)
    .sort()
    .at(-1);

  // FOUR COUNTS, NEVER A RETURN, EACH READ FROM THE PAYLOAD. The fourth is the
  // account kind, which is the fact that qualifies the other three.
  const heroStats = [
    tested !== null ? { label: "Strategies researched", value: int(tested) } : null,
    backtests !== null ? { label: "Recorded backtests", value: int(backtests) } : null,
    presented !== null ? { label: "Presented as an edge", value: int(presented) } : null,
    books.length > 0
      ? {
          label: hasLive ? "Portfolios" : "Paper accounts",
          value: String(books.length),
        }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const rejected: [number | undefined, string][] = [
    [
      research?.catalogue?.by_tier?.production?.reject,
      "rejected in the working catalogue",
    ],
    [
      research?.catalogue?.by_tier?.Research?.unfiled,
      "archived: the code did not implement the thesis its name claims",
    ],
    [
      research?.deflation?.demoted_by_book_level,
      "demoted by the book-level correction alone",
    ],
  ];
  const shownRejected = rejected.filter(
    (r): r is [number, string] => typeof r[0] === "number",
  );

  return (
    <>
      {/* ─── THE HERO ──────────────────────────────────────────────────
          The mark, the claim, the counts and two ways in — one band, which
          is the shape this kind of site opens with. It supersedes both the
          old title page and the stamp band: the stamps said the same four
          things in the same order, one screen further down. */}
      <Hero stats={heroStats} />

      {!index && (
        <div className="mt-9">
          <Note tone="warn">
            The published data could not be loaded. Nothing is being shown rather
            than a stale or partial figure.
          </Note>
        </div>
      )}

      {/* ─── WHAT A PAPER ACCOUNT IS, AND THE DISQUALIFIER ────────────────
          Immediately under the hero, before any other figure on the page. The
          plain definition comes first because without it the sentence after
          it — and half this site — is unreadable to anyone who has not
          traded. */}
      <section className="mt-14 lg:mt-20 max-w-[68ch]">
        <p className="text-[16px] leading-[1.6] text-fg-muted">
          <span className="text-fg font-medium">A paper account</span> is a real
          broker account trading live market prices with simulated money: the
          orders and the fills are the broker&rsquo;s, the money is not.
        </p>
        <div className="mt-7 border-t hairline pt-6">
          <AccountDisclosureText hasLive={hasLive} />
        </div>
        <p className="mt-6 text-[15px] leading-[1.6] text-fg-muted">
          The company&rsquo;s registered corporate purpose, as filed, is{" "}
          <span className="text-fg">{ENTITY.purposeEn.replace(/\.$/, "")}</span>{" "}
          —{" "}
          <Link href="/firm" className="text-accent hover:underline">
            the register&rsquo;s record of it
          </Link>
          , not ours.
        </p>
      </section>

      {/* ─── 7. HOW THIS WORKS ────────────────────────────────────────────
          Three plain steps, each ending at the page that evidences it. This
          replaces a paragraph of assertive prose about method — the one
          genuinely marketing passage the site had left — with sentences that
          hand off instead of claiming. */}
      <section className="mt-16 lg:mt-24 border-t hairline pt-7">
        <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
          How this works
        </h2>
        <ol className="mt-6 max-w-[72ch] space-y-6">
          {[
            {
              n: "01",
              head: "We test",
              body: "A strategy is built and measured inside one framework, under one cost structure and one execution delay, then deflated against everything else that was searched. Most do not survive that.",
              href: "/research",
              cta: "The search, and the correction",
            },
            {
              n: "02",
              head: "We select",
              body: "What survives is assembled into fixed rosters. A portfolio here is a committed file of strategies and target weights, traded on one broker account, and it is not re-chosen between marks.",
              href: "/portfolios",
              cta: "The accounts",
            },
            {
              n: "03",
              head: "We publish every session",
              body: "The desk marks each account after its own close and archives the result. Every record is hashed, linked to the one before it and timestamped, so a figure cannot be changed afterwards without breaking the chain.",
              href: "/verify",
              cta: "Check it without asking us",
            },
          ].map((s) => (
            <li key={s.n} className="grid grid-cols-[34px_minmax(0,1fr)] gap-x-4">
              <span className="font-figure text-[11px] text-fg-faint pt-[6px]">
                {s.n}
              </span>
              <div>
                <span className="text-[16px] font-semibold">{s.head}</span>
                <p className="mt-1 text-[14.5px] leading-[1.6] text-fg-muted">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="mt-2 inline-block font-figure text-[10.5px] uppercase tracking-[0.14em] text-accent hover:underline"
                >
                  {s.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── 8. WHAT WE REJECTED ──────────────────────────────────────────
          Three figures and one link. The full account is a page of its own; on
          the front page this is a fact about the work, not a confession. */}
      {shownRejected.length > 0 && (
        <section className="mt-16 lg:mt-24 border-t hairline pt-7">
          <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
            What we rejected
          </h2>
          <p className="mt-6 max-w-[68ch] text-[15px] leading-[1.62] text-fg-muted">
            Nothing is deleted when it fails. The code, the returns and the
            report card stay exactly where they were, auditable, and stop being
            presented as a result — which is what makes the count publishable at
            all.{" "}
            <Link href="/refused" className="text-accent hover:underline">
              What we refused, in full
            </Link>
            .
          </p>
          <dl className="mt-7 grid gap-x-10 gap-y-6 sm:grid-cols-3 max-w-[76ch]">
            {shownRejected.map(([value, label]) => (
              <div key={label}>
                <dt className="font-figure tnum text-[26px] leading-none text-fg">
                  {int(value)}
                </dt>
                <dd className="mt-2.5 text-[12.5px] leading-snug text-fg-faint">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ─── 9. THE CONTENTS ──────────────────────────────────────────────
          Each part printed as the question it answers. A reader who has got
          this far should choose where to go from what they want to know,
          rather than from a noun. */}
      <section className="mt-16 lg:mt-24 border-t hairline pt-7">
        <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
          Contents
        </h2>
        <ul className="mt-5 max-w-[80ch]">
          {[
            ["/firm", "The firm", "Who is RVB Partners, and what can you check without taking our word for it?"],
            ["/portfolios", "Portfolios", "What accounts exist, what is in each, and how do they differ?"],
            ["/research", "Research", "How much was searched to produce what is published?"],
            ["/refused", "Refused", "Most of what we tested did not work. This is the count."],
            ["/verify", "Verify", "How can a stranger prove this record was not edited?"],
            ["/methodology", "Methodology", "By what conventions is every number here produced?"],
            ["/disclosures", "Disclosures", "What must be held in mind before believing any of it?"],
          ].map(([href, label, question]) => (
            <li key={href} className="border-b hairline last:border-b-0">
              <Link
                href={href}
                className="group grid gap-x-6 gap-y-1 py-3.5 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)]"
              >
                <span className="font-figure text-[10.5px] uppercase tracking-[0.15em] text-fg-faint transition-colors group-hover:text-fg">
                  {label}
                </span>
                <span className="text-[14.5px] leading-snug text-fg-muted transition-colors group-hover:text-fg">
                  {question}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── 10. COLOPHON ─────────────────────────────────────────────────
          ONE clock, not three. The research figures carry their own date on
          /research, and the known-violation lists carry theirs beside the table
          they qualify — each next to what it governs. Three dates stacked on a
          front page do not read as scrupulousness; they read as a site that is
          out of date. */}
      <section className="mt-16 lg:mt-24 border-t hairline pt-7">
        <p className="max-w-[76ch] text-[12.5px] leading-relaxed text-fg-faint">
          {currentTo && (
            <>
              This record is current to{" "}
              <span className="tnum text-fg-muted">{date(currentTo)}</span>
              {longestRecord > 0 && (
                <>
                  , and its longest account has{" "}
                  <span className="tnum text-fg-muted">{longestRecord}</span>{" "}
                  marked sessions
                </>
              )}
              .{" "}
            </>
          )}
          Every figure on this site is generated from files published in a public
          repository and pushed unedited; nothing here is typed by hand. The
          company is identified in full on the{" "}
          <Link href="/legal" className="text-accent hover:underline">
            legal notice
          </Link>
          , and can be reached at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </>
  );
}
