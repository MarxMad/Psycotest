"use client";

import { useEffect, useRef, useState } from "react";
import { useParticipants, type ReceivedChatMessage } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Hand, Mic, MicOff, UserX } from "lucide-react";
import type { Dinamica, Pase, SalaDivision } from "./tipos";
import { iniciales } from "./tipos";
import s from "./sala.module.css";

async function moderar(pase: Pase, accion: string, identidad?: string) {
  const res = await fetch(`/api/live-classes/${pase.clase.id}/moderar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accion, identidad, breakoutRoomId: pase.breakout?.id }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "No se pudo aplicar");
  }
}

// --------------------------------------------------------------------------
// Personas
// --------------------------------------------------------------------------

export function PanelPersonas({ pase }: { pase: Pase }) {
  const personas = useParticipants();
  const [error, setError] = useState<string | null>(null);
  const [aSacar, setASacar] = useState<string | null>(null);

  const ordenadas = [...personas].sort((a, b) => {
    const manoA = a.attributes?.mano === "1" ? 0 : 1;
    const manoB = b.attributes?.mano === "1" ? 0 : 1;
    if (manoA !== manoB) return manoA - manoB;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
  const manos = ordenadas.filter((p) => p.attributes?.mano === "1").length;

  async function hacer(accion: string, identidad?: string) {
    setError(null);
    try {
      await moderar(pase, accion, identidad);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className={s.panelCuerpo}>
      <div className={s.panelFila}>
        <span className={s.tenue}>
          {personas.length} {personas.length === 1 ? "persona" : "personas"}
          {manos > 0 && ` · ${manos} con la mano levantada`}
        </span>
        {pase.anfitrion && personas.length > 1 && (
          <button type="button" className={s.secundario} onClick={() => void hacer("silenciar-todos")}>
            Silenciar a todos
          </button>
        )}
      </div>
      {error && <p className={s.aviso}>{error}</p>}

      <ul className={s.lista}>
        {ordenadas.map((p) => {
          const mano = p.attributes?.mano === "1";
          const anfitrion = p.attributes?.rol === "anfitrion";
          const mic = p.getTrackPublication(Track.Source.Microphone);
          const hablaActivo = Boolean(mic && !mic.isMuted);
          return (
            <li key={p.identity} className={s.persona}>
              <span className={s.personaAvatar}>{iniciales(p.name)}</span>
              <span className={s.personaNombre}>
                {p.name || p.identity}
                {p.isLocal && <em> (tú)</em>}
                {anfitrion && <span className={s.insignia}>Anfitrión</span>}
              </span>
              {mano && <Hand size={16} className={s.iconoMano} aria-label="Mano levantada" />}
              {hablaActivo ? (
                <Mic size={16} aria-label="Micrófono encendido" />
              ) : (
                <MicOff size={16} className={s.tenue} aria-label="Micrófono apagado" />
              )}

              {pase.anfitrion && !p.isLocal && (
                <span className={s.personaAcciones}>
                  {mano && (
                    <button type="button" onClick={() => void hacer("bajar-mano", p.identity)}>
                      Bajar mano
                    </button>
                  )}
                  {hablaActivo && (
                    <button type="button" onClick={() => void hacer("silenciar", p.identity)}>
                      Silenciar
                    </button>
                  )}
                  {aSacar === p.identity ? (
                    <>
                      <button
                        type="button"
                        className={s.peligro}
                        onClick={() => {
                          setASacar(null);
                          void hacer("sacar", p.identity);
                        }}
                      >
                        Confirmar
                      </button>
                      <button type="button" onClick={() => setASacar(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setASacar(p.identity)}
                      aria-label={`Sacar a ${p.name} de la sala`}
                      title="Sacar de la sala"
                    >
                      <UserX size={15} />
                    </button>
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --------------------------------------------------------------------------
// Chat
// --------------------------------------------------------------------------

export function PanelChat({
  mensajes,
  enviar,
  enviando,
}: {
  mensajes: ReceivedChatMessage[];
  enviar: (texto: string) => Promise<unknown>;
  enviando: boolean;
}) {
  const [texto, setTexto] = useState("");
  const fondo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fondo.current?.scrollIntoView({ block: "end" });
  }, [mensajes.length]);

  async function mandar() {
    const limpio = texto.trim();
    if (!limpio) return;
    setTexto("");
    await enviar(limpio);
  }

  return (
    <div className={s.chat}>
      <div className={s.chatMensajes}>
        {mensajes.length === 0 && (
          <p className={s.tenue}>
            Aún no hay mensajes. Lo que escribas aquí lo ve toda la sala mientras dure la clase.
          </p>
        )}
        {mensajes.map((m) => (
          <div key={m.id} className={m.from?.isLocal ? s.mensajePropio : s.mensaje}>
            <span className={s.mensajeAutor}>
              {m.from?.isLocal ? "Tú" : m.from?.name || "Alguien"}
              <time>
                {new Date(m.timestamp).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </span>
            <p>{m.message}</p>
          </div>
        ))}
        <div ref={fondo} />
      </div>
      <form
        className={s.chatForm}
        onSubmit={(e) => {
          e.preventDefault();
          void mandar();
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={1000}
          aria-label="Mensaje"
        />
        <button type="submit" className={s.primario} disabled={enviando || !texto.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}

// --------------------------------------------------------------------------
// Salas de división
// --------------------------------------------------------------------------

export function PanelDivision({
  pase,
  salas,
  mia,
  onIrASala,
  onCambio,
}: {
  pase: Pase;
  salas: SalaDivision[];
  mia: SalaDivision | null;
  onIrASala: (breakoutRoomId: string | null) => void;
  /** Avisa del cambio con la lista nueva, para no mostrar salas ya cerradas. */
  onCambio: (lista?: SalaDivision[]) => void;
}) {
  const [cuantas, setCuantas] = useState(2);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const abiertas = salas.filter((b) => b.status === "open");

  async function pedir(cuerpo: Record<string, unknown>) {
    setOcupado(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/live-classes/${pase.clase.id}/breakouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) throw new Error();
      const d = await res.json();
      const lista: SalaDivision[] = d.breakouts ?? [];
      const nuevas = lista.filter((b) => b.status === "open");
      if (cuerpo.action === "close") {
        setMensaje("Salas cerradas: todos regresan a la sala principal.");
      } else {
        const repartidos = nuevas.reduce((n, b) => n + b.assignments.length, 0);
        setMensaje(
          repartidos === 0
            ? `${nuevas.length} salas listas, pero no había alumnos conectados para repartir.`
            : `${nuevas.length} salas · ${repartidos} persona${repartidos === 1 ? "" : "s"} repartida${repartidos === 1 ? "" : "s"}. Se mueven solas en unos segundos.`,
        );
      }
      onCambio(lista);
    } catch {
      setMensaje("No se pudo completar. Intenta de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className={s.panelCuerpo}>
      {pase.anfitrion ? (
        <>
          <div className={s.panelFila}>
            <label className={s.campoEnLinea}>
              Salas
              <input
                type="number"
                min={2}
                max={12}
                value={cuantas}
                onChange={(e) => setCuantas(Math.max(2, Math.min(12, Number(e.target.value) || 2)))}
              />
            </label>
            <button
              type="button"
              className={s.primario}
              disabled={ocupado}
              onClick={() => void pedir({ count: cuantas, autoAssign: true })}
            >
              Repartir al grupo
            </button>
          </div>
          <p className={s.tenue}>
            Reparte a los alumnos conectados ahora. Volver a repartir reemplaza el reparto anterior.
          </p>
          {abiertas.length > 0 && (
            <button
              type="button"
              className={s.secundario}
              disabled={ocupado}
              onClick={() => void pedir({ action: "close" })}
            >
              Cerrar todas y regresar a la principal
            </button>
          )}
        </>
      ) : mia ? (
        <p>
          Estás asignado a <strong>{mia.name}</strong>.
        </p>
      ) : (
        <p className={s.tenue}>Cuando el anfitrión abra salas de división, aquí verás la tuya.</p>
      )}

      {mensaje && <p className={s.aviso}>{mensaje}</p>}

      {pase.breakout && (
        <button type="button" className={s.secundario} onClick={() => onIrASala(null)}>
          Volver a la sala principal
        </button>
      )}

      <ul className={s.lista}>
        {abiertas.map((b) => {
          const aqui = pase.breakout?.id === b.id;
          const puedeEntrar = pase.anfitrion || mia?.id === b.id;
          return (
            <li key={b.id} className={s.division}>
              <div>
                <strong>{b.name}</strong>
                {aqui && <span className={s.insignia}>Estás aquí</span>}
                <p className={s.tenue}>
                  {b.assignments.map((a) => a.nombre || "Alumno").join(", ") || "Sin asignados"}
                </p>
              </div>
              {puedeEntrar && !aqui && (
                <button type="button" className={s.secundario} onClick={() => onIrASala(b.id)}>
                  Entrar
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --------------------------------------------------------------------------
// Dinámicas
// --------------------------------------------------------------------------

const DINAMICAS: Array<{ tipo: string; etiqueta: string }> = [
  { tipo: "pregunta_rapida", etiqueta: "Pregunta rápida" },
  { tipo: "dos_verdades", etiqueta: "Dos verdades y una mentira" },
  { tipo: "asociacion", etiqueta: "Asociación" },
];

export function PanelDinamicas({
  pase,
  activa,
  onCambio,
}: {
  pase: Pase;
  activa: Dinamica | null;
  onCambio: (d: Dinamica | null) => void;
}) {
  const [tipo, setTipo] = useState(DINAMICAS[0].tipo);
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function pedir(cuerpo: Record<string, unknown>) {
    setOcupado(true);
    try {
      const res = await fetch(`/api/live-classes/${pase.clase.id}/icebreakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) return;
      const d = await res.json();
      onCambio(cuerpo.action === "close" ? null : (d.session ?? null));
    } finally {
      setOcupado(false);
    }
  }

  const respuestas = activa?.stateJson?.responses ?? [];
  const yaRespondi = respuestas.some((r) => r.userId === pase.user.id);

  return (
    <div className={s.panelCuerpo}>
      {pase.anfitrion && (
        <div className={s.dinamicaNueva}>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de dinámica">
            {DINAMICAS.map((d) => (
              <option key={d.tipo} value={d.tipo}>
                {d.etiqueta}
              </option>
            ))}
          </select>
          <input
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Tu pregunta (si la dejas vacía, proponemos una)"
            maxLength={300}
          />
          <button
            type="button"
            className={s.primario}
            disabled={ocupado}
            onClick={() => {
              void pedir({ type: tipo, prompt: pregunta.trim() || undefined });
              setPregunta("");
            }}
          >
            {activa ? "Lanzar otra" : "Lanzar dinámica"}
          </button>
        </div>
      )}

      {!activa && <p className={s.tenue}>No hay ninguna dinámica en curso.</p>}

      {activa && (
        <div className={s.dinamica}>
          <p className={s.dinamicaTipo}>{activa.type.replace(/_/g, " ")}</p>
          <p className={s.dinamicaPregunta}>{activa.prompt}</p>
          <form
            className={s.chatForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (!respuesta.trim()) return;
              void pedir({ action: "respond", sessionId: activa.id, text: respuesta.trim() });
              setRespuesta("");
            }}
          >
            <input
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              placeholder={yaRespondi ? "Cambia tu respuesta…" : "Tu respuesta…"}
              maxLength={500}
            />
            <button type="submit" className={s.primario} disabled={!respuesta.trim()}>
              {yaRespondi ? "Actualizar" : "Enviar"}
            </button>
          </form>
          <ul className={s.lista}>
            {respuestas.map((r) => (
              <li key={r.userId} className={s.respuesta}>
                <strong>{r.nombre}</strong> {r.text}
              </li>
            ))}
          </ul>
          {pase.anfitrion && (
            <button
              type="button"
              className={s.secundario}
              onClick={() => void pedir({ action: "close", sessionId: activa.id })}
            >
              Cerrar dinámica
            </button>
          )}
        </div>
      )}
    </div>
  );
}
