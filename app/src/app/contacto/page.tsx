import type { Metadata } from "next";
import { MarketShell } from "@/components/marketplace/MarketShell";
import { Contacto } from "@/components/marketplace/paginas/Contacto";

export const metadata: Metadata = {
  title: "Contacto — CEDUCT",
  description: "Habla con un asesor de CEDUCT sobre diplomados, certificaciones o capacitación para empresas.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ContactoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const asunto = typeof sp.asunto === "string" ? sp.asunto : "informes";
  const programa = typeof sp.programa === "string" ? sp.programa.slice(0, 120) : undefined;
  return (
    <MarketShell>
      {/* key: cambiar de asunto desde el navbar reinicia el formulario */}
      <Contacto key={asunto} asuntoInicial={asunto} programa={programa} />
    </MarketShell>
  );
}
