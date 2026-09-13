import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Section } from "@/components/Section";
import { slugLabel } from "@/lib/format";
import {
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
    "The terms on which the portfolios and figures on this site should be read.",
};

/** Who a disclosure applies to, in the words the rest of the site uses. */
const AUDIENCE: Record<string, string> = {
  all: "Every portfolio",
  paper: "Paper-account portfolios",
  real_capital: "Real-capital portfolio",
};

/** The account kind of a book, from the field the publisher writes, falling
 *  back to the risk flag. Both are published; neither is inferred from a name. */
function kindOf(b: BookSummary): string {
  return b.account_kind ?? (b.capital_at_risk ? "real_capital" : "paper");
}

type Context = { gate: number | null; lagDays: number | null };

/**
 * The firm's wording for each published disclosure, keyed by the id the data
 * repository publishes it under. The index decides WHICH items apply and to
 * whom; the site states them in its own voice. An id with no entry here is
 * rendered from the published text, so a new item is never dropped.
 */
const COPY: Record<string, { title: string; body: (c: Context) => string }> = {
  paper_account: {
    title: "Paper accounts",
    body: () =>
      "The paper portfolios run on Alpaca paper accounts. No capital is invested in them: the desk sends real orders, and the broker fills them from its paper engine against its market data. They record how the strategies execute live; they are not a record of managing client money.",
  },
  real_capital_account: {
    title: "Real capital",
    body: () =>
      "One portfolio trades the firm’s own capital, with fills executed on its venues. The firm manages no third-party money. The capital is published beside the return, since a return on a smaller account does not scale directly to a larger one: costs do not scale with size.",
  },
  not_advice: {
    title: "Past performance",
    body: () =>
      "Nothing on this site is investment advice, an offer, or a solicitation to buy or sell any financial instrument. Past performance, simulated or otherwise, is not indicative of future results.",
  },
  attributed_returns: {
    title: "Per-strategy figures",
    body: () =>
      "Account-level equity and returns are read from the broker’s account. Per-strategy figures are modelled: the broker nets the desk’s orders, so each net fill is attributed back to the strategies that contributed to it, pro-rata by requested size. A different attribution rule would give different per-strategy figures from the same fills.",
  },
  short_history: {
    title: "Annualised statistics",
    body: ({ gate }) =>
      `The Sharpe ratio, annual return, Calmar ratio, volatility and maximum drawdown are published once a portfolio has ${
        gate === null ? "enough marked sessions" : `${gate} marked sessions`
      }. Cumulative return and the equity curve are published from the first session.`,
  },
  detail_lag: {
    title: "Publication timing",
    body: ({ lagDays }) =>
      `Net asset value, returns and metrics are published without delay. Order, fill and position detail is published once the cycle that produced it has executed${
        lagDays !== null && lagDays > 0
          ? `, and at least ${lagDays} ${lagDays === 1 ? "day" : "days"} after it`
          : ""
      }. The order plan the desk prepares after the close is published only once it has been sent, so current holdings are public.`,
  },
  capital_events: {
    title: "Capital movements",
    body: () =>
      "Deposits, withdrawals and broker adjustments are excluded from the return and kept in the balance, the standard time-weighted treatment. Raw broker equity is published unchanged in nav.csv beside the flow, the adjustment factor and the adjusted series, and each declared event is published with its evidence in the snapshot for the session it affected.",
  },
  strategy_identity: {
    title: "Strategy categories",
    body: () =>
      "Positions and attribution are grouped by strategy category, such as mean reversion, momentum, trend following or seasonal, rather than by individual strategy. The identity and logic of each strategy are not published.",
  },
  not_gips: {
    title: "GIPS",
    body: () =>
      "Returns are time-weighted. The presentation is informed by GIPS practice but is not GIPS-compliant; compliance requires third-party verification, which has not been performed.",
  },
};

export default async function DisclosuresPage() {
  const index = await getIndex();
  const disclosures = index?.disclosures ?? [];
  const books = index?.books ?? [];
  // The market-data feed each account kind's fills were priced against, read
  // from the newest chained record of that kind.
  const feeds = await getFeedByAccountKind(books);
  const kinds = new Set(books.map(kindOf));

  const ctx: Context = {
    gate:
      typeof index?.min_sessions_for_annualised === "number"
        ? index.min_sessions_for_annualised
        : null,
    lagDays:
      typeof index?.detail_lag_days === "number" ? index.detail_lag_days : null,
  };

  return (
    <>
      <header>
        <h1 className="text-heading sm:text-title font-semibold">Disclosures</h1>
        <p className="mt-2 text-body text-fg-muted">
          The terms on which the portfolios and figures on this site should be
          read. Each published record in the{" "}
          <a
            className="text-accent hover:underline"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            data repository
          </a>{" "}
          also carries its own disclosure block, including whether its capital
          is at risk.
        </p>
      </header>

      {disclosures.map((d, i) => {
        const copy = COPY[d.id];
        const audience = d.applies_to
          ? (AUDIENCE[d.applies_to] ?? slugLabel(d.applies_to))
          : kinds.size > 1
            ? null
            : AUDIENCE.all;
        const scope =
          d.applies_to && d.applies_to !== "all"
            ? books.filter((b) => kindOf(b) === d.applies_to).length
            : books.length;
        const feed = d.applies_to ? feeds.get(d.applies_to) : undefined;
        return (
          <Section
            key={d.id}
            id={d.id}
            first={i === 0}
            title={copy?.title ?? slugLabel(d.id)}
            aside={
              <dl className="space-y-2.5">
                {audience && (
                  <Fact
                    term="Applies to"
                    value={audience}
                    qualifier={
                      books.length > 0 ? (
                        <span className="tabular-nums">
                          {scope} of {books.length}{" "}
                          {books.length === 1 ? "portfolio" : "portfolios"}
                        </span>
                      ) : undefined
                    }
                  />
                )}
                {feed && <Fact term="Market data" value={feed} />}
              </dl>
            }
          >
            {!copy && (
              <h3 className="text-subhead font-semibold text-fg">{d.title_en}</h3>
            )}
            <p className="text-body">{copy ? copy.body(ctx) : d.body_en}</p>
            {feed && (
              <p className="text-body">
                Simulated fills are priced against the market data feed named in
                the margin. A feed covering part of consolidated volume shows
                fewer quotes, at wider spreads, than the full tape a live order
                meets.
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
        aside={
          <dl className="space-y-2.5">
            <Fact term="Jurisdiction" value="France" />
            <Fact
              term="Contact"
              value={
                /* An email address has no break opportunity, so in a narrow
                   margin track it may break anywhere. */
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
        <p className="text-body">
          RVB Partners is a company registered in France that trades its own
          capital. It does not provide investment services, manages no
          third-party money and offers no product to the public.
        </p>
      </Section>
    </>
  );
}

function Fact({
  term,
  value,
  qualifier,
}: {
  term: string;
  value: ReactNode;
  qualifier?: ReactNode;
}) {
  return (
    <div className="border-t hairline pt-2">
      <dt className="text-label font-medium uppercase text-fg-muted">{term}</dt>
      <dd className="mt-1 text-small text-fg">{value}</dd>
      {qualifier && (
        <dd className="mt-1 text-caption text-fg-muted">{qualifier}</dd>
      )}
    </div>
  );
}
