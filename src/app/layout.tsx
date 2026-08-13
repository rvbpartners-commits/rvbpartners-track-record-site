import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: {
    default: "RVB Partners — live track record",
    template: "%s — RVB Partners",
  },
  description:
    "Independently verifiable live paper-trading track record for four RVB " +
    "Partners portfolios. Every published number is hash-chained, timestamped, " +
    "and reproducible from open data.",
  // These are paper accounts with a short history. Ranking a page that makes
  // performance claims is not something to chase, so the site is discoverable
  // but not promoted.
  robots: { index: true, follow: true },
  openGraph: {
    title: "RVB Partners — live track record",
    description:
      "Four paper-trading portfolios, published daily, hash-chained and " +
      "timestamped. Verify every number yourself.",
    type: "website",
  },
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
