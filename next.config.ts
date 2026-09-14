import type { NextConfig } from "next";

/* A CONTENT-SECURITY-POLICY WITHOUT A NONCE. Next's inline bootstrap scripts
   need 'unsafe-inline' unless every request carries a nonce, so script-src
   cannot be locked to hashes here. What this still does is refuse any script,
   style, font, image or connection from another origin, plugins, <base>
   rewriting, form posts elsewhere and framing by other sites. The site loads
   nothing from a third party, so nothing legitimate is refused. Development
   keeps 'unsafe-eval' for the dev server's hot reload. */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // No `X-Powered-By: Next.js`: it tells a scanner which advisories to try.
  poweredByHeader: false,
  // No remote images. The GitHub avatar that needed an allowance is gone, and
  // with none allowed the optimiser only ever processes the site's own files.

  /* The legal notice was published at /mentions-legales for a few hours before
     the site settled on English throughout. That address is already in the
     wild, and a legal notice is exactly the page a reader must not meet a 404
     at. Permanent, so it is also the answer for anything that indexed it. */
  async redirects() {
    return [
      { source: "/mentions-legales", destination: "/legal", permanent: true },
      // /refused became /selection; the old address was public for a week.
      { source: "/refused", destination: "/selection", permanent: true },
    ];
  },

  /* SECURITY HEADERS. None of them changes what the site says; they change
   * what a third party can do to a reader who is looking at it. The CSP is
   * the nonce-free baseline defined above. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          /* HSTS WITHOUT `preload`, on purpose. Preloading is a submission to a
             list baked into browser binaries; removal takes months to
             propagate. Two years of enforced HTTPS is the same protection for
             any returning reader without the one-way door. */
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          /* A published record framed inside someone else's page, under their
             commentary, is a misattribution this cannot otherwise prevent. */
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          /* The site serves JSON and CSV straight from a public repository.
             Content sniffing is what turns one of those into something a
             browser will execute. */
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          /* Nothing here needs a camera, a microphone, a location or a
             cohort. Denying them is free and permanent. */
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          /* NO `X-XSS-Protection`. The corporate site sets `1; mode=block`;
             it is deprecated, ignored by every current browser, and in the
             engines that did implement it the auditor introduced
             vulnerabilities of its own. Carrying a dead header forward
             because it looks like security is how a checklist replaces a
             decision. */
        ],
      },
    ];
  },
};

export default nextConfig;
