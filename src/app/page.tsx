import { BookSwitcher, type BookBundle } from "@/components/BookView";
import { Note } from "@/components/Note";
import {
  getAnalytics,
  getBenchmark,
  getIntraday,
  getIndex,
  getLatestDetail,
  getMetrics,
  getMeta,
  getNav,
} from "@/lib/data";
import { dateTime } from "@/lib/format";

// Next.js requires this to be a statically analysable literal, so it cannot
// be the REVALIDATE_SECONDS constant. 900s = 15 min; the desk publishes daily.
export const revalidate = 900;

export default async function Home() {
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
      const [meta, metrics, analytics, nav, benchmark, intraday] =
        await Promise.all([
          getMeta(summary.book),
          getMetrics(summary.book),
          getAnalytics(summary.book),
          getNav(summary.book),
          getBenchmark(summary.book),
          getIntraday(summary.book),
        ]);
      const detail = await getLatestDetail(summary.book, meta);
      return { summary, meta, metrics, analytics, nav, benchmark, intraday, detail };
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
