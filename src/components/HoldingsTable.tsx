"use client";

import { Fragment, useState } from "react";
import type { CategoryGroup } from "@/lib/data";
import { money, qty, signedPct } from "@/lib/format";

/**
 * Holdings by strategy category, expandable.
 *
 * P&L is a category total, never a per-symbol line. A holding with no same-day
 * mark counts toward cost basis only and flags its group partial, rather than
 * being valued at a borrowed price.
 *
 * THE "SHARE" COLUMN IS GONE. It divided each group's signed net cost basis by
 * the signed sum of them all, so a book with a short sleeve printed shares of
 * −238% and +338% under a header that read like a portfolio weight — beside a
 * "Target weight" table eighteen lines above whose figures are positive and sum
 * to one. It was also computed here, in the browser, from a basis nothing
 * publishes and nothing documents. Removing it fixes the arithmetic and the
 * contradiction in one edit; if an exposure split is wanted, the desk should
 * publish one with its basis named, and this table should render that.
 */
export function HoldingsTable({
  groups,
  currency = "USD",
}: {
  groups: CategoryGroup[];
  currency?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (groups.length === 0) {
    return (
      <p className="text-[13px] text-fg-muted">
        No positions have been published for this session.
      </p>
    );
  }

  // Table sums over the rows immediately above them, not statistics: they are
  // the column totals of what is drawn, and they are labelled as net.
  const totalCost = groups.reduce((s, g) => s + g.cost_basis, 0);
  const totalValue = groups.reduce((s, g) => s + g.market_value, 0);
  const totalPnl = groups.reduce((s, g) => s + g.open_pnl, 0);
  const totalPositions = groups.reduce((s, g) => s + g.n_positions, 0);
  const anyPartial = groups.some((g) => g.partial);
  const anyShort = groups.some((g) => g.cost_basis < 0);
  // Rows whose published percentage contradicts its own dollar figure. Counted
  // so the table can say it withheld something rather than silently dropping it.
  const suppressedPct = groups.filter((g) => pctDisagrees(g)).length;

  return (
    <div className="scroll-x">
      <table className="w-full sm:min-w-[640px] text-[13px]">
        <thead>
          <tr className="text-[11px] text-fg-faint">
            <th className="text-left font-normal pb-3">Category</th>
            <th className="text-right font-normal pb-3">Positions</th>
            <th className="text-right font-normal pb-3">Cost basis</th>
            <th className="hidden sm:table-cell text-right font-normal pb-3">Market value</th>
            <th className="text-right font-normal pb-3">Open P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = open[g.category] ?? false;
            const pnlColour =
              g.open_pnl > 0 ? "text-up" : g.open_pnl < 0 ? "text-down" : "text-fg-muted";
            const showPct = g.open_pnl_pct !== null && !pctDisagrees(g);
            return (
              <Fragment key={g.category}>
                <tr
                  className="border-t hairline cursor-pointer hover:bg-bg-subtle transition-colors"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [g.category]: !isOpen }))
                  }
                >
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <span
                        className="text-fg-faint text-[9px] w-2.5 inline-block transition-transform"
                        style={{
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        ▶
                      </span>
                      <span className="font-medium">{g.label}</span>
                      <span className="text-[10px] tracking-[0.08em] text-fg-faint border hairline px-1.5 py-0.5">
                        {g.code}
                      </span>
                      {g.partial && (
                        <span className="text-[11px] text-fg-faint">partial</span>
                      )}
                    </button>
                  </td>
                  <td className="py-3 text-right tnum text-fg-muted whitespace-nowrap">
                    {g.n_long > 0 && `${g.n_long}L`}
                    {g.n_long > 0 && g.n_short > 0 && " · "}
                    {g.n_short > 0 && `${g.n_short}S`}
                  </td>
                  <td className="py-3 text-right tnum">
                    {money(g.cost_basis, currency, 0)}
                  </td>
                  <td className="hidden sm:table-cell py-3 text-right tnum">
                    {money(g.market_value, currency, 0)}
                  </td>
                  {/* THE COLOUR AND THE PERCENTAGE MUST AGREE WITH THE DOLLARS.
                      The published `open_pnl_pct` is P&L over a SIGNED net cost
                      basis, so on a net-short sleeve it carries the opposite
                      sign to the money beside it: this cell rendered a green
                      "+$7,347 (−7.53%)" and a red "−$2,989 (+22.99%)" from the
                      data as published. The dollar figure is the one that
                      reconciles (cost_basis + open_pnl == market_value), so it
                      keeps the colour, and a percentage that contradicts it is
                      withheld rather than printed. Absence, not a number we
                      know to be wrong. */}
                  <td className={`py-3 text-right tnum font-medium ${pnlColour}`}>
                    {money(g.open_pnl, currency, 0)}
                    <span className="text-fg-faint font-normal">
                      {showPct ? ` (${signedPct(g.open_pnl_pct)})` : ""}
                    </span>
                  </td>
                </tr>

                {isOpen &&
                  g.positions.map((p, i) => (
                    // Keyed on the INDEX as well as the symbol: a category can
                    // publish two rows for one symbol (an offsetting pair, or a
                    // dust remainder beside a real holding), and a symbol-only
                    // key silently collapses them in the DOM.
                    <tr key={`${g.category}:${p.symbol}:${i}`} className="bg-bg-subtle">
                      <td className="py-2 pl-8 pr-4 text-fg-muted">{p.symbol}</td>
                      <td className="py-2 text-right tnum text-fg-muted">
                        {qty(p.qty)}
                      </td>
                      <td className="py-2 text-right tnum text-fg-muted whitespace-nowrap">
                        {money(p.cost_basis, currency, 0)}
                        <span className="block text-[11px] text-fg-faint">
                          @ {money(p.avg_price, currency)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell py-2 text-right tnum text-fg-faint">
                        {p.mark === null
                          ? "no mark"
                          : money(p.qty * p.mark, currency, 0)}
                      </td>
                      {/* No per-symbol P&L, by design. */}
                      <td className="py-2 text-right text-fg-faint">—</td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}

          <tr className="border-t hairline">
            <td className="py-3 font-medium">Total, net</td>
            <td className="py-3 text-right tnum text-fg-muted">{totalPositions}</td>
            <td className="py-3 text-right tnum font-semibold">
              {money(totalCost, currency, 0)}
            </td>
            <td className="hidden sm:table-cell py-3 text-right tnum font-semibold">
              {money(totalValue, currency, 0)}
            </td>
            <td
              className={`py-3 text-right tnum font-semibold ${
                totalPnl > 0 ? "text-up" : totalPnl < 0 ? "text-down" : ""
              }`}
            >
              {money(totalPnl, currency, 0)}
            </td>
          </tr>
        </tbody>
      </table>

      {anyShort && (
        <p className="mt-3 text-[12px] text-fg-faint">
          Cost basis is signed and the total nets longs against shorts, so it is
          not the size of the portfolio. Account equity, above, is the exact
          figure and is read from the broker.
        </p>
      )}

      {suppressedPct > 0 && (
        <p className="mt-3 text-[12px] text-fg-faint">
          {suppressedPct === 1
            ? "One category publishes an open-P&L percentage whose sign contradicts its own dollar figure — it is taken over a signed net cost basis — so the percentage is not shown for it."
            : `${suppressedPct} categories publish an open-P&L percentage whose sign contradicts their own dollar figure — it is taken over a signed net cost basis — so the percentage is not shown for them.`}{" "}
          The dollar amounts are unaffected and reconcile with cost basis and
          market value.
        </p>
      )}

      {anyPartial && (
        <p className="mt-3 text-[12px] text-fg-faint">
          &ldquo;Partial&rdquo; means at least one holding in that category had no
          mark for this session. It is counted in cost basis but excluded from
          market value and P&amp;L rather than valued at a borrowed price.
        </p>
      )}
    </div>
  );
}

/** True when the published percentage disagrees in sign with the P&L it is
 *  supposed to describe — which is what dividing by a signed net cost basis
 *  produces on every net-short sleeve. Zero on either side is not a
 *  disagreement: a flat group has nothing to contradict. */
function pctDisagrees(g: CategoryGroup): boolean {
  if (g.open_pnl_pct === null || g.open_pnl === 0 || g.open_pnl_pct === 0) {
    return false;
  }
  return g.open_pnl > 0 !== g.open_pnl_pct > 0;
}
