import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Next } from "@/components/Next";
import { Section } from "@/components/Section";
import { SITE_ORIGIN } from "@/lib/data";
import { roster } from "@/lib/team";

/**
 * THE PEOPLE.
 *
 * THE PAGE THE SITE DID NOT HAVE. Seven routes answered *how do we know these
 * numbers are real* and none answered *who is this*. The officers appeared once,
 * on /firm, as two rows of a register transcript — which identifies them and
 * tells a reader nothing: a name under the heading "Officers" is a legal fact,
 * not an introduction.
 *
 * NOT BIOGRAPHIES. Three or four lines each, and every one of them is about a
 * part of the system the rest of this site documents — who answers for the
 * catalogue, who answers for the framework it all runs on. Where anyone
 * studied is not a fact this record can verify, so it is not published; the
 * same standard the figures are held to.
 *
 * NO HEADCOUNT, NO PHOTOGRAPHS, NO TITLES THE REGISTER DOES NOT CARRY. The
 * roster is derived from `ENTITY.officers` in `lib/team` — this page cannot
 * name anyone the Kbis does not. A firm whose whole argument is that its
 * numbers are checkable does not get to have an unverifiable team page.
 */
export const metadata: Metadata = {
  title: "Team",
  description:
    "RVB Partners is built as a research team: who answers for the strategy " +
    "catalogue, for the framework it runs on, and for the record this site " +
    "publishes.",
  alternates: { canonical: `${SITE_ORIGIN}/team` },
};

export default function TeamPage() {
  const members = roster();

  return (
    <div className="pt-2 lg:pt-6">
      <header>
        <h1 className="text-heading sm:text-title font-semibold tracking-tight leading-tight">
          Team
        </h1>
        <p className="mt-3 text-body text-fg-muted leading-relaxed">
          RVB is built as a research team, not around a single strategy or a
          single researcher. Research, strategy development and production
          infrastructure sit inside one group and one codebase, which is what
          lets a result found in research be run on an account without being
          rebuilt on the way.
        </p>
      </header>

      <div className="text-body">
        {/* No margin, and the reason is the content: three people at full
            width. A figure hung beside them would be a figure about something
            else. */}
        <Section
          first
          id="officers"
          title="Who does what"
          gloss="The officers, and the part each answers for."
        >
          <ul className="mt-1 grid gap-x-10 gap-y-9 lg:grid-cols-3">
            {members.map((m) => (
              <li key={m.registered} className="border-t hairline pt-5">
                <h3 className="text-subhead font-semibold text-fg">
                  {m.display}
                </h3>
                <p className="mt-1 text-small text-fg-muted">{m.title}</p>
                {m.area && (
                  <p className="mt-3 inline-block border hairline px-1.5 py-px text-caption leading-[1.6] text-fg-faint">
                    {m.area}
                  </p>
                )}
                {m.description && (
                  <p className="mt-3.5 text-small leading-relaxed text-fg-muted">
                    {m.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="how"
          title="How the work is divided"
          gloss="Three areas, one codebase."
          aside={
            <MarginBlock label="The three areas">
              <Area
                name="Research"
                what="Finding ideas, testing them, and recording every test."
              />
              <Area
                name="Strategy development"
                what="Turning a surviving result into something that can be traded, weighted and retired."
              />
              <Area
                name="Production"
                what="The framework, the desk, and the systems that publish this record."
              />
            </MarginBlock>
          }
        >
          <p>
            The work is distributed rather than owned. Every portfolio published
            on this site was built collectively: no book is one person&rsquo;s
            idea run on one person&rsquo;s account, and no strategy enters a
            portfolio without being measured against everything else the firm
            has already searched.
          </p>
          <p>
            What keeps that honest is that there is only one instrument. The
            same metrics module computes a Sharpe ratio in research and on the
            desk, the same accounting engine applies the same execution delay
            and the same cost treatment to both, and the live path re-uses the
            research path rather than re-implementing it. Two people can
            disagree about a strategy; they cannot see two different numbers for
            the same returns.
          </p>
          <p>
            Every change to the framework, the catalogue and this site is
            versioned and reviewed. That is not a process claim — it is why the
            published record can be re-derived at all.
          </p>
        </Section>

        {/* NO MARGIN, AND THE REASON IS THE SECTION. Four lines and one
            pointer: a figure hung beside them would be a figure repeated from
            somewhere else on the site for the sake of filling a column, which
            is what the third track exists not to be. */}
        <Section
          id="scale"
          title="What the firm is, at this size"
          gloss="Stated rather than implied."
        >
          <p className="text-small leading-relaxed text-fg-muted">
            RVB Partners is a small firm trading its own capital. It manages no
            third-party money, employs no sales function, and makes no claim to
            a size it does not have. The officers above are the people who do
            the work; the register entry behind them is published in full on the{" "}
            <a href="/legal" className="text-accent hover:underline">
              legal notice
            </a>
            .
          </p>
        </Section>
      </div>

      <Next
        items={[
          {
            href: "/approach",
            label: "How we invest",
            question:
              "What the firm optimises for beyond return, and how a strategy becomes a portfolio.",
          },
          {
            href: "/research",
            label: "How we research",
            question:
              "How much was searched, and the bar every result is measured against.",
          },
          {
            href: "/firm",
            label: "The firm",
            question:
              "The company, its registered details, and the terms used on this site.",
          },
        ]}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   PIECES
   ───────────────────────────────────────────────────────────────────── */

function MarginBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="border-b hairline pb-2 text-label font-medium uppercase tracking-[0.13em] text-fg-faint">
        {label}
      </h3>
      <dl className="mt-3">{children}</dl>
    </div>
  );
}

function Area({ name, what }: { name: string; what: string }) {
  return (
    <div className="border-b hairline py-2 last:border-b-0">
      <dt className="text-caption font-medium text-fg">{name}</dt>
      <dd className="text-caption leading-snug text-fg-muted">{what}</dd>
    </div>
  );
}
