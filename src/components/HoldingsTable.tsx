"use client";

import { Fragment, useState } from "react";
import type { CategoryGroup } from "@/lib/data";
import { money, pct, qty, signedPct } from "@/lib/format";

/**
 * Holdings by strategy category, one expandable row per category.
 *
 * The published data contains no strategy identifier — not on the group, not on
 * the position — so there is nothing here to hide at render time. Groups are
 * styles (mean reversion, momentum, …); the strategies inside them are not
 * named anywhere in the pipeline.
 *
 * **P&L is a category total and never a per-symbol line.** The expanded rows
 * show what is held and at what average price, but the profit sits on the group.
 * A per-symbol P&L column under a named style is the trade record itself — which
 * name it made money on, and when it got out.
 *
 * Cost basis is qty × average entry; market value uses the session's mark. A
 * holding with no same-day mark contributes to cost basis, is counted as
 * unmarked, and flags its group partial — rather than being valued at a
 * borrowed price that would look authoritative and not be.
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

  const totalCost = groups.reduce((s, g) => s + g.cost_basis, 0);
  const totalValue = groups.reduce((s, g) => s + g.market_value, 0);
  const totalPnl = groups.reduce((s, g) => s + g.open_pnl, 0);
  const totalPositions = groups.reduce((s, g) => s + g.n_positions, 0);
  const anyPartial = groups.some((g) => g.partial);

  return (
    <div className="scroll-x">
      <table className="w-full min-w-[680px] text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.1em] text-fg-faint">
            <th className="text-left font-normal pb-3">Category</th>
            <th className="text-right font-normal pb-3">Positions</th>
            <th className="text-right font-normal pb-3">Cost basis</th>
            <th className="text-right font-normal pb-3">Market value</th>
            <th className="text-right font-normal pb-3">Open P&amp;L</th>
            <th className="text-right font-normal pb-3 w-[64px]">Share</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = open[g.category] ?? false;
            const share = totalCost !== 0 ? g.cost_basis / totalCost : null;
            const pnlColour =
              g.open_pnl > 0 ? "text-up" : g.open_pnl < 0 ? "text-down" : "text-fg-muted";
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
                      <span className="text-[10px] tracking-[0.08em] text-fg-faint border hairline rounded px-1.5 py-0.5">
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
                  <td className="py-3 text-right tnum">
                    {money(g.market_value, currency, 0)}
                  </td>
                  <td className={`py-3 text-right tnum font-medium ${pnlColour}`}>
                    {money(g.open_pnl, currency, 0)}
                    <span className="text-fg-faint font-normal">
                      {" "}
                      {g.open_pnl_pct === null ? "" : `(${signedPct(g.open_pnl_pct)})`}
                    </span>
                  </td>
                  <td className="py-3 text-right tnum text-fg-muted">
                    {share === null ? "—" : pct(share, 1)}
                  </td>
                </tr>

                {isOpen &&
                  g.positions.map((p) => (
                    <tr key={`${g.category}:${p.symbol}`} className="bg-bg-subtle">
                      <td className="py-2 pl-8 pr-4 text-fg-muted">{p.symbol}</td>
                      <td className="py-2 text-right tnum text-fg-muted">
                        {qty(p.qty)}
                      </td>
                      <td className="py-2 text-right tnum text-fg-muted">
                        {money(p.cost_basis, currency, 0)}
                      </td>
                      <td className="py-2 text-right tnum text-fg-faint">
                        {p.mark === null
                          ? "no mark"
                          : money(p.qty * p.mark, currency, 0)}
                      </td>
                      {/* No per-symbol P&L, by design. */}
                      <td className="py-2 text-right text-fg-faint">—</td>
                      <td className="py-2 text-right tnum text-fg-faint whitespace-nowrap">
                        @ {money(p.avg_price, currency)}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}

          <tr className="border-t hairline">
            <td className="py-3 font-medium">Total</td>
            <td className="py-3 text-right tnum text-fg-muted">{totalPositions}</td>
            <td className="py-3 text-right tnum font-semibold">
              {money(totalCost, currency, 0)}
            </td>
            <td className="py-3 text-right tnum font-semibold">
              {money(totalValue, currency, 0)}
            </td>
            <td
              className={`py-3 text-right tnum font-semibold ${
                totalPnl > 0 ? "text-up" : totalPnl < 0 ? "text-down" : ""
              }`}
            >
              {money(totalPnl, currency, 0)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>

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
