import type { Metadata } from "next";
import { CHANNELS } from "@/lib/channels";
import { esMarcaCobro } from "@/lib/stripe";
import { BotonBaja } from "./BotonBaja";
import s from "./baja.module.css";

export const metadata: Metadata = {
  title: "Dejar de recibir promociones",
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

/** Página a la que lleva el enlace de baja del pie de cada promoción. */
export default async function BajaPage({ searchParams }: Props) {
  const { e = "", m = "", t = "" } = await searchParams;
  const valido = Boolean(e && t && esMarcaCobro(m));
  const marca = esMarcaCobro(m) ? CHANNELS[m].name : "";

  return (
    <main className={s.main}>
      <div className={s.card}>
        <h1>Dejar de recibir promociones</h1>
        {valido ? (
          <>
            <p>
              Ya no te mandaremos promociones de <strong>{marca}</strong> a <strong>{e}</strong>. Los
              correos de tus pagos y de tus cursos te seguirán llegando.
            </p>
            <BotonBaja e={e} m={m} t={t} />
          </>
        ) : (
          <p>Este enlace no es válido. Usa el enlace que viene al pie del correo.</p>
        )}
      </div>
    </main>
  );
}
