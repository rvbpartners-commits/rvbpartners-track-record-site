import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "@/components/Section";
import {
  CONTACT_EMAIL,
  DATA_REPO_URL,
  SITE_HOST,
  SITE_ORIGIN,
  SITE_REPO_URL,
} from "@/lib/data";
import { ENTITY, REGISTERED_ADDRESS } from "@/lib/entity";
import { date } from "@/lib/format";

/**
 * Mentions légales — required of a French company publishing a website
 * (LCEN 2004-575 art. 6-III, and code de commerce R. 123-237 for the
 * commercial identifiers). The site had none, which is the one gap on it that
 * was not a matter of taste.
 *
 * ENGLISH, LIKE THE REST OF THE SITE. Nothing in French law requires this page
 * to be in French: loi Toubon governs the presentation of goods and services
 * offered to consumers, and this company offers neither — its registered
 * purpose is trading its own account.
 *
 * But the REGISTERED WORDING still has to be recoverable, because the whole
 * value of these identifiers is that a reader can check them against the
 * register and find the same words. "Simplified joint-stock company with
 * variable capital" is a translation, not a legal form; nobody can look it up.
 * So each translated value carries the filed French beneath it, marked "as
 * registered". English to read, French to verify.
 *
 * Every identifier comes from `lib/entity.ts`, which is transcribed from the
 * Kbis. See that file for what was deliberately left out.
 *
 * ── WHAT THE GRID CHANGED HERE ────────────────────────────────────────────
 * This page carried a private `Section` byte-identical to five others, and its
 * `Rows` list was uncapped: a 220px label column paired with an 870px value
 * column holding "103 404 778". Half the page was white to the right of a
 * nine-digit number. The shared Section owns the measure now, so `Rows` sits
 * inside 33rem and its label column narrows to match, and the third track
 * carries what the sections have and never showed:
 *
 *   The company   the register's own calendar. The commencement of activity
 *                 and the fiscal year end are published on the Kbis and were
 *                 transcribed into `entity.ts`, and until now neither of them
 *                 was rendered anywhere on the site.
 *   Officers      the two strings that return the filing, and an explicit
 *                 statement of what the register holds that this page does not.
 *   Hosting       where each of the two things is actually served from.
 *   Purpose       the four negatives, as a list, beside the paragraph making
 *                 them.
 *   IP            the owned strings, and the repository that is not.
 *   Cookies       the stores, each marked None. This is the section the footer
 *                 links to, and a reader arriving at `#cookies` wants the
 *                 answer before the paragraph.
 *
 * NOTHING IS COMPUTED HERE, and there is nothing to compute: every value on
 * this page is a string transcribed from a register. "None" is a positive fact
 * about a store this site does not write, not a missing value, so it is a word
 * and never a zero and never the absence marker.
 */
export const metadata: Metadata = {
  title: "Legal notice",
  description:
    "Legal notice for RVB Partners: company identification, officers, hosting, and the terms on which this site is published.",
  alternates: { canonical: `${SITE_ORIGIN}/legal` },
};

