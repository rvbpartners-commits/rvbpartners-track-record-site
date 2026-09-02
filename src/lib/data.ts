/**
 * The site's only data source: the public track-record repository.
 *
 * Everything here is a fetch and a parse. No metric is computed in this file or
 * anywhere else in the frontend — the numbers arrive already calculated by the
 * desk's `rvb.metrics` module, which is the whole point of publishing them as
 * JSON. If you find yourself about to write `Math.sqrt(252) * ...` here, stop:
 * the answer belongs upstream, in the one place metrics are allowed to live.
 */

export const DATA_REPO = "rvbpartners-commits/rvbpartners-track-record-data";
export const DATA_BASE = `https://raw.githubusercontent.com/${DATA_REPO}/main`;
export const DATA_REPO_URL = `https://github.com/${DATA_REPO}`;
export const SITE_REPO_URL =
  "https://github.com/rvbpartners-commits/rvbpartners-track-record-site";
export const MAINTAINER_URL = "https://github.com/v89ysppdry";
export const MAINTAINER_AVATAR =
  "https://avatars.githubusercontent.com/u/247671242?v=4";
/** One address, used by the footer and the landing page. */
export const CONTACT_EMAIL = "contact@rvbpartners.fr";
/** @deprecated use DATA_REPO_URL */
export const REPO_URL = DATA_REPO_URL;

/** How long a fetched file is reused inside one server instance.
 *
 *  Deliberately OUR cache and not the framework's. Statically prerendering these
 *  pages and relying on `next: { revalidate }` left the live site serving data
 *  six hours old: the page regenerated, but the underlying fetch kept returning
 *  a cached response, and no amount of traffic cleared it. The pages are dynamic
 *  now and every fetch is `no-store`, so freshness is bounded by this window
 *  plus raw.githubusercontent's own CDN (~5 minutes) — both small, both
 *  predictable, neither able to silently pin the site to an old publish. */
export const MEMO_SECONDS = 60;

/** English only; the published `_fr` fields are deliberately not typed here. */
/** The research denominator: how much was searched to find what is published.
 *  Aggregates only — the file names no strategy, by construction. */
export type ResearchSummary = {
  schema: string;
  generated_at: string;
  note?: string;
  source?: string;
  search: {
    strategies_researched: number;
    recorded_trials: number;
    ledger_entries: number;
    idea_families: number;
    effective_independent_trials: number;
    effective_independent_strategies: number;
    note?: string;
  };
  deflation: {
    alpha: number;
    clear_nominal_bar: number;
    expected_false_positives_at_alpha: number;
    survive_book_level: number;
    demoted_by_book_level: number;
    gross_sharpe_fallback_rows?: number;
    note?: string;
  };
  catalogue?: {
    by_tier?: Record<string, Record<string, number>>;
    presented_folders?: number;
  };
  gate_debt?: Record<string, Record<string, number | string | null>>;
};

export type Disclosure = {
  id: string;
  severity: "critical" | "important" | "note";
  title_en: string;
  body_en: string;
  /** Which books the item is true of: "all", "paper", or "real_capital".
   *  Older records predate the field; absent means it applies to everything,
   *  which is what those records meant when they were written. */
  applies_to?: string;
};

/** Where the curve stops, and why it stops there.
 *
 *  Published per book because each one closes at its own hour. A page that
 *  guesses a close time is right about one book and wrong about the rest. */
export type SessionClose = {
  label: string;
  note: string;
};

export type BookSummary = {
  book: string;
  /** The book's URL segment, published by the publisher. See `bookSlug`. */
  slug?: string;
  label: string;
  tagline_en: string | null;
  inception: string;
  last_session: string;
  sessions: number;
  /** Sessions on which the book actually executed. Counted from executions,
   *  never from non-zero returns: funding accrues while a position is held
   *  without any order being placed. */
  active_sessions?: number;
  initial_capital: number;
  cumulative_return: number | null;
  live: LiveReading | null;
  annualised_gated: boolean;
  categories: BookCategory[];
  account_ref: string | null;
  account_number: string | null;
  /** True when the book trades real money. Optional: a payload published before
   *  this field existed reads as `false`, which is what every book was then. */
  capital_at_risk?: boolean;
  /** The badge wording, published by the book. Both kinds of account get the
   *  same visual treatment and differ only in this text. */
  account_kind?: string;
  account_kind_label?: string;
  session_close?: SessionClose;
  exposure?: Exposure;
  latest_detail_session: string | null;
  paths: Record<string, string>;
};

