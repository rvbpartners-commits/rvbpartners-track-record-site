"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signedPct } from "@/lib/format";
import { orderWithVariants, parentOf, variantSize } from "@/lib/variants";

export type PortfolioOption = {
  book: string;
  /** The book's own address. Every row is a real link, so middle-click and
   *  "open in new tab" work — a listbox built from buttons swallows both. */
  href: string;
  label: string;
  tagline: string | null;
  cumulative: number | null;
  /** True when the book trades real money rather than a paper account. */
  capitalAtRisk?: boolean;
  /** The badge wording, published by the book itself. Both kinds get the same
   *  visual treatment; only this text differs. */
  kindLabel?: string | null;
};

/** Paper or real capital, marked on EVERY row rather than only on the exception.
 *
 *  Marking just the live book would make the others readable only by inference —
 *  and a reader who does not know what the unmarked default is cannot infer it.
 *  The two labels cost one line each and remove the guess.
 *
 *  Identical styling for both, deliberately. A red uppercase banner on one of
 *  them is theatre where information is wanted: the reader who needs to know
 *  needs to READ it, not be shouted at, and shouting also implies a warning the
 *  operator's own capital does not warrant. */
function AccountTag({ live, label }: { live?: boolean; label?: string | null }) {
  return (
    <span className="inline-block border hairline px-1.5 py-px text-[10px] leading-[1.5] align-middle text-fg-faint">
      {label ?? (live ? "Real capital (live test)" : "Paper (broker-simulated)")}
    </span>
  );
}

/** Portfolio selector. A listbox rather than a native `<select>` because each
 *  option carries its return in a second column — and every option is an anchor,
 *  because these are separate pages, not a state of this one. */
export function PortfolioSelect({
  options,
  value,
}: {
  options: PortfolioOption[];
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // A capital variant is the same portfolio at a different size, so it is listed
  // directly beneath its parent and indented rather than as a peer entry.
  const ordered = orderWithVariants(options, (o) => o.book);
  const books = ordered.map((o) => o.book);
  const current = options.find((o) => o.book === value) ?? ordered[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div className="relative block sm:inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-3 border hairline px-4 py-2.5 hover:bg-bg-subtle transition-colors w-full sm:w-auto sm:min-w-[240px]"
      >
        <span className="text-left">
          <span className="block text-[14px] font-medium leading-tight">
            {current.label}
          </span>
          <span className="block text-[11px] text-fg-faint leading-tight mt-0.5">
            Portfolio ·{" "}
            {current.kindLabel ??
              (current.capitalAtRisk
                ? "Real capital (live test)"
                : "Paper (broker-simulated)")}
          </span>
        </span>
        <span className="ml-auto text-fg-faint text-[10px]">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Rendue TOUJOURS, masquee quand elle est fermee, plutot que montee au
          clic. Une liste qui n'existe pas dans le HTML servi n'a pas de liens :
          rien a partager, rien a suivre, rien a ouvrir dans un onglet tant que
          personne n'a clique. `hidden` la sort de l'ordre de tabulation et de
          l'arbre d'accessibilite, donc le comportement visible est identique --
          mais les adresses des sept portefeuilles sont dans la page. */}
      <ul
        role="listbox"
        hidden={!open}
        className="absolute z-20 mt-1 w-full sm:w-[420px] border hairline bg-bg-raised shadow-lg max-h-[70vh] overflow-y-auto"
      >
          {ordered.map((o) => {
            const selected = o.book === value;
            const parent = parentOf(o.book);
            const isVariant = parent !== null && books.includes(parent);
            const size = variantSize(o.book);
            const colour =
              o.cumulative === null
                ? "text-fg-faint"
                : o.cumulative >= 0
                  ? "text-up"
                  : "text-down";
            return (
              <li key={o.book} role="option" aria-selected={selected}>
                <Link
                  href={o.href}
                  onClick={() => setOpen(false)}
                  className={`w-full text-left px-4 py-3 flex items-baseline gap-4 transition-colors ${
                    isVariant ? "pl-8" : ""
                  } ${selected ? "bg-bg-subtle" : "hover:bg-bg-subtle"}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate">
                      {/* A rule tying the row to the one above: this is not a
                          separate portfolio, it is the same one at another size. */}
                      {isVariant && (
                        <span aria-hidden="true" className="text-fg-faint mr-1.5">
                          └
                        </span>
                      )}
                      {o.label}
                      <span className="ml-2">
                        <AccountTag live={o.capitalAtRisk} label={o.kindLabel} />
                      </span>
                    </span>
                    {(isVariant ? size : o.tagline) && (
                      <span className="block text-[11px] text-fg-faint truncate mt-0.5">
                        {isVariant
                          ? `Same strategies and weights, funded with $${size}`
                          : o.tagline}
                      </span>
                    )}
                  </span>
                  <span className={`ml-auto text-[13px] font-medium tnum ${colour}`}>
                    {signedPct(o.cumulative)}
                  </span>
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
