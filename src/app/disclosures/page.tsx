import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { NO_VALUE, slugLabel } from "@/lib/format";
import {
  bookSlug,
  CONTACT_EMAIL,
  REPO_URL,
  getFeedByAccountKind,
  getIndex,
  type BookSummary,
} from "@/lib/data";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Disclosures",
  description:
    "The specific, measured limitations of this track record, published " +
    "beside the data and stamped per book into the published records.",
};

/**
 * The rank of an item, and how it is set.
 *
 * NO HUE AT ALL, AND THAT IS THE POINT. "Critical" was first set in
 * `text-down`: `--down` is the colour of a LOSING RETURN and means the sign of
 * a number, nothing else, so on a rank — which has no sign — the red said
 * nothing while spending a colour the data owns. It was then set in
 * `text-oxide`, which is the same mistake one colour along. `--oxide` is
 * reserved for four NEGATIVE FACTS — PAPER, WITHHELD, REFUSED, EXCLUDED — and
 * a severity is not one of them: it is an editorial rank the publisher assigns,
 * and the live record puts "critical" on "Past performance is not indicative of
 * future results", boilerplate that disqualifies no figure on this page. Ruling
 * out `--down` is an argument against red; it is not an argument for oxide.
 *
 * So the three ranks are three steps of weight and ink, the way the lower two
 * already were. That reads down a nine-item page perfectly well and leaves the
 * reserved colour for the fact that earns it.
 */
const SEVERITY: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "text-fg font-semibold" },
  important: { label: "Important", className: "text-fg font-medium" },
  note: { label: "Note", className: "text-fg-muted" },
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
 *
 * EACH ITEM IS A SECTION, and its metadata lives in the margin. Every
 * disclosure used to stack four one-line blocks above its body — the rank, the
 * title, the audience, then the prose — at three sizes in three colours inside
 * one 80ch column, so the right half of the page was white for the full height
 * of nine items and the rank of an item was only legible once you had scrolled
 * to it. Rank, audience and the evidence behind an item are now a ruled list
 * beside the body, which is what makes severity scannable down the whole page
 * and the three states (scoped, unscoped, undeterminable) visible at a glance
 * rather than buried in a caption.
 */
