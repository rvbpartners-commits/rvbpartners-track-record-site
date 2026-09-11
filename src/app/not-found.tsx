import Link from "next/link";
import { Section } from "@/components/Section";
import { DATA_REPO_URL } from "@/lib/data";

/**
 * THE ADDRESS DID NOT RESOLVE, and that is the only question this page
 * answers. It answers it in the first line; everything under it exists so a
 * reader who arrived at the wrong door does not have to go back to a search
 * engine to find the register.
 *
 * IT FETCHES NOTHING. Two pages on this site are the ones a stranger meets on a
 * bad day, this and `error.tsx`, and a not-found page that needs the data host
 * in order to render is a page that fails in exactly the situation it exists
 * for. Everything below is a constant or a link, so it renders whatever else is
 * down.
 *
 * IT DOES NOT ECHO THE ADDRESS THAT FAILED. A not-found boundary is given no
 * props; recovering the path would mean making this a client component to
 * reprint a string the reader can already see in their address bar. Not worth a
 * bundle, and the sentence reads the same without it.
 *
 * WHY THERE IS A SECOND PARAGRAPH. A reader who mistyped a URL and a reader who
 * followed a link that used to work need different answers, and this page cannot
 * tell which one it is talking to, so it does not guess. It states the one fact
 * that settles the question for both: the record is append-only and it lives in
 * a repository this site merely renders, so anything ever published can be
 * looked up there without our help. That is a general property of how the record
 * is kept. NOTHING HERE ANNOUNCES ANY PARTICULAR PAGE AS WITHDRAWN, and nothing
 * here should ever be edited into one: a 404 is not the place a register
 * discloses its contents, and a sentence about a specific missing page would be
 * a claim with no evidence attached on the one page that carries no data.
 *
 * WHAT IS IN THE MARGIN, AND WHY IT IS NOT MORE. The shared `Section` gives
 * every part of this page a third column for figures, and this page may not
 * fetch one. So the margin carries only what the file itself already knows: how
 * many addresses the index lists, the shape of the one address the index cannot
 * list (a portfolio's own, a level further down), and the three files in the
 * published repository a reader would open first. All of those are constants in
 * this bundle, so the margin renders under exactly the conditions the page
 * exists for. Nothing there is a metric and nothing there is derived: the only
 * number is the length of the list printed beside it.
 *
 * NO OXIDE. The reserved colour marks a fact that DISQUALIFIES a number beside
 * it: paper, withheld, superseded. A mistyped address disqualifies nothing; it
 * is a navigation event. Spending the colour here is how it stops meaning
 * anything on the pages where it does the work.
 *
 * NO `metadata` EXPORT. The document head stays the root layout's. A not-found
 * boundary is rendered in place of a page rather than as one, and the part of
 * this response that machines actually read, the 404 status, is set by the
 * framework, not by a title.
 */

/** The register's contents, in the masthead's order: identity, what is traded,
 *  the denominator those figures are read against, what was thrown away, how to
 *  check any of it, the reference, the standing caveats, then the legal notice.
 *
 *  Each gloss is the page's own description of itself, shortened, not a fresh
 *  characterisation written here, which is how two surfaces end up describing
 *  the same page differently.
 *
 *  `/research` and `/refused` are listed unconditionally. The masthead drops
 *  them while the research summary is unpublished, because a primary navigation
 *  item with nothing behind it is a promise the record cannot keep; this page
 *  cannot make that check without a fetch, and a fetch here is the one thing it
 *  may not do. Both pages state their own absence honestly if it comes to that,
 *  which is the acceptable version of the trade. */
const CONTENTS: { href: string; gloss: string }[] = [
  { href: "/", gloss: "The front page of the register." },
  {
    href: "/firm",
    gloss: "The company publishing it, and the register’s entry for it.",
  },
  { href: "/portfolios", gloss: "Every published portfolio, each at its own address." },
  { href: "/research", gloss: "How much was searched to produce what is published." },
  {
    href: "/refused",
    gloss: "What did not survive, and what this record cannot prove about itself.",
  },
  {
    href: "/verify",
    gloss: "Every snapshot, its hash, and the checks you can run yourself.",
  },
  { href: "/methodology", gloss: "How every published number is produced." },
  { href: "/disclosures", gloss: "The conditions attached to every figure here." },
  {
    href: "/legal",
    gloss: "Company identification, hosting, and the terms this site is published on.",
  },
];