export default function LegalNotice() {
  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="text-title sm:text-title">
        Legal notice
      </h1>
      {/* The one width cap left on this page. This paragraph sits ABOVE the
          first section, outside the grid that owns the measure, so there is no
          track for it to take a width from. Everything below is inside a
          section and inherits `--measure`. */}
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        The <em>mentions légales</em> required of a French company publishing a
        website, under article 6-III of law n° 2004-575 of 21 June 2004 (LCEN)
        and article R. 123-237 of the code de commerce. Every identifier below
        is transcribed from the company&rsquo;s <em>extrait Kbis</em> and can be
        checked against the register, where it appears in French.
      </p>

      {/* ─── ÉDITEUR ──────────────────────────────────────────────────── */}
      <Section
        first
        title="The company"
        gloss="Publisher of this site"
        note={
          <>
            Each translated value carries the filed French beneath it. The
            register will show a reader the French wording, so that is the
            wording that has to match; the English is there to be read.
          </>
        }
        aside={
          <dl className="space-y-2.5">
            <Fact term="Activity began" value={date(ENTITY.activityStarted)} />
            <Fact
              term="Entered on the register"
              value={date(ENTITY.rcs.registeredOn)}
              qualifier={`Greffe de ${ENTITY.rcs.registry}.`}
            />
            <Fact term="Financial year ends" value={ENTITY.fiscalYearEnd} />
            <Fact
              term="Share capital"
              value={ENTITY.capital}
              qualifier={`Variable. The statutory minimum is ${ENTITY.capitalMinimum}.`}
            />
          </dl>
        }
      >
        <Rows
          rows={[
            { label: "Company name", value: ENTITY.name },
            { label: "Short name", value: ENTITY.short },
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
                  {ENTITY.capital}
                  <Gloss>variable, minimum {ENTITY.capitalMinimum}</Gloss>
                </>
              ),
            },
            { label: "Registered office", value: REGISTERED_ADDRESS },
            {
              label: "Registration",
              value: (
                <>
                  {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry}
                  <Gloss>
                    entered on the register {date(ENTITY.rcs.registeredOn)} ·
                    file no. {ENTITY.rcs.managementNumber}
                  </Gloss>
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
              label: "Registered activity",
              value: (
                <>
                  {ENTITY.purposeEn}
                  <Gloss>
                    as registered: <span lang="fr">{ENTITY.purpose}</span>
                  </Gloss>
                </>
              ),
            },
            {
              label: "Contact",
              value: (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-accent hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              ),
            },
          ]}
        />
        {/* THE SIÈGE IS A DOMICILIATION ADDRESS. Printing it without saying so
            invites a reader to picture an office at 47 rue Vivienne. The
            domiciliataire is itself a registered company and is named on the
            Kbis, so naming it here costs nothing and forecloses the inference.
            The space above it is the measure track's, not this element's. */}
        <p className="text-small leading-relaxed text-fg-faint">
          The registered office is a domiciliation address provided by{" "}
          {ENTITY.domiciliation.name} (RCS {ENTITY.domiciliation.rcs}). It is
          the company&rsquo;s legal address; it is not a place of business open
          to the public.
        </p>
      </Section>

      {/* ─── DIRECTION ────────────────────────────────────────────────── */}
      <Section
        title="Officers"
        gloss="Who runs the company"
        note={
          <>
            Every officer here is entered on the register, and the filing can be
            read without asking us. The two identifiers below are what return
            it.
          </>
        }
        aside={
          <dl className="space-y-2.5">
            <Fact
              term="Registry"
              value={`R.C.S. ${ENTITY.rcs.registry}`}
              literal
            />
            <Fact
              term="File no."
              value={ENTITY.rcs.managementNumber}
              literal
            />
            {/* An explicit statement of what was left out, because the
                alternative is a reader assuming this is everything the
                register holds about these three people. `entity.ts` makes the
                same point in a comment nobody outside this repository reads. */}
            <Fact
              term="Not carried here"
              value="Dates and places of birth, nationalities"
              qualifier="Recorded by the register for every officer. This page publishes what identifies the company."
            />
          </dl>
        }
      >
        <Rows
          rows={[
            { label: "President", value: ENTITY.officers.president },
            {
              label: "General managers",
              value: ENTITY.officers.generalManagers.join(" · "),
            },
          ]}
        />
      </Section>

      {/* ─── HÉBERGEUR ────────────────────────────────────────────────── */}
      <Section
        title="Hosting"
        gloss="Where this site is served from"
        note={
          <>
            Naming the host is an obligation of the publisher, not of the host.
            Neither company has any part in what this site says, and neither is
            asked to check it. Both are United States companies, which is why
            the addresses given for them are American.
          </>
        }
        aside={
          <dl className="space-y-2.5">
            <Fact term="This site" value={SITE_HOST} literal />
            <Fact
              term="The record"
              value={
                <a
                  href={DATA_REPO_URL}
                  className="text-accent hover:underline"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {repoPath(DATA_REPO_URL)}
                </a>
              }
              literal
            />
          </dl>
        }
      >
        <Rows
          rows={[
            {
              label: "This site",
              value: (
                <>
                  {ENTITY.host.name}
                  <Gloss>{ENTITY.host.address}</Gloss>
                </>
              ),
            },
            {
              label: "The published record",
              value: (
                <>
                  GitHub, Inc.
                  <Gloss>
                    the record itself is served from a public repository: see{" "}
                    <a
                      href={DATA_REPO_URL}
                      className="text-accent hover:underline"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      the data repository
                    </a>
                  </Gloss>
                </>
              ),
            },
          ]}
        />
      </Section>

      {/* ─── WHAT THIS SITE IS ────────────────────────────────────────── */}
      <Section
        title="Purpose"
        gloss="What this site is, and is not"
        note={
          <>
            The paragraph here is the company&rsquo;s own claim. The corporate
            purpose filed at the register is a third party&rsquo;s record of the
            same thing, and it can be read without asking us.
          </>
        }
        /* THE FOUR NEGATIVES, AS A LIST. Not a restatement for its own sake:
           the paragraph makes them in passing, inside a sentence about
           methodology, and a reader who came to this page to find out whether
           anything is being sold to them should not have to parse a sentence
           to learn it. No oxide: that colour marks PAPER, WITHHELD, REFUSED and
           EXCLUDED, and a negative that disqualifies no figure is not one of
           them. */
        aside={
          <dl className="space-y-2.5">
            <Fact
              term="Third-party money"
              value="None managed"
              qualifier="The company is not authorised to manage it."
            />
            <Fact term="Investment advice" value="None given" />
            <Fact term="Offer or solicitation" value="None made" />
            <Fact term="Invitation to invest" value="None" />
          </dl>
        }
      >
        {/* THE REGISTERED PURPOSE IS THE EVIDENCE FOR THE DISCLAIMER. Every
            other page asserts "no third-party money is managed here" in the
            firm's own voice. Here it is a third party's record of it. */}
        <p className="text-body text-fg-muted">
          <span className="text-fg">
            {ENTITY.name} trades its own capital and no one else&rsquo;s.
          </span>{" "}
          That is not only a statement by the company. Its registered corporate
          purpose, as filed, is{" "}
          <em lang="fr">{ENTITY.purpose.replace(/\.$/, "")}</em>: the purchase
          and sale of financial products for its own account. The company does
          not manage third-party money and is not authorised to.
        </p>
        <p className="text-body text-fg-muted">
          This site publishes a record of that trading. Nothing on it is
          investment advice, an offer, or a solicitation to buy or sell any
          financial instrument, and nothing on it is an invitation to invest.
          Past performance is not indicative of future results. The basis on
          which every figure is computed is set out under{" "}
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
      </Section>

      {/* ─── PROPRIÉTÉ INTELLECTUELLE ─────────────────────────────────── */}
      <Section
        title="Intellectual property"
        gloss="What is owned, and what is open"
        aside={
          <dl className="space-y-2.5">
            <Fact
              term="Registered name"
              value={ENTITY.name}
              qualifier="Dénomination sociale, as filed."
            />
            <Fact
              term="Sigle"
              value={ENTITY.short}
              qualifier="Registered alongside the name."
            />
            <Fact
              term="Source of this site"
              value={
                <a
                  href={SITE_REPO_URL}
                  className="text-accent hover:underline"
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {repoPath(SITE_REPO_URL)}
                </a>
              }
              literal
              qualifier="Public, for the same reason the record is."
            />
          </dl>
        }
      >
        <p className="text-body text-fg-muted">
          The name {ENTITY.name}, the {ENTITY.short} mark and the editorial
          content of this site belong to the company. The published record
          itself is deliberately open. Every figure, series and snapshot in it
          is served from{" "}
          <a
            href={DATA_REPO_URL}
            className="text-accent hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            a public repository
          </a>{" "}
          so that anyone can reproduce it, and the{" "}
          <a
            href={SITE_REPO_URL}
            className="text-accent hover:underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            source of this site
          </a>{" "}
          is public for the same reason. A record nobody can copy is a record
          nobody can check.
        </p>
      </Section>

      {/* ─── DONNÉES / COOKIES ────────────────────────────────────────── */}
      <Section
        id="cookies"
        title="Personal data and cookies"
        gloss="Privacy"
        note={
          <>
            This is written from what the site does, not from a template. If an
            analytics script, an embed or a cookie is ever added, this section
            is the first thing that has to change.
          </>
        }
        /* The footer links here. A reader arriving at `#cookies` wants the
           answer, and on a wide screen it is now the first thing level with the
           heading rather than the fourth line of a paragraph. The terms are set
           in words rather than as `localStorage` and `sessionStorage`: the
           margin's terms are uppercased by CSS, and an API name rendered
           LOCALSTORAGE is no longer the string it names. The prose keeps the
           literals. */
        aside={
          <dl className="space-y-2.5">
            <Fact term="Cookies" value="None" />
            <Fact term="Local storage" value="None" />
            <Fact term="Session storage" value="None" />
            <Fact term="Analytics, advertising, tracking" value="None" />
            <Fact
              term="Data held"
              value="Only what you send us"
              qualifier="Your message and your address, for as long as the exchange requires."
            />
          </dl>
        }
      >
        {/* WRITTEN FROM WHAT THE SITE ACTUALLY DOES, not from a template. If
            this ever stops being true — an analytics script, an embed, a
            cookie — this paragraph is the thing that has to change first.
            It went stale once already: it described a `sessionStorage` entry
            written by the title page, and the title page was folded into the
            hero without this notice being revisited. A legal notice
            describing a store the site does not have is the one kind of
            inaccuracy here that is not a matter of taste. */}
        <p className="text-body text-fg-muted">
          <span className="text-fg">This site sets no cookies</span> and carries
          no analytics, no advertising and no third-party tracking. It stores
          nothing in your browser: no cookie, no <code>localStorage</code>{" "}
          entry, no <code>sessionStorage</code> entry. Reading it leaves nothing
          behind on your machine and sends nothing to us.
        </p>
        <p className="text-body text-fg-muted">
          Writing to us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          means we hold your message and your address, for as long as the
          exchange requires. You may ask us for a copy of it or for its deletion
          at that same address.
        </p>
      </Section>
    </div>
  );
}

