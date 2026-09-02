import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
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
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
