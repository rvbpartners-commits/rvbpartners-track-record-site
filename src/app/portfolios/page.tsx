import { BookSwitcher, type BookBundle } from "@/components/BookView";
import { Note } from "@/components/Note";
import {
  getAnalytics,
  getBenchmark,
  getBenchmarkIntraday,
  getDaily,
  getEvents,
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

export const metadata = { title: "Portfolios" };

export default async function Portfolios() {
  const index = await getIndex();

  if (!index) {
    return (
      <Note tone="warn">
        The published data could not be loaded. Nothing is being shown rather
        than a stale or partial figure.
      </Note>
    );
  }

  const bundles: BookBundle[] = await Promise.all(
    index.books.map(async (summary) => {
      const [meta, metrics, analytics, nav, benchmark, intraday, benchIntraday,
             daily, events] =
        await Promise.all([
          getMeta(summary.book),
          getMetrics(summary.book),
          getAnalytics(summary.book),
          getNav(summary.book),
          getBenchmark(summary.book),
          getIntraday(summary.book),
          getBenchmarkIntraday(summary.book),
          // Absents pour la plupart des books, et c'est une reponse : une
          // serie vide veut dire « non publiee », jamais « plate ».
          getDaily(summary.book),
          getEvents(summary.book),
        ]);
      const detail = await getLatestDetail(summary.book, meta);
      return {
        summary, meta, metrics, analytics, nav, benchmark, intraday,
        benchIntraday, detail, daily, events,
      };
    }),
  );

  return (
    <>
      <BookSwitcher
        bundles={bundles}
        minSessions={index.min_sessions_for_annualised}
      />

      <p className="mt-14 text-[12px] text-fg-faint">
        Published {dateTime(index.published_at)} · {index.chain.entries} chained
        records · every number computed by the desk, not the browser.
      </p>
    </>
  );
}
