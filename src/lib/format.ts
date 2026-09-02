/** Formatting only. Nothing here turns "not published" into a value. */

/** The one thing this module must never do quietly: render a missing number as
 *  0, "0.00%", or "—" without the reader knowing which it was. `null` from the
 *  data layer means "the desk withheld this or never had it", and every
 *  formatter below returns this marker so the UI can style it as absence. */
export const NO_VALUE = "—";

export function pct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return NO_VALUE;
  }
  return `${(value * 100).toFixed(digits)}%`;
}

export function signedPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return NO_VALUE;
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}%`;
}

export function ratio(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return NO_VALUE;
  }
  return value.toFixed(digits);
}

export function money(
  value: number | null | undefined,
  currency = "USD",
  digits = 2,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return NO_VALUE;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function qty(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return NO_VALUE;
  }
  // Fractional shares are real here (Alpaca fills them), so they are shown
  // rather than rounded away — but four decimals is where it stops mattering.
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(value);
}

export function date(iso: string | null | undefined): string {
  if (!iso) return NO_VALUE;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return NO_VALUE;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(d);
}

/** Direction for colouring. `null` is deliberately its own case — a withheld
 *  number is not "flat", and painting it neutral-grey says so. */
export function direction(value: number | null | undefined): "up" | "down" | "flat" {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return "flat";
  }
  return value > 0 ? "up" : "down";
}

export function slugLabel(slug: string): string {
  return slug
    .split("_")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

export function shortHash(hash: string | null | undefined, len = 12): string {
  if (!hash) return NO_VALUE;
  return hash.length <= len ? hash : `${hash.slice(0, len)}…`;
}

/** A broker reading's instant, in the market's own clock.
 *
 *  New York, not UTC and not the reader's zone: every session boundary in this
 *  record is an ET date, so a reading stamped "16:45 CEST" cannot be placed
 *  against the session it belongs to without the reader doing arithmetic. */
export function marketTime(iso: string | null | undefined): string {
  if (!iso) return NO_VALUE;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(d)} ET`;
}

/**
 * A holding time, in the largest unit that stays readable.
 *
 * Lives here because two components used to define it independently, with
 * different thresholds, and rendered the same quantity as "93 min" in one
 * section and "1.5 h" in another on one page. On a record whose argument is
 * internal consistency, that is not a rounding difference.
 */
export function duration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = seconds / 60;
  if (minutes < 120) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}
