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
  //
  // A HOLDING THAT ROUNDS TO ZERO IS NOT A HOLDING OF ZERO. The published
  // detail files carry dust rows (−9.2e-08 shares of HPE, −3.3e-10 of DELL),
  // and at four decimals those render as "0" and "-0" — a row that looks like a
  // position of nothing rather than a residual too small to print. It is shown
  // as a bounded magnitude instead, so the reader sees a real, tiny quantity.
  if (value !== 0 && Math.abs(value) < 0.0001) {
    return `${value < 0 ? "−" : ""}<0.0001`;
  }
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

/** The clock a book's readings are shown on.
 *
 *  Not a module constant any more. The comment that used to sit here said
 *  "every session boundary in this record is an ET date" — true of the six
 *  Alpaca books and false of the book whose published `session_close` is
 *  "21:00 UTC", which was being labelled in New York time on the same page that
 *  printed its UTC close. The zone is therefore read from the book's own
 *  published convention, and only falls back to ET for a book that publishes
 *  none (which is what every Alpaca book's close is). */
export type DisplayZone = { timeZone: string; suffix: string };

export const ET_ZONE: DisplayZone = { timeZone: "America/New_York", suffix: "ET" };

/** Derive the display zone from a book's published `session_close.label`.
 *
 *  Two shapes appear in the data: an IANA zone ("16:00 America/New_York") and a
 *  bare UTC offset label ("21:00 UTC"). Anything else falls back to ET rather
 *  than guessing — a wrong zone silently re-dates a reading. */
export function sessionZone(
  label: string | null | undefined,
): DisplayZone {
  if (!label) return ET_ZONE;
  const iana = label.match(/[A-Za-z]+\/[A-Za-z_]+/);
  if (iana) {
    const timeZone = iana[0];
    return {
      timeZone,
      suffix: timeZone === "America/New_York" ? "ET" : timeZone,
    };
  }
  if (/\bUTC\b/.test(label)) return { timeZone: "UTC", suffix: "UTC" };
  return ET_ZONE;
}

/** A broker reading's instant, on the book's own clock.
 *
 *  The zone is passed in rather than assumed: a reading stamped "16:45 CEST"
 *  cannot be placed against the session it belongs to without the reader doing
 *  arithmetic, and doing that arithmetic in the wrong zone is worse than not
 *  doing it at all. */
export function marketTime(
  iso: string | null | undefined,
  zone: DisplayZone = ET_ZONE,
): string {
  if (!iso) return NO_VALUE;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: zone.timeZone,
  }).format(d)} ${zone.suffix}`;
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
  // `Number.isFinite`, like every other formatter here: a non-finite value must
  // render as absence rather than as "NaN h". It cannot arrive through
  // `JSON.parse` (a bare NaN literal makes the whole payload fail to parse and
  // the page renders the absence branch instead), so this is a backstop against
  // a future caller that computes rather than reads.
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return NO_VALUE;
  }
  if (seconds < 90) return `${Math.round(seconds)} s`;
  const minutes = seconds / 60;
  if (minutes < 120) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}
