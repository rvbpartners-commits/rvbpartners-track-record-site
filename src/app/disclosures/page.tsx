import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { bookSlug, REPO_URL, getIndex, type BookSummary } from "@/lib/data";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Disclosures",
  description:
    "The specific, measured limitations of this track record — published " +
    "beside the data, and stamped per book into the published records.",
};

const SEVERITY: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "text-down" },
  important: { label: "Important", className: "text-warn-fg" },
  note: { label: "Note", className: "text-fg-faint" },
};

/**
 * Who a disclosure is true of.
 *
 * THIS MAP HAD NO "all" KEY, AND THAT WAS THE WHOLE BUG. The page rendered
 * `AUDIENCE[d.applies_to ?? "all"] && …`, so an item published without
 * `applies_to` resolved to `undefined`, the guard was falsy, and NO audience
 * caption rendered for ANY item — while a CRITICAL "no capital is at risk"
 * block sat unqualified on a page that also publishes a book trading real
 * money. A missing field was indistinguishable from a universal claim, which is
 * exactly the failure the file's own comment warned about.
 *
 * So: "all" is an explicit, rendered label, and an unscoped item on a record of
 * mixed account kinds is a LOUD failure rather than a silent one. See
 * `audienceFor`.
 */
const AUDIENCE: Record<string, string> = {
  all: "Applies to every portfolio on this site",
  paper: "Applies to the paper-account portfolios",
  real_capital: "Applies to the real-capital portfolio",
};

/** The account kind of a book, from the field the publisher writes, falling
 *  back to the risk flag. Both are published; neither is inferred from a name. */
function kindOf(b: BookSummary): string {
  return b.account_kind ?? (b.capital_at_risk ? "real_capital" : "paper");
}

/** A body that denies any capital is at risk. Matched on the published text
 *  because that is the claim a real-capital book contradicts; an item that does
 *  not match still gets the generic unscoped warning below, so this test can
 *  only ever add scrutiny, never remove it. */
const DENIES_RISK = /no capital is at risk|no real money is invested/i;

/** A body claiming the per-strategy attribution adds up to the book. It does
 *  not, on any published session of any book — see the correction below. */
const CLAIMS_ATTRIBUTION_CLOSES = /sums? to the book/i;

/**
 * Rendered from the SAME source the publisher stamps into the per-book records,
 * so the page and the data cannot drift apart. If this list is ever shorter than
 * the one in the records, that is a bug and not an editorial decision.
 */