/** A book's URL segment.
 *
 *  Read from the payload. The fallback recomputes what the publisher would have
 *  written — from the LABEL, never from the internal book id: the ids say
 *  `best_cagr`, `best_mdd`, `best_sharpe`, which name the criterion each
 *  portfolio was selected on and is exactly what the labels keep off the page.
 *  Putting that in the address bar would re-expose it in every shared link.
 *
 *  Because the fallback is the same function, a book published before the field
 *  existed resolves to the SAME slug it will get once republished — so no URL
 *  moves under a reader who bookmarked it. */
export function bookSlug(
  b: { slug?: string | null; label?: string | null; book: string },
): string {
  if (b.slug) return b.slug;
  const source = (b.label ?? b.book).trim().toLowerCase();
  const slug = source.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || b.book.replace(/_/g, "-");
}

export type IndexPayload = {
  schema: string;
  publisher: string;
  published_at: string;
  min_sessions_for_annualised: number;
  detail_lag_days: number;
  books: BookSummary[];
  disclosures: Disclosure[];
  chain: { file: string; entries: number };
};

export type MetricValues = Record<string, number | null>;

export type MetricsPayload = {
  book: string;
  as_of: string;
  published_at: string;
  values: MetricValues;
  risk_free_annual: number;
  risk_free_source: string;
  annualised_basis: number;
  computed_by: string;
  sharpe_convention: string;
  insufficient_history?: {
    have: number;
    need: number;
    suppressed: string[];
    label_en: string;
  };
};

export type NavPoint = {
  date: string;
  /** Exactly what the broker reported, never rewritten. */
  equity: number;
  cash: number | null;
  /** Declared external capital movement on this date, signed. Zero on every
   *  session that had none, which is almost all of them. */
  flow: number;
  /** The multiplier that removes declared external flows from the return.
   *  Exactly 1 for a book that has never had one, so `equity_adj === equity`. */
  adj_factor: number;
  /** equity x adj_factor: the track-record index, and the series every
   *  published metric is computed on. This is what the charts draw. */
  equity_adj: number;
  daily_return: number | null;
};

export type BenchmarkPoint = {
  date: string;
  spy_cum: number | null;
  cash_cum: number | null;
};

/** Broker account equity at 5-minute resolution. This is what makes the curve a
 *  curve rather than two line segments — real broker data, not interpolation. */
export type IntradayPoint = {
  timestamp: string;
  session_date: string;
  equity: number;
};

export type Position = {
  symbol: string;
  qty: number;
  avg_price: number;
  mark: number | null;
  cost_basis: number;
};

/** Holdings are grouped by strategy category; no strategy identifier exists
 *  anywhere in the published data. */
export type CategoryGroup = {
  category: string;
  code: string;
  label: string;
  positions: Position[];
  cost_basis: number;
  market_value: number;
  open_pnl: number;
  open_pnl_pct: number | null;
  /** True when some holding in the group had no same-day mark, so the group's
   *  market value and P&L cover only part of it. */
  partial: boolean;
  unmarked: number;
  n_positions: number;
  n_long: number;
  n_short: number;
};

export type BookCategory = {
  category: string;
  code: string;
  label: string;
  strategies: number;
  weight: number;
};

export type DetailPayload = {
  book: string;
  session_date: string;
  released_under_lag_days: number;
  note: string;
  orders: Record<string, unknown>[];
  fills: Record<string, unknown>[];
  categories: CategoryGroup[];
};

export type RollingPoint = { date: string; value: number | null };

export type AnalyticsPayload = {
  book: string;
  as_of: string;
  sessions: number;
  gated: boolean;
  min_sessions_for_annualised: number;
  risk_free_annual: number;
  risk_free_source: string;
  computed_by: string;
  daily_returns: { date: string; return: number | null }[];
  drawdown: { date: string; drawdown: number | null }[];
  rolling_sharpe: Record<string, RollingPoint[]>;
  rolling_volatility: Record<string, RollingPoint[]>;
  rolling_sortino: Record<string, RollingPoint[]>;
  quantiles: {
    horizon: string;
    n: number;
    min: number | null;
    q25: number | null;
    median: number | null;
    q75: number | null;
    max: number | null;
  }[];
  rolling_windows_withheld?: number[];
  monthly_returns: {
    year: number;
    month: number;
    return: number | null;
    sessions: number;
    partial: boolean;
  }[];
  distribution: { bins: { from: number; to: number; count: number }[] };
  drawdown_episodes: {
    start: string;
    trough: string;
    recovered: string | null;
    depth: number | null;
    sessions: number;
    ongoing: boolean;
  }[];
  summary: Record<string, number | null>;
  withheld_note?: string;
};

