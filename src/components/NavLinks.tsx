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
 * ONE TYPEFACE, AND A RULE INSTEAD OF THE MONO. The row was set in the figure
 * face at `text-label` — 10.5px — which made it the smallest thing on the site
 * and gave the masthead only two of the scale's eight steps. The face is now
 * the prose one at `text-caption`, at the firm's direction: one typeface
 * throughout, so the chrome stops looking like two.
 *
 * Dropping the mono costs the row its distinctiveness, so the mark of place is
 * no longer colour alone. The current item carries a 2px rule sitting exactly
 * on the masthead's bottom hairline, which is a tab and reads at a glance;
 * `--fg` against `--fg-faint` at 10.5px did not.
 *
 * `aria-current="page"` is the substance; the colour and the rule are the
 * visible half of the same fact. A dossier under `/portfolios/<slug>` marks `Portfolios`, because a
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
            className={`relative text-caption font-medium uppercase tracking-[0.12em] transition-colors ${
              active
                ? "text-fg after:absolute after:inset-x-0 after:-bottom-[10px] after:h-[2px] after:bg-fg"
                : "text-fg-faint hover:text-fg"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