export default async function DisclosuresPage() {
  const index = await getIndex();
  const disclosures = index?.disclosures ?? [];
  const books = index?.books ?? [];

  // Derived from the DATA, as a defence against the field going missing again.
  // The publisher is meant to scope each item; when it does not, this is what
  // lets the page say which books the record actually contains instead of
  // letting an unscoped critical claim stand over all of them.
  const kinds = new Set(books.map(kindOf));
  const mixedKinds = kinds.size > 1;
  const realCapital = books.filter((b) => kindOf(b) === "real_capital");
  const unscoped = disclosures.filter((d) => !d.applies_to);
  const unscopedRisk = unscoped.filter((d) => DENIES_RISK.test(d.body_en));

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Disclosures
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          These are not boilerplate. Each one is a specific limitation of this
          track record. Every published record in the{" "}
          <a
            className="text-accent hover:underline"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            data repository
          </a>{" "}
          also carries its own per-book disclosure block — including whether that
          book&rsquo;s capital is real — so a reader who only ever touches the raw
          JSON gets the caveats that apply to the book in front of them.
        </p>
      </header>

      {/* Fail LOUDLY, not silently. An unscoped item on a record that publishes
          both simulated and real-capital books is a publishing defect, and the
          page's job is to make it visible rather than to render a blanket claim
          under a heading a reader trusts. */}
      {mixedKinds && unscoped.length > 0 && (
        <Note tone="warn" className="mt-8">
          <strong className="font-semibold">
            {unscoped.length === 1
              ? "One disclosure below is published without a scope."
              : `${unscoped.length} disclosures below are published without a scope.`}
          </strong>{" "}
          This record contains portfolios of more than one kind — broker-simulated
          paper accounts and{" "}
          {realCapital.length === 1 ? "a portfolio" : "portfolios"} trading real
          capital
          {realCapital.length > 0 && (
            <>
              {" ("}
              {realCapital.map((b, i) => (
                <span key={b.book}>
                  {i > 0 ? ", " : ""}
                  <Link
                    className="underline underline-offset-2"
                    href={`/portfolios/${bookSlug(b)}`}
                  >
                    {b.label}
                  </Link>
                </span>
              ))}
              {")"}
            </>
          )}
          . An item carrying no audience cannot be read as a statement about all
          of them, and this page will not present it as one.
          {unscopedRisk.length > 0 && (
            <>
              {" "}
              <strong className="font-semibold">
                In particular, a &ldquo;no capital is at risk&rdquo; statement
                below is not true of{" "}
                {realCapital.length === 1
                  ? "the real-capital portfolio"
                  : "the real-capital portfolios"}
                .
              </strong>{" "}
              Each portfolio&rsquo;s own page and each published record state which
              kind of account it is; those are the authority here.
            </>
          )}
        </Note>
      )}

      <div className="mt-12 space-y-12 max-w-[80ch]">
        {disclosures.map((d) => {
          const sev = SEVERITY[d.severity] ?? SEVERITY.note;
          const audience = audienceFor(d.applies_to, mixedKinds);
          return (
            <section key={d.id} className="border-t hairline pt-6">
              <div
                className={`text-[11px] ${sev.className}`}
              >
                {sev.label}
              </div>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight leading-snug">
                {d.title_en}
              </h2>
              <div
                className={`mt-1.5 text-[12px] ${
                  audience.warn ? "text-warn-fg" : "text-fg-faint"
                }`}
              >
                {audience.label}
              </div>
              {/* English only. The published records carry a French field as
                  well, but this site is not bilingual: a translation printed
                  under every paragraph doubles the length of the page a reader
                  has to get through to reach the caveat that matters. */}
              <p className="mt-3 text-[14px] leading-relaxed">{d.body_en}</p>
              {audience.warn && DENIES_RISK.test(d.body_en) && (
                <p className="mt-3 text-[13px] leading-relaxed text-warn-fg">
                  This statement is published with no audience and is not true of
                  every portfolio in this record. It does not apply to{" "}
                  {realCapital.map((b, i) => (
                    <span key={b.book}>
                      {i > 0 ? ", " : ""}
                      <Link
                        className="underline underline-offset-2"
                        href={`/portfolios/${bookSlug(b)}`}
                      >
                        {b.label}
                      </Link>
                    </span>
                  ))}
                  {realCapital.length === 1
                    ? ", which trades real capital."
                    : ", which trade real capital."}
                </p>
              )}
              {/* The attribution claim is republished here verbatim from the
                  index, and it does not hold: summed per date, the published
                  per-category contributions do not reach the broker's own daily
                  return for the book, and on some sessions they carry the
                  opposite sign. The body cannot be edited from this repository,
                  so the correction is printed beneath it rather than left for a
                  reader to discover. */}
              {CLAIMS_ATTRIBUTION_CLOSES.test(d.body_en) && (
                <p className="mt-3 text-[13px] leading-relaxed text-warn-fg">
                  Correction: the attribution does <em>not</em> sum to the book.
                  The published per-category contributions are weighted
                  per-strategy returns and, added up for a session, they differ
                  from that book&rsquo;s own broker-measured daily return —
                  sometimes with the opposite sign. Book-level equity and returns
                  are unaffected: they are read from the broker and never
                  reconstructed from the attribution.
                </p>
              )}
            </section>
          );
        })}

        {disclosures.length === 0 && (
          <p className="text-[14px] text-fg-muted">
            Disclosures could not be loaded from the data repository.
          </p>
        )}
      </div>

      <section className="mt-16 border-t hairline pt-6 max-w-[80ch]">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Regulatory status
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
          RVB is a French entity. Publicly presenting performance may
          engage AMF and EU marketing rules even where the accounts are simulated
          and no service is offered. No regulatory assessment has been obtained
          for this site, and nothing here should be read as a claim that one has.
          If you are a regulator or counsel and something on this site needs to
          change, please get in touch.
        </p>
      </section>
    </>
  );
}

/**
 * The caption under a disclosure's title, and whether it is a warning.
 *
 * An unknown `applies_to` value still renders — labelled with the raw value —
 * because printing nothing is how the original bug hid. An ABSENT `applies_to`
 * is only read as "everything" when the record contains one kind of account; on
 * a mixed record it is read as what it is, an unscoped claim.
 */
function audienceFor(
  appliesTo: string | undefined,
  mixedKinds: boolean,
): { label: string; warn: boolean } {
  if (appliesTo) {
    return {
      label: AUDIENCE[appliesTo] ?? `Applies to: ${appliesTo}`,
      warn: false,
    };
  }
  if (!mixedKinds) return { label: AUDIENCE.all, warn: false };
  return {
    label: "Published without an audience — see the notice above",
    warn: true,
  };
}