/** The files a reader who leaves this site opens first, named exactly as the
 *  repository names them. These are the same paths this site's own data layer
 *  fetches, so they are literals rather than a description of the layout, and
 *  they are set in the mono for the same reason every other path here is. */
const FIRST_FILES: { path: string; what: string }[] = [
  { path: "index.json", what: "Every published portfolio, and what each one is called in the data." },
  { path: "CHAIN.jsonl", what: "The chain of sessions, each hashed and linked to the one before it." },
  { path: "books/<book>/nav.csv", what: "One portfolio’s equity curve, in full." },
];

export default function NotFound() {
  return (
    <div className="pt-2 lg:pt-6">
      {/* Outside every Section, so the header keeps a width of its own, set
          from the grid rather than from a hand-written cap: the opening
          statement and the prose below it are then one width and not two. */}
      <header>
        <h1 className="text-title">
          This address is not part of the register.
        </h1>
        <p className="mt-5 text-body text-fg-muted">
          Nothing is published at it. Either it named a page this site no longer
          shows, or it was never one of ours (a typo, or an address assembled by
          hand).
        </p>
        <p className="mt-4 text-body text-fg-muted">
          Which of the two it is can be settled without asking us, and that is the
          point of keeping the record the way we do: each session is written once,
          hashed, and chained to the session before it, in a public repository this
          site only renders. A page that stops being shown here does not take its
          published history with it. So if you followed a link that named a
          portfolio, the repository is where to look for it.
        </p>
      </header>

      {/* ─── CONTENTS ──────────────────────────────────────────────────────
          The route is the identifier and carries the link, so it is set in the
          mono; the gloss is us describing it, so it is set in the page's own
          face. That is the inverse of the legal notice's rows, where the label
          is ours and the value is transcribed: same rule, applied to the other
          column.

          The two columns used to be 220px and everything left over, which was
          most of the page. Inside the measure track the label column is sized
          to the longest route instead, so the glosses start where the routes
          end and a route added later moves the column rather than overflowing
          it. */}
      <Section
        title="Contents"
        gloss="Where everything is"
        note={
          <>
            A portfolio has an address of its own, a level further down under{" "}
            <span className="font-figure">/portfolios</span>. Those are not
            listed here: which ones exist is data, and this page reads none.
          </>
        }
        aside={
          <MarginList label="The index">
            {/* The length of the list printed beside it, and nothing else.
                Counting a list's own rows is the one arithmetic the frontend
                does; no figure on this page is derived from another. */}
            <Fig label="Addresses listed" value={CONTENTS.length} />
            <Fig label="A portfolio" value="/portfolios/<name>" literal />
          </MarginList>
        }
      >
        {/* TWO COLUMNS ONLY WHERE TWO COLUMNS FIT. The label track is sized to
            the longest route, but that is a decision about the measure track at
            its full width, not about a phone: at 390px the route eats ~94px and
            the gloss is left about 236px, which sets "Company identification,
            hosting, and the terms this site is published on." as five lines of
            twenty-six characters. Below `sm` the pair stacks instead, the gloss
            pulled up under its own route so the two read as one block. */}
        <dl className="grid gap-y-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-8">
          {CONTENTS.map(({ href, gloss }) => (
            <div key={href} className="contents">
              <dt className="font-figure text-small leading-snug">
                <Link href={href} className="text-accent hover:underline">
                  {href}
                </Link>
              </dt>
              <dd className="-mt-2.5 text-body leading-snug text-fg-muted sm:mt-0">
                {gloss}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ─── THE RECORD ITSELF ─────────────────────────────────────────────
          The way out of the site entirely. A reader who cannot find something
          here should not have to trust that we have shown it to them: the
          published files are the record, this is a rendering of it, and the two
          are reachable independently. The address is set in the mono because it
          is an address, not a phrase, and so are the three file names in the
          margin, for the same reason. */}
      <Section
        title="The record itself"
        gloss="Readable without this site"
        note={
          <>
            Browsable on GitHub, no clone needed. The directories under{" "}
            <span className="font-figure">books/</span> carry the data’s own
            names rather than the labels this site prints, and{" "}
            <span className="font-figure">index.json</span> maps one to the
            other.
          </>
        }
        aside={
          <MarginList label="Where to look first">
            {FIRST_FILES.map(({ path, what }) => (
              <FileRow key={path} path={path} what={what} />
            ))}
          </MarginList>
        }
      >
        <p className="text-body text-fg-muted">
          Every figure, series and snapshot this site draws from is served from a
          public repository. You can read it directly, and check it, without
          going through any page here:
        </p>
        <p>
          <a
            href={DATA_REPO_URL}
            className="font-figure text-small text-accent hover:underline break-all"
            rel="noreferrer noopener"
            target="_blank"
          >
            {DATA_REPO_URL}
          </a>
        </p>
        <p className="text-small leading-relaxed text-fg-faint">
          The checks that run on a clone of it are set out under{" "}
          <Link href="/verify" className="text-accent hover:underline">
            verify
          </Link>
          , along with what each one proves.
        </p>
      </Section>
    </div>
  );
}

/* ─── THE MARGIN ───────────────────────────────────────────────────────────
   The third track, ruled the way every table on this site is ruled: a label, a
   value, a hairline under each row, and nothing else. No box, no ground, no
   corner. Below `lg` these fall under the prose they annotate, which is why
   each block names itself. */

/** A block in the margin, under one mark. */
function MarginList({
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

/** One figure. `literal` is for a string a reader would retype or compare
 *  character by character, which on this page means a path; a quantity keeps
 *  the page's own face and lines its digits up with `tabular-nums`.
 *
 *  A LITERAL DOES NOT SHARE A LINE WITH ITS LABEL. The margin is ~296px at full
 *  width but only about 140px at the `lg` breakpoint itself, and
 *  `/portfolios/<name>` is eighteen characters of mono at `text-small` — about
 *  the whole track on its own. Beside a 62px label and a 12px gap it asks for
 *  ~215px of a 140px column, and mono offers no break opportunity in a path, so
 *  the row simply ran out of the page between 1024px and roughly 1180px. So the
 *  label goes ABOVE it and the value takes the full track, which is the same
 *  arrangement `FileRow` below already makes for the same reason. `break-all`
 *  on top of `min-w-0` is the floor under that: it keeps a longer path inside
 *  the column instead of through its edge. A quantity is two or three digits
 *  and keeps the row. */
function Fig({
  label,
  value,
  literal = false,
}: {
  label: string;
  value: string | number;
  literal?: boolean;
}) {
  if (literal) {
    return (
      <div className="border-b hairline py-1.5">
        <dt className="text-caption text-fg-faint">{label}</dt>
        <dd className="mt-0.5 min-w-0 break-all font-figure text-small text-fg">
          {value}
        </dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-3 border-b hairline py-1.5">
      <dt className="min-w-0 text-caption text-fg-faint">{label}</dt>
      <dd className="min-w-0 text-small tabular-nums text-fg text-right">
        {value}
      </dd>
    </div>
  );
}

/** One published file, and what is in it. Stacked rather than columned: at
 *  296px of margin a two-column row would break the path across three lines,
 *  and a path broken across lines is not a path a reader can retype. */
function FileRow({ path, what }: { path: string; what: string }) {
  return (
    <div className="border-b hairline py-2">
      <dt className="font-figure text-caption text-fg break-all">{path}</dt>
      <dd className="mt-0.5 text-caption leading-snug text-fg-muted">{what}</dd>
    </div>
  );
}
