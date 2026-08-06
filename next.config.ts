import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image small and lets the commission
  // start the platform with a plain `node server.js`.
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "motion"],
  },
};

export default nextConfig;
