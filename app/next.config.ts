import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Hay otros lockfiles en el home del usuario; sin esto Next infiere mal la raíz.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["drizzle-kit", "better-sqlite3", "@libsql/client"],
  async redirects() {
    return [
      {
        source: "/psycotest",
        destination: "/evaluacion",
        permanent: true,
      },
      {
        source: "/psycotest/:path*",
        destination: "/evaluacion/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/evaluacion", destination: "/psycotest" },
      { source: "/evaluacion/:path*", destination: "/psycotest/:path*" },
    ];
  },
};

export default nextConfig;
