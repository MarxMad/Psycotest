import { headers } from "next/headers";
import { getChannelFromHost, type ChannelId } from "@/lib/channels";
import { BrandShell } from "./BrandShell";

/**
 * Resuelve el canal desde el host (servidor) y viste la zona con su tema.
 * Sin subdominio usa CEDUCT, que es el canal de formación por defecto.
 */
export async function ConsultorioRoot({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const canal: ChannelId = getChannelFromHost(host)?.id ?? "ceduct";
  return <BrandShell canal={canal}>{children}</BrandShell>;
}
