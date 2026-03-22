import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Skip ESLint during production builds — lint separately in CI
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during build (tsc is run separately in CI)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