/** The latest broker reading. NOT chained evidence: it is a mid-session equity
 *  reading, not an after-close mark, and it can still move. Published by the
 *  desk (never divided out here) so the headline a reader sees and the curve
 *  drawn beside it come from the same source and the same funded-capital base. */
export type LiveReading = {
  /** The raw broker reading. */
  equity: number;
  at: string;
  session_date: string;
  /** Already on the adjusted index: the desk applies `adj_factor` before
   *  publishing, so this never needs adjusting again here. */
  cumulative_return: number;
  /** The multiplier applied. 1 unless a capital event is declared. */
  adj_factor?: number;
  marked: boolean;
  source: string;
};

/** A declared external capital movement: money or assets entering or leaving an
 *  account by an act that is not a trade. Excluded from the return, kept in the
 *  balance — the standard time-weighted treatment. Absent for every book that
 *  has never had one. */
export type CapitalEvents = {
  convention: string;
  raw_series_preserved: string;
  events: {
    date: string;
    kind: string;
    amount_usd: number;
    derivation: string;
    reason_en: string;
    reason_fr: string;
    evidence: Record<string, unknown>;
  }[];
  cumulative_flow_usd: number;
  /** Multiply a RAW intraday reading by this to place it on the adjusted index.
   *  It matters in one window and matters a lot there: a flow reaches the
   *  broker's equity hours before the mark that creates its NAV row, so until
   *  that mark this is the only thing keeping the live line on the same axis as
   *  the marked one. */
  live_factor: number;
  live_factor_note: string;
};

export type BookMeta = {
  book: string;
  account_ref: string | null;
  account_number: string | null;
  /** True when the book trades real money. Optional: a payload published before
   *  this field existed reads as `false`, which is what every book was then. */
  capital_at_risk?: boolean;
  account_type: string;
  inception: string;
  inception_anchored_to_funded_capital: boolean;
  inception_note: string;
  last_session: string;
  sessions: number;
  /** Sessions on which the book actually executed. Counted from executions,
   *  never from non-zero returns: funding accrues while a position is held
   *  without any order being placed. */
  active_sessions?: number;
  initial_capital: number;
  currency: string;
  detail_lag_days: number;
  min_sessions_for_annualised: number;
  categories: BookCategory[];
  intraday_points: number;
  intraday_resolution: string;
  intraday_sessions_rejected: string[];
  live: LiveReading | null;
  capital_events?: CapitalEvents | null;
  desk_manifest_hash: string | null;
  chain_head: string;
  published_at: string;
  /** Sessions for which execution detail has been released. Authoritative —
   *  the site reads these, it never probes for files that may not exist. */
  detail_sessions: string[];
  latest_detail_session: string | null;
  /** The account badge, as DATA. The page must not decide what kind of account
   *  this is from a hardcoded sentence: the sentence that enumerated "6 paper
   *  and 1 real" became false the day a second real book arrived. */
  account_kind?: string;
  account_kind_label?: string;
  slug?: string;
  session_close?: SessionClose;
  exposure?: Exposure;
  /** Sessions the book carried an open, unmatched position past the close.
   *  Disclosed, never marked: a locked pair is realised the day it locks, and
   *  an unmatched remainder carries the market risk and none of the published
   *  profit. Its result appears on the day it locks. */
  open_at_close?: {
    sessions_checked: number;
    sessions_flat: number;
    sessions_with_open_exposure: {
      session: string;
      tickets: number;
      net_volume: number;
    }[];
    note: string;
  };
  /** Equity at the OPEN of the inception session — the denominator of the first
   *  day's return, which is not the same number as `initial_capital` on a book
   *  whose capital lands intraday. Never a curve point. */
  opening_capital?: number;
  round_trips?: RoundTrips | null;
};

/** What a book is exposed to, for one that does not hold anything for long.
 *
 *  Its presence is also what tells the page to show exposure instead of a
 *  holdings table: a book that publishes this has no holdings to publish. An
 *  equity book publishes `categories` and positions; this one publishes how
 *  much of the time it is exposed. */
export type Exposure = {
  sessions_published: number;
  sessions_traded: number;
  sessions_checked: number;
  sessions_flat_at_close: number;
  carried_past_close: { session: string; tickets: number; net_volume: number }[];
  median_holding_seconds: number | null;
  structure: string;
  note: string;
};

