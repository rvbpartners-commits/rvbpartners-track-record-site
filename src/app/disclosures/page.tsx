import type { Metadata } from "next";
import { REPO_URL, getIndex } from "@/lib/data";

// Next.js requires this to be a statically analysable literal, so it cannot
// be the REVALIDATE_SECONDS constant. 900s = 15 min; the desk publishes daily.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "Disclosures",
  description:
    "The specific, measured limitations of this track record — the same text " +
    "stamped into every published record.",
};

const SEVERITY: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "text-down" },
  important: { label: "Important", className: "text-warn-fg" },
  note: { label: "Note", className: "text-fg-faint" },
};

/**
 * Rendered from the SAME source the publisher stamps into every snapshot, so the
 * page and the data cannot drift apart. If this list is ever shorter than the
 * one in the records, that is a bug and not an editorial decision.
 */
export default async function DisclosuresPage() {
  const index = await getIndex();
  const disclosures = index?.disclosures ?? [];

  return (
    <>
      <header>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight">
          Disclosures
        </h1>
        <p className="mt-2 text-[14px] text-fg-muted max-w-[72ch] leading-relaxed">
          These are not boilerplate. Each one is a specific limitation of this
          track record, and each is stamped into every record in the{" "}
          <a
            className="text-accent hover:underline"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
          >
            data repository
          </a>{" "}
          — so a reader who only ever touches the raw JSON gets the same caveats
          as one who reads this page.
        </p>
      </header>

      <div className="mt-12 space-y-12 max-w-[80ch]">
        {disclosures.map((d) => {
          const sev = SEVERITY[d.severity] ?? SEVERITY.note;
          return (
            <section key={d.id} className="border-t hairline pt-6">
              <div
                className={`text-[11px] uppercase tracking-[0.12em] ${sev.className}`}
              >
                {sev.label}
              </div>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight leading-snug">
                {d.title_en}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed">{d.body_en}</p>
              <div className="mt-5 pl-4 border-l-2 hairline">
                <div className="text-[13px] font-medium text-fg-muted">
                  {d.title_fr}
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
                  {d.body_fr}
                </p>
              </div>
            </section>
          );
        })}

        {disclosures.length === 0 && (
          <p className="text-[14px] text-fg-muted">
            Disclosures could not be loaded from the data repository.
          </p>
        )}
      </div>

      <section className="mt-16 border-t hairline pt-6 max-w-[80ch]">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Regulatory status
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
          RVB Partners is a French entity. Publicly presenting performance may
          engage AMF and EU marketing rules even where the accounts are simulated
          and no service is offered. No regulatory assessment has been obtained
          for this site, and nothing here should be read as a claim that one has.
          If you are a regulator or counsel and something on this site needs to
          change, please get in touch.
        </p>
      </section>
    </>
  );
}
