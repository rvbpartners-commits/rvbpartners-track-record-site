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
};

export default nextConfig;
