import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, DATA_REPO_URL, SITE_ORIGIN, SITE_REPO_URL } from "@/lib/data";
import { ENTITY, REGISTERED_ADDRESS } from "@/lib/entity";

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
 */
export const metadata: Metadata = {
  title: "Legal notice",
  description:
    "Legal notice for RVB Partners — company identification, officers, hosting, and the terms on which this site is published.",
  alternates: { canonical: `${SITE_ORIGIN}/legal` },
};

export default function LegalNotice() {
  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="text-title sm:text-title">
        Legal notice
      </h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        The <em>mentions légales</em> required of a French company publishing a
        website, under article 6-III of law n° 2004-575 of 21 June 2004 (LCEN)
        and article R. 123-237 of the code de commerce. Every identifier below
        is transcribed from the company&rsquo;s <em>extrait Kbis</em> and can be
        checked against the register, where it appears in French.
      </p>

      {/* ─── ÉDITEUR ──────────────────────────────────────────────────── */}
      <Section title="The company" gloss="Publisher of this site">
        <Rows
          rows={[
            ["Company name", ENTITY.name],
            ["Short name", ENTITY.short],
            [
              "Legal form",
              <span key="forme">
                {ENTITY.legalFormEn}
                <Gloss>as registered: {ENTITY.legalForm}</Gloss>
              </span>,
            ],
            [
              "Share capital",
              <span key="capital">
                {ENTITY.capital}
                <Gloss>
                  variable, minimum {ENTITY.capitalMinimum}
                </Gloss>
              </span>,
            ],
            ["Registered office", REGISTERED_ADDRESS],
            [
              "Registration",
              <span key="rcs">
                {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry}
                <Gloss>
                  entered on the register {ENTITY.rcs.registeredOn} · file no.{" "}
                  {ENTITY.rcs.managementNumber}
                </Gloss>
              </span>,
            ],
            ["SIREN", ENTITY.rcs.siren],
            ["European identifier (EUID)", ENTITY.rcs.euid],
            [
              "Registered activity",
              <span key="purpose">
                {ENTITY.purposeEn}
                <Gloss>as registered: {ENTITY.purpose}</Gloss>
              </span>,
            ],
            [
              "Contact",
              <a
                key="contact"
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-accent hover:underline"
              >
                {CONTACT_EMAIL}
              </a>,
            ],
          ]}
        />
        {/* THE SIÈGE IS A DOMICILIATION ADDRESS. Printing it without saying so
            invites a reader to picture an office at 47 rue Vivienne. The
            domiciliataire is itself a registered company and is named on the
            Kbis, so naming it here costs nothing and forecloses the inference. */}
        <p className="mt-5 max-w-[72ch] text-small leading-relaxed text-fg-faint">
          The registered office is a domiciliation address provided by{" "}
          {ENTITY.domiciliation.name} (RCS {ENTITY.domiciliation.rcs}). It is
          the company&rsquo;s legal address; it is not a place of business open
          to the public.
        </p>
      </Section>

      {/* ─── DIRECTION ────────────────────────────────────────────────── */}
      <Section title="Officers" gloss="Who runs the company">
        <Rows
          rows={[
            ["President", ENTITY.officers.president],
            [
              "General managers",
              ENTITY.officers.generalManagers.join(" · "),
            ],
          ]}
        />
      </Section>

      {/* ─── HÉBERGEUR ────────────────────────────────────────────────── */}
      <Section title="Hosting" gloss="Where this site is served from">
        <Rows
          rows={[
            [
              "This site",
              <span key="host">
                {ENTITY.host.name}
                <Gloss>{ENTITY.host.address}</Gloss>
              </span>,
            ],
            [
              "The published record",
              <span key="data-host">
                GitHub, Inc.
                <Gloss>
                  the record itself is served from a public repository — see{" "}
                  <a
                    href={DATA_REPO_URL}
                    className="text-accent hover:underline"
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    the data repository
                  </a>
                </Gloss>
              </span>,
            ],
          ]}
        />
      </Section>

      {/* ─── WHAT THIS SITE IS ────────────────────────────────────────── */}
      <Section title="Purpose" gloss="What this site is, and is not">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          {/* THE REGISTERED PURPOSE IS THE EVIDENCE FOR THE DISCLAIMER. Every
              other page asserts "no third-party money is managed here" in the
              firm's own voice. Here it is a third party's record of it. */}
          <p>
            <span className="text-fg">
              {ENTITY.name} trades its own capital and no one else&rsquo;s.
            </span>{" "}
            That is not only a statement by the company: its registered
            corporate purpose, as filed, is{" "}
            <em>{ENTITY.purpose.replace(/\.$/, "")}</em> — the purchase and sale
            of financial products for its own account. The company does not
            manage third-party money and is not authorised to.
          </p>
          <p>
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
        </div>
      </Section>

      {/* ─── PROPRIÉTÉ INTELLECTUELLE ─────────────────────────────────── */}
      <Section title="Intellectual property" gloss="What is owned, and what is open">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          <p>
            The name {ENTITY.name}, the {ENTITY.short} mark and the editorial
            content of this site belong to the company. The published record
            itself — every figure, series and snapshot — is deliberately open:
            it is served from{" "}
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
        </div>
      </Section>

      {/* ─── DONNÉES / COOKIES ────────────────────────────────────────── */}
      <Section title="Personal data and cookies" gloss="Privacy">
        <div className="max-w-[72ch] space-y-4 text-body text-fg-muted">
          {/* WRITTEN FROM WHAT THE SITE ACTUALLY DOES, not from a template. If
              this ever stops being true — an analytics script, an embed, a
              cookie — this paragraph is the thing that has to change first.
              It went stale once already: it described a `sessionStorage` entry
              written by the title page, and the title page was folded into the
              hero without this notice being revisited. A legal notice
              describing a store the site does not have is the one kind of
              inaccuracy here that is not a matter of taste. */}
          <p>
            <span className="text-fg">This site sets no cookies</span> and
            carries no analytics, no advertising and no third-party tracking. It
            stores nothing in your browser: no cookie, no{" "}
            <code>localStorage</code> entry, no <code>sessionStorage</code>{" "}
            entry. Reading it leaves nothing behind on your machine and sends
            nothing to us.
          </p>
          <p>
            Writing to us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            means we hold your message and your address, for as long as the
            exchange requires. You may ask us for a copy of it or for its
            deletion at that same address.
          </p>
        </div>
      </Section>
    </div>
  );
}

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
      <h2 className="font-figure text-label font-medium uppercase tracking-[0.15em] text-fg-faint">
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

function Gloss({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 block font-[family-name:var(--font-prose)] text-small leading-snug text-fg-faint">
      {children}
    </span>
  );
}
