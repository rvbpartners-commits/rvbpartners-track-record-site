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
    ];
  },
};

export default nextConfig;
