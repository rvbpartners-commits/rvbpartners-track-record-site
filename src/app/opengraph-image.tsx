import { ImageResponse } from "next/og";
import { getIndex } from "@/lib/data";

/**
 * The card a shared link unfurls into. Generated from the live index so it
 * cannot state a book count or a cadence that has gone stale — the two facts
 * that have already changed once. It carries no performance figure: a
 * cumulative return in a preview image is a claim made where none of the
 * caveats fit.
 */
export const alt = "RVB live track record";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const index = await getIndex();
  const books = index?.books?.length ?? 0;
  const real = index?.books?.some((b) => b.capital_at_risk) ?? false;
  // One string, not a set of conditional children: the image renderer requires
  // an explicit display on any element with more than one child, and a subtitle
  // is a sentence rather than a layout.
  const subtitle = [
    books > 0 ? `${books} portfolios` : null,
    real ? "paper and real capital" : null,
    "hash-chained, timestamped, verifiable from open data",
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d0f12",
          color: "#e8e6e1",
          padding: "72px 80px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#d8a54f", letterSpacing: "0.14em" }}>
          RVB PARTNERS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Live track record
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9aa1ab", lineHeight: 1.35, maxWidth: 900 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#6f7889" }}>
          trackrecord.rvbpartners.fr
        </div>
      </div>
    ),
    { ...size },
  );
}
