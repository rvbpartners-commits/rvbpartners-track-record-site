"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

/**
 * The contents row, with the reader's place in it marked.
 *
 * This became necessary when the routes became real destinations. With five
 * links, two of which bounced elsewhere, an unmarked row was survivable. With
 * seven — and with `/portfolios` finally an index rather than a redirect — a
 * reader has no way to tell which part of the document they are in, and the
 * masthead stops being a table of contents and becomes decoration.
 *
 * `aria-current="page"` is the substance; the colour is the visible half of the
 * same fact. A dossier under `/portfolios/<slug>` marks `Portfolios`, because a
 * reader inside a chapter is still in that chapter — hence the prefix test
 * rather than equality, with `/` excluded from it or every route would match.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();

  return (
    <div className="flex gap-7 min-w-max py-2.5">
      {items.map((item) => {
        const active =
          path === item.href ||
          (item.href !== "/" && path.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`font-figure text-[10.5px] uppercase tracking-[0.15em] transition-colors ${
              active ? "text-fg" : "text-fg-faint hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
