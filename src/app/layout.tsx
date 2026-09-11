import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
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
 * ONE SANS, ONE MONO. The prose face is Inter — the institutional register the
 * firm asked for, and the same family the corporate site used, so the two are
 * finally speaking in one voice.
 *
 * The split that matters survives the change: mono carries anything MEASURED —
 * every figure, date, hash, ticker, table cell and axis tick — and the prose
 * face carries everything the firm says. That is what keeps a page of numbers
 * reading as a record rather than as a claim about one, and it is the half of
 * the old serif/mono grammar worth keeping.
 *
 * Self-hosted at build by next/font, so the CSP never sees a font request and
 * there is no layout shift while a webfont loads.
 *
 * The variables next/font emits are named for the TYPEFACE (--font-sans,
 * --font-plex); globals.css maps them onto the ROLE names (--font-prose,
 * --font-figure) in its @theme block. The two layers must not share a name:
 * both declarations land on <html> at equal specificity, so `--font-prose:
 * var(--font-prose)` resolves to itself, and a self-referential custom
 * property is invalid at computed-value time — which silently invalidates
 * every `font-family` that reads it and drops the page back to the system
 * stack. The fonts download, the class lands, and nothing uses them.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  // Pinned, not inferred. Without it Next resolves canonical and social URLs
  // against whichever host served the request, so a link shared from a
  // redirecting hostname advertises that hostname as the canonical one.
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "RVB Partners · public register",
    template: "%s · RVB",
  },
  // No portfolio count and no publishing cadence in here: both have already
  // changed once (four books became six, daily became every fifteen minutes)
  // and metadata nobody re-reads is exactly where a stale number survives.
  // "ONE REAL-CAPITAL BOOK" WAS FALSE ON EVERY SHARE. The description claimed
  // a book this site does not publish, and "live track record" reads as a
  // record of money at risk when every account shown is broker-simulated.
  // "Live" survives only where it means continuously updated, and never beside
  // "track record".
  description:
    "The public register of RVB Partners: what we trade, how it was tested, " +
    "and what we refused. Every portfolio shown is a broker-simulated paper " +
    "account. Each published number is hash-chained, timestamped, and " +
    "reproducible from open data.",
  // These are paper accounts with a short history. Ranking a page that makes
  // performance claims is not something to chase, so the site is discoverable
  // but not promoted.
  robots: { index: true, follow: true },
  openGraph: {
    title: "RVB Partners · public register",
    description:
      "Broker-simulated paper portfolios, hash-chained and timestamped. " +
      "Verify every number yourself.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
