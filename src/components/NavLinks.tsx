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
 * the prose one, at the firm's direction: one typeface throughout, so the
 * chrome stops looking like two.
 *
 * AND THE CAPITALS ARE GONE. Setting seven navigation items in tracked capitals
 * is a decision about volume, not about rank: it made the one row a reader uses
 * to move around the site shout, and it cost the labels their word shapes,
 * which is what the eye actually recognises when it is looking for "Portfolios"
 * rather than reading it. The published labels are written in sentence case, so
 * the row prints them as written and goes up to `text-small` — lowercase does
 * not need the letter-spacing that made capitals legible, and 13px reads better
 * than 11.5px without it.
 *
 * Dropping the mono costs the row its distinctiveness, so the mark of place is
 * no longer colour alone. The current item carries a 2px rule sitting exactly
 * on the masthead's bottom hairline, which is a tab and reads at a glance;
 * `--fg` against `--fg-faint` at 10.5px did not.
 *
 * CENTRED, AND ALL SEVEN IN THE BAND'S LIGHT TYPE. The row sat flush left in
 * `--fg-faint`, so the site's one navigation control was both off to one side
 * and the palest text in the masthead. It is centred now, and since the
 * masthead became an ink band it is set in that band's `#f2f0ec` rather than in
 * the page's black, which on that ground is not a colour but an absence.
 *
 * The values are literals, as they are on every ink surface here. The palette
 * tokens describe a white page; this band is the one piece of chrome that is
 * not one, and it shares its four values with Hero.tsx.
 *
 * That leaves the RULE as the only mark of place, which is the point: colour
 * was carrying it before, and `--fg` against `--fg-faint` at 13px is a
 * distinction a reader has to go looking for. A 2px rule sitting on the
 * band's own bottom edge is a tab, and it reads at a glance. Hover fades
 * towards the band's muted grey, since there is nowhere brighter to go.
 *
 * `min-w-max` stays with `justify-center`: where the row fits, it centres;
 * where it does not (a phone), it keeps its natural width and scrolls from the
 * left edge, which is the behaviour the masthead's `scroll-x` depends on.
 *
 * `aria-current="page"` is the substance; the rule is the visible half of the
 * same fact. A dossier under `/portfolios/<slug>` marks `Portfolios`, because a
 * reader inside a chapter is still in that chapter — hence the prefix test
 * rather than equality, with `/` excluded from it or every route would match.
 */
export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();

  return (
    <div className="flex min-w-max justify-center gap-8 py-2.5">
      {items.map((item) => {
        const active =
          path === item.href ||
          (item.href !== "/" && path.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`relative text-small font-medium transition-colors ${
              active
                ? "text-[#f2f0ec] after:absolute after:inset-x-0 after:-bottom-[10px] after:h-[2px] after:bg-[#f2f0ec]"
                : "text-[#f2f0ec] hover:text-[#b9b4ab]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
