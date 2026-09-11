import Link from "next/link";
import { DATA_REPO_URL } from "@/lib/data";

/**
 * THE ADDRESS DID NOT RESOLVE — and that is the only question this page
 * answers. It answers it in the first line; everything under it exists so a
 * reader who arrived at the wrong door does not have to go back to a search
 * engine to find the register.
 *
 * IT FETCHES NOTHING. Two pages on this site are the ones a stranger meets on a
 * bad day — this and `error.tsx` — and a not-found page that needs the data host
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
 * tell which one it is talking to — so it does not guess. It states the one fact
 * that settles the question for both: the record is append-only and it lives in
 * a repository this site merely renders, so anything ever published can be
 * looked up there without our help. That is a general property of how the record
 * is kept. NOTHING HERE ANNOUNCES ANY PARTICULAR PAGE AS WITHDRAWN, and nothing
 * here should ever be edited into one — a 404 is not the place a register
 * discloses its contents, and a sentence about a specific missing page would be
 * a claim with no evidence attached on the one page that carries no data.
 *
 * NO OXIDE. The reserved colour marks a fact that DISQUALIFIES a number beside
 * it — paper, withheld, superseded. A mistyped address disqualifies nothing; it
 * is a navigation event. Spending the colour here is how it stops meaning
 * anything on the pages where it does the work.
 *
 * NO `metadata` EXPORT. The document head stays the root layout's. A not-found
 * boundary is rendered in place of a page rather than as one, and the part of
 * this response that machines actually read — the 404 status — is set by the
 * framework, not by a title.
 */

/** The register's contents, in the masthead's order: identity, what is traded,
 *  the denominator those figures are read against, what was thrown away, how to
 *  check any of it, the reference, the standing caveats, then the legal notice.
 *
 *  Each gloss is the page's own description of itself, shortened — not a fresh
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

export default function NotFound() {
  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="max-w-[26ch] text-title sm:text-title">
        This address is not part of the register.
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        Nothing is published at it. Either it named a page this site no longer
        shows, or it was never one of ours (a typo, or an address assembled by
        hand).
      </p>
      <p className="mt-4 max-w-[68ch] text-body text-fg-muted">
        Which of the two it is can be settled without asking us, and that is the
        point of keeping the record the way we do: each session is written once,
        hashed, and chained to the session before it, in a public repository this
        site only renders. A page that stops being shown here does not take its
        published history with it. So if you followed a link that named a
        portfolio, the repository is where to look for it.
      </p>

      {/* ─── CONTENTS ──────────────────────────────────────────────────────
          The route is the identifier and carries the link, so it is set in the
          mono; the gloss is us describing it, so it is set in the serif. That
          is the inverse of the legal notice's rows, where the label is ours and
          the value is transcribed — same rule, applied to the other column. */}
      <Section title="Contents" gloss="Where everything is">
        <dl className="grid gap-y-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-x-10">
          {CONTENTS.map(({ href, gloss }) => (
            <div key={href} className="contents">
              <dt className="font-figure text-small leading-snug sm:pt-px">
                <Link href={href} className="text-accent hover:underline">
                  {href}
                </Link>
              </dt>
              <dd className="text-body leading-snug text-fg-muted -mt-2.5 sm:mt-0">
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
          is an address, not a phrase. */}
      <Section title="The record itself" gloss="Readable without this site">
        <p className="max-w-[72ch] text-body text-fg-muted">
          Every figure, series and snapshot this site draws from is served from a
          public repository. You can read it directly, and check it, without
          going through any page here:
        </p>
        <p className="mt-4">
          <a
            href={DATA_REPO_URL}
            className="font-figure text-small text-accent hover:underline break-all"
            rel="noreferrer noopener"
            target="_blank"
          >
            {DATA_REPO_URL}
          </a>
        </p>
        <p className="mt-5 max-w-[72ch] text-small leading-relaxed text-fg-faint">
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

/** A ruled section head, in the mono: the serif is the firm talking, and an
 *  index of a register is not the firm talking. The same shape the legal notice
 *  and /firm use, restated rather than imported — those helpers are private to
 *  their pages, and sharing a component would couple three files that only
 *  happen to look alike. */
function Section({
  title,
  gloss,
  children,
}: {
  title: string;
  gloss: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 lg:mt-16 border-t hairline pt-6">
      <h2 className="text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
        {title}
        <span className="ml-3 normal-case tracking-normal text-fg-faint/70">
          {gloss}
        </span>
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
