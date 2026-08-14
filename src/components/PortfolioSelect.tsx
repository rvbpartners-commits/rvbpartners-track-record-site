"use client";

import { useEffect, useRef, useState } from "react";
import { signedPct } from "@/lib/format";
import { orderWithVariants, parentOf, variantSize } from "@/lib/variants";

export type PortfolioOption = {
  book: string;
  label: string;
  tagline: string | null;
  cumulative: number | null;
};

/** Portfolio selector. A listbox rather than a native `<select>` because each
 *  option carries its return in a second column. */
export function PortfolioSelect({
  options,
  value,
  onChange,
}: {
  options: PortfolioOption[];
  value: string;
  onChange: (book: string) => void;
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
            Portfolio
          </span>
        </span>
        <span className="ml-auto text-fg-faint text-[10px]">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Portfolio"
          className="absolute z-20 mt-1.5 w-full sm:w-[320px] sm:max-w-[86vw] border hairline bg-bg-raised shadow-lg overflow-hidden"
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
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.book);
                    setOpen(false);
                  }}
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
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