/** The combined daily profit and loss, in the book's currency.
 *
 *  Published beside the unit NAV rather than instead of it, because the two
 *  answer different questions: "what did this book make" and "what return did
 *  it serve". On a book that took deposits those are not the same number, and
 *  showing one under the other's label is how a curve starts lying. */
export type DailyPoint = {
  date: string;
  pnl: number | null;
  cumulative: number | null;
  cumulativePct: number | null;
};

/** Round trips, for a book whose unit of account is the round trip rather than
 *  the session. Absent on every book that counts in sessions. */
export type RoundTrips = {
  round_trips: number;
  round_trips_needed_for_annualising: number;
  annualised_withheld: boolean;
  net_total_usd: number;
  net_mean_usd: number | null;
  winners: number;
  hit_rate: number | null;
  median_holding_seconds: number | null;
  funding_total_usd: number;
  funding_share_of_net: number | null;
  fees_total_usd: number;
  combined_note: string;
  unit_note: string;
};

export type ChainEntry = {
  ts: string;
  book: string;
  session_date: string;
  file: string;
  sha256: string;
  prev_hash: string;
  hash: string;
};

type Memo = { at: number; body: string | null };
const memo = new Map<string, Memo>();

async function getText(path: string): Promise<string | null> {
  const now = Date.now();
  const hit = memo.get(path);
  if (hit && now - hit.at < MEMO_SECONDS * 1000) return hit.body;

  // A transport failure is not a different kind of event from a missing file:
  // in both cases we do not have the data, and the page says so rather than
  // showing something stale. Without this, a DNS or TLS failure against the
  // data host threw out of the render and replaced every carefully worded
  // absence with a framework crash page.
  let body: string | null = null;
  try {
    const res = await fetch(`${DATA_BASE}/${path}`, { cache: "no-store" });
    body = res.ok ? await res.text() : null;
  } catch {
    // Not memoised: a network failure is transient, and caching it for a
    // minute would turn one bad second into a minute of empty pages.
    return null;
  }
  // A 404 is memoised too: most session dates legitimately have no detail file,
  // and re-asking on every render would spend the whole page budget on misses.
  memo.set(path, { at: now, body });
  return body;
}

/** Drop `*_fr` keys at the boundary. Rendering only English is not enough -
 *  server props are serialised into the page and would ship the French too. */
function stripFrench<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripFrench) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !k.endsWith("_fr"))
        .map(([k, v]) => [k, stripFrench(v)]),
    ) as T;
  }
  return value;
}

async function getJson<T>(path: string): Promise<T | null> {
  const text = await getText(path);
  if (text === null) return null;
  try {
    return stripFrench(JSON.parse(text) as T);
  } catch {
    return null;
  }
}

/** Minimal CSV reader. The published files have no quoted fields, no embedded
 *  commas and no newlines inside values — the publisher writes plain numeric
 *  columns — so a full parser would be dependency for nothing. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]));
  });
}

/** Empty string and the literal "None"/"nan" all mean "no value published".
 *  They must become null, never 0 — a gap in the series is a gap, and rendering
 *  it as zero would draw a crash that never happened. */
