import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 30,  // Cache dynamic pages for 30s on client
      static: 180,  // Cache static pages for 3min on client
    },
  },
};

export default nextConfig;
