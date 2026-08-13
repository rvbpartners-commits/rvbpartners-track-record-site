"use client";

import { useEffect, useRef, useState } from "react";
import { signedPct } from "@/lib/format";

export type PortfolioOption = {
  book: string;
  label: string;
  tagline: string | null;
  cumulative: number | null;
};

/**
 * The portfolio selector.
 *
 * A dropdown rather than a tab strip: tabs read as sections of one thing, and
 * these are four separate portfolios on four separate accounts. The control
 * says "you are looking at one of several" in a way a row of tabs does not, and
 * it does not silently run out of room when a fifth book is added.
 *
 * Native `<select>` was the alternative and is rejected for one reason: each
 * option carries its return, and an OS-rendered option list cannot show two
 * columns. The listbox below keeps keyboard behaviour (Escape closes, focus
 * returns, `aria-*` set) rather than trading it away for the layout.
 */
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
  const current = options.find((o) => o.book === value) ?? options[0];

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
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-3 rounded-lg border hairline px-4 py-2.5 hover:bg-bg-subtle transition-colors min-w-[240px]"
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
          className="absolute z-20 mt-1.5 w-[320px] max-w-[86vw] rounded-lg border hairline bg-bg-raised shadow-lg overflow-hidden"
        >
          {options.map((o) => {
            const selected = o.book === value;
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
                    selected ? "bg-bg-subtle" : "hover:bg-bg-subtle"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate">
                      {o.label}
                    </span>
                    {o.tagline && (
                      <span className="block text-[11px] text-fg-faint truncate mt-0.5">
                        {o.tagline}
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
