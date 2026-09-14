import Link from "next/link";
import { Section } from "@/components/Section";
import { NAV } from "@/lib/nav";

/**
 * The address did not resolve. The page says so, then lists every page on the
 * site so a reader can continue without going back to a search engine.
 *
 * It fetches nothing, so it renders even when the data host is unavailable.
 * The list is read from `lib/nav`, the same source as the masthead, footer and
 * sitemap, with the front page prepended.
 */
const CONTENTS: { href: string; label: string; gloss: string }[] = [
  { href: "/", label: "Home", gloss: "RVB Partners." },
  ...NAV.map((item) => ({
    href: item.href,
    label: item.label,
    gloss: item.question,
  })),
];

export default function NotFound() {
  return (
    <div className="pt-2 lg:pt-6">
      <header>
        <h1 className="text-title">Page not found</h1>
        <p className="mt-5 text-body text-fg-muted">
          The page you were looking for does not exist or has moved. Every page
          on the site is listed below.
        </p>
      </header>

      <Section first title="Pages" gloss="Where everything is">
        <dl className="grid gap-y-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline sm:gap-x-8">
          {CONTENTS.map(({ href, label, gloss }) => (
            <div key={href} className="contents">
              <dt className="text-small font-medium leading-snug">
                <Link href={href} className="text-accent hover:underline">
                  {label}
                </Link>
              </dt>
              <dd className="-mt-2.5 text-body leading-snug text-fg-muted sm:mt-0">
                {gloss}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </div>
  );
}
