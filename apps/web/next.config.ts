import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // outputFileTracingRoot tells Next.js exactly where the monorepo root is.
  // This silences the "multiple lockfiles" warning on Vercel and ensures
  // all file traces are correct during the production build.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
