import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Hay otros lockfiles en el home del usuario; sin esto Next infiere mal la raíz.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["drizzle-kit", "better-sqlite3", "@libsql/client"],
};

export default nextConfig;