function num(v: string | undefined): number | null {
  if (v === undefined || v === "" || v === "None" || v === "nan" || v === "NaN") {
    return null;
  }
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getIndex(): Promise<IndexPayload | null> {
  return getJson<IndexPayload>("index.json");
}

export async function getMetrics(book: string): Promise<MetricsPayload | null> {
  return getJson<MetricsPayload>(`books/${book}/metrics.json`);
}

export async function getAnalytics(book: string): Promise<AnalyticsPayload | null> {
  return getJson<AnalyticsPayload>(`books/${book}/analytics.json`);
}

export async function getMeta(book: string): Promise<BookMeta | null> {
  return getJson<BookMeta>(`books/${book}/meta.json`);
}

export async function getNav(book: string): Promise<NavPoint[]> {
  const text = await getText(`books/${book}/nav.csv`);
  if (!text) return [];
  return parseCsv(text).map((r) => {
    const equity = num(r.equity) ?? 0;
    // A file published before the columns existed has no flow to remove, so it
    // falls back to the identity. That is the correct reading of an older file,
    // not a guess: those books had no capital event.
    const adjFactor = num(r.adj_factor) ?? 1;
    return {
      date: r.date,
      equity,
      cash: num(r.cash),
      flow: num(r.flow) ?? 0,
      adj_factor: adjFactor,
      equity_adj: num(r.equity_adj) ?? equity * adjFactor,
      daily_return: num(r.daily_return),
    };
  });
}

/** Benchmarks on the same instants as the intraday equity, so both series span
 *  the axis instead of being joined across three points. */
export async function getBenchmarkIntraday(
  book: string,
): Promise<Map<string, { spy: number | null; cash: number | null }>> {
  const text = await getText(`books/${book}/benchmark_intraday.csv`);
  const out = new Map<string, { spy: number | null; cash: number | null }>();
  if (!text) return out;
  for (const r of parseCsv(text)) {
    if (!r.timestamp) continue;
    out.set(r.timestamp, { spy: num(r.spy_cum), cash: num(r.cash_cum) });
  }
  return out;
}

export async function getIntraday(book: string): Promise<IntradayPoint[]> {
  const text = await getText(`books/${book}/intraday.csv`);
  if (!text) return [];
  return parseCsv(text)
    .map((r) => ({
      timestamp: r.timestamp,
      session_date: r.session_date,
      equity: num(r.equity) ?? 0,
    }))
    // A BACKSTOP, and it must never be load-bearing. The desk is the only place
    // allowed to decide which broker readings are true, and it now refuses to
    // publish a zero-equity reading at all (an account reporting no equity is an
    // account that was not yet funded, which against a funded base is -100%).
    // This filter was silently absorbing exactly that defect for two books --
    // the site looked correct while the published data was wrong, which is the
    // worst of both. Kept only so a novel broker glitch cannot deface a public
    // page; if it ever removes a point again, the bug is upstream.
    .filter((p) => p.timestamp && p.equity > 0);
}

export async function getBenchmark(book: string): Promise<BenchmarkPoint[]> {
  const text = await getText(`books/${book}/benchmark.csv`);
  if (!text) return [];
  return parseCsv(text).map((r) => ({
    date: r.date,
    spy_cum: num(r.spy_cum),
    cash_cum: num(r.cash_cum),
  }));
}

export async function getDetail(
  book: string,
  session: string,
): Promise<DetailPayload | null> {
  return getJson<DetailPayload>(`books/${book}/detail/${session}.json`);
}

/** The latest released detail file. The session comes from
 *  `meta.latest_detail_session` - never probe, a 404 aborts static generation. */
export async function getLatestDetail(
  book: string,
  meta: BookMeta | null,
): Promise<DetailPayload | null> {
  const session = meta?.latest_detail_session;
  if (!session) return null;
  return getDetail(book, session);
}

/** The daily profit-and-loss series. Absent for books that publish only a NAV;
 *  an empty array then means "not published", never "flat". */
export async function getDaily(book: string): Promise<DailyPoint[]> {
  const text = await getText(`books/${book}/daily.csv`);
  if (!text) return [];
  return parseCsv(text).map((r) => ({
    date: r.date,
    pnl: num(r.pnl_usd),
    cumulative: num(r.pnl_cumulative_usd),
    cumulativePct: num(r.pnl_cumulative_pct),
  }));
}

/** Absent until the summary has been generated and published — the page is
 *  simply not rendered in that case, rather than shown with holes in it. */
export async function getResearch(): Promise<ResearchSummary | null> {
  return getJson<ResearchSummary>("research.json");
}

export async function getChain(): Promise<ChainEntry[]> {
  const text = await getText("CHAIN.jsonl");
  if (!text) return [];
  return text
    .trim()
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => {
      try {
        return JSON.parse(l) as ChainEntry;
      } catch {
        return null;
      }
    })
    .filter((e): e is ChainEntry => e !== null);
}

/** Cumulative return series derived from published NAV — a rebase, not a metric.
 *  (equity_adj / equity_adj[0] − 1 is the definition of the axis the chart draws,
 *  and it reconciles exactly with the published `cumulative_return`.)
 *
 *  `equity_adj` rather than `equity`: a capital movement that is not a trade
 *  does not belong in a performance line. The two columns are identical for
 *  every book that has never had one, and the raw column stays in the same file
 *  for anyone who wants the unadjusted curve. */
export function toCumulative(nav: NavPoint[]): { date: string; value: number }[] {
  if (nav.length === 0) return [];
  const base = nav[0].equity_adj;
  if (!base) return [];
  return nav.map((p) => ({ date: p.date, value: p.equity_adj / base - 1 }));
}
