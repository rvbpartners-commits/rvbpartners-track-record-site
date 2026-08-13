"use client";

import { Fragment, useMemo, useState } from "react";
import type { Position } from "@/lib/data";
import { money, qty, slugLabel } from "@/lib/format";

type Group = {
  slug: string;
  positions: Position[];
  costBasis: number;
  longCount: number;
  shortCount: number;
};

/**
 * Holdings grouped by strategy, one expandable row per group.
 *
 * The subtotal is **cost basis** (qty x average entry price), not market value.
 * That is a deliberate limitation rather than an oversight: the published detail
 * carries the position and what it was entered at, but not a same-dated mark for
 * every symbol, and multiplying by a stale or borrowed price would produce a
 * "market value" column that looks authoritative and is not. The column is named
 * for what it actually is.
 *
 * Every figure here is ATTRIBUTED — the broker nets our orders and the split back
 * to strategies is a model. The caller states that above the table; it is not
 * decoration.
 */
export function HoldingsTable({
  positions,
  currency = "USD",
}: {
  positions: Position[];
  currency?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo<Group[]>(() => {
    const bySlug = new Map<string, Position[]>();
    for (const p of positions) {
      const list = bySlug.get(p.slug) ?? [];
      list.push(p);
      bySlug.set(p.slug, list);
    }
    return [...bySlug.entries()]
      .map(([slug, list]) => ({
        slug,
        positions: [...list].sort((a, b) =>
          Math.abs(b.qty * b.avg_price) - Math.abs(a.qty * a.avg_price),
        ),
        costBasis: list.reduce((sum, p) => sum + p.qty * p.avg_price, 0),
        longCount: list.filter((p) => p.qty > 0).length,
        shortCount: list.filter((p) => p.qty < 0).length,
      }))
      .sort((a, b) => Math.abs(b.costBasis) - Math.abs(a.costBasis));
  }, [positions]);

  const total = groups.reduce((sum, g) => sum + g.costBasis, 0);

  if (positions.length === 0) {
    return (
      <p className="text-[13px] text-fg-muted">
        No position detail has been released yet.
      </p>
    );
  }

  return (
    <div className="scroll-x">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.1em] text-fg-faint">
            <th className="text-left font-normal pb-3">Strategy</th>
            <th className="text-right font-normal pb-3">Positions</th>
            <th className="text-right font-normal pb-3">Cost basis</th>
            <th className="text-right font-normal pb-3 w-[76px]">Share</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => {
            const isOpen = open[g.slug] ?? false;
            const share = total !== 0 ? g.costBasis / total : null;
            return (
              <Fragment key={g.slug}>
                <tr
                  className="border-t hairline cursor-pointer hover:bg-bg-subtle transition-colors"
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [g.slug]: !isOpen }))
                  }
                >
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      className="flex items-center gap-2 text-left"
                    >
                      <span
                        className="text-fg-faint text-[10px] w-3 inline-block transition-transform"
                        style={{
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        ▶
                      </span>
                      <span className="font-medium">{slugLabel(g.slug)}</span>
                    </button>
                  </td>
                  <td className="py-3 text-right tnum text-fg-muted">
                    {g.longCount > 0 && `${g.longCount} long`}
                    {g.longCount > 0 && g.shortCount > 0 && " · "}
                    {g.shortCount > 0 && `${g.shortCount} short`}
                  </td>
                  <td className="py-3 text-right tnum font-medium">
                    {money(g.costBasis, currency, 0)}
                  </td>
                  <td className="py-3 text-right tnum text-fg-muted">
                    {share === null ? "—" : `${(share * 100).toFixed(1)}%`}
                  </td>
                </tr>

                {isOpen &&
                  g.positions.map((p) => (
                    <tr key={`${g.slug}:${p.symbol}`} className="bg-bg-subtle">
                      <td className="py-2 pl-9 pr-4 text-fg-muted">
                        {p.symbol}
                      </td>
                      <td className="py-2 text-right tnum text-fg-muted">
                        {qty(p.qty)}
                      </td>
                      <td className="py-2 text-right tnum text-fg-muted">
                        {money(p.qty * p.avg_price, currency, 0)}
                      </td>
                      <td className="py-2 text-right tnum text-fg-faint">
                        @ {money(p.avg_price, currency)}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
          <tr className="border-t hairline">
            <td className="py-3 font-medium">Total</td>
            <td className="py-3 text-right tnum text-fg-muted">
              {positions.length}
            </td>
            <td className="py-3 text-right tnum font-semibold">
              {money(total, currency, 0)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
