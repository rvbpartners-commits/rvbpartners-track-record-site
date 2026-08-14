import Link from "next/link";
import { Note } from "@/components/Note";
import {
  OverviewChart,
  OverviewLegend,
  type OverviewSeries,
} from "@/components/OverviewChart";
import { getIndex, getIntraday, getNav } from "@/lib/data";

// Same reasoning as the portfolios page: rendered per request, because the
// curve below is the live one and a cached landing page is a stale claim.
export const dynamic = "force-dynamic";

export default async function Home() {
  const index = await getIndex();

  const series: OverviewSeries[] = index
    ? await Promise.all(
        index.books.map(async (summary) => {
          const [nav, intraday] = await Promise.all([
            getNav(summary.book),
            getIntraday(summary.book),
          ]);
          return { book: summary.book, label: summary.label, nav, intraday };
        }),
      )
    : [];

  const sessions = index?.books.reduce((n, b) => Math.max(n, b.sessions), 0) ?? 0;

  return (
    <>
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-center pt-2 lg:pt-6">
        {/* Chart first on a wide screen, second on a phone: the paragraph is
            what orients a reader, and a chart with no caption above it is
            decoration until you have been told what it is. */}
        <div className="order-2 lg:order-1">
          {index ? (
            <>
              <OverviewChart series={series} />
              <div className="mt-4">
                <OverviewLegend series={series} />
              </div>
            </>
          ) : (
            <Note tone="warn">
              The published data could not be loaded. Nothing is being shown
              rather than a stale or partial figure.
            </Note>
          )}
        </div>

        <div className="order-1 lg:order-2 max-w-[52ch]">
          <h1 className="text-[30px] sm:text-[38px] font-semibold tracking-tight leading-[1.12]">
            A systematic fund, run by research rather than by opinion.
          </h1>

          <div className="mt-6 space-y-4 text-[14.5px] leading-relaxed text-fg-muted">
            <p>
              RVB is systematic and data-driven. Every position is decided by
              rules, tested against decades of point-in-time data, and measured
              by one shared metrics module — so two people never see two numbers
              for the same return.
            </p>
            <p>
              Research comes first. A strategy only reaches an account after it
              survives a battery built to reject it, and most of what we test
              does not survive.
            </p>
            <p>
              We are glad to be running our portfolios on live demo accounts, in
              the open: every session is published, hash-chained, timestamped and
              reproducible from the data itself.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link
              href="/portfolios"
              className="inline-flex items-center gap-2 border hairline px-5 py-2.5 text-[14px] font-medium hover:bg-bg-subtle transition-colors"
            >
              Discover our portfolios
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/verify"
              className="text-[13.5px] text-fg-muted hover:text-fg transition-colors underline underline-offset-4 decoration-hairline"
            >
              Verify it yourself
            </Link>
          </div>
        </div>
      </div>

      {index && (
        <dl className="mt-14 lg:mt-20 border-t hairline pt-6 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
          <Stat label="Portfolios" value={String(index.books.length)} />
          <Stat label="Sessions published" value={String(sessions)} />
          <Stat
            label="Chained records"
            value={String(index.chain.entries)}
            note="each one timestamped"
          />
          <Stat
            label="Curve resolution"
            value="5 min"
            note="broker equity, not interpolation"
          />
        </dl>
      )}

      <p className="mt-8 text-[12px] text-fg-faint max-w-[80ch]">
        Alpaca paper accounts: fills are simulated and no capital is at risk.
        Cumulative return since each account was funded, rebased on its own
        opening equity, so accounts of different sizes are comparable. A line
        sits flat at zero while that account was funded but had not yet traded,
        and begins where its record does. No benchmark is drawn here; past
        performance is not indicative of future results.
      </p>
    </>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-fg-faint">{label}</dt>
      <dd className="mt-1 text-[19px] tnum tracking-tight">{value}</dd>
      {note && <div className="text-[11.5px] text-fg-faint mt-0.5">{note}</div>}
    </div>
  );
}
