import Link from "next/link";
import { CHANNELS, channelPublicUrl, CHANNEL_IDS } from "@/lib/channels";
import { tieneAreaAlumno } from "@/lib/area-alumno";
import s from "./sin-contenido.module.css";

export const dynamic = "force-dynamic";

/**
 * Alguien con cuenta pero sin nada contratado todavía. En vez de una zona
 * vacía, se le muestra qué ofrece cada canal.
 */
export default function SinContenidoPage() {
  const canales = CHANNEL_IDS.filter(tieneAreaAlumno);

  return (
    <main className={s.main}>
      <div className={s.card}>
        <h1>Tu cuenta está lista</h1>
        <p className={s.lead}>
          Todavía no tienes nada contratado. Cuando te inscribas a un programa o contrates una
          evaluación, lo verás aquí.
        </p>

        <div className={s.opciones}>
          {canales.map((id) => (
            <a key={id} href={channelPublicUrl(id)} className={s.opcion}>
              <strong>{CHANNELS[id].name}</strong>
              <span>{CHANNELS[id].description}</span>
            </a>
          ))}
        </div>

        <p className={s.pie}>
          ¿Crees que esto es un error?{" "}
          <Link href="/verificar">Verifica una constancia</Link> o escríbenos.
        </p>
      </div>
    </main>
  );
}
