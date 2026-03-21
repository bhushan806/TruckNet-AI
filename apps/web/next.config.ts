import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Skip ESLint during production builds — lint separately in CI
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
