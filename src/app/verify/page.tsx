import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
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
  type ChainEntry,
} from "@/lib/data";
import { NO_VALUE, date, dateTime, prose, shortHash } from "@/lib/format";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify",
  description:
    "Every published snapshot with its hash, its commit, and its " +
    "OpenTimestamps proof, so a stranger can re-derive every number.",
};

/** How many chain records one page of the register shows.
 *
 *  The table was unpaginated and unfilterable: it rendered every entry in the
 *  current chains, which is 120 rows today and grows by one per book per
 *  session. That is not a table anybody reads — it is a wall that the reader
 *  scrolls past, and until this change the runnable proof was underneath it.
 *  A screenful at a time, newest first, with the whole file one link away. */
const PAGE_SIZE = 30;

/** The `prev_hash` a book's FIRST record carries: sixty-four zeroes. The clone
 *  check below asserts it, the table prints "genesis" in place of it, and the
 *  drawing in the margin finds a book's genesis row by it. Named once so the
 *  three agree by construction. */
const GENESIS_PREV = "0".repeat(64);

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
  const metaOf = new Map(candidates.map((b, i) => [b, metas[i]] as const));

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

  // ─── WHAT THE MARGIN SAYS ───────────────────────────────────────────────
  // Everything below is SELECTED from published fields — the earliest session
  // in the chain, the latest, each book's own published chain head, two records
  // that link. Nothing here is averaged, divided or otherwise derived: the desk
  // publishes quantities, this page picks among them and prints them.
  const sessionDates = chain.map((e) => e.session_date).sort();
  const firstSession = sessionDates[0] ?? null;
  const lastSession = sessionDates.at(-1) ?? null;

  // Each book's head as the book itself publishes it, in the order the filter
  // row uses. The clone check at the foot of the second section ends by
  // printing exactly this map, computed from the files rather than read off
  // them, so the two can be held side by side. A book whose meta cannot be read
  // shows an absence, never a blank and never a zero.
  const heads = ordered.map((book) => ({
    book,
    head: metaOf.get(book)?.chain_head ?? null,
  }));

  // Two REAL records for the drawing: the newest entry whose previous record is
  // itself in the chain, and that previous record. Chosen, not constructed — if
  // no entry links to a visible predecessor (every chain one record long) there
  // is nothing to draw and the margin carries the note alone.
  const byHash = new Map(chain.map((e) => [e.hash, e] as const));
  const linked = entries.find((e) => byHash.has(e.prev_hash)) ?? null;
  const linkedPrev = linked ? byHash.get(linked.prev_hash) ?? null : null;
  // And the drawn book's GENESIS ROW, found rather than typed. Every other
  // value in that figure is read from a ChainEntry, which is the point of it;
  // the sixty-four zeroes were a constant sitting in the component. A book
  // with no such row in the current chain gets no genesis block at all.
  const genesisFor = (book: string) =>
    chain.find((e) => e.book === book && e.prev_hash === GENESIS_PREV) ?? null;

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
      {/* THE PAGE HEAD SITS ON THE SECTION GRID, and is the one block on this
          page allowed a width cap of its own: it is above the first Section, so
          no measure track owns it. The cap is the measure TOKEN rather than a
          hand-counted `ch`, which is the whole point of having one width.

          The title block spans rail and measure; the standing totals land in
          the third track, where every figure on this page lands, so the margin
          reads as one column from the masthead down. */}
      <header className="section-grid">
        <div className="lg:col-span-2 min-w-0">
          <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
            Verify this record
          </h1>
          <p className="mt-3 text-body text-fg-muted leading-relaxed">
            Every marked number on this site comes from a file in a public
            repository. Each file hashes its own content, carries the hash of the
            previous session, and has a third-party timestamp bounding when it
            existed. You do not have to take any of it on trust, and you do not need
            our cooperation to check it. The one exception is the latest broker
            reading in each portfolio&rsquo;s header: it is a current reading of an
            account, not an after-close mark, and it is not chained evidence. The
            page labels it as such and shows the chained figure beneath it.
          </p>
        </div>

        <div className="min-w-0">
          <FigureList label="The record, as published">
            <Fig label="Chained records" value={entries.length} />
            <Fig label="Books" value={booksInChain.length} />
            {/* A withdrawn snapshot is a NEGATIVE fact about the record, which
                is the one thing oxide marks. Rendered only when there is one:
                a "0 withdrawn" row is a claim nobody made. */}
            {supersededCount > 0 && (
              <Fig label="Withdrawn" value={supersededCount} tone="oxide" />
            )}
            <Fig
              label="Published"
              value={index ? dateTime(index.published_at) : NO_VALUE}
            />
          </FigureList>
        </div>
      </header>

      <Section
        first
        title="What the proofs establish"
        gloss="And, just as plainly, what they do not."
        aside={
          <div>
            <p className="text-label uppercase text-fg-faint">
              What each piece rests on
            </p>
            <dl className="mt-2 border-t hairline">
              <Rests on="Hash chain" what="Your clone, and nothing of ours." />
              <Rests on="Timestamps" what="A Bitcoin block, read with ots verify." />
              <Rests
                on="Commit signatures"
                what="GitHub’s badge, until the signer’s key is published."
              />
              <Rests on="Branch ruleset" what="GitHub’s word for it." />
            </dl>
          </div>
        }
      >
        {/* THE TWO CLAIMS CONTRADICT EACH OTHER AND LOOKED IDENTICAL. They sat
            side by side in a two-up grid on grounds of #f7f6f3 and #f6f6f5 —
            two greys no reader can tell apart — so the pair read as one block
            of caveats rather than as a claim and its limit.

            The lead-in of each is now the STEM of its sentence, lifted out of
            the note and set as its own mark. BOTH MARKS ARE SET THE SAME,
            because they are the same rank: what separates the two blocks is
            the warn GROUND under the second note, not a second colour on its
            label. The reserved oxide belongs to a negative fact with a figure
            beside it, where the label carries the colour and the figure stays
            in ink; spent on an eyebrow it would make one heading on this site
            look unlike its own counterpart three lines above. The words are
            unchanged; only where they sit is. */}
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
            This proves
          </p>
          {/* "BY OPEN CODE" WAS AN OVERCLAIM. The metrics module is the firm's
              and is not published anywhere, so a reader cannot read the code
              that produced these numbers. What IS true is stronger than a
              hedge and weaker than the old sentence: the INPUT is published in
              full, every metric is stated with the convention and the rate it
              used, and the definitions are standard — so anyone can recompute
              them from nav.csv with their own code and get the same answers.
              That is the check that matters, and it does not require trusting
              ours. */}
          <Note className="mt-2">
            no published number has been edited in place; no session has been
            removed from a chain without breaking it; and each record existed no
            later than the block its timestamp is anchored in. It also puts every
            metric&rsquo;s input in your hands: the equity curve is published in
            full, and each figure is published with the convention and the
            risk-free rate it used, so you can recompute any of them yourself
            from <Code>nav.csv</Code>.
          </Note>
        </div>

        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
            This does not prove
          </p>
          <Note tone="warn" className="mt-2">
            that the trading was skilful, that a simulated fill would have
            happened in a real market, or that no other book exists unpublished.
            A chain proves no session was dropped <em>from that chain</em>. It
            cannot prove a chain was never restarted, so a restart is declared
            separately below. A timestamp bounds a record from above only: it
            proves the file existed by a given block and says nothing about how
            much earlier. Git history can be rewritten by whoever controls a
            repository. That is exactly why the hash chain, the Bitcoin
            timestamps, the signed commits and the branch ruleset are used
            together rather than relying on any one of them.
          </Note>
        </div>
      </Section>

      {/* ─── THE RUNNABLE PROOF, AT THE TOP ─────────────────────────────────
          This block used to sit at the foot of the four checks, underneath a
          120-row table. It is the only thing on the page that settles the
          question without us — everything else is the firm describing its own
          evidence — and it was the thing a reader was least likely to reach.
          Ordering is an argument: the check comes before the description of the
          check. The four checks below now read as the commentary they are. */}
      <Section
        title="Check it yourself, on a clone"
        gloss="Two commands. Nothing of ours is involved."
        aside={
          /* Nothing to hold up against the command's output if no book
             published a head, so the margin says nothing rather than ruling an
             empty list. */
          heads.length === 0 ? null : (
            <div>
              <p className="text-label uppercase text-fg-faint">
                What the last line prints
              </p>
              <dl className="mt-2 border-t hairline">
                {heads.map(({ book, head }) => (
                  <div
                    key={book}
                    className="flex items-baseline justify-between gap-3 border-b hairline py-1.5"
                  >
                    <dt className="min-w-0 text-caption text-fg-faint">
                      {labelFor(book)}
                    </dt>
                    {/* A hash is a LITERAL: twelve characters a reader compares
                        against their own terminal, so this is one of the few
                        places the mono earns its keep. Twelve, not thirteen: the
                        command slices to twelve and prints no ellipsis, and a
                        figure meant to be compared character by character must
                        not carry a character the other side does not have. */}
                    <dd className="mono min-w-0 break-words text-right text-caption text-fg">
                      {head ? head.slice(0, 12) : NO_VALUE}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-caption leading-relaxed text-fg-muted">
                Each book&rsquo;s chain head, as published in its own{" "}
                <span className="mono">meta.json</span>. The command computes the
                same twelve characters from the files themselves.
              </p>
            </div>
          )
        }
      >
        <p className="text-small text-fg-muted leading-relaxed">
          Two commands, before anything else on this page. The first takes a
          copy of the whole published record. The second re-hashes every file
          the chain lists, compares each hash with the chain&rsquo;s own record
          of it, and follows each book&rsquo;s <Code>prev_hash</Code> back to
          that book&rsquo;s genesis. It needs <Code>git</Code> and{" "}
          <Code>python</Code>, nothing from this site, and no cooperation from
          us.
        </p>
        <pre className="scroll-x bg-bg-subtle border hairline p-3 sm:p-4 text-caption sm:text-small leading-relaxed">
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
        <p className="text-small text-fg-muted leading-relaxed">
          That is checks 1 and 2 below, end to end. It deliberately does not run
          the other two, because neither is ours to run for you: a timestamp is
          checked with <Code>ots verify &lt;file&gt;.ots</Code>, and the fourth
          check is a recomputation from <Code>nav.csv</Code> in whatever code you
          trust.
        </p>
      </Section>

      {/* Declared restarts. Rendered from the books' own published conventions,
          so a future restart cannot go unlisted by anyone forgetting to edit
          this page. */}
      {superseded.length > 0 && (
        <Section
          title="Declared chain restarts"
          gloss="A chain withdrawn, and what replaced it."
          note="A restart is the one thing a chain cannot rule out on its own, so it is declared rather than inferred. The withdrawn record stays published, with its own chain and its own timestamps."
          aside={
            /* THE FOUR NUMBERS, OUT OF THE PARAGRAPH. They were spelled out
               inside the warn note — a count, a total, a date and a snapshot
               count, in a sentence a reader has to parse to compare two books.
               As a figure block they compare at a glance, and the note is free
               to say what the restart MEANS. */
            <div className="space-y-6">
              {superseded.map(({ book, chain: withdrawn }) => {
                const back = backfilledFor(book);
                return (
                  <FigureList key={book} label={labelFor(book)}>
                    {withdrawn.length > 0 && (
                      <Fig
                        label="Withdrawn snapshots"
                        value={withdrawn.length}
                        tone="oxide"
                      />
                    )}
                    <Fig label="Records in the chain" value={back.records} />
                    {/* ONLY WHERE THERE WAS A BACKFILL. This count is not a
                        published field: it is this page comparing each row's
                        recording date against its session date. A book that
                        restarted its chain and backfilled nothing would print
                        "JOINED THE CHAIN LATE 0" — a zero standing where a
                        published figure stands, asserting something no one
                        wrote. Absent is absent. */}
                    {back.late > 0 && (
                      <>
                        <Fig
                          label="Joined the chain late"
                          value={back.late}
                        />
                        {back.onOneDay && (
                          <Fig
                            label="All of them on"
                            value={date(back.onOneDay)}
                          />
                        )}
                      </>
                    )}
                  </FigureList>
                );
              })}
            </div>
          }
        >
          {superseded.map(({ book, meta, chain: withdrawn }) => (
            <Note key={book} tone="warn">
              <strong className="font-semibold">{labelFor(book)}:</strong> this
              book&rsquo;s chain was restarted, and the table below therefore
              shows a genesis entry dated after the record begins. Records that
              joined the chain later than the session they describe each carry
              that recording date in the{" "}
              <strong className="font-medium">Recorded</strong> column below,
              beside the session it covers.{" "}
              {prose(meta?.convention?.superseded_chain)}
              {meta?.convention?.superseded_snapshots ? (
                <> {prose(meta.convention.superseded_snapshots)}</>
              ) : null}{" "}
              {withdrawn.length > 0 ? (
                <>
                  The withdrawn chain&rsquo;s snapshots are counted nowhere in
                  the table below.{" "}
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
          ))}
        </Section>
      )}

      <Section
        title="The four checks"
        gloss="What each one proves, and in which direction."
        note={
          <>
            The first two are what the clone check above runs. The third is a
            stamp beside each file. The fourth is yours to run, on the curve.
          </>
        }
        aside={
          linked && linkedPrev ? (
            <ChainDrawing
              head={linked}
              prev={linkedPrev}
              genesis={genesisFor(linked.book)}
              label={labelFor(linked.book)}
              records={countOf(linked.book)}
            />
          ) : null
        }
      >
        <ol className="space-y-5 sm:space-y-6 text-small leading-relaxed">
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
                removed later without breaking every record after it.
                Publishing only the good days therefore leaves evidence. What it
                does not cover is a chain that was replaced wholesale; where that
                has happened it is declared above, with the withdrawn chain
                published beside the current one.
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
                carefully: a proof bounds a record from <em>above</em>. It
                establishes that the file existed no later than the block it is
                anchored in, and says nothing about how much earlier. A record
                written in a later backfill and stamped once therefore carries a
                proof for the day it was stamped, not for its session date. The{" "}
                <strong className="font-medium">Recorded</strong> column in the
                table below is the chain&rsquo;s own <Code>ts</Code> for each
                entry: the day the record joined the chain. It is printed beside
                its session so the gap is visible rather than assumed to be zero.
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
                module. That module is not itself published, so the check
                available to you is the better one: recompute from the curve. The
                convention is named and the risk-free rate is echoed in{" "}
                <Code>metrics.json</Code>, the definitions are the standard ones,
                and a disagreement is then a fact about the numbers rather than
                about whose code you trust. No metric is computed in your
                browser. This page renders numbers it was handed. The browser does
                scale axes and total a table&rsquo;s own rows, which is drawing,
                not measuring.
              </>
            }
          />
        </ol>
      </Section>

      {/* "EVERY PUBLISHED SNAPSHOT" WAS NOT EVERY PUBLISHED SNAPSHOT. A
          withdrawn chain's records are published too — verbatim, with their own
          timestamps, linked from the block above — and this table deliberately
          does not list them. The heading says which set it is counting, and the
          rest is named underneath rather than left for a reader to find and
          wonder about.

          The totals moved to the page head, where they stand for the record as
          a whole; what is on SCREEN is stated under the table, where a reader
          who has just scrolled a page of rows is looking. A count in the
          heading is a claim about the record, and a filter is a claim about the
          reader: the two were one line apart and easy to confuse. */}
      <Section
        id="snapshots"
        title="Every snapshot in the current chains"
        gloss="The register itself, newest first."
        note="Withdrawn chains are not in this table and never counted into it. Where a book has one, it is declared above and published beside the current chain."
        aside={
          <FigureList label="What the register covers">
            <Fig label="Books" value={booksInChain.length} />
            <Fig label="First session" value={date(firstSession)} />
            <Fig label="Latest session" value={date(lastSession)} />
            {selectedBook && (
              <Fig label="Filtered to" value={labelFor(selectedBook)} />
            )}
          </FigureList>
        }
      >
        {supersededCount > 0 && (
          <p className="text-small text-fg-faint">
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
            chain. They are kept, unrewritten, so the withdrawn record can be
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
            className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-small"
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
          <p className="text-small text-fg-faint">
            No book in the current chains is keyed{" "}
            <code className="tnum">{unknownBook}</code>, so every record is
            shown.
          </p>
        )}

        <div className="scroll-x">
          <table className="w-full sm:min-w-[760px] text-small">
            <thead>
              <tr className="text-caption text-fg-faint">
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
                      <span className="block text-caption text-fg-faint tnum">
                        {e.book}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 tnum text-fg-muted">
                    {shortHash(e.hash)}
                  </td>
                  <td className="hidden sm:table-cell py-2.5 pr-4 tnum text-fg-faint">
                    {e.prev_hash === GENESIS_PREV
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
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 text-small">
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
          <p className="text-small text-fg-muted">No records published yet.</p>
        )}
      </Section>

      <Section
        title="Where everything lives"
        gloss="The repositories, and who answers for them."
        aside={
          <div>
            <FigureList label="Published, and not">
              <Fig
                label="Chain file"
                value={index?.chain?.file ?? NO_VALUE}
                literal
              />
              {/* AN ABSENCE, PRINTED AS ONE. The signer's public key is not
                  published, so this row shows the absence marker rather than a
                  name, a path or a reassuring blank. It is the only figure on
                  this page that is missing, and the page whose subject is
                  evidence is the last place to hide that. */}
              <Fig label="Signer’s key" value={NO_VALUE} />
            </FigureList>
            <p className="mt-2 text-caption leading-relaxed text-fg-muted">
              Until an <span className="mono">allowed_signers</span> file is
              published, commit signatures cannot be checked offline. The chain
              and the timestamps can.
            </p>

            <div className="mt-6 border-t hairline pt-5">
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
              <a
                href={MAINTAINER_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 group"
              >
                <Image
                  src={`${MAINTAINER_AVATAR}&s=160`}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="shrink-0 border hairline"
                />
                <span className="min-w-0">
                  <span className="block text-small font-medium group-hover:underline">
                    @v89ysppdry
                  </span>
                  <span className="block text-caption text-fg-muted">
                    the account this record is published from
                  </span>
                </span>
              </a>
              <div className="mt-4 flex flex-col gap-y-2 text-small">
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
        }
      >
        <p className="text-small text-fg-muted leading-relaxed">
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
          the trading box itself. GitHub Actions is not involved in producing
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
        <p className="text-small text-fg-muted leading-relaxed">
          <strong className="font-medium text-fg">
            A caveat on checking those signatures yourself.
          </strong>{" "}
          The signer&rsquo;s public key is not yet published, so{" "}
          <Code>git log --show-signature</Code> on a clone reports{" "}
          <em>No principal matched</em> rather than a verified signature: it
          can see a signature is present but has nothing to check it against.
          That is a gap in what is published here, not a failed signature.
          Until an <Code>allowed_signers</Code> file is published beside the
          data, the commit signatures rest on GitHub&rsquo;s badge. Once it is
          published,{" "}
          <Code>
            git -c gpg.ssh.allowedSignersFile=allowed_signers log
            --show-signature
          </Code>{" "}
          checks them offline. The hash chain and the Bitcoin timestamps do
          not rest on that badge: those are checkable today, with no key and
          no cooperation from us, which is why they are the first two checks
          above rather than the signature.
        </p>

        <div className="border-t hairline pt-6">
          <h3 className="text-subhead font-semibold tracking-tight">
            Found something wrong?
          </h3>
          <p className="mt-2 text-small text-fg-muted leading-relaxed">
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
            The company behind the publishing account is identified in full on
            the <Link className="text-accent" href="/legal">legal notice</Link>.
          </p>
        </div>
      </Section>
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
      <span className="shrink-0 text-small tnum text-fg-faint pt-1 w-4">
        {n}
      </span>
      <div className="min-w-0">
        {/* An item title inside a list, which is a step on the scale. It was
            `font-medium` at the body's own size, so the four checks read as one
            paragraph with bold bits in it. */}
        <div className="text-body font-medium">{title}</div>
        <p className="mt-1 text-fg-muted">{body}</p>
      </div>
    </li>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-bg-subtle px-1.5 py-0.5 text-small tnum">
      {children}
    </code>
  );
}

/* ─── THE MARGIN ───────────────────────────────────────────────────────────
   Everything below draws the third track. Figures the desk published, ruled
   the way the tables are ruled: a label, a value, a hairline under each row
   and nothing else. No box, no ground, no corner. */

/** A block of figures in the margin, under one mark. */
function FigureList({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-label uppercase text-fg-faint">{label}</p>
      <dl className="mt-2 border-t hairline">{children}</dl>
    </div>
  );
}

/** One published figure. `tone="oxide"` is for a NEGATIVE fact and nothing
 *  else — a withdrawn snapshot, a withheld count — which is the only licence
 *  the reserved colour has, and it lands on the LABEL, never on the figure.
 *  `literal` is for a string a reader would retype: a filename, a hash. Values
 *  arrive formatted; a missing one arrives as the absence marker and is never
 *  turned into a zero here. */
function Fig({
  label,
  value,
  tone,
  literal = false,
}: {
  label: string;
  value: string | number;
  tone?: "oxide";
  literal?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b hairline py-1.5">
      {/* THE LABEL CARRIES THE COLOUR AND THE FIGURE STAYS IN THE PAGE'S OWN
          INK. Stamp.tsx sets the idiom and the reason is not decorative: a
          count drawn in the reserved oxide reads as a warning rather than as a
          number. What is negative here is the thing being counted — withdrawn
          snapshots — not the quantity of them. */}
      <dt
        className={`text-caption ${
          tone === "oxide" ? "text-oxide" : "text-fg-faint"
        }`}
      >
        {label}
      </dt>
      <dd
        className={[
          "min-w-0 break-words text-small tabular-nums text-right text-fg",
          literal ? "mono" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

/** One line of the evidence matrix: a mechanism, and what it asks you to
 *  trust. Stacked rather than columned — at 172px of margin a two-column row
 *  would break "GitHub's badge" across three lines. */
function Rests({ on, what }: { on: string; what: string }) {
  return (
    <div className="border-b hairline py-2">
      <dt className="text-caption font-medium text-fg">{on}</dt>
      <dd className="text-caption leading-snug text-fg-muted">{what}</dd>
    </div>
  );
}

/**
 * THE CHAIN, DRAWN, WITH TWO REAL RECORDS IN IT.
 *
 * The four checks are seventy lines of prose describing a structure that is
 * three boxes and an arrow. This is that structure, and it is not an
 * illustration: the hashes are the two newest records in the published chain
 * that link to each other, so the twelve characters printed as the upper
 * record's `prev_hash` are literally the twelve printed as the lower record's
 * `hash`. A reader can find both rows in the table below and check that they
 * match — which is the whole argument of the page, in a figure that fits in
 * the margin. The genesis line holds to the same rule: it is the book's own
 * first row, passed in, and the block is omitted when there is no such row.
 *
 * Hashes are set in the mono because they are literals to be compared
 * character by character. Nothing else here is.
 */
function ChainDrawing({
  head,
  prev,
  genesis,
  label,
  records,
}: {
  head: ChainEntry;
  prev: ChainEntry;
  /** The drawn book's first record, or null if the current chain holds none. */
  genesis: ChainEntry | null;
  label: string;
  records: number;
}) {
  return (
    <div>
      <p className="text-label uppercase text-fg-faint">
        How one record is held
      </p>
      <div className="mt-2 border hairline">
        <div className="border-b hairline px-3 py-2.5">
          <p className="text-label uppercase text-fg-faint">
            Newest linked record
          </p>
          <p className="mt-1 text-small tabular-nums text-fg">
            {date(head.session_date)} · {label}
          </p>
          <HashLine field="hash" value={shortHash(head.hash)} />
          <HashLine field="prev_hash" value={shortHash(head.prev_hash)} strong />
        </div>
        <p className="border-b hairline px-3 py-1.5 text-caption text-fg-muted">
          ↓ the same twelve characters
        </p>
        <div className="border-b hairline px-3 py-2.5">
          <p className="text-label uppercase text-fg-faint">
            The session before
          </p>
          <p className="mt-1 text-small tabular-nums text-fg">
            {date(prev.session_date)}
          </p>
          <HashLine field="hash" value={shortHash(prev.hash)} strong />
        </div>
        <div className="px-3 py-2.5">
          {genesis && (
            <>
              <p className="text-label uppercase text-fg-faint">
                Genesis of this book
              </p>
              <HashLine
                field="prev_hash"
                value={shortHash(genesis.prev_hash)}
              />
            </>
          )}
          <p
            className={`text-caption text-fg-muted ${genesis ? "mt-1.5" : ""}`}
          >
            <span className="tabular-nums text-fg">{records}</span> records in
            its chain, each holding the one before it.
          </p>
        </div>
      </div>
      <p className="mt-2 text-caption leading-relaxed text-fg-muted">
        Every file also has a <span className="mono">.ots</span> proof beside
        it, which bounds it from above and says nothing about how much earlier
        it was written.
      </p>
    </div>
  );
}

/** A field name and its value, both literals, in the one place on this page
 *  where the monospace is the point: the two `strong` lines are meant to be
 *  compared character by character, and a proportional face would not line
 *  them up. */
function HashLine({
  field,
  value,
  strong = false,
}: {
  field: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <p className="mt-1 flex items-baseline justify-between gap-2 text-caption">
      <span className="mono shrink-0 text-fg-faint">{field}</span>
      {/* `min-w-0 break-words`, because a hash has no space in it to break at.
          The margin track is 296px at full width but only about 140px at the
          `lg` breakpoint itself, and a twelve-character literal that cannot
          wrap would run straight out of the column there. */}
      <span
        className={`mono min-w-0 break-words text-right ${
          strong ? "text-fg" : "text-fg-muted"
        }`}
      >
        {value}
      </span>
    </p>
  );
}
