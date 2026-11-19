import { NextResponse } from "next/server";
import { getChannelFromHost, type ChannelId } from "@/lib/channels";

/**
 * Favicon de la marca del dominio.
 *
 * Todas las marcas comparten un solo despliegue, así que el ícono no puede
 * ser un archivo fijo: se elige por el host y se redirige al de esa marca en
 * /public/marcas. El panel y el dominio del grupo usan el de Counseling.
 */

const CARPETA: Record<ChannelId, string> = {
  psicologia: "psicologia",
  ige: "ige",
  ceduct: "ceduct",
  martin: "counseling",
};

const ARCHIVOS = new Set(["icon-32.png", "icon-512.png", "apple-icon.png"]);

export async function GET(request: Request, { params }: { params: Promise<{ archivo: string }> }) {
  const { archivo } = await params;
  if (!ARCHIVOS.has(archivo)) return new NextResponse(null, { status: 404 });

  const canal = getChannelFromHost(request.headers.get("host"));
  const carpeta = canal ? CARPETA[canal.id] : "counseling";
  // Location relativa: se queda en el mismo dominio que pidió el ícono
  // (request.url puede traer el host interno en lugar del público).
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: `/marcas/${carpeta}/${archivo}`,
      // La respuesta depende del host: que ninguna caché compartida la reparta.
      "Cache-Control": "private, max-age=86400",
    },
  });
}
