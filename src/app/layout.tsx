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
 *
 * The variables next/font emits are named for the TYPEFACE (--font-spectral,
 * --font-plex); globals.css maps them onto the ROLE names (--font-prose,
 * --font-figure) in its @theme block. The two layers must not share a name:
 * both declarations land on <html> at equal specificity, so `--font-prose:
 * var(--font-prose)` resolves to itself, and a self-referential custom
 * property is invalid at computed-value time — which silently invalidates
 * every `font-family` that reads it and drops the page back to the system
 * stack. The fonts download, the class lands, and nothing uses them.
 */
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-spectral",
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
      <head>
        {/* HAS THIS VISITOR ALREADY COME THROUGH THE FRONT DOOR? Answered
            BEFORE THE FIRST PAINT, which is the only reason this is an inline
            script rather than a `useEffect`.
            
            The title page is server-rendered on every request — it has to be,
            or a reader with no JavaScript never sees it. So on a reload, a
            visitor who has already entered would get the panel painted, then
            hydration would run, then React would remove it: a flash of the
            splash screen followed by the page jumping up a full viewport. On a
            slow connection that is not a flash, it is a second.
            
            A blocking script in <head> settles it before anything is drawn.
            The markup is identical either way — only a CSS rule changes — so
            there is no hydration mismatch to recover from.
            
            sessionStorage, NOT a cookie. A cookie would be sent to the server
            on every request, which would let this be decided during rendering
            and is in that sense the tidier engineering; but it would also make
            a French financial site with no consent banner start setting
            cookies, and skipping a splash screen is not a strictly-necessary
            purpose. This never leaves the browser.
            
            try/catch because storage access THROWS, it does not return null,
            when a browser is set to block site data. An exception here would
            be uncaught at the top of the document. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('rvb.entered')==='1')" +
              "document.documentElement.dataset.entered='1'}catch(e){}",
          }}
        />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
