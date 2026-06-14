import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/compliance-check": ["./docs/**/*"],
  },
};

export default nextConfig;