/** The repository path a reader would type, without the scheme and host. The
 *  full URL does not fit the margin, and the path is the part that identifies
 *  it anyway. */
function repoPath(url: string): string {
  return url.replace(/^https:\/\/github\.com\//, "");
}

type Row = {
  label: string;
  value: ReactNode;
  /** A REGISTERED IDENTIFIER: the RCS number, the SIREN, the EUID, the file
   *  number. Those keep the monospace, because they are retyped into a
   *  register's search box character by character and the mono is what holds 0
   *  apart from O. A name, an address, a date, a legal form or a sentence is
   *  not one of them, however faithfully it is transcribed. */
  literal?: boolean;
};

/**
 * A definition list, not a table: this is the register's own record of the
 * company, and the mono marks the handful of values a reader retypes into the
 * register to get it back.
 *
 * TWO THINGS CHANGED WITH THE GRID. The label column was 220px against an
 * uncapped value column, which inside a full-width page meant a nine-digit
 * SIREN alone in 870px of white; inside the measure track the whole list is
 * 33rem and the labels take 11rem of it. And `font-figure` is no longer on
 * every value: the company name, the officers, the registered office and the
 * two hosts were all set in the mono, and none of them is a string anybody
 * retypes. Setting prose in the monospace is what put a second typeface on a
 * page that has one.
 */
function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="grid gap-y-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-x-6">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-small leading-snug text-fg-faint sm:pt-px">
            {row.label}
          </dt>
          <dd
            className={
              row.literal
                ? "-mt-2.5 font-figure text-small leading-snug text-fg sm:mt-0"
                : "-mt-2.5 text-small leading-snug text-fg sm:mt-0"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The filed French under a translated value, or the detail under an
 *  identifier. Always prose: the value above it may be a literal, but the
 *  sentence explaining it never is. */
function Gloss({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1.5 block font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
      {children}
    </span>
  );
}

/**
 * One fact in a section's margin: a term, the value, and an optional
 * qualification under it.
 *
 * Ruled rather than boxed, like every other edge on the site. The term is at
 * the eyebrow step of the scale but set in the prose face, because the
 * monospace is reserved for literals and a label is not one. `tabular-nums` on
 * every value so the dates and the capital line up down the column; `literal`
 * for the strings that are compared character by character.
 */
function Fact({
  term,
  value,
  qualifier,
  literal = false,
}: {
  term: string;
  value: ReactNode;
  qualifier?: ReactNode;
  literal?: boolean;
}) {
  return (
    <div className="border-t hairline pt-2">
      <dt className="text-label font-medium uppercase text-fg-muted">{term}</dt>
      <dd
        className={
          literal
            ? "mt-1 font-figure text-small leading-snug tabular-nums text-fg"
            : "mt-1 text-small leading-snug tabular-nums text-fg"
        }
      >
        {value}
      </dd>
      {qualifier && (
        <dd className="mt-1 text-caption leading-relaxed text-fg-muted">
          {qualifier}
        </dd>
      )}
    </div>
  );
}
