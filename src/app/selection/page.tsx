import type { Metadata } from "next";
import Link from "next/link";
import { Note } from "@/components/Note";
import { Section } from "@/components/Section";
import { DATA_REPO_URL, SITE_ORIGIN, getResearch } from "@/lib/data";
import { date } from "@/lib/format";

// Every figure here moves when the catalogue does.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selection",
  description:
    "How the strategy catalogue is graded, tier by tier, and which strategies that grading presents.",
  alternates: { canonical: `${SITE_ORIGIN}/selection` },
};

/**
 * SELECTION: how the catalogue is graded and what the grading presents.
 *
 * Every figure is a field of `research.json`. The only arithmetic is summing
 * the published grid's own cells into its tier totals, and checking that the
 * promoted and conditional cells add up to the published `presented_folders`
 * before the sentence explaining that relation is printed. A derived number may
 * explain a published one; it never replaces it.
 *
 * This page used to be /refused. It carried the correction counts, the
 * gross-Sharpe rows and the gate debt again (all on /research), the proofs a
 * hash chain cannot offer again (all on /verify), and a list of withheld
 * statistics shown on every portfolio's own page. What is left is the part only
 * this page shows: the catalogue as it is filed.
 */

/** Counts, grouped; a value never published prints as a dash, never a zero. */
const count = (n: number | null | undefined) =>
  n === null || n === undefined || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US");

// The published tier keys are not case-consistent ("production" beside
// "Baseline"), and a tier this file has never heard of must still render under
// its own name. Order is a preference applied case-insensitively.
const TIER_ORDER = ["production", "optimized", "baseline", "research"];
const VERDICT_ORDER = ["promote", "conditional", "reject", "unfiled"];

const TIER_LABEL: Record<string, string> = {
  production: "Production",
  optimized: "Optimised",
  baseline: "Baseline",
  research: "Archived",
};

const TIER_GLOSS: Record<string, string> = {
  production: "the working catalogue",
  optimized: "optimised versions, graded on their own results",
  baseline: "each strategy's original version, kept unedited",
  research: "strategies that do not meet the catalogue's standard",
};

const VERDICT_LABEL: Record<string, string> = {
  promote: "promoted",
  conditional: "conditional",
  reject: "not promoted",
  unfiled: "not graded",
};

function ordered(keys: string[], preferred: string[]): string[] {
  const rank = (k: string) => {
    const i = preferred.indexOf(k.toLowerCase());
    return i === -1 ? preferred.length : i;
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

export default async function SelectionPage() {
  const research = await getResearch();
  const byTier = research?.catalogue?.by_tier;
  const presented = research?.catalogue?.presented_folders;

  const tiers = byTier ? ordered(Object.keys(byTier), TIER_ORDER) : [];
  const verdicts = byTier
    ? ordered([...new Set(Object.values(byTier).flatMap((r) => Object.keys(r)))], VERDICT_ORDER)
    : [];
  const tierTotal = (tier: string) =>
    Object.values(byTier?.[tier] ?? {}).reduce((s, n) => s + n, 0);
  const entries = tiers.reduce((s, t) => s + tierTotal(t), 0);
  const sumVerdict = (verdict: string) =>
    tiers.reduce((s, t) => {
      const cell = byTier?.[t]?.[verdict];
      return typeof cell === "number" ? s + cell : s;
    }, 0);
  const promoted = sumVerdict("promote");
  const conditional = sumVerdict("conditional");
  const reconciles = presented !== undefined && promoted + conditional === presented;
  const archivedTier = tiers.find((t) => t.toLowerCase() === "research") ?? null;

  return (
    <div className="pt-2 lg:pt-6">
      <h1 className="text-title">Selection</h1>
      <p className="mt-5 max-w-[68ch] text-body text-fg-muted">
        How the strategy catalogue is graded, and what that grading presents.
        {research ? <> Figures as of {date(research.generated_at)}.</> : null}
      </p>

      {!byTier ? (
        <Note tone="warn" className="mt-12">
          The catalogue breakdown has not been published. Nothing is shown here
          rather than a count that might be out of date.
        </Note>
      ) : (
        <>
          <Section
            first
            title="The catalogue"
            aside={<TierGrid tiers={tiers} verdicts={verdicts} byTier={byTier} total={tierTotal} />}
          >
            <p className="text-body text-fg-muted">
              Every strategy is filed under the verdict its own results earned.
              Nothing is deleted: the code, the returns and the report stay in the
              catalogue, and only promoted and conditional strategies in the two
              deployable tiers are presented as an edge.
            </p>
            <p className="text-body text-fg-muted">
              The catalogue holds {count(entries)} entries across its tiers. One
              strategy can hold an entry in several tiers at once (its production
              version, its original baseline and its optimised version), so
              entries are not strategies:{" "}
              {count(research?.search?.strategies_researched)} strategies were
              researched.
            </p>
            {presented !== undefined && (
              <p className="text-body text-fg-muted">
                {count(presented)} entries are presented
                {reconciles
                  ? `: ${count(promoted)} promoted and ${count(conditional)} conditional`
                  : ""}
                . A promoted strategy must also clear the whole-catalogue
                correction set out under{" "}
                <Link href="/research" className="text-accent hover:underline">
                  research
                </Link>
                .
              </p>
            )}
          </Section>

          {archivedTier && (
            <Section title="Archived strategies">
              <p className="text-body text-fg-muted">
                {count(tierTotal(archivedTier))} strategies are archived because
                they do not meet the catalogue&rsquo;s own standard: the code does
                not implement the thesis it names, the sample is too small to
                conclude from, or the version was chosen on the same window it was
                measured on. Archived strategies are never presented, and every
                trial spent on them still counts in the correction applied to all
                the others.
              </p>
            </Section>
          )}

          <Section title="Source">
            <p className="text-small leading-relaxed text-fg-muted">
              Every figure on this page is read from{" "}
              <a
                className="text-accent hover:underline"
                href={`${DATA_REPO_URL}/blob/main/research.json`}
                target="_blank"
                rel="noreferrer noopener"
              >
                research.json
              </a>
              ; tier totals are the sum of each tier&rsquo;s published cells.
            </p>
          </Section>
        </>
      )}
    </div>
  );
}

function TierGrid({
  tiers,
  verdicts,
  byTier,
  total,
}: {
  tiers: string[];
  verdicts: string[];
  byTier: Record<string, Record<string, number>>;
  total: (tier: string) => number;
}) {
  return (
    <div>
      {tiers.map((tier) => {
        const key = tier.toLowerCase();
        // A tier lists only the verdicts it is graded on: a cell it never
        // carries is left out rather than printed as a zero.
        const cells = verdicts.filter((v) => typeof byTier[tier]?.[v] === "number");
        return (
          <div key={tier} className="mt-6 first:mt-0">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-caption font-semibold uppercase tracking-[0.12em] text-fg">
                {TIER_LABEL[key] ?? tier}
              </h3>
              <span className="tnum text-caption text-fg">{count(total(tier))}</span>
            </div>
            {TIER_GLOSS[key] && (
              <p className="mt-1 text-caption leading-snug text-fg-faint">{TIER_GLOSS[key]}</p>
            )}
            <dl className="mt-2">
              {cells.map((v) => (
                <div
                  key={v}
                  className="flex items-baseline justify-between gap-3 border-t hairline py-1"
                >
                  <dt className="text-caption text-fg-muted">
                    {VERDICT_LABEL[v.toLowerCase()] ?? v.replace(/_/g, " ")}
                  </dt>
                  <dd className="tnum text-caption text-fg">{count(byTier[tier][v])}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