export default async function DisclosuresPage() {
  const index = await getIndex();
  const disclosures = index?.disclosures ?? [];
  const books = index?.books ?? [];
  // The feed each account kind's fills were priced against. It is stamped into
  // every snapshot and into none of these disclosure bodies, which is why a
  // reader of this page — the page whose whole job is the caveats — never met
  // the most material caveat there is about a simulated fill. Read from the
  // evidence, and rendered in the margin of the disclosure it is true of.
  const feeds = await getFeedByAccountKind(books);

  // Derived from the DATA, as a defence against the field going missing again.
  // The publisher is meant to scope each item; when it does not, this is what
  // lets the page say which books the record actually contains instead of
  // letting an unscoped critical claim stand over all of them.
  const kinds = new Set(books.map(kindOf));
  const mixedKinds = kinds.size > 1;
  const realCapital = books.filter((b) => kindOf(b) === "real_capital");
  const unscoped = disclosures.filter((d) => !d.applies_to);
  const unscopedRisk = unscoped.filter((d) => DENIES_RISK.test(d.body_en));

  // Two published thresholds that two of the items below also state in prose.
  // Read from the index rather than parsed back out of a sentence, so the
  // figure in the margin is the same field the publisher actually gates on and
  // the two cannot drift. Neither is computed here; both are read.
  const gate = index?.min_sessions_for_annualised;
  const lagDays = index?.detail_lag_days;

  // THE RELEASE RULE, WITH ITS THREE STATES KEPT APART. `detail_lag_days` is
  // published as 0, and this page rendered that as "DETAIL LAG / 0 days" beside
  // the item headed "Everything is published as soon as it is real" — the exact
  // defect /methodology documents ("'held back for 0 days' was literally what
  // this rendered") and had already fixed. A published ZERO is a stated policy
  // of no lag, an unread index is an absence, and a positive lag is a floor in
  // days. The expression is the one /methodology uses, word for word, so the
  // two pages state one policy; it belongs in `lib/format.ts` so they cannot
  // diverge a third time, and that file is not this file's to edit.
  const detailRelease =
    typeof lagDays !== "number"
      ? NO_VALUE
      : lagDays === 0
        ? "No lag"
        : `${lagDays} ${lagDays === 1 ? "day" : "days"}`;

  return (
    <>
      <header>
        <h1 className="text-heading sm:text-title font-semibold">Disclosures</h1>
        {/* Outside every Section, so this one keeps a width of its own — set
            from the grid rather than a hand-written `ch` cap, so the page
            header and the prose below it are one width and not two. */}
        <p className="mt-2 text-body text-fg-muted">
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
          also carries its own per-book disclosure block, including whether that
          book&rsquo;s capital is real. A reader who only ever touches the raw
          JSON therefore gets the caveats that apply to the book in front of
          them.
        </p>
      </header>

      {/* Fail LOUDLY, not silently. An unscoped item on a record that publishes
          both simulated and real-capital books is a publishing defect, and the
          page's job is to make it visible rather than to render a blanket claim
          under a heading a reader trusts. */}
      {mixedKinds && unscoped.length > 0 && (
        <div className="mt-8">
          <Note tone="warn">
            <strong className="font-semibold">
              {unscoped.length === 1
                ? "One disclosure below is published without a scope."
                : `${unscoped.length} disclosures below are published without a scope.`}
            </strong>{" "}
            This record contains portfolios of more than one kind:
            broker-simulated paper accounts and{" "}
            {realCapital.length === 1 ? "a portfolio" : "portfolios"} trading
            real capital
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
            . An item carrying no audience cannot be read as a statement about
            all of them, and this page will not present it as one.
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
                Each portfolio&rsquo;s own page and each published record state
                which kind of account it is; those are the authority here.
              </>
            )}
          </Note>
        </div>
      )}

      {disclosures.map((d) => {
        const sev = SEVERITY[d.severity] ?? SEVERITY.note;
        const audience = audienceFor(d.applies_to, mixedKinds);
        const scope = scopeOf(d.applies_to, mixedKinds, books, kinds);
        const feed = d.applies_to ? feeds.get(d.applies_to) : undefined;
        return (
          <Section
            key={d.id}
            id={d.id}
            /* THE RAIL IS 172px AND IS NOT WHERE A SENTENCE GOES. This passed
               `d.title_en`, and the Section sets its title at `text-caption`,
               uppercase, tracked 0.12em: "Annualised statistics are withheld
               until there is enough history" is 64 characters, about 520px of
               tracked all-caps, so it wrapped to four lines in a column built
               for a two-word section name — and below `lg`, where the rail is
               full width, it opened every item with a block of shouting. The
               rail carries the KEY the item is published under, prettified;
               the headline is restored to the measure below at the size a
               headline has. Derived from the id rather than a written-out map
               so a newly published item cannot arrive without a rail label. */
            title={slugLabel(d.id)}
            /* The published body says fills are "simulated by the broker's
               paper engine against its market data" and stops there. WHICH
               market data is the whole question, and every snapshot answers
               it. The argument is annotation, so it sits in the margin; the
               feed itself is a fact read from the evidence and is set below it
               at full size and full contrast, not demoted to a footnote. */
            note={
              feed ? (
                <>
                  The market data behind those simulated fills is named below,
                  and stamped into every published record for these books. A
                  feed carrying a few percent of consolidated volume prints
                  fewer quotes, and wider ones, than the tape a real order
                  meets. A fill simulated against it is not interchangeable
                  with one that happened.
                </>
              ) : undefined
            }
            aside={
              <dl className="space-y-2.5">
                <Fact term="Severity" value={sev.label} tone={sev.className} />
                <Fact
                  term="Applies to"
                  value={
                    scope === null ? (
                      NO_VALUE
                    ) : (
                      <span className="tabular-nums">
                        {scope.length} of {books.length}{" "}
                        {books.length === 1 ? "portfolio" : "portfolios"}
                      </span>
                    )
                  }
                  tone={scope === null ? "text-fg-faint" : undefined}
                  qualifier={
                    <span className={audience.warn ? "text-warn-fg" : undefined}>
                      {audience.label}
                    </span>
                  }
                />
                {feed && <Fact term="Market data" value={feed} />}
                {d.id === "short_history" && typeof gate === "number" && (
                  <Fact
                    term="Withheld until"
                    value={
                      <>
                        <span className="tabular-nums">{gate}</span> marked
                        sessions
                      </>
                    }
                    qualifier="The gate the publisher applies, read from the index rather than from the paragraph it qualifies."
                  />
                )}
                {d.id === "detail_lag" && (
                  <Fact
                    term="Detail lag"
                    value={
                      <span className="tabular-nums">{detailRelease}</span>
                    }
                    tone={
                      detailRelease === NO_VALUE ? "text-fg-faint" : undefined
                    }
                    qualifier={
                      detailRelease === NO_VALUE
                        ? "The index could not be read. The release rule is unknown here, which is not the same as a policy of none."
                        : "Declared in the index, and applied to every published record."
                    }
                  />
                )}
                {/* A literal: the key this item is published under, and the
                    anchor for this section. Someone reading the raw JSON
                    compares it character by character, which is the one thing
                    left on this site that earns the monospace. */}
                <Fact
                  term="Identifier"
                  value={<span className="mono">{d.id}</span>}
                />
              </dl>
            }
          >
            {/* The disclosure's own headline, at the step of the scale an item
                title takes, in the track prose lives in. Set here rather than
                in the rail so a critical caveat is not typographically
                identical to the words "REGULATORY STATUS" further down. */}
            <h3 className="text-subhead font-semibold text-fg">{d.title_en}</h3>
            {/* English only. The published records carry a French field as
                well, but this site is not bilingual: a translation printed
                under every paragraph doubles the length of the page a reader
                has to get through to reach the caveat that matters. */}
            <p className="text-body">{d.body_en}</p>
            {audience.warn && DENIES_RISK.test(d.body_en) && (
              <p className="text-small text-warn-fg">
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
                reader to discover. It stays in the measure, beside the
                sentence it corrects: a correction demoted to the margin is a
                correction nobody reads. */}
            {CLAIMS_ATTRIBUTION_CLOSES.test(d.body_en) && (
              <p className="text-small text-warn-fg">
                Correction: the attribution does <em>not</em> sum to the book.
                The published per-category contributions are weighted
                per-strategy returns. Added up for a session they differ from
                that book&rsquo;s own broker-measured daily return, and
                sometimes carry the opposite sign. Book-level equity and returns
                are unaffected: they are read from the broker and never
                reconstructed from the attribution.{" "}
                {/* Say WHY an uncorrected paragraph is still sitting above a
                    correction. Left unexplained it reads as the site having
                    caught the publisher out and shrugged; it is actually the
                    site refusing to edit text it republishes verbatim. */}
                <span className="text-fg-muted">
                  The paragraph above is republished word for word from the
                  published data and is not edited here. This page does not
                  rewrite what it quotes. The correction stands until the
                  published body is amended at its source.
                </span>
              </p>
            )}
          </Section>
        );
      })}

      {disclosures.length === 0 && (
        <p className="mt-12 text-body text-fg-muted">
          Disclosures could not be loaded from the data repository.
        </p>
      )}

      <Section
        id="regulatory-status"
        title="Regulatory status"
        gloss="No assessment obtained."
        aside={
          <dl className="space-y-2.5">
            <Fact
              term="Jurisdiction"
              value="France"
              qualifier="Publicly presenting performance may engage AMF and EU marketing rules even where the accounts are simulated."
            />
            {/* The three states apply to a regulatory opinion as much as to a
                statistic. None has been obtained, so the value is the absence
                marker and not a reassuring word. */}
            <Fact
              term="Assessment"
              value={NO_VALUE}
              tone="text-fg-faint"
              qualifier="None has been obtained for this site, and nothing here should be read as a claim that one has."
            />
            <Fact
              term="Contact"
              value={
                /* `break-all`: an address is 22 characters and UAX#14 gives it
                   no break opportunity at all — not at the "@", not at a dot
                   between letters — so in a 140px margin track it runs straight
                   out of its column unless it is allowed to break anywhere. */
                <a
                  className="block break-all text-accent hover:underline"
                  href={`mailto:${CONTACT_EMAIL}`}
                >
                  {CONTACT_EMAIL}
                </a>
              }
            />
          </dl>
        }
      >
        <p className="text-body text-fg-muted">
          RVB is a French entity. Publicly presenting performance may engage AMF
          and EU marketing rules even where the accounts are simulated and no
          service is offered. No regulatory assessment has been obtained for
          this site, and nothing here should be read as a claim that one has. If
          you are a regulator or counsel and something on this site needs to
          change, please get in touch.
        </p>
      </Section>
    </>
  );
}

