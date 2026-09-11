import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { GatedLink } from "@/components/GatedLink";
import { AccountDisclosureText } from "@/components/AccountDisclosure";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import {
  CONTACT_EMAIL,
  SITE_ORIGIN,
  getIndex,
  getResearch,
  type BookSummary,
} from "@/lib/data";
import { ENTITY, REGISTERED_ADDRESS } from "@/lib/entity";
import { NO_VALUE, date } from "@/lib/format";

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
 * WHAT IS IN THE MARGIN. The page used to spend two payloads on one number (the
 * annualised threshold) and print prose across half a column, so the section
 * that argued "here is the claim, here is somebody else's record of it" was
 * itself unevidenced on the page. Every margin below now carries the record:
 * published counts beside the account of what the company does, the register's
 * own identifiers beside the filed purpose, the portfolios currently
 * withholding their annualised statistics beside the rule that withholds them,
 * and the count evidencing each step beside the five-step pipeline.
 *
 * NOTHING IN THIS FILE COMPUTES A METRIC. Every figure in a margin is either a
 * field read straight out of the published payload or a SELECTION over published
 * fields — the newest session, the books whose `annualised_gated` is true. There
 * is no division, no average and no ratio anywhere on the page, and an absent
 * field renders as an absence rather than as a zero.
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
  // `getResearch` is read for two reasons: two sentences below link to
  // /research, and that route is not rendered when the summary is absent; and
  // the first two steps of the pipeline are evidenced by counts that live in
  // it. Both fetches are memoised for 60s and three other routes already take
  // them, so this costs nothing.
  const [index, research] = await Promise.all([getIndex(), getResearch()]);
  const hasResearch = research !== null;
  const books = index?.books ?? [];
  // Derived, never asserted — the same expression the masthead and the footer
  // use, so a book withheld from the index rewrites this page's account
  // sentence in the same breath as theirs. Today every published book is paper
  // and this is `false`; the branch stays because it is what keeps the sentence
  // true on the day that changes.
  const hasLive = books.some((b) => b.capital_at_risk);
  // `?? null`, never `?? 60`. A failed fetch must not let this page state a
  // threshold as fact; the `gated` definition below drops the number and keeps
  // the definition instead.
  const minSessions = index?.min_sessions_for_annualised ?? null;

  // HOW CURRENT THE RECORD IS, selected and never computed: the newest
  // `last_session` any book published, which is the same expression the
  // masthead uses. NOT `published_at`, which is when the publisher last ran and
  // is the more flattering of the two claims.
  const currentTo =
    books
      .map((b) => b.last_session)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  // The books withholding their annualised statistics right now: a filter over
  // a published boolean, printed as a list of NAMES. No count of them is
  // rendered anywhere — "n of m" is an aggregation, and this page does not make
  // one.
  const gatedBooks = books.filter((b) => b.annualised_gated);

  // WHAT EVIDENCES EACH STEP OF THE PIPELINE. One published figure per step,
  // read from the file the step's own sentence links to, so the schematic
  // cannot claim a step the record does not carry. A payload that did not load
  // leaves its rows as an absence: `int` and `date` both print the dash, and
  // step 3 is written out longhand because `books.length` on a failed fetch is
  // a zero that would read as "no portfolios".
  const stepEvidence = [
    {
      n: 1,
      name: "Research",
      value: int(research?.search?.recorded_trials),
      label: "recorded backtests, every one in the ledger",
    },
    {
      n: 2,
      name: "Catalogue",
      value: int(research?.deflation?.survive_book_level),
      label: "survive the book-level correction",
    },
    {
      n: 3,
      name: "Portfolios",
      value: index ? int(books.length) : NO_VALUE,
      label: "published portfolios, each with its own account",
    },
    {
      n: 4,
      name: "The desk",
      value: date(currentTo),
      label: "the newest session marked",
    },
    {
      n: 5,
      name: "The published record",
      value: int(index?.chain?.entries),
      label: "records in the hash chain",
    },
  ];

  return (
    <div className="pt-2 lg:pt-6">
      {/* ─── 1. IDENTITY ───────────────────────────────────────────────────
          WORD FOR WORD THE HOME PAGE'S OPENING SENTENCE, deliberately. A firm
          that answers "who is this" in two different formulations on two pages
          has answered it once too often, and a reader then has to decide which
          one is the careful version. "In France" is the only geography claimed,
          and it is claimed because the register carries it.

          The two caps here are the ones that survive: this header sits ABOVE
          the first section, outside the grid that owns the measure, so there is
          no track to inherit a width from. Everything inside a section below
          takes its width from the grid. */}
      <h1 className="max-w-[24ch] text-title sm:text-title">
        RVB Partners is a systematic trading firm in France.
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        This site is the public register of what we trade, how it was tested,
        and what we refused. This page is the short account of the company
        publishing it: what it does, what it does not do, and the identifiers
        that let you check both against a third party&rsquo;s record rather than
        against our word.
      </p>

      {/* ─── 2. WHAT THE COMPANY DOES ───────────────────────────────────────
          The margin carries what the paragraph is an account OF: how many
          portfolios are published, how many records are in the chain, how far
          the record runs. Selections over published fields, not metrics. */}
      <Section
        first
        title="What the company does"
        gloss="In one paragraph"
        note={
          index ? (
            <>
              Read from the published index. Every figure on this site is
              computed by the desk before it is published, never derived here.
            </>
          ) : undefined
        }
        aside={
          index ? (
            <MarginList
              rows={[
                { label: "Portfolios published", value: int(books.length) },
                { label: "Chained records", value: int(index.chain?.entries) },
                { label: "Newest marked session", value: date(currentTo) },
                { label: "Index published", value: date(index.published_at) },
              ]}
            />
          ) : undefined
        }
      >
        <p className="text-body text-fg-muted">
          RVB Partners researches systematic trading strategies and trades them
          on its own accounts. Research and execution are not two systems: a
          strategy is tested by the same framework that later places its orders,
          under one cost structure, one execution delay and one computation for
          every metric, so the rules a result was measured under do not change
          on its way to an account. What that produces is published here,
          session by session, as it is marked.
        </p>
        {/* THE SAME COMPONENT THE FOOTER RENDERS ON THE OTHER PAGES, not a copy
            of its sentence. The footer's copy is gated to
            /methodology, /disclosures and /verify, so on this route the
            disqualifier appears only if the page places it — and it belongs
            here, in the paragraph that says what the company trades on, not
            underneath it. Rendering the component rather than retyping the
            sentence is what stops the two from drifting apart.

            The spacing above the rule is the grid's, not this block's: inside
            the measure track `* + *` owns the rhythm, and an `mt-` here would
            be one more local override of a decision made once. */}
        <div className="border-t hairline pt-5">
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
          own account" is not what the register will show a reader who checks.

          THE MARGIN IS THE SAME ARGUMENT MADE VISUAL: the claim runs down the
          measure, the register's own identifiers sit beside it, and they are
          the four strings a reader would type into Infogreffe to read the
          filing. They keep the mono, because a registered identifier is a
          literal — it is compared character by character, and that is the one
          job the second typeface still has. */}
      {/* The apostrophe is a literal ’ and not an entity: this is a string
          PROP, not JSX text, and an entity in a prop is a coin-flip on the
          toolchain that decodes it. */}
      <Section
        title="What it does not do"
        gloss="And the register’s record of it"
        note={
          <>
            The three negatives are ours. The quoted purpose is the
            register&rsquo;s record of the same thing, and these are the four
            strings you would search on to read that filing yourself.
          </>
        }
        aside={
          <MarginList
            rows={[
              {
                label: "Registry",
                value: `R.C.S. ${ENTITY.rcs.registry}`,
                literal: true,
              },
              {
                label: "Register number",
                value: ENTITY.rcs.number,
                literal: true,
              },
              {
                label: "File no.",
                value: ENTITY.rcs.managementNumber,
                literal: true,
              },
              {
                label: "European identifier",
                value: ENTITY.rcs.euid,
                literal: true,
              },
            ]}
          />
        }
      >
        <p className="text-body text-fg-muted">
          <span className="text-fg">
            The company manages no third-party money and is not authorised to.
          </span>{" "}
          It sells nothing. Nothing on this site is investment advice, an offer,
          or a solicitation to buy or sell any financial instrument, and nothing
          on it is an invitation to invest.
        </p>
        <p className="text-body text-fg-muted">
          The corporate purpose filed at the register, in the words it was filed
          in:
        </p>

        <figure className="border-l hairline pl-5">
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

        <p className="text-body text-fg-muted">
          <em>En compte propre</em> (for its own account) is the whole of the
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
          /legal, which is linked from the margin. The registered activity is
          deliberately NOT repeated as a row: it is the evidence in the section
          above, and evidence that appears twice reads as a template.

          The caveat that used to close this section is now the marginal note.
          It is an annotation on the rows rather than a continuation of them,
          and that is exactly the distinction the third track exists to draw. */}
      <Section
        title="The register entry"
        gloss="The short form"
        note={
          <>
            Every value in this section is transcribed from the company&rsquo;s{" "}
            <em>extrait Kbis</em> and appears in French on the register, where
            it can be checked. The full notice is at{" "}
            <Link href="/legal" className="text-accent hover:underline">
              legal
            </Link>
            : hosting, intellectual property, personal data and the terms this
            site is published on.
          </>
        }
      >
        <Rows
          rows={[
            {
              label: "Legal form",
              value: (
                <>
                  {ENTITY.legalFormEn}
                  <Gloss>
                    as registered: <span lang="fr">{ENTITY.legalForm}</span>
                  </Gloss>
                </>
              ),
            },
            {
              label: "Share capital",
              value: (
                <>
                  <span className="tnum">{ENTITY.capital}</span>
                  <Gloss>
                    variable, minimum {ENTITY.capitalMinimum}: the form exists
                    so the figure can move
                  </Gloss>
                </>
              ),
            },
            {
              label: "Registered office",
              value: (
                <>
                  {REGISTERED_ADDRESS}
                  {/* SAYING "DOMICILIATION" IS THE HONEST PART. Printed bare,
                      this address invites a reader to picture an office; the
                      domiciliataire is named on the Kbis, so naming it here
                      costs nothing and forecloses the inference. */}
                  <Gloss>
                    a domiciliation address provided by{" "}
                    {ENTITY.domiciliation.name} (RCS {ENTITY.domiciliation.rcs})
                  </Gloss>
                </>
              ),
            },
            {
              label: "Registration",
              value: (
                <>
                  {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry}
                  <Gloss>file no. {ENTITY.rcs.managementNumber}</Gloss>
                </>
              ),
              literal: true,
            },
            { label: "SIREN", value: ENTITY.rcs.siren, literal: true },
            {
              label: "European identifier (EUID)",
              value: ENTITY.rcs.euid,
              literal: true,
            },
            {
              label: "Entered on the register",
              value: <span className="tnum">{date(ENTITY.rcs.registeredOn)}</span>,
            },
            {
              label: "Activity began",
              value: (
                <>
                  <span className="tnum">{date(ENTITY.activityStarted)}</span>
                  {/* The declared start of activity precedes the registration
                      date by three days. That is what the Kbis says, and it is
                      printed as filed rather than tidied into agreement — the
                      one kind of correction this site is not allowed to
                      make. */}
                  <Gloss>as declared on the register</Gloss>
                </>
              ),
            },
            { label: "Financial year ends", value: ENTITY.fiscalYearEnd },
          ]}
        />
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
      <Section
        title="Officers"
        gloss="As entered on the register"
        note={
          <>
            The register records these names under these titles. This site adds
            nothing to them: no roles, no responsibilities, no biographies, no
            headcount.
          </>
        }
      >
        <Rows
          rows={[
            { label: "President", value: ENTITY.officers.president },
            {
              label: "General managers",
              value: (
                <>
                  {ENTITY.officers.generalManagers.map((name) => (
                    <span key={name} className="block">
                      {name}
                    </span>
                  ))}
                </>
              ),
            },
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
          of them is a term of art borrowed to sound rigorous.

          ONE OF THE EIGHT IS A RULE THAT IS IN FORCE RIGHT NOW, and the margin
          says on whom. `gated` defines a withholding; the list beside it names
          the portfolios currently withheld under it, each marked in the
          reserved oxide. It is a filter over a published boolean and it prints
          no count, because a count of them against the fleet is an aggregation
          this page is not allowed to make. */}
      <Section
        title="Vocabulary"
        gloss="Eight terms, defined once"
        note={
          index && books.length > 0 ? (
            <>
              The rule under <em>gated</em>, applied: the portfolios whose
              annualised figures are withheld in the index as it stands now.
              Their pages print a dash where those figures would be.
            </>
          ) : undefined
        }
        aside={
          index && books.length > 0 ? (
            <GatedBooks books={gatedBooks} />
          ) : undefined
        }
      >
        <dl className="space-y-7">
          <Term id="rvb-partners" term="RVB Partners">
            The company. It is registered in Paris under the identifiers above,
            and it is the party accountable for everything published on this
            site: the figures, the method and the refusals alike.
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
            money. The orders and fills are the broker&rsquo;s; the money is
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
            rather than at the current moment. The newest broker reading on a
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
            rather than assumed to be zero. The verify table prints both
            columns, and a timestamp proof bounds a record from above only.
          </Term>

          <Term id="gated" term="Gated">
            A statistic withheld because there is not enough history to compute
            it honestly. Annualised figures (a Sharpe ratio, a volatility, an
            annual return) are withheld until a book has{" "}
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
            place. What happened is shown from day one: cumulative return, the
            daily returns, the realised drawdown path.
          </Term>

          <Term id="attributed" term="Attributed">
            A per-strategy or per-category figure that is modelled rather than
            measured. The broker nets the desk&rsquo;s orders, so one net fill
            is attributed back to the strategies whose intents contributed to
            it, pro-rata by requested size; a different rule would give
            different numbers from the same fills. Book-level figures are read
            from the broker and never reconstructed from the attribution. The
            attribution does not add up to the book, which{" "}
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
          are what make this a claim with a receipt attached.

          THE MARGIN PUTS THE RECEIPT BESIDE THE CLAIM. One published figure per
          step, read from the same file the step's own sentence links to, so the
          schematic can be checked without leaving the page and cannot outrun
          what the record carries. Where a payload did not load its row is a
          dash, which is the honest reading of a step whose evidence is not
          available right now. */}
      <Section
        title="How the work is organised"
        gloss="And where each step is evidenced"
        note={
          index || research ? (
            <>
              One published figure per step, read from the file that step&rsquo;s
              own sentence links to.
            </>
          ) : undefined
        }
        aside={
          index || research ? <StepEvidence rows={stepEvidence} /> : undefined
        }
      >
        <ol className="space-y-5">
          <Step n={1} name="Research">
            Every strategy is built and tested inside the framework that will
            later execute it, and every backtest, sweep and grid cell is written
            to an append-only ledger, because a result means nothing without the
            number of things that were tried to find it. Those counts are
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
            The desk runs each portfolio on a fixed daily cycle: stage after the
            close, execute at the next open, mark after the close that follows.
            The cost and timing rules are the same ones the research used. The
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
          would be the only unverifiable claim on it. The margin holds the
          gloss and nothing else, which is what an empty third track is for. */}
      <Section title="How to reach us" gloss="One address">
        <p className="text-body text-fg-muted">
          Anything about this record (a figure that does not reconcile, a check
          that fails, a passage that is unclear) goes to{" "}
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

