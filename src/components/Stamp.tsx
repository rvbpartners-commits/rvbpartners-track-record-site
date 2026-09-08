/**
 * A STAMP: a hairline rectangle carrying a status and a figure.
 *
 * This is the one piece of ornament the page allows itself, and it exists
 * because the site's honest facts were previously the quietest thing on it —
 * "paper account", "withheld", "excluded" were set in the same grey as the
 * captions, so a visitor skimming the page absorbed the returns and missed the
 * conditions attached to them. A stamp is what a register puts on a record to
 * qualify it, and it reads before the prose does.
 *
 * TWO GOVERNANCE RULES, both enforced by the shape of the props:
 *
 *  1. A STAMP ALWAYS CARRIES A NUMBER. `value` is required, not optional. A
 *     stamp reading just "PAPER" is a label, and labels drift into decoration:
 *     six of them across a page and they stop being read. A stamp reading
 *     "PAPER ACCOUNTS / 6" is a fact, and a fact that changes when the book
 *     changes. If there is no number to print, the thing being said belongs in
 *     a sentence, not in a stamp.
 *
 *  2. NEVER MORE THAN FOUR ABOVE A FOLD. Not expressible in a type, so it is
 *     stated here and held to at the call sites: the band on the home page is
 *     four. A wall of stamps is a dashboard, and this page is not one.
 *
 * `tone="negative"` spends the reserved oxide (see globals.css). It marks a
 * fact that DISQUALIFIES the numbers near it — a simulated account, a withheld
 * statistic, an excluded book — and nothing else. It is not "important", it is
 * not "attention", and it is never the tone of a good result. The moment a
 * strong return is stamped in oxide the colour stops meaning anything and the
 * disclosures go quiet with it.
 */
export function Stamp({
  label,
  value,
  note,
  tone = "neutral",
}: {
  label: string;
  /** Required by rule 1 above. A stamp with no number does not ship. */
  value: string;
  note?: string;
  tone?: "neutral" | "negative";
}) {
  const negative = tone === "negative";
  return (
    <div
      className="border px-4 py-3.5"
      style={{
        // Not `border-oxide`: a full-strength saturated rectangle competes with
        // its own contents. The border carries the signal at 40%, the label
        // carries it at full strength, and the figure stays in the page's own
        // ink so it is read as a number rather than as a warning.
        borderColor: negative
          ? "color-mix(in srgb, var(--oxide) 40%, transparent)"
          : "var(--hairline)",
      }}
    >
      <div
        className="font-figure text-[10.5px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: negative ? "var(--oxide)" : "var(--fg-faint)" }}
      >
        {label}
      </div>
      <div className="mt-2 font-figure tnum text-[19px] leading-none text-fg">
        {value}
      </div>
      {note && (
        <div className="mt-2 text-[11.5px] leading-snug text-fg-faint">
          {note}
        </div>
      )}
    </div>
  );
}
