import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Note } from "@/components/Note";
import {
  DATA_BASE,
  DATA_REPO,
  DATA_REPO_URL,
  MAINTAINER_AVATAR,
  MAINTAINER_URL,
  SITE_REPO_URL,
  getChain,
  getIndex,
  getMeta,
  getSupersededChain,
} from "@/lib/data";
import { date, dateTime, prose, shortHash } from "@/lib/format";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify",
  description:
    "Every published snapshot with its hash, its commit, and its " +
    "OpenTimestamps proof — so a stranger can re-derive every number.",
};

/** How many chain records one page of the register shows.
 *
 *  The table was unpaginated and unfilterable: it rendered every entry in the
 *  current chains, which is 120 rows today and grows by one per book per
 *  session. That is not a table anybody reads — it is a wall that the reader
 *  scrolls past, and until this change the runnable proof was underneath it.
 *  A screenful at a time, newest first, with the whole file one link away. */
const PAGE_SIZE = 30;

/** The directory `git clone` creates, derived rather than typed.
 *
 *  The snippet below tells a reader to `cd` into it. Written out as a literal
 *  it was a second copy of the repository name — and the site's own address has
 *  already moved once, which is exactly how a copy goes stale while the thing
 *  it copies does not. One source, one string. */
const CLONE_DIR = DATA_REPO.split("/")[1];

/** A search param, as a single value. A repeated key (`?book=a&book=b`) arrives
 *  as an array; the first is taken rather than the pair being joined into a
 *  string that matches no book. */
