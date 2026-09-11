import type { Metadata } from "next";
import Link from "next/link";
import { GatedLink } from "@/components/GatedLink";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { CONTACT_EMAIL, SITE_ORIGIN, getIndex, getResearch} from "@/lib/data";
import { ENTITY, REGISTERED_ADDRESS } from "@/lib/entity";
import { date } from "@/lib/format";

/**
 * WHO IS PUBLISHING THIS RECORD, AND WHAT CAN A STRANGER CHECK?
 *
 * The site answers "what did the portfolios do" on six pages and "is it true"
 * on three. It answered "who is this" nowhere: a reader arriving from a shared
 * link met a curve, a hash chain and a list of caveats published by a name they
 * had no way to place. This page is that missing half, and it is built on one
 * rule — EVERY CLAIM IS PAIRED WITH SOMEBODY ELSE'S RECORD OF IT.
 *
 * That is why the "what it does not do" section is not a paragraph of
 * reassurance. Any firm can write "we manage no third-party money"; the
 * sentence is worth exactly nothing on its own. What is worth something is the
 * corporate purpose filed at the RCS — *en compte propre* — which a reader can
 * look up against a public register and which the company cannot edit on a
 * whim. The claim and the evidence sit in the same section, in that order,
 * because separating them turns the evidence into decoration.
 *
 * TWO NOUNS, AND ONLY TWO. "RVB Partners" is the company; "the desk" is the
 * software it runs. There is no third party in between — no individual who runs
 * the desk, no personal capital, no "operator". That role was removed from the
 * whole site on 2026-09-08; the vocabulary section below is where the two
 * surviving nouns are defined, once, so no page has to define them again.
 *
 * NO ROLES, NO BIOGRAPHIES, NO HEADCOUNT. The officers appear exactly as the
 * legal notice lists them — three names under two registered titles — because
 * that is what the register records. Anything beyond it would be this site
 * inventing an org chart, on the one site whose entire premise is that nothing
 * on it is invented.
 *
 * The only LIVE figure on the page is the annualised-statistics threshold, read
 * from the published index rather than typed here. See the `gated` entry.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The firm",
  description:
    "Who RVB Partners is: what the company does, what it does not do and the " +
    "register's record of that, its identifiers, its officers, and the " +
    "vocabulary this record uses.",
  alternates: { canonical: `${SITE_ORIGIN}/firm` },
};

export default async function FirmPage() {
  // `getResearch` is read for one reason: two sentences below link to
  // /research, and that route is not rendered when the summary is absent.
  // Both fetches are memoised for 60s and three other routes already take
  // them, so this costs nothing.
  const [index, research] = await Promise.all([getIndex(), getResearch()]);
  const hasResearch = research !== null;
  // Derived, never asserted — the same expression the masthead and the footer
  // use, so a book withheld from the index rewrites this page's account
  // sentence in the same breath as theirs. Today every published book is paper
  // and this is `false`; the branch stays because it is what keeps the sentence
  // true on the day that changes.
  const hasLive = (index?.books ?? []).some((b) => b.capital_at_risk);
  // `?? null`, never `?? 60`. A failed fetch must not let this page state a
  // threshold as fact; the `gated` definition below drops the number and keeps
  // the definition instead.
  const minSessions = index?.min_sessions_for_annualised ?? null;

  return (
    <div className="pt-2 lg:pt-6">
      {/* ─── 1. IDENTITY ───────────────────────────────────────────────────
          WORD FOR WORD THE HOME PAGE'S OPENING SENTENCE, deliberately. A firm
          that answers "who is this" in two different formulations on two pages
          has answered it once too often, and a reader then has to decide which
          one is the careful version. "In France" is the only geography claimed,
          and it is claimed because the register carries it. */}
      <h1 className="max-w-[24ch] text-title sm:text-title">
        RVB Partners is a systematic trading firm in France.
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        This site is the public register of what we trade, how it was tested,
        and what we refused. This page is the short account of the company
        publishing it — what it does, what it does not do, and the identifiers
        that let you check both against a third party&rsquo;s record rather than
        against our word.
      </p>

      {/* ─── 2. WHAT THE COMPANY DOES ─────────────────────────────────────── */}
      <Section title="What the company does" gloss="In one paragraph">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          <p>
            RVB Partners researches systematic trading strategies and trades
            them on its own accounts. Research and execution are not two
            systems: a strategy is tested by the same framework that later
            places its orders, under one cost structure, one execution delay and
            one computation for every metric — so the rules a result was
            measured under do not change on its way to an account. What that
            produces is published here, session by session, as it is marked.
          </p>
        </div>
        {/* THE SAME COMPONENT THE FOOTER RENDERS ON THE OTHER PAGES, not a copy
            of its sentence. The footer's copy is gated to
            /methodology, /disclosures and /verify, so on this route the
            disqualifier appears only if the page places it — and it belongs
            here, in the paragraph that says what the company trades on, not
            underneath it. Rendering the component rather than retyping the
            sentence is what stops the two from drifting apart. */}
        <div className="mt-6 border-t hairline pt-5">
          {index ? (
            <AccountDisclosureText hasLive={hasLive} />
          ) : (
            <Note tone="warn">
              The published index could not be read just now, so this page is
              not describing the accounts from it. Each portfolio states what
              kind of account it is in its own header.
            </Note>
          )}
        </div>
      </Section>

      {/* ─── 3. WHAT IT DOES NOT DO, AND WHO ELSE RECORDS THAT ─────────────
          The pairing IS the section. The three negatives are ordinary — every
          site makes them — and a reader is right to discount them. The filed
          corporate purpose is the same claim written down by somebody who is
          not us, in a register the company cannot edit at will and a reader can
          consult without us. It is printed in the language it was filed in for
          the same reason the legal notice does it: a translation cannot be
          looked up, and "purchase and sale of all financial products for its
          own account" is not what the register will show a reader who checks. */}
      {/* The apostrophe is a literal ’ and not an entity: this is a string
          PROP, not JSX text, and an entity in a prop is a coin-flip on the
          toolchain that decodes it. */}
      <Section
        title="What it does not do"
        gloss="And the register’s record of it"
      >
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          <p>
            <span className="text-fg">
              The company manages no third-party money and is not authorised to.
            </span>{" "}
            It sells nothing. Nothing on this site is investment advice, an
            offer, or a solicitation to buy or sell any financial instrument,
            and nothing on it is an invitation to invest.
          </p>
          <p>
            The corporate purpose filed at the register, in the words it was filed in:</p>
        </div>

        <figure className="mt-6 max-w-[72ch] border-l hairline pl-5">
          {/* `lang="fr"`: the document is `lang="en"` and this is the Kbis
              wording verbatim. Without it a screen reader pronounces a French
              legal formula with English phonetics, which is the one sentence on
              the page a reader is being invited to check against the register
              character for character. */}
          <blockquote lang="fr" className="text-body text-fg">
            {ENTITY.purpose}
          </blockquote>
          <figcaption className="mt-3 text-small leading-relaxed text-fg-faint">
            In English: {ENTITY.purposeEn} Registered corporate purpose of{" "}
            {ENTITY.name}, {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry},
            entered on the register {date(ENTITY.rcs.registeredOn)}.
          </figcaption>
        </figure>

        <p className="mt-5 max-w-[72ch] text-body text-fg-muted">
          <em>En compte propre</em> — for its own account — is the whole of the
          registered activity. The conditions attached to every figure published
          here are set out under{" "}
          <Link href="/disclosures" className="text-accent hover:underline">
            disclosures
          </Link>
          , and the full legal notice is at{" "}
          <Link href="/legal" className="text-accent hover:underline">
            legal
          </Link>
          .
        </p>
      </Section>

      {/* ─── 4. THE REGISTER ENTRY ─────────────────────────────────────────
          THE SHORT FORM, not a second legal notice. Everything here is
          transcribed from the Kbis by way of lib/entity.ts — hosting,
          intellectual property, cookies and the officers' registry data stay on
          /legal, which is linked beneath. The registered activity is
          deliberately NOT repeated as a row: it is the evidence in the section
          above, and evidence that appears twice reads as a template. */}
      <Section title="The register entry" gloss="The short form">
        <Rows
          rows={[
            [
              "Legal form",
              <span key="form">
                {ENTITY.legalFormEn}
                <Gloss>
                  as registered: <span lang="fr">{ENTITY.legalForm}</span>
                </Gloss>
              </span>,
            ],
            [
              "Share capital",
              <span key="capital">
                {ENTITY.capital}
                <Gloss>
                  variable, minimum {ENTITY.capitalMinimum} — the form exists so
                  the figure can move
                </Gloss>
              </span>,
            ],
            [
              "Registered office",
              <span key="office">
                {REGISTERED_ADDRESS}
                {/* SAYING "DOMICILIATION" IS THE HONEST PART. Printed bare, this
                    address invites a reader to picture an office; the
                    domiciliataire is named on the Kbis, so naming it here costs
                    nothing and forecloses the inference. */}
                <Gloss>
                  a domiciliation address provided by {ENTITY.domiciliation.name}{" "}
                  (RCS {ENTITY.domiciliation.rcs})
                </Gloss>
              </span>,
            ],
            [
              "Registration",
              <span key="rcs">
                {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry}
                <Gloss>file no. {ENTITY.rcs.managementNumber}</Gloss>
              </span>,
            ],
            ["SIREN", ENTITY.rcs.siren],
            ["European identifier (EUID)", ENTITY.rcs.euid],
            ["Entered on the register", date(ENTITY.rcs.registeredOn)],
            [
              "Activity began",
              <span key="activity">
                {date(ENTITY.activityStarted)}
                {/* The declared start of activity precedes the registration
                    date by three days. That is what the Kbis says, and it is
                    printed as filed rather than tidied into agreement — the one
                    kind of correction this site is not allowed to make. */}
                <Gloss>as declared on the register</Gloss>
              </span>,
            ],
            ["Financial year ends", ENTITY.fiscalYearEnd],
          ]}
        />
        <p className="mt-6 max-w-[72ch] text-small leading-relaxed text-fg-faint">
          Every value above is transcribed from the company&rsquo;s{" "}
          <em>extrait Kbis</em> and appears in French on the register, where it
          can be checked. The full notice — hosting, intellectual property,
          personal data and the terms this site is published on — is at{" "}
          <Link href="/legal" className="text-accent hover:underline">
            legal
          </Link>
          .
        </p>
      </Section>

      {/* ─── 5. OFFICERS ───────────────────────────────────────────────────
          TWO ROWS, THE SAME TWO THE LEGAL NOTICE CARRIES, AND NOTHING ELSE. No
          titles beyond the registered ones, no responsibilities, no
          biographies, no photographs. A site that publishes a hash chain to
          avoid asking for trust does not then ask for trust in a paragraph
          about how experienced somebody is.

          The general managers are rendered one per line rather than joined by a
          separator, and the string is passed through NOTHING. "Garcia--Baron"
          is a French double-barrelled surname, not a dash that survived an
          ASCII round-trip: `prose()` from lib/format would turn those two
          hyphens into an em dash and silently misspell a named individual. */}
      <Section title="Officers" gloss="As entered on the register">
        <Rows
          rows={[
            ["President", ENTITY.officers.president],
            [
              "General managers",
              <span key="gm">
                {ENTITY.officers.generalManagers.map((name) => (
                  <span key={name} className="block">
                    {name}
                  </span>
                ))}
              </span>,
            ],
          ]}
        />
      </Section>

      {/* ─── 6. VOCABULARY ─────────────────────────────────────────────────
          Eight terms this record uses in a narrower sense than a reader would
          assume. They are defined ONCE, here, with stable ids, so another page
          can link a term (/firm#paper-account) instead of re-explaining it in a
          parenthesis — which is how two surfaces end up defining the same word
          differently.

          Every definition is a description of something this site actually
          does, drawn from the published data or from the methodology page. None
          of them is a term of art borrowed to sound rigorous. */}
      <Section title="Vocabulary" gloss="Eight terms, defined once">
        <dl className="space-y-7">
          <Term id="rvb-partners" term="RVB Partners">
            The company. It is registered in Paris under the identifiers above,
            and it is the party accountable for everything published on this
            site — the figures, the method and the refusals alike.
          </Term>

          <Term id="the-desk" term="The desk">
            The software the company runs. After each close it computes signals
            and nets them into an order plan; at the next open it submits that
            plan; after the following close it sweeps late fills, values the
            positions and records the broker&rsquo;s account equity; then it
            archives the session. When these pages say &ldquo;the desk&rdquo;
            they mean that program.
          </Term>

          <Term id="paper-account" term="A paper account">
            A real broker account trading live market prices with simulated
            money — the orders and fills are the broker&rsquo;s; the money is
            not. Every account on this site is one. A simulated fill is only as
            good as the market data it was simulated against, and each record
            names the feed it used; the limits that puts on these results are
            stated under{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              methodology
            </Link>
            .
          </Term>

          <Term id="marked" term="Marked">
            A session is marked once the desk has closed it out: late fills
            swept, positions valued, and the broker&rsquo;s own account equity
            taken as that session&rsquo;s net asset value. A session joins the
            record when it has been marked, which is why a curve ends at a close
            rather than at the current moment — the newest broker reading on a
            portfolio page is shown separately and labelled as not yet marked.
          </Term>

          <Term id="chained" term="Chained">
            Each marked session is written to a record carrying the SHA-256 of
            its own contents and the hash of the previous session&rsquo;s
            record. Edit a published number afterwards and it stops matching;
            drop a session and every record after it breaks. That is what makes
            the series checkable as a whole rather than file by file, and the
            checks you can run yourself are set out under{" "}
            <Link href="/verify" className="text-accent hover:underline">
              verify
            </Link>
            .
          </Term>

          <Term id="backfilled" term="Backfilled">
            A record that joined the chain later than the session it describes.
            The chain stamps the day each record was recorded beside the session
            it covers, so where there is a gap between the two it is published
            rather than assumed to be zero — the verify table prints both
            columns, and a timestamp proof bounds a record from above only.
          </Term>

          <Term id="gated" term="Gated">
            A statistic withheld because there is not enough history to compute
            it honestly. Annualised figures — a Sharpe ratio, a volatility, an
            annual return — are withheld until a book has{" "}
            {/* THE THRESHOLD IS READ FROM THE PUBLISHED INDEX, never typed
                here. It is one number in one file, and a copy of it in this
                repository is a number that can disagree with the gate it
                describes. Where the index cannot be read the sentence keeps the
                definition and drops the figure. */}
            {minSessions !== null ? (
              <>
                <span className="tnum">{minSessions}</span> marked sessions
              </>
            ) : (
              "the published minimum number of marked sessions"
            )}
            . On a handful of sessions those figures are not imprecise
            estimates, they are meaningless ones. Each book publishes the exact
            list of names it is suppressing and its page renders a dash in their
            place; what happened — cumulative return, the daily returns, the
            realised drawdown path — is shown from day one.
          </Term>

          <Term id="attributed" term="Attributed">
            A per-strategy or per-category figure that is modelled rather than
            measured. The broker nets the desk&rsquo;s orders, so one net fill
            is attributed back to the strategies whose intents contributed to
            it, pro-rata by requested size; a different rule would give
            different numbers from the same fills. Book-level figures are read
            from the broker and never reconstructed from the attribution — and
            the attribution does not add up to the book, which{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              methodology
            </Link>{" "}
            states in full.
          </Term>
        </dl>
      </Section>

      {/* ─── 7. HOW THE WORK IS ORGANISED ──────────────────────────────────
          Five steps, and every one of them ends at a page that evidences it. A
          process diagram nobody can check is an organisation chart; the links
          are what make this a claim with a receipt attached. The step numbers
          are set in the mono because they are an index, not prose. */}
      <Section
        title="How the work is organised"
        gloss="And where each step is evidenced"
      >
        <ol className="max-w-[76ch] space-y-5">
          <Step n={1} name="Research">
            Every strategy is built and tested inside the framework that will
            later execute it, and every backtest, sweep and grid cell is written
            to an append-only ledger — because a result means nothing without
            the number of things that were tried to find it. Those counts are
            published under{" "}
            <GatedLink href="/research" available={hasResearch}>
              research
            </GatedLink>
            .
          </Step>
          <Step n={2} name="Catalogue">
            What survived and what did not are both kept on record. Each
            headline is then re-derived against the whole book&rsquo;s effective
            number of trials rather than its own grid, and how many cleared the
            nominal bar, how many that correction demoted and how many are
            presented as an edge are published as counts on the same{" "}
            <GatedLink href="/research" available={hasResearch}>
              research
            </GatedLink>{" "}
            page.
          </Step>
          <Step n={3} name="Portfolios">
            Surviving strategies are combined into portfolios, each with its own
            broker account and its own page under{" "}
            <Link href="/portfolios" className="text-accent hover:underline">
              portfolios
            </Link>
            {/* NOT "so that positions stay private" — they do not. Each
                portfolio publishes its actual holdings, symbol by symbol, in
                its released detail files; what is withheld is which STRATEGY
                asked for them. The site's own stated reason for that is the one
                given here, and inventing a second one would contradict the
                published disclosure. */}
            . Holdings are published by strategy category and weight, never by
            strategy name: the catalogue is the work.
          </Step>
          <Step n={4} name="The desk">
            The desk runs each portfolio on a fixed daily cycle — stage after
            the close, execute at the next open, mark after the close that
            follows — with the same cost and timing rules the research used. The
            conventions, and the biases they do not remove, are set out under{" "}
            <Link href="/methodology" className="text-accent hover:underline">
              methodology
            </Link>
            .
          </Step>
          <Step n={5} name="The published record">
            Every marked session is snapshotted, hashed, chained to the session
            before it and timestamped, then published to a public repository.
            You do not need our cooperation to check any of it:{" "}
            <Link href="/verify" className="text-accent hover:underline">
              verify
            </Link>{" "}
            lists every snapshot and the four checks that run on a clone.
          </Step>
        </ol>
      </Section>

      {/* ─── 8. CONTACT ────────────────────────────────────────────────────
          One address and one sentence. No form, no dropdown, no undertaking
          about how quickly anyone replies — a promise this page cannot keep
          would be the only unverifiable claim on it. */}
      <Section title="How to reach us" gloss="One address">
        <p className="max-w-[72ch] text-body text-fg-muted">
          Anything about this record — a figure that does not reconcile, a check
          that fails, a passage that is unclear — goes to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </div>
  );
}

