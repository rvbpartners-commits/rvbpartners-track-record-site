import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Next } from "@/components/Next";
import { Section } from "@/components/Section";
import { CONTACT_EMAIL, SITE_ORIGIN, getIndex } from "@/lib/data";
import { ENTITY } from "@/lib/entity";
import { NO_VALUE, date } from "@/lib/format";

/**
 * The firm: what the company does, how it is registered, and the vocabulary
 * this record uses. Registered details are summarised here and given in full
 * on /legal; officers and their responsibilities are on /team.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The firm",
  description:
    "What RVB Partners does, how it is registered, and the vocabulary this " +
    "record uses.",
  alternates: { canonical: `${SITE_ORIGIN}/firm` },
};

export default async function FirmPage() {
  const index = await getIndex();
  const books = index?.books ?? [];

  // HOW CURRENT THE RECORD IS, selected and never computed: the newest
  // `last_session` any book published, the same expression the masthead uses.
  const currentTo =
    books
      .map((b) => b.last_session)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  return (
    <div className="pt-2 lg:pt-6">
      <div className="grid gap-x-11 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,var(--margin))] lg:items-start">
        <div>
          <h1 className="max-w-[24ch] text-title sm:text-title">The firm</h1>
          <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
            What RVB Partners does, how it is registered, and the terms used
            across this site.
          </p>
        </div>
        {index && (
          <MarginList
            rows={[
              { label: "Portfolios published", value: int(books.length) },
              { label: "Chained records", value: int(index.chain?.entries) },
              { label: "Newest marked session", value: date(currentTo) },
            ]}
          />
        )}
      </div>

      <Section first title="What the company does" gloss="In one paragraph">
        <p className="text-body text-fg-muted">
          RVB Partners researches systematic trading strategies and trades them
          on its own capital. A strategy is tested by the same framework that
          later places its orders, under one cost structure, one execution delay
          and one computation for every metric, so the rules a result was
          measured under do not change on its way to an account. What that
          produces is published here, session by session, as it is marked.
        </p>
      </Section>

      <Section title="Registration" gloss="The company in brief">
        <p className="text-body text-fg-muted">
          {ENTITY.name} is a <span lang="fr">société par actions simplifiée</span>{" "}
          registered in {ENTITY.rcs.registry} ({ENTITY.rcs.number} R.C.S.{" "}
          {ENTITY.rcs.registry}). Its registered activity is the purchase and
          sale of financial products for its own account, and it manages no
          third-party money. Its officers and their responsibilities are set out
          on the{" "}
          <Link href="/team" className="text-accent hover:underline">
            team page
          </Link>
          , and its full registered details in the{" "}
          <Link href="/legal" className="text-accent hover:underline">
            legal notice
          </Link>
          .
        </p>
      </Section>

      {/* Terms this record uses in a narrower sense than a reader would
          assume, defined once here with stable ids so other pages can link a
          term (/firm#paper-account) instead of re-explaining it. */}
      <Section title="Vocabulary" gloss="Six terms, defined once">
        <dl className="space-y-7">
          <Term id="rvb-partners" term="RVB Partners">
            The company. It is registered in Paris, and it is the party
            accountable for everything published on this site.
          </Term>

          <Term id="the-desk" term="The desk">
            The software the company runs. After each close it computes signals
            and nets them into an order plan; at the next open it submits that
            plan; after the following close it sweeps late fills, values the
            positions and records the broker&rsquo;s account equity; then it
            archives the session.
          </Term>

          <Term id="paper-account" term="A paper account">
            A real broker account trading live market prices with simulated
            money: the orders and fills are the broker&rsquo;s, the money is
            not. Each portfolio&rsquo;s page states whether its account is a
            paper account or trades the firm&rsquo;s own capital.
          </Term>

          <Term id="marked" term="Marked">
            A session is marked once the desk has closed it out: late fills
            swept, positions valued, and the broker&rsquo;s own account equity
            taken as that session&rsquo;s net asset value. A curve ends at the
            last marked close; the newest broker reading on a portfolio page is
            shown separately.
          </Term>

          <Term id="chained" term="Chained">
            Each marked session is written to a record carrying the SHA-256 of
            its own contents and the hash of the previous session&rsquo;s
            record, so a published number cannot be edited, or a session
            removed, without breaking every record after it. The checks are set
            out under{" "}
            <Link href="/verify" className="text-accent hover:underline">
              verify
            </Link>
            .
          </Term>

          <Term id="attributed" term="Attributed">
            A per-strategy or per-category figure that is modelled rather than
            measured. The broker nets the desk&rsquo;s orders, so each net fill
            is attributed back to the strategies that contributed to it,
            pro-rata by requested size. Account-level figures are read from the
            broker and do not depend on the attribution.
          </Term>
        </dl>
      </Section>

      <Section title="How to reach us" gloss="One address">
        <p className="text-body text-fg-muted">
          Write to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          . Further details are on the{" "}
          <Link href="/contact" className="text-accent hover:underline">
            contact page
          </Link>
          .
        </p>
      </Section>

      <Next
        items={[
          {
            href: "/team",
            label: "Meet the team",
            question:
              "Who answers for the research, the framework and the published record.",
          },
          {
            href: "/approach",
            label: "How we invest",
            question:
              "What the firm optimises for, and how a strategy becomes a funded portfolio.",
          },
          {
            href: "/portfolios",
            label: "See the portfolios",
            question:
              "Every published account, its kind, its history and its return.",
          },
        ]}
      />
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