function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [index, chain, params] = await Promise.all([
    getIndex(),
    getChain(),
    searchParams,
  ]);
  const entries = [...chain].reverse();

  // The verify table names books by their DATA SLUG (`best_cagr`), which is the
  // one identifier that appears nowhere else on the site — the labels exist
  // precisely to keep the selection criterion out of the reader's way. The map
  // between them lives only in index.json, so a reader checking a row against
  // the portfolio page they came from had to go and find it. Both are printed.
  const labelOf = new Map(
    (index?.books ?? []).map((b) => [b.book, b.label] as const),
  );
  const labelFor = (book: string) => labelOf.get(book) ?? book;

  // A restarted chain is DATA, not prose: a book whose published conventions
  // name a superseded chain has had its earlier record withdrawn and replaced,
  // and the "no session has been quietly dropped" claim below has to carve that
  // out by name. Read from each book's own meta rather than inferred from a
  // genesis date — a book that simply started later also has a late genesis,
  // and guessing from that would flag every capital twin.
  //
  // THE CANDIDATE LIST IS THE RECORD, NOT THE SHOP WINDOW. This used to iterate
  // `index.books`, which the data layer has already filtered — a book withheld
  // from the site is dropped there before this page ever sees it. That made a
  // published CORRECTION disappear as a side effect of withholding a RESULT,
  // which are not the same decision and must not share a switch: a chain
  // restart is the one thing on this page a reader most needs told, and the
  // withdrawn record stays published in the data repository either way.
  // Unioning in every book the chain itself evidences means a book still
  // present in the current chains keeps its declared restart on this page even
  // when it is withheld elsewhere. It does NOT close the hole for a book that
  // has no current-chain rows at all — that needs the unfiltered index, which
  // only lib/data.ts can hand over. Reported, not worked around here.
  const candidates = [
    ...new Set([
      ...(index?.books ?? []).map((b) => b.book),
      ...chain.map((e) => e.book),
    ]),
  ];
  const metas = await Promise.all(candidates.map((b) => getMeta(b)));

  // THE WITHDRAWN CHAINS ARE PUBLISHED TOO, and the table below does not list
  // them — it lists the CURRENT chains. A heading reading "every published
  // snapshot · N records" over that table is off by however many the withdrawn
  // chains hold, which is exactly the kind of miscount this page exists to make
  // impossible. Counted from the withdrawn chain files themselves; a file that
  // cannot be read contributes nothing and the page says less rather than
  // guessing.
  const superseded = await Promise.all(
    candidates
      .map((book, i) => ({ book, meta: metas[i] }))
      .filter(({ meta }) => meta?.convention?.superseded_chain)
      .map(async (entry) => ({
        ...entry,
        chain: await getSupersededChain(entry.book),
      })),
  );
  const supersededCount = superseded.reduce((n, s) => n + s.chain.length, 0);

  // Which records were written later than the sessions they describe. The chain
  // publishes it per entry and the table prints the column; these counts let
  // the page say it in words where the restart is declared, instead of leaving
  // a reader to notice a genesis entry dated after the record begins.
  const backfilledFor = (book: string) => {
    const rows = chain.filter((e) => e.book === book);
    const late = rows.filter((e) => e.ts.slice(0, 10) !== e.session_date);
    const days = new Set(late.map((e) => e.ts.slice(0, 10)));
    return {
      records: rows.length,
      late: late.length,
      onOneDay: days.size === 1 ? [...days][0] : null,
    };
  };

  // ─── THE REGISTER'S FILTER AND PAGE, FROM THE URL ──────────────────────
  // Search params rather than client state, deliberately: the table is the
  // evidence, and evidence that only exists once JavaScript has run is worse
  // evidence. Every control below is a link, the server renders the right rows
  // on the first response, and a filtered view is a URL somebody can cite.
  //
  // The book list comes from the CHAIN, not from the index: the table renders
  // chain rows, so a book with rows here but no entry in the published index
  // must still be filterable rather than silently unreachable.
  const booksInChain = [...new Set(chain.map((e) => e.book))];
  const countOf = (book: string) => chain.filter((e) => e.book === book).length;
  const ordered = [
    ...(index?.books ?? []).map((b) => b.book).filter((b) => booksInChain.includes(b)),
    ...booksInChain.filter((b) => !labelOf.has(b)).sort(),
  ];

  const askedBook = one(params.book);
  // An unrecognised `?book=` shows everything and SAYS so. Silently ignoring it
  // would hand a reader a complete table under a caption implying it was
  // narrowed — the one failure mode a filter on a register must not have.
  const selectedBook =
    askedBook && booksInChain.includes(askedBook) ? askedBook : null;
  const unknownBook = askedBook && !selectedBook ? askedBook : null;

  const filtered = selectedBook
    ? entries.filter((e) => e.book === selectedBook)
    : entries;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const askedPage = Number.parseInt(one(params.page) ?? "", 10);
  // Clamped, never trusted. `?page=900` is a page that does not exist, and an
  // empty table under a "records 27001–27030" caption reads as a record with
  // holes in it rather than as a bad URL.
  const page = Number.isFinite(askedPage)
    ? Math.min(Math.max(askedPage, 1), pageCount)
    : 1;
  const start = (page - 1) * PAGE_SIZE;
  const shown = filtered.slice(start, start + PAGE_SIZE);

  /** A link back into this same table. `#snapshots` because the controls sit
   *  beside the table and a reader who pages should land on rows, not on the
   *  top of the page. `page=1` and the empty book are omitted so the unfiltered
   *  view has exactly one address. */
  const href = (next: { book?: string | null; page?: number }) => {
    const book = next.book === undefined ? selectedBook : next.book;
    const target = next.page ?? 1;
    const query = new URLSearchParams();
    if (book) query.set("book", book);
    if (target > 1) query.set("page", String(target));
    const q = query.toString();
    return `/verify${q ? `?${q}` : ""}#snapshots`;
  };

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Verify this record
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          Every marked number on this site comes from a file in a public
          repository. Each file hashes its own content, carries the hash of the
          previous session, and has a third-party timestamp bounding when it
          existed. You do not have to take any of it on trust, and you do not need
          our cooperation to check it. The one exception is the latest broker
          reading in each portfolio&rsquo;s header: it is a current reading of an
          account, not an after-close mark, and it is not chained evidence — the
          page labels it as such and shows the chained figure beneath it.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight">
          What the proofs do and do not establish
        </h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* "BY OPEN CODE" WAS AN OVERCLAIM. The metrics module is the firm's
              and is not published anywhere, so a reader cannot read the code
              that produced these numbers. What IS true is stronger than a
              hedge and weaker than the old sentence: the INPUT is published in
              full, every metric is stated with the convention and the rate it
              used, and the definitions are standard — so anyone can recompute
              them from nav.csv with their own code and get the same answers.
              That is the check that matters, and it does not require trusting
              ours. */}
          <Note>
            <strong className="font-semibold text-fg">This proves:</strong> no
            published number has been edited in place; no session has been removed
            from a chain without breaking it; and each record existed no later
            than the block its timestamp is anchored in. It also puts every
            metric&rsquo;s input in your hands: the equity curve is published in
            full, and each figure is published with the convention and the
            risk-free rate it used, so you can recompute any of them yourself
            from <Code>nav.csv</Code>.
          </Note>
          <Note tone="warn">
            <strong className="font-semibold">This does not prove:</strong> that
            the trading was skilful, that a simulated fill would have happened in
            a real market, or that no other book exists unpublished. A chain
            proves no session was dropped <em>from that chain</em> — it cannot
            prove a chain was never restarted, so a restart is declared
            separately below. A timestamp bounds a record from above only: it
            proves the file existed by a given block and says nothing about how
            much earlier. Git history can be rewritten by whoever controls a
            repository — which is exactly why the hash chain, the Bitcoin
            timestamps, the signed commits and the branch ruleset are used
            together rather than relying on any one of them.
          </Note>
        </div>
      </section>

      {/* ─── THE RUNNABLE PROOF, AT THE TOP ─────────────────────────────────
          This block used to sit at the foot of the four checks, underneath a
          120-row table. It is the only thing on the page that settles the
          question without us — everything else is the firm describing its own
          evidence — and it was the thing a reader was least likely to reach.
          Ordering is an argument: the check comes before the description of the
          check. The four checks below now read as the commentary they are. */}
      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Check it yourself, on a clone
        </h2>
        <p className="mt-3 text-[13px] text-fg-muted leading-relaxed max-w-[80ch]">
          Two commands, before anything else on this page. The first takes a
          copy of the whole published record. The second re-hashes every file
          the chain lists, compares each hash with the chain&rsquo;s own record
          of it, and follows each book&rsquo;s <Code>prev_hash</Code> back to
          that book&rsquo;s genesis. It needs <Code>git</Code> and{" "}
          <Code>python</Code>, nothing from this site, and no cooperation from
          us.
        </p>
        <pre className="scroll-x mt-4 bg-bg-subtle border hairline p-3 sm:p-4 text-[11px] sm:text-[12px] leading-relaxed">
          <code>{`git clone ${DATA_REPO_URL}.git
cd ${CLONE_DIR}
python -c "
import json,hashlib,pathlib
prev={}
for line in open('CHAIN.jsonl',encoding='utf-8'):
    e=json.loads(line); p=pathlib.Path(e['file']); raw=p.read_bytes()
    assert hashlib.sha256(raw).hexdigest()==e['sha256'], p
    rec=json.loads(raw.decode())
    assert rec['prev_hash']==prev.get(e['book'],'0'*64), p
    prev[e['book']]=rec['hash']
print('chain ok:', {k:v[:12] for k,v in prev.items()})
"`}</code>
        </pre>
        <p className="mt-3 text-[13px] text-fg-muted leading-relaxed max-w-[80ch]">
          That is checks 1 and 2 below, end to end. It deliberately does not run
          the other two, because neither is ours to run for you: a timestamp is
          checked with <Code>ots verify &lt;file&gt;.ots</Code>, and the fourth
          check is a recomputation from <Code>nav.csv</Code> in whatever code you
          trust.
        </p>
      </section>

      {/* Declared restarts. Rendered from the books' own published conventions,
          so a future restart cannot go unlisted by anyone forgetting to edit
          this page. */}
      {superseded.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[15px] font-semibold tracking-tight">
            Declared chain restarts
          </h2>
          <div className="mt-4 space-y-4 max-w-[80ch]">
            {superseded.map(({ book, meta, chain: withdrawn }) => {
              const back = backfilledFor(book);
              return (
              <Note key={book} tone="warn">
                <strong className="font-semibold">{labelFor(book)}</strong> —
                this book&rsquo;s chain was restarted, and the table below
                therefore shows a genesis entry dated after the record begins.{" "}
                {/* STATE THE COUNT WHERE THE RESTART IS DECLARED. The raw
                    Recorded column already says it, entry by entry; saying it
                    in words costs nothing and pre-empts the single most
                    damaging inference a sceptic can draw from a batch of
                    records sharing one recording date. */}
                {back.late > 0 ? (
                  <>
                    <strong className="font-semibold">
                      {back.late} of this book&rsquo;s {back.records} records
                      joined the chain
                      {back.onOneDay ? ` on ${date(back.onOneDay)}` : " later"}
                      {back.late === back.records - 1
                        ? "; only the last was recorded on its own day"
                        : ""}
                      .
                    </strong>{" "}
                    Every one of them carries that recording date in the{" "}
                    <strong className="font-medium">Recorded</strong> column
                    below, beside the session it covers.{" "}
                  </>
                ) : null}
                {prose(meta?.convention?.superseded_chain)}
                {meta?.convention?.superseded_snapshots ? (
                  <>
                    {" "}
                    {prose(meta.convention.superseded_snapshots)}
                  </>
                ) : null}{" "}
                {withdrawn.length > 0 ? (
                  <>
                    It holds {withdrawn.length} snapshots, none of them counted
                    in the table below.{" "}
                  </>
                ) : null}
                The withdrawn record is published verbatim, with its own chain and
                its own timestamps, and verifies independently back to its own
                genesis:{" "}
                <a
                  className="underline underline-offset-2"
                  href={`${DATA_REPO_URL}/tree/main/books/${book}/superseded`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  books/{book}/superseded/
                </a>
                .
              </Note>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight">
          The four checks
        </h2>
        <ol className="mt-5 space-y-5 sm:space-y-6 text-[13px] leading-relaxed max-w-[80ch]">
          <Check
            n={1}
            title="Each record hashes its own content"
            body={
              <>
                Every snapshot carries a <Code>hash</Code>: the SHA-256 of its
                canonical JSON with the <Code>hash</Code> field removed. Change
                any published number and it stops matching.
              </>
            }
          />
          <Check
            n={2}
            title="The records are chained"
            body={
              <>
                Each snapshot&rsquo;s <Code>prev_hash</Code> is the previous
                session&rsquo;s <Code>hash</Code>. This is what a timestamp alone
                cannot give you: a timestamp proves a file existed, but says
                nothing about whether the series is <em>complete</em>. Because
                each session commits to the one before it, a day cannot be
                removed later without breaking every record after it — so
                publishing only the good days leaves evidence. What it does not
                cover is a chain that was replaced wholesale; where that has
                happened it is declared above, with the withdrawn chain published
                beside the current one.
              </>
            }
          />
          <Check
            n={3}
            title="A record cannot have been written later than its proof"
            body={
              <>
                Each snapshot has an OpenTimestamps proof beside it, anchored in
                the Bitcoin blockchain. Run{" "}
                <Code>ots verify &lt;file&gt;.ots</Code>. Read the direction
                carefully: a proof bounds a record from <em>above</em> — it
                establishes that the file existed no later than the block it is
                anchored in, and says nothing about how much earlier. A record
                written in a later backfill and stamped once therefore carries a
                proof for the day it was stamped, not for its session date. The{" "}
                <strong className="font-medium">Recorded</strong> column in the
                table below is the chain&rsquo;s own <Code>ts</Code> for each
                entry — the day the record joined the chain — printed beside its
                session so the gap is visible rather than assumed to be zero.
              </>
            }
          />
          <Check
            n={4}
            title="The numbers follow from the inputs"
            body={
              <>
                <Code>nav.csv</Code> is the whole equity curve. Every metric is
                computed from it by one function in the firm&rsquo;s metrics
                module — which is not itself published, so the check available
                to you is the better one: recompute from the curve. The
                convention is named and the risk-free rate is echoed in{" "}
                <Code>metrics.json</Code>, the definitions are the standard ones,
                and a disagreement is then a fact about the numbers rather than
                about whose code you trust. No metric is computed in your browser
                — this page renders numbers it was handed. The browser does scale
                axes and total a table&rsquo;s own rows, which is drawing, not
                measuring.
              </>
            }
          />
        </ol>
      </section>

      <section id="snapshots" className="mt-14 scroll-mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {/* "EVERY PUBLISHED SNAPSHOT" WAS NOT EVERY PUBLISHED SNAPSHOT. A
              withdrawn chain's records are published too — verbatim, with
              their own timestamps, linked from the block above — and this table
              deliberately does not list them. The heading now says which set it
              is counting, and the rest is named underneath rather than left for
              a reader to find and wonder about.

              The count stays the count of the WHOLE current chains, never the
              count of the filtered page: the heading is a claim about the
              record, and a filter is a claim about the reader. What is on
              screen is stated separately, under the table. */}
          <h2 className="text-[15px] font-semibold tracking-tight">
            Every snapshot in the current chains
          </h2>
          <span className="text-[12px] text-fg-faint">
            {entries.length} records
            {index ? ` · published ${dateTime(index.published_at)}` : ""}
          </span>
        </div>

        {supersededCount > 0 && (
          <p className="mt-3 text-[12px] text-fg-faint max-w-[80ch]">
            {supersededCount} further snapshot
            {supersededCount === 1 ? " is" : "s are"} published in the superseded
            chain
            {superseded.length === 1 ? "" : "s"} declared above, listed at{" "}
            {superseded.map(({ book }, i) => (
              <span key={book}>
                {i > 0 ? ", " : ""}
                <a
                  className="text-accent hover:underline"
                  href={`${DATA_REPO_URL}/tree/main/books/${book}/superseded`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <code>books/{book}/superseded/</code>
                </a>
              </span>
            ))}
            . They are not counted here because they are not part of a current
            chain — they are kept, unrewritten, so the withdrawn record can be
            verified as easily as this one.
          </p>
        )}

        {/* THE FILTER IS A ROW OF LINKS, NOT A SELECT. No JavaScript is involved
            in narrowing this table: each entry is an href the server answers
            with the rows themselves, so the view is citable, back-buttonable and
            works with scripting off — which is the only posture that makes sense
            on the page whose argument is that you need nothing from us. */}
        {booksInChain.length > 1 && (
          <nav
            aria-label="Filter snapshots by portfolio"
            className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[12px]"
          >
            <span className="text-fg-faint">Book</span>
            <FilterLink href={href({ book: null })} active={selectedBook === null}>
              All <span className="tnum text-fg-faint">{entries.length}</span>
            </FilterLink>
            {ordered.map((book) => (
              <FilterLink
                key={book}
                href={href({ book })}
                active={selectedBook === book}
              >
                {labelFor(book)}{" "}
                <span className="tnum text-fg-faint">{countOf(book)}</span>
              </FilterLink>
            ))}
          </nav>
        )}

        {unknownBook && (
          <p className="mt-3 text-[12px] text-fg-faint max-w-[80ch]">
            No book in the current chains is keyed{" "}
            <code className="tnum">{unknownBook}</code>, so every record is
            shown.
          </p>
        )}

        <div className="scroll-x mt-5">
          <table className="w-full sm:min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-[11px] text-fg-faint">
                <th className="text-left font-normal pb-3">Session</th>
                {/* When the record entered the chain. A backfilled record shows
                    a date well after its session, which is the one thing an
                    OpenTimestamps proof cannot tell a reader on its own. */}
                <th className="hidden sm:table-cell text-left font-normal pb-3">Recorded</th>
                <th className="hidden sm:table-cell text-left font-normal pb-3">Book</th>
                <th className="text-left font-normal pb-3">Record hash</th>
                <th className="hidden sm:table-cell text-left font-normal pb-3">Chains to</th>
                <th className="text-right font-normal pb-3">Files</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={`${e.book}:${e.session_date}`} className="border-t hairline">
                  <td className="py-2.5 pr-4 tnum whitespace-nowrap">
                    {date(e.session_date)}
                  </td>
                  <td className="hidden sm:table-cell py-2.5 pr-4 tnum text-fg-faint whitespace-nowrap">
                    {date(e.ts)}
                  </td>
                  {/* The label a reader has actually seen, above the data slug
                      the file is keyed by. Without the label this column was
                      the only place on the site where a book is named
                      `best_cagr`, and the map back lives in index.json. */}
                  <td className="hidden sm:table-cell py-2.5 pr-4 text-fg-muted">
                    {labelFor(e.book)}
                    {labelOf.has(e.book) && (
                      <span className="block text-[11px] text-fg-faint tnum">
                        {e.book}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 tnum text-fg-muted">
                    {shortHash(e.hash)}
                  </td>
                  <td className="hidden sm:table-cell py-2.5 pr-4 tnum text-fg-faint">
                    {e.prev_hash === "0".repeat(64)
                      ? "genesis"
                      : shortHash(e.prev_hash)}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_BASE}/${e.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      JSON
                    </a>
                    <span className="text-fg-faint px-1.5">·</span>
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_BASE}/${e.file}.ots`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      .ots
                    </a>
                    <span className="text-fg-faint px-1.5">·</span>
                    <a
                      className="text-accent hover:underline"
                      href={`${DATA_REPO_URL}/commits/main/${e.file}`}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      commits
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WHAT IS ON SCREEN, COUNTED, beside what exists. A paginated register
            that does not say which slice you are looking at is a register you
            cannot cite, and the reader's next question — "where is the rest?" —
            is answered with the file rather than with more pages. */}
        {filtered.length > 0 && (
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-[12px]">
            <span className="text-fg-faint">
              Records{" "}
              <span className="tnum text-fg-muted">
                {start + 1}&ndash;{start + shown.length}
              </span>{" "}
              of <span className="tnum text-fg-muted">{filtered.length}</span>
              {selectedBook ? ` for ${labelFor(selectedBook)}` : ""}
              {" · "}
              the complete list is{" "}
              <a
                className="text-accent hover:underline"
                href={`${DATA_REPO_URL}/blob/main/${index?.chain?.file ?? "CHAIN.jsonl"}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <code>{index?.chain?.file ?? "CHAIN.jsonl"}</code>
              </a>
              , one line per record.
            </span>

            {pageCount > 1 && (
              <nav
                aria-label="Snapshot register pages"
                className="flex items-baseline gap-4"
              >
                {page > 1 ? (
                  <Link
                    className="text-accent hover:underline"
                    href={href({ page: page - 1 })}
                    rel="prev"
                  >
                    ← Newer
                  </Link>
                ) : (
                  <span className="text-fg-faint">← Newer</span>
                )}
                <span className="text-fg-faint">
                  Page <span className="tnum">{page}</span> of{" "}
                  <span className="tnum">{pageCount}</span>
                </span>
                {page < pageCount ? (
                  <Link
                    className="text-accent hover:underline"
                    href={href({ page: page + 1 })}
                    rel="next"
                  >
                    Older →
                  </Link>
                ) : (
                  <span className="text-fg-faint">Older →</span>
                )}
              </nav>
            )}
          </div>
        )}

        {entries.length === 0 && (
          <p className="mt-4 text-[13px] text-fg-muted">
            No records published yet.
          </p>
        )}
      </section>

      <section className="mt-14 grid lg:grid-cols-[190px_1fr] gap-x-10 gap-y-4 border-t hairline pt-8">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Where everything lives
        </h2>
        <div className="max-w-[74ch]">
          <p className="text-[13px] text-fg-muted leading-relaxed">
            The data is in{" "}
            <a className="text-accent hover:underline" href={DATA_REPO_URL}
               target="_blank" rel="noreferrer noopener">
              {DATA_REPO_URL.replace("https://github.com/", "")}
            </a>{" "}
            and this site is in{" "}
            <a className="text-accent hover:underline" href={SITE_REPO_URL}
               target="_blank" rel="noreferrer noopener">
              {SITE_REPO_URL.replace("https://github.com/", "")}
            </a>
            . Both are public. Their <Code>main</Code> branches carry a ruleset
            that blocks force-pushes and deletions, requires linear history, and
            requires every commit to be signed, so the append-only history cannot
            be rewritten without leaving a trace. Each publish commit is signed
            with an SSH key and GitHub shows it as Verified. Publication runs on
            the trading box itself — GitHub Actions is not involved in producing
            this data and holds no broker credential.
          </p>

          {/* THE COMMAND WE GAVE DOES NOT DO WHAT THE SENTENCE SAID. `git log
              --show-signature` on a fresh clone reports these commits as made
              by an UNTRUSTED key, because verifying an SSH signature needs an
              allowed-signers file naming the key, and no such file is
              published. A reader who ran the command got a worse impression
              than the truth, on the page whose entire purpose is to be checked
              — and was left with GitHub's badge, which is the thing this page
              exists to avoid depending on. Stated plainly, with the command
              that will work once the key is published. */}
          <p className="mt-3 text-[13px] text-fg-muted leading-relaxed">
            <strong className="font-medium text-fg">
              A caveat on checking those signatures yourself.
            </strong>{" "}
            The signer&rsquo;s public key is not yet published, so{" "}
            <Code>git log --show-signature</Code> on a clone reports{" "}
            <em>No principal matched</em> rather than a verified signature: it
            can see a signature is present but has nothing to check it against.
            That is a gap in what is published here, not a failed signature.
            Until an <Code>allowed_signers</Code> file is published beside the
            data — at which point{" "}
            <Code>
              git -c gpg.ssh.allowedSignersFile=allowed_signers log
              --show-signature
            </Code>{" "}
            checks it offline — the commit signatures rest on GitHub&rsquo;s
            badge. The hash chain and the Bitcoin timestamps do not: those are
            checkable today, with no key and no cooperation from us, which is
            why they are the first two checks above rather than the signature.
          </p>

          <div className="mt-6 border-t hairline pt-5">
            <h3 className="text-[13px] font-semibold tracking-tight">
              Found something wrong?
            </h3>
            <p className="mt-2 text-[13px] text-fg-muted leading-relaxed">
              If a check fails, a number does not reconcile, or something here is
              unclear, please say so. Open an issue on either repository and tag{" "}
              <a className="text-accent hover:underline" href={MAINTAINER_URL}
                 target="_blank" rel="noreferrer noopener">
                @v89ysppdry
              </a>
              , or write to{" "}
              <a className="text-accent hover:underline"
                 href="mailto:contact@rvbpartners.fr">
                contact@rvbpartners.fr
              </a>
              . A track record nobody can question is not one worth publishing.
            </p>
            <a
              href={MAINTAINER_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 inline-flex items-center gap-3 group"
            >
              <Image
                src={`${MAINTAINER_AVATAR}&s=160`}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="rounded-full shrink-0"
              />
              {/* THE ACCOUNTABLE PARTY IS THE COMPANY. This block used to
                  define "the operator" as an individual who ran the desk and
                  owned the capital in a real-capital book — a role no register
                  records, invented to explain a handle. RVB Partners is a
                  registered company with named officers (/legal), and it is the
                  company that publishes this record and answers for it.

                  The handle stays because it is genuinely useful: it is the
                  account that pushes these commits, so a reader checking the
                  repository history meets it and should be able to place it. It
                  is now labelled as what it is — the publishing account — not
                  as a person standing behind the firm. */}
              <span className="min-w-0">
                <span className="block text-[13px] font-medium group-hover:underline">
                  @v89ysppdry
                </span>
                <span className="block text-[12px] text-fg-muted">
                  the account this record is published from. The company behind
                  it is identified in full on the{" "}
                  <span className="underline underline-offset-2">legal notice</span>.
                </span>
              </span>
            </a>

            <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-5 gap-y-2 text-[13px]">
              <a className="text-accent hover:underline"
                 href={`${DATA_REPO_URL}/issues/new`}
                 target="_blank" rel="noreferrer noopener">
                Open an issue on the data
              </a>
              <a className="text-accent hover:underline"
                 href={`${SITE_REPO_URL}/issues/new`}
                 target="_blank" rel="noreferrer noopener">
                Open an issue on the site
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** One book in the filter row.
 *
 *  The selected entry stays a link rather than becoming inert text: clicking it
 *  from page 3 of a filtered view is how a reader gets back to the top of that
 *  book, and an `aria-current` says which one is showing without relying on the
 *  colour to carry it. */
function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "text-fg border-b border-accent pb-0.5"
          : "text-accent hover:underline"
      }
    >
      {children}
    </Link>
  );
}

function Check({
  n,
  title,
  body,
}: {
  n: number;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0 text-[12px] tnum text-fg-faint pt-0.5 w-4">
        {n}
      </span>
      <div>
        <div className="font-medium">{title}</div>
        <p className="mt-1 text-fg-muted">{body}</p>
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-bg-subtle px-1.5 py-0.5 text-[12px] tnum">
      {children}
    </code>
  );
}
