import type { RoundTrips } from "@/lib/data";
import { pct } from "@/lib/format";
import { duration } from "@/lib/format";

/**
 * The round-trip ledger.
 *
 * A portfolio of equities produces a return every session, so the session is
 * its natural observation and sixty of them are enough to speak of a Sharpe
 * ratio. This book does not trade every day: counting it in sessions gives a
 * denominator that measures the calendar rather than the strategy — a row of
 * zeros and a handful of numbers, whose volatility is the trading schedule's.
 *
 * The honest unit is the round trip: a position opened and brought back flat.
 * Every figure below is a COUNT or a MEASURED duration. None of them is a
 * ratio that needs a distribution, which is why they can be published on five
 * observations at all — and why anything annualised stays withheld until there
 * are thirty.
 */
export function RoundTripStats({ rt }: { rt: RoundTrips }) {
  const held = rt.median_holding_seconds;
  return (
    <>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-5">
        <Stat label="Round trips" value={String(rt.round_trips)} />
        <Stat
          label="Net capture, mean"
          value={money(rt.net_mean_usd)}
          sign={rt.net_mean_usd}
        />
        <Stat label="Median holding" value={duration(held)} />
        <Stat
          label="Funding share of net"
          value={rt.funding_share_of_net === null ? "—" : pct(rt.funding_share_of_net, 1)}
        />
        <Stat
          label="Hit rate"
          value={rt.hit_rate === null ? "—" : pct(rt.hit_rate, 0)}
          note={`${rt.winners} of ${rt.round_trips}`}
        />
      </dl>

      <dl className="mt-8 grid sm:grid-cols-2 gap-x-14 gap-y-3 text-[13px]">
        <Row label="Net result, all round trips">
          <span className={`tnum ${colour(rt.net_total_usd)}`}>
            {money(rt.net_total_usd)}
          </span>
        </Row>
        <Row label="Funding, cumulative">
          <span className={`tnum ${colour(rt.funding_total_usd)}`}>
            {money(rt.funding_total_usd)}
          </span>
        </Row>
        <Row label="Fees paid">
          <span className="tnum">{money(rt.fees_total_usd)}</span>
        </Row>
        <Row label="Annualised statistics">
          {rt.annualised_withheld ? (
            <span className="text-fg-muted">
              withheld (n={rt.round_trips})
            </span>
          ) : (
            <span>released</span>
          )}
        </Row>
      </dl>

      <p className="mt-6 text-[12.5px] leading-relaxed text-fg-muted max-w-[72ch]">
        Each round trip is the <strong className="font-medium text-fg">sum of
        both legs</strong>. The hedge account runs in hedging mode, so its half
        only appears when a ticket settles — or never, while the ticket stays
        locked against an opposite one. Counted on one leg alone this book reads
        negative; counted on both, it does not. The convention is set out in the
        methodology and every snapshot carries the decomposition.
      </p>
      <p className="mt-3 text-[12.5px] leading-relaxed text-fg-muted max-w-[72ch]">
        Sharpe, volatility, drawdown and every other annualised figure stay
        withheld below {rt.round_trips_needed_for_annualising} round trips. On{" "}
        {rt.round_trips} they would not be imprecise, they would be meaningless.
      </p>
    </>
  );
}

function colour(v: number | null) {
  if (v === null) return "";
  return v > 0 ? "text-up" : v < 0 ? "text-down" : "";
}

function money(v: number | null) {
  if (v === null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(4)} USD`;
}

/** Minutes up to an hour, then hours. A median holding of "4260 s" is a number
 *  the reader has to divide themselves. */
function Stat({
  label,
  value,
  note,
  sign,
}: {
  label: string;
  value: string;
  note?: string;
  sign?: number | null;
}) {
  return (
    <div>
      <dt className="text-[11.5px] text-fg-faint">{label}</dt>
      <dd className={`mt-1 text-[17px] tnum tracking-tight ${colour(sign ?? null)}`}>
        {value}
      </dd>
      {note && <div className="text-[11.5px] text-fg-faint mt-0.5">{note}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b hairline pb-2.5">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
