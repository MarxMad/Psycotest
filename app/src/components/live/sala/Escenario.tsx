"use client";

import type { ReactNode } from "react";
import {
  VideoTrack,
  isTrackReference,
  useIsMuted,
  useIsSpeaking,
  useParticipantAttributes,
  type TrackReferenceOrPlaceholder,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { Hand, MicOff, MonitorUp } from "lucide-react";
import { iniciales } from "./tipos";
import s from "./sala.module.css";

/** Cuántas cámaras caben en el mosaico antes de resumir en «+N». */
const MAXIMO_MOSAICO = 25;

function prioridad(t: TrackReferenceOrPlaceholder): number {
  const a = t.participant.attributes ?? {};
  if (a.rol === "anfitrion") return 0;
  if (a.mano === "1") return 1;
  if (t.participant.isSpeaking) return 2;
  return 3;
}

export function Escenario({
  camaras,
  pantallas,
  pizarra,
}: {
  camaras: TrackReferenceOrPlaceholder[];
  pantallas: TrackReferenceOrPlaceholder[];
  /** La pizarra abierta ocupa el centro; las cámaras pasan a la tira. */
  pizarra: ReactNode | null;
}) {
  const ordenadas = [...camaras].sort((a, b) => prioridad(a) - prioridad(b));
  const pantalla = pantallas.find(isTrackReference);

  if (pizarra || pantalla) {
    return (
      <div className={s.enfoque}>
        <div className={s.enfoquePrincipal}>
          {pizarra ?? (pantalla && <Pantalla pista={pantalla} />)}
        </div>
        <div className={s.tira}>
          {ordenadas.slice(0, 12).map((t) => (
            <Mosaico key={`${t.participant.identity}-${t.source}`} pista={t} compacto />
          ))}
          {ordenadas.length > 12 && <div className={s.mas}>+{ordenadas.length - 12}</div>}
        </div>
      </div>
    );
  }

  const visibles = ordenadas.slice(0, MAXIMO_MOSAICO);
  const resto = ordenadas.length - visibles.length;
  const total = visibles.length + (resto > 0 ? 1 : 0);
  const columnas = Math.ceil(Math.sqrt(Math.max(1, total)));

  return (
    <div
      className={s.mosaico}
      style={{ "--columnas": columnas, "--filas": Math.ceil(total / columnas) } as React.CSSProperties}
    >
      {visibles.map((t) => (
        <Mosaico key={`${t.participant.identity}-${t.source}`} pista={t} />
      ))}
      {resto > 0 && <div className={s.mas}>+{resto} más</div>}
    </div>
  );
}

function Pantalla({ pista }: { pista: TrackReferenceOrPlaceholder }) {
  if (!isTrackReference(pista)) return null;
  return (
    <div className={s.pantalla}>
      <VideoTrack trackRef={pista} className={s.pantallaVideo} />
      <span className={s.etiqueta}>
        <MonitorUp size={14} /> {pista.participant.name || "Alguien"} comparte pantalla
      </span>
    </div>
  );
}

function Mosaico({ pista, compacto = false }: { pista: TrackReferenceOrPlaceholder; compacto?: boolean }) {
  const persona = pista.participant;
  const hablando = useIsSpeaking(persona);
  const { attributes } = useParticipantAttributes({ participant: persona });
  const microfonoApagado = useIsMuted({ participant: persona, source: Track.Source.Microphone });
  const conVideo = isTrackReference(pista) && !pista.publication.isMuted;
  const anfitrion = attributes?.rol === "anfitrion";
  const mano = attributes?.mano === "1";
  const nombre = persona.name || persona.identity;

  return (
    <div
      className={compacto ? s.mosaicoCompacto : s.mosaicoCelda}
      data-hablando={hablando || undefined}
      data-mano={mano || undefined}
    >
      {conVideo ? (
        <VideoTrack trackRef={pista} className={s.video} data-propio={persona.isLocal || undefined} />
      ) : (
        <div className={s.avatar}>
          <span>{iniciales(nombre)}</span>
        </div>
      )}
      {mano && (
        <span className={s.mano} aria-label="Levantó la mano">
          <Hand size={compacto ? 14 : 18} />
        </span>
      )}
      <span className={s.etiqueta}>
        {microfonoApagado && <MicOff size={13} aria-label="Micrófono apagado" />}
        <span className={s.nombre}>
          {nombre}
          {persona.isLocal ? " (tú)" : ""}
        </span>
        {anfitrion && <span className={s.insignia}>Anfitrión</span>}
      </span>
    </div>
  );
}
