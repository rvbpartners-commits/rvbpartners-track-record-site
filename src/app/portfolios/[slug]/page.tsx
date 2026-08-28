import { notFound } from "next/navigation";
import { BookPage, type BookBundle } from "@/components/BookView";
import { Note } from "@/components/Note";
import {
  bookSlug,
  getAnalytics,
  getBenchmark,
  getBenchmarkIntraday,
  getDaily,
  getIntraday,
  getIndex,
  getLatestDetail,
  getMetrics,
  getMeta,
  getNav,
} from "@/lib/data";
import { dateTime } from "@/lib/format";

// Rendered per request. A static prerender plus framework caching left the
// site serving data hours old with no way for traffic to clear it; the data
// layer memoises for 60s, which is the whole of the caching now.
export const dynamic = "force-dynamic";

/**
 * One portfolio, at its own address.
 *
 * Every book used to live at `/portfolios` and be chosen by a piece of client
 * state, so opening one changed nothing a reader could keep: no shareable link,
 * no back button, nothing to reload onto. A portfolio is a page, and a page has
 * a URL — which also means the server renders the RIGHT book on the first
 * response, rather than rendering the first one and waiting for a click.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = await getIndex();
  const summary = index?.books.find((b) => bookSlug(b) === slug);
  return { title: summary ? summary.label : "Portfolio" };
}

export default async function Portfolio({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = await getIndex();

  if (!index) {
    return (
      <Note tone="warn">
        The published data could not be loaded. Nothing is being shown rather
        than a stale or partial figure.
      </Note>
    );
  }

  const summary = index.books.find((b) => bookSlug(b) === slug);
  // An unknown slug is a 404, not an empty page and not a silent bounce to
  // whichever book happens to be first: a reader who followed a broken link
  // should be told it is broken, not shown someone else's numbers under it.
  if (!summary) notFound();

  const [meta, metrics, analytics, nav, benchmark, intraday, benchIntraday,
         daily] =
    await Promise.all([
      getMeta(summary.book),
      getMetrics(summary.book),
      getAnalytics(summary.book),
      getNav(summary.book),
      getBenchmark(summary.book),
      getIntraday(summary.book),
      getBenchmarkIntraday(summary.book),
      // Absente pour la plupart des books, et c'est une reponse : une serie
      // vide veut dire « non publiee », jamais « plate ».
      getDaily(summary.book),
    ]);
  const detail = await getLatestDetail(summary.book, meta);
  const bundle: BookBundle = {
    summary, meta, metrics, analytics, nav, benchmark, intraday,
    benchIntraday, detail, daily,
  };

  // Le selecteur se contente de ce que l'index porte deja : un rendement par
  // book, et l'adresse de chacun. Charger les sept dossiers complets pour
  // dessiner une liste de sept lignes etait le prix de l'ancien ecran unique.
  const options = index.books.map((b) => ({
    book: b.book,
    href: `/portfolios/${bookSlug(b)}`,
    label: b.label,
    tagline: b.tagline_en,
    cumulative: b.cumulative_return,
    capitalAtRisk: b.capital_at_risk,
    kindLabel: b.account_kind_label ?? null,
  }));

  return (
    <>
      <BookPage
        bundle={bundle}
        options={options}
        minSessions={index.min_sessions_for_annualised}
      />

      <p className="mt-14 text-[12px] text-fg-faint">
        Published {dateTime(index.published_at)} · {index.chain.entries} chained
        records · every number computed by the desk, not the browser.
      </p>
    </>
  );
}