/** A ruled section head, in the mono: the serif is the firm talking, and an
 *  index of a register is not the firm talking. Same shape as the legal
 *  notice's, restated here rather than imported — that file's helpers are
 *  private to it, and a shared component would couple two pages that only
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

/** A definition list, not a table: these are identifiers, and the mono face is
 *  what marks a value as something transcribed rather than something claimed. */
function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-y-4 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-x-10">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-small leading-snug text-fg-faint sm:pt-px">
            {label}
          </dt>
          <dd className="font-figure text-small leading-snug text-fg -mt-2.5 sm:mt-0">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The second line under a transcribed value, set back in the serif: the value
 *  is the record, the gloss is us explaining it, and the two faces keep that
 *  distinction visible without a label. */
function Gloss({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 block font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
      {children}
    </span>
  );
}

/** One vocabulary entry.
 *
 *  The term carries the anchor and is itself the link to it, so a reader who
 *  wants to point somebody at one definition can copy it out of the address bar
 *  — the whole reason these ids exist. `scroll-mt` keeps the heading off the
 *  top edge when the browser jumps to it. */
function Term({
  id,
  term,
  children,
}: {
  id: string;
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt id={id} className="scroll-mt-8">
        <a
          href={`#${id}`}
          className="text-small font-medium text-fg hover:text-accent transition-colors"
        >
          {term}
        </a>
      </dt>
      <dd className="mt-2 max-w-[72ch] text-body text-fg-muted">
        {children}
      </dd>
    </div>
  );
}

/** One step of the pipeline. The index is set in the mono and the name beside
 *  it, so the left column reads as a contents list rather than as a bullet. */
function Step({
  n,
  name,
  children,
}: {
  n: number;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <li className="sm:grid sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-x-10">
      <span className="text-caption uppercase tracking-[0.12em] text-fg-faint">
        <span className="tnum">{n}</span>
        <span className="mx-2">·</span>
        {name}
      </span>
      <p className="mt-1.5 sm:mt-0 text-body text-fg-muted">
        {children}
      </p>
    </li>
  );
}
