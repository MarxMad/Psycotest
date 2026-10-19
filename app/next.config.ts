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
      // La verificación de constancias es pública: salió del área de alumno.
      { source: "/consultorio/constancias", destination: "/verificar", permanent: true },
      /*
       * Enlaces viejos: /consultorio se repartió y desapareció.
       *
       * Era un área de alumno paralela a /mi-cuenta —mismo expediente, mismas
       * clases, otro encabezado— y resolvía su marca por el subdominio, así
       * que sin subdominio un curso de IGE se pintaba con el tema de CEDUCT.
       * Ahora la ficha del curso vive en /cursos y hereda la identidad de su
       * propio canal; lo privado vive en /mi-cuenta, y lo legal en /legal.
       */
      { source: "/consultorio", destination: "/cursos", permanent: true },
      { source: "/consultorio/ingreso", destination: "/login", permanent: true },
      { source: "/consultorio/legal", destination: "/legal", permanent: true },
      { source: "/consultorio/expediente", destination: "/mi-cuenta/expediente", permanent: true },
      {
        source: "/consultorio/clases-vivo",
        destination: "/mi-cuenta/en-vivo",
        permanent: true,
      },
      {
        source: "/consultorio/clases-vivo/:id/sala",
        destination: "/mi-cuenta/en-vivo/:id/sala",
        permanent: true,
      },
      { source: "/consultorio/cursos", destination: "/cursos", permanent: true },
      { source: "/consultorio/cursos/:path*", destination: "/cursos/:path*", permanent: true },
      // El módulo de evaluación no tiene portada: el candidato entra con su código.
      { source: "/evaluacion", destination: "/evaluacion/acceso", permanent: false },
    ];
  },
};

export default nextConfig;
