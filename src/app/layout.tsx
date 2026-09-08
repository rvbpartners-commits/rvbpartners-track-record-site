import type { Metadata } from "next";
import { IBM_Plex_Mono, Spectral } from "next/font/google";
import "./globals.css";
import { SITE_ORIGIN } from "@/lib/data";
import { Shell } from "@/components/Shell";

/* TWO FAMILIES, AND THE SPLIT IS THE WHOLE LOOK.
 *
 * The site had no typeface at all — `ui-sans-serif, system-ui` renders in
 * whatever the visitor's operating system supplies, so the same page arrived
 * as SF Pro on a Mac and Segoe on Windows. That is not restraint, it is an
 * unmade decision, and it is why careful writing still read as generic.
 *
 * Serif means the firm is talking. Mono means this came out of a file you can
 * download: every figure, date, hash, ticker, table cell and axis tick. The
 * day a digit appears in the serif, the register stops reading as a record and
 * starts reading as an opinion about one.
 *
 * Self-hosted at build by next/font, so the CSP never sees a font request and
 * there is no layout shift while a webfont loads.
 */
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-prose",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-figure",
});

export const metadata: Metadata = {
  // Pinned, not inferred. Without it Next resolves canonical and social URLs
  // against whichever host served the request, so a link shared from a
  // redirecting hostname advertises that hostname as the canonical one.
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "RVB live track record",
    template: "%s · RVB",
  },
  // No portfolio count and no publishing cadence in here: both have already
  // changed once (four books became six, daily became every fifteen minutes)
  // and metadata nobody re-reads is exactly where a stale number survives.
  description:
    "Independently verifiable live track record for the RVB portfolios — " +
    "paper accounts and one real-capital book. Every published number is " +
    "hash-chained, timestamped, and reproducible from open data.",
  // These are paper accounts with a short history. Ranking a page that makes
  // performance claims is not something to chase, so the site is discoverable
  // but not promoted.
  robots: { index: true, follow: true },
  openGraph: {
    title: "RVB live track record",
    description:
      "Live portfolios — paper and real capital — hash-chained and " +
      "timestamped. Verify every number yourself.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spectral.variable} ${plexMono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
