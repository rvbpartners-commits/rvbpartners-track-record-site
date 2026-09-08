import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/data";

/**
 * robots.txt.
 *
 * THE SITE IS DISCOVERABLE AND NOTHING IS BLOCKED. This file is the crawler
 * half of a decision the root layout already states per page
 * (`robots: { index: true, follow: true }`); the two must agree, and if the
 * layout's ever changes this file changes with it. A `Disallow` here plus an
 * `index: true` there is not caution, it is a site asking to be indexed from a
 * page a crawler has been told not to read.
 *
 * NOTHING IS DISALLOWED BECAUSE NOTHING HERE IS PRIVATE. Every page is a
 * rendering of a public repository, and the repository is reachable — and
 * crawlable — without this site at all. A rule that hid a route from crawlers
 * would hide it from readers who search for it while hiding it from nobody
 * else: robots.txt is a request, not access control, and it is itself a public
 * file that advertises whatever it names.
 *
 * NO `crawl-delay`. It is not part of the standard, the major crawlers ignore
 * it, and the site has no cost to protect: the pages are prose over a payload
 * this process memoises for a minute, so a crawler and a reader hitting the
 * same page cost one fetch between them. A directive we could not justify in a
 * sentence is a directive that does not belong in a public file.
 *
 * NO `host`. The canonical host is stated where it is actually honoured — in
 * the layout's `metadataBase` and each page's `alternates.canonical`. The
 * `Host:` directive is a Yandex extension no other crawler reads, and a second
 * place to declare the same thing is a second place for it to go stale. It
 * moved once already; see `SITE_HOST`.
 *
 * `SITE_ORIGIN`, never a literal: the sitemap must be advertised on the same
 * host the sitemap's own URLs are built on, or a crawler treats it as
 * cross-site and drops it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