/** Counts, grouped. Never `?? 0`: an absent count is an absence, and the dash
 *  is how this site writes one. Same treatment /research and the home page give
 *  the same numbers. */
function int(n: number | null | undefined): string {
  return n === null || n === undefined ? NO_VALUE : n.toLocaleString("en-US");
}

/** One row of the margin: what the figure is, and the figure.
 *
 *  `literal` is the only typographic switch on the page. A REGISTERED
 *  IDENTIFIER is a string a reader retypes into a register and compares
 *  character by character, so it keeps the mono, where 0 stays apart from O. A
 *  count or a date is a FIGURE: it is set in the page's one typeface with
 *  tabular digits, so a column of them lines up without a second face on the
 *  page. */
type MarginRow = { label: string; value: ReactNode; literal?: boolean };

/** THE THIRD TRACK, RULED.
 *
 *  A hairline per row and nothing else: no box, no fill, no corner. The label
 *  is the quiet half and the figure is the loud one, which is the opposite of
 *  how these facts read when they were sentences in a paragraph. */
function MarginList({ rows }: { rows: MarginRow[] }) {
  return (
    <dl className="border-t hairline">
      {rows.map((row) => (
        <div key={row.label} className="border-b hairline py-2.5">
          <dt className="text-label font-semibold uppercase tracking-[0.16em] text-fg-faint">
            {row.label}
          </dt>
          <dd
            className={
              row.literal
                ? "mt-1.5 font-figure text-small leading-snug text-fg"
                : "mt-1.5 tnum text-small leading-snug text-fg"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** THE WITHHOLDING RULE, APPLIED, in the margin beside the rule itself.
 *
 *  A list of names and a stamp, never a count: how many books are gated out of
 *  how many is an aggregation, and it is also the least useful form of the
 *  fact. What a reader wants to know is WHICH portfolio is withholding, and how
 *  much history it has, both of which are published fields.
 *
 *  The oxide is spent here exactly as the palette reserves it — on a fact that
 *  disqualifies figures near it — and on nothing else in this file. */
function GatedBooks({ books }: { books: BookSummary[] }) {
  return (
    <div>
      <h3 className="text-label font-semibold uppercase tracking-[0.16em] text-fg-faint">
        Annualised statistics withheld
      </h3>
      {books.length === 0 ? (
        <p className="mt-3 border-t hairline pt-3 text-caption leading-relaxed text-fg-muted">
          No portfolio is withholding its annualised statistics.
        </p>
      ) : (
        <ul className="mt-3 border-t hairline">
          {books.map((b) => (
            <li key={b.book} className="border-b hairline py-2.5">
              <span className="block text-small leading-snug text-fg">
                {b.label}
              </span>
              <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-label font-semibold uppercase tracking-[0.16em] text-oxide">
                  Withheld
                </span>
                <span className="text-caption leading-snug text-fg-faint">
                  <span className="tnum">{int(b.sessions)}</span> marked
                  sessions
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** THE PIPELINE'S RECEIPTS, one per step, ruled into a column.
 *
 *  The numbers repeat the order of the steps beside them rather than an order
 *  of their own, so the column is read as an index of the list and not as a
 *  ranking. */
function StepEvidence({
  rows,
}: {
  rows: { n: number; name: string; value: string; label: string }[];
}) {
  return (
    <div className="border-t hairline">
      {rows.map((row) => (
        <div key={row.n} className="border-b hairline py-3">
          <div className="text-label font-semibold uppercase tracking-[0.16em] text-fg-faint">
            <span className="tnum">{row.n}</span>
            <span className="mx-1.5">·</span>
            {row.name}
          </div>
          <div className="mt-2 tnum text-small leading-snug text-fg">
            {row.value}
          </div>
          <div className="mt-1.5 text-caption leading-snug text-fg-faint">
            {row.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/** A definition list, not a table: these are the register's own rows.
 *
 *  `literal` marks the values that are REGISTERED IDENTIFIERS — the RCS number,
 *  the SIREN, the EUID. Those keep the mono, because they are strings a reader
 *  compares character by character against a register. Everything else here is
 *  prose or a date and is set in the page's one typeface: the blanket mono this
 *  list used to carry put "simplified joint-stock company with variable
 *  capital" in a monospace, which says nothing about the value and puts a
 *  second face on half the page. */
function Rows({
  rows,
}: {
  rows: { label: string; value: ReactNode; literal?: boolean }[];
}) {
  return (
    <dl className="grid gap-y-4 sm:grid-cols-[minmax(0,150px)_minmax(0,1fr)] sm:gap-x-8">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-small leading-snug text-fg-faint sm:pt-px">
            {row.label}
          </dt>
          <dd
            className={`text-small leading-snug text-fg -mt-2.5 sm:mt-0 ${
              row.literal ? "font-figure" : ""
            }`}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The second line under a transcribed value: the value is the record, the
 *  gloss is us explaining it. On a literal row it also drops back out of the
 *  mono, so an identifier stays visibly an identifier and the sentence about it
 *  does not. */
function Gloss({ children }: { children: ReactNode }) {
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
  children: ReactNode;
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
      <dd className="mt-2 text-body text-fg-muted">{children}</dd>
    </div>
  );
}

/** One step of the pipeline: an index, a name, and what the step is.
 *
 *  The name sits ABOVE its paragraph rather than in a 180px column beside it.
 *  That column was invented when the prose had the whole page to spread across;
 *  inside the measure it left the sentence about 300px wide, which is a
 *  newspaper column with none of a newspaper's reasons. The rail now says what
 *  the section is, so the step does not have to. */
function Step({
  n,
  name,
  children,
}: {
  n: number;
  name: string;
  children: ReactNode;
}) {
  return (
    <li>
      <span className="text-caption uppercase tracking-[0.12em] text-fg-faint">
        <span className="tnum">{n}</span>
        <span className="mx-2">·</span>
        {name}
      </span>
      <p className="mt-1.5 text-body text-fg-muted">{children}</p>
    </li>
  );
}
