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
export const REPO_URL = `https://github.com/${DATA_REPO}`;

/** Re-fetch every 15 minutes. The desk publishes once a day, so this is only
 *  about how quickly a fresh publish reaches visitors, never about load. */
export const REVALIDATE_SECONDS = 900;

export type Disclosure = {
  id: string;
  severity: "critical" | "important" | "note";
  title_en: string;
  title_fr: string;
  body_en: string;
  body_fr: string;
};

export type BookSummary = {
  book: string;
  label: string;
  tagline_en: string | null;
  tagline_fr: string | null;
  inception: string;
  last_session: string;
  sessions: number;
  initial_capital: number;
  cumulative_return: number | null;
  annualised_gated: boolean;
  strategies: string[];
  account_ref: string | null;
  account_number: string | null;
  latest_detail_session: string | null;
  paths: Record<string, string>;
};

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
    label_fr: string;
    label_en: string;
  };
};

export type NavPoint = {
  date: string;
  equity: number;
  cash: number | null;
  daily_return: number | null;
};

export type BenchmarkPoint = {
  date: string;
  spy_cum: number | null;
  cash_cum: number | null;
};

export type Position = {
  slug: string;
  symbol: string;
  qty: number;
  avg_price: number;
};

export type DetailPayload = {
  book: string;
  session_date: string;
  released_under_lag_days: number;
  note: string;
  orders: Record<string, unknown>[];
  fills: Record<string, unknown>[];
  positions: Position[];
};

export type BookMeta = {
  book: string;
  account_ref: string | null;
  account_number: string | null;
  account_type: string;
  inception: string;
  inception_anchored_to_funded_capital: boolean;
  inception_note: string;
  last_session: string;
  sessions: number;
  initial_capital: number;
  currency: string;
  detail_lag_days: number;
  min_sessions_for_annualised: number;
  strategies: string[];
  desk_manifest_hash: string | null;
  chain_head: string;
  published_at: string;
  /** Sessions for which execution detail has been released. Authoritative —
   *  the site reads these, it never probes for files that may not exist. */
  detail_sessions: string[];
  latest_detail_session: string | null;
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

async function getText(path: string): Promise<string | null> {
  const res = await fetch(`${DATA_BASE}/${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return null;
  return res.text();
}

async function getJson<T>(path: string): Promise<T | null> {
  const text = await getText(path);
  if (text === null) return null;
  try {
    return JSON.parse(text) as T;
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

export async function getMeta(book: string): Promise<BookMeta | null> {
  return getJson<BookMeta>(`books/${book}/meta.json`);
}

export async function getNav(book: string): Promise<NavPoint[]> {
  const text = await getText(`books/${book}/nav.csv`);
  if (!text) return [];
  return parseCsv(text).map((r) => ({
    date: r.date,
    equity: num(r.equity) ?? 0,
    cash: num(r.cash),
    daily_return: num(r.daily_return),
  }));
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

/**
 * The most recent released detail file, or null.
 *
 * The session is taken from `meta.latest_detail_session`, which the publisher
 * writes for exactly this purpose — it is never guessed by walking back through
 * NAV dates. Detail is released on a lag and only for cycles that actually
 * executed, so most session dates legitimately have no file, and probing for
 * one is worse than merely wasteful here: a 404 during Next's static generation
 * aborts the render of that component, which showed up as an empty holdings
 * table with no error anywhere.
 */
export async function getLatestDetail(
  book: string,
  meta: BookMeta | null,
): Promise<DetailPayload | null> {
  const session = meta?.latest_detail_session;
  if (!session) return null;
  return getDetail(book, session);
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
 *  (equity / equity[0] − 1 is the definition of the axis the chart draws, and it
 *  reconciles exactly with the published `cumulative_return`.) */
export function toCumulative(nav: NavPoint[]): { date: string; value: number }[] {
  if (nav.length === 0) return [];
  const base = nav[0].equity;
  if (!base) return [];
  return nav.map((p) => ({ date: p.date, value: p.equity / base - 1 }));
}