/**
 * One fact in a section's margin: a term, the value read from the payload, and
 * an optional qualification under it.
 *
 * Ruled rather than boxed, like every other edge on the site. The term is at
 * the eyebrow step of the type scale but set in the prose face: the monospace
 * is reserved for literals now, and a label is not one.
 */
function Fact({
  term,
  value,
  tone,
  qualifier,
}: {
  term: string;
  value: ReactNode;
  /** Colour and weight for the value. Defaults to full-contrast ink. */
  tone?: string;
  qualifier?: ReactNode;
}) {
  return (
    <div className="border-t hairline pt-2">
      <dt className="text-label font-medium uppercase text-fg-muted">{term}</dt>
      <dd className={`mt-1 text-small ${tone ?? "text-fg"}`}>{value}</dd>
      {qualifier && (
        <dd className="mt-1 text-caption text-fg-muted">{qualifier}</dd>
      )}
    </div>
  );
}

/**
 * The books an item is actually true of, or `null` when the published fields
 * do not determine that.
 *
 * NULL IS NOT ZERO HERE EITHER. An item scoped to an account kind this record
 * does not contain, and an unscoped item on a record of mixed kinds, both have
 * no determinable audience — and "0 of 7 portfolios" would be a confident
 * claim about a question the data does not answer. Both render as an absence.
 */
function scopeOf(
  appliesTo: string | undefined,
  mixedKinds: boolean,
  books: BookSummary[],
  kinds: Set<string>,
): BookSummary[] | null {
  if (books.length === 0) return null;
  if (!appliesTo) return mixedKinds ? null : books;
  if (appliesTo === "all") return books;
  if (!kinds.has(appliesTo)) return null;
  return books.filter((b) => kindOf(b) === appliesTo);
}

/**
 * The audience line in a disclosure's margin, and whether it is a warning.
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
    label: "Published without an audience: see the notice above",
    warn: true,
  };
}
