import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Hay otros lockfiles en el home del usuario; sin esto Next infiere mal la raíz.
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["drizzle-kit", "better-sqlite3", "@libsql/client"],
  async redirects() {
    return [
      // Enlaces viejos: la carpeta pasó de /psycotest a /evaluacion.
      { source: "/psycotest", destination: "/evaluacion/acceso", permanent: true },
      {
        source: "/psycotest/participantes",
        destination: "/admin/participantes",
        permanent: true,
      },
      { source: "/evaluacion/participantes", destination: "/admin/participantes", permanent: true },
      { source: "/psycotest/:path*", destination: "/evaluacion/:path*", permanent: true },
      // El módulo de evaluación no tiene portada: el candidato entra con su código.
      { source: "/evaluacion", destination: "/evaluacion/acceso", permanent: false },
    ];
  },
};

export default nextConfig;
