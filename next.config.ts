import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The maintainer's GitHub avatar, shown beside the contact link on /verify.
    // The only remote image the site loads.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/u/**",
      },
    ],
  },

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

  /* SECURITY HEADERS. The site shipped none of these — Vercel supplies HSTS
   * and nothing else — which is a poor look on a register whose whole claim is
   * that it can be checked. None of them changes what the site says; they
   * change what a third party can do to a reader who is looking at it.
   *
   * A CSP is deliberately NOT here. It needs a per-request nonce for the
   * inline script in <head>, and a nonce cannot come from a static config —
   * it belongs in middleware, where the request exists. Adding a
   * `script-src 'self'` line here would silently break that script.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
