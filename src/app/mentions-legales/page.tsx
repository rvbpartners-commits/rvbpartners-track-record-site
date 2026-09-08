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
 * THE ROUTE IS FRENCH AND THE HEADINGS ARE FRENCH; the explanations are in
 * English like the rest of the site. That is not indecision. A French reader
 * and a French authority both look for the words "mentions légales", and the
 * identifiers themselves — société par actions simplifiée, RCS, capital social
 * — are terms of art that do not survive translation: "simplified joint-stock
 * company" is not a legal form anyone can look up. So the legal furniture keeps
 * its own language and the prose keeps the site's, with English glosses beside
 * the terms that need them.
 *
 * Every identifier comes from `lib/entity.ts`, which is transcribed from the
 * Kbis. See that file for what was deliberately left out.
 */
export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Legal notice for RVB Partners — company identification, publication director, hosting, and the terms on which this site is published.",
  alternates: { canonical: `${SITE_ORIGIN}/mentions-legales` },
};

export default function MentionsLegales() {
  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="text-[30px] sm:text-[38px] leading-[1.16] tracking-[-0.012em]">
        Mentions légales
      </h1>
      <p className="mt-5 max-w-[68ch] text-[15px] leading-[1.62] text-fg-muted">
        Published under article 6-III of the French law n° 2004-575 of 21 June
        2004 (LCEN) and article R. 123-237 of the code de commerce. Every
        identifier below is transcribed from the company&rsquo;s{" "}
        <em>extrait Kbis</em> and can be checked against the register.
      </p>

      {/* ─── ÉDITEUR ──────────────────────────────────────────────────── */}
      <Section title="Éditeur du site" gloss="Publisher">
        <Rows
          rows={[
            ["Dénomination sociale", ENTITY.name],
            ["Sigle", ENTITY.short],
            [
              "Forme juridique",
              <span key="forme">
                {ENTITY.legalForm}
                <Gloss>{ENTITY.legalFormEn}</Gloss>
              </span>,
            ],
            [
              "Capital social",
              <span key="capital">
                {ENTITY.capital}
                <Gloss>
                  variable, minimum {ENTITY.capitalMinimum}
                </Gloss>
              </span>,
            ],
            ["Siège social", REGISTERED_ADDRESS],
            [
              "Immatriculation",
              <span key="rcs">
                {ENTITY.rcs.number} R.C.S. {ENTITY.rcs.registry}
                <Gloss>
                  registered {ENTITY.rcs.registeredOn} · n° de gestion{" "}
                  {ENTITY.rcs.managementNumber}
                </Gloss>
              </span>,
            ],
            ["SIREN", ENTITY.rcs.siren],
            ["Identifiant européen (EUID)", ENTITY.rcs.euid],
            [
              "Activités principales",
              <span key="purpose">
                {ENTITY.purpose}
                <Gloss>{ENTITY.purposeEn}</Gloss>
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
        <p className="mt-5 max-w-[72ch] text-[12.5px] leading-relaxed text-fg-faint">
          The registered office is a domiciliation address provided by{" "}
          {ENTITY.domiciliation.name} (RCS {ENTITY.domiciliation.rcs}). It is
          the company&rsquo;s legal address; it is not a place of business open
          to the public.
        </p>
      </Section>

      {/* ─── DIRECTION ────────────────────────────────────────────────── */}
      <Section title="Direction" gloss="Officers and publication director">
        <Rows
          rows={[
            ["Président", ENTITY.officers.president],
            [
              "Directeurs généraux",
              ENTITY.officers.generalManagers.join(" · "),
            ],
            [
              "Directeur de la publication",
              <span key="dirpub">
                {ENTITY.publicationDirector}
                <Gloss>as legal representative of the company</Gloss>
              </span>,
            ],
          ]}
        />
        {/* The Kbis records each officer's date and place of birth and their
            nationality. The registry requires that OF THE REGISTRY. Nothing
            requires it on a website, and it is personal data about three named
            individuals published to no purpose — the same judgment the Kbis
            itself makes about their home addresses (art. R. 123-54-1). */}
        <p className="mt-5 max-w-[72ch] text-[12.5px] leading-relaxed text-fg-faint">
          The register also records each officer&rsquo;s date and place of birth
          and their nationality. Those are not reproduced here: no rule requires
          them on a website, and they identify private individuals without
          serving any reader of this one.
        </p>
      </Section>

      {/* ─── HÉBERGEUR ────────────────────────────────────────────────── */}
      <Section title="Hébergeur" gloss="Host">
        <Rows
          rows={[
            [
              "Hébergeur du site",
              <span key="host">
                {ENTITY.host.name}
                <Gloss>{ENTITY.host.address}</Gloss>
              </span>,
            ],
            [
              "Données publiées",
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
      <Section title="Objet du site" gloss="What this site is, and is not">
        <div className="max-w-[72ch] space-y-4 text-[14.5px] leading-[1.62] text-fg-muted">
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
      <Section title="Propriété intellectuelle" gloss="Intellectual property">
        <div className="max-w-[72ch] space-y-4 text-[14.5px] leading-[1.62] text-fg-muted">
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
      <Section title="Données personnelles et cookies" gloss="Privacy">
        <div className="max-w-[72ch] space-y-4 text-[14.5px] leading-[1.62] text-fg-muted">
          {/* WRITTEN FROM WHAT THE SITE ACTUALLY DOES, not from a template. If
              this ever stops being true — an analytics script, an embed, a
              cookie — this paragraph is the thing that has to change first. */}
          <p>
            <span className="text-fg">This site sets no cookies</span> and
            carries no analytics, no advertising and no third-party tracking. It
            stores one thing in your browser: a note that you have already
            passed the title page, kept in <code>sessionStorage</code> so the
            site does not show it to you again in the same session. It is
            cleared when you close the tab, it never leaves your browser, and it
            is never sent to us.
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
      <h2 className="font-figure text-[10.5px] font-medium uppercase tracking-[0.15em] text-fg-faint">
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
          <dt className="text-[13px] leading-snug text-fg-faint sm:pt-px">
            {label}
          </dt>
          <dd className="font-figure text-[13.5px] leading-snug text-fg -mt-2.5 sm:mt-0">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Gloss({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 block font-[family-name:var(--font-prose)] text-[12.5px] leading-snug text-fg-faint">
      {children}
    </span>
  );
}
