"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { AmbientBackground } from "@/components/AmbientBackground";
import { BackLink } from "@/components/ui/BackLink";
import { PhaseTransition } from "@/components/ui/PhaseTransition";
import datos from "@/data/hartman-items.json";
import {
  SUMA_ESPERADA,
  calificarHartman,
  etiquetaNivel,
  nivel,
  type ResultadoParte,
} from "@/lib/hartman";
import { AXIOGRAMAS, type Axiograma } from "@/data/hartman-axiogramas";
import { ConfirmacionPrueba } from "@/components/ConfirmacionPrueba";
import { useApplicantSession } from "@/lib/applicant-client";
import { PARTE_I, PARTE_II, type Consigna } from "./consignas";
import s from "./hartman.module.css";
import { finalizarSesion, nuevaSesion, type Sesion } from "@/lib/storage";
import { interpretarHartman } from "@/lib/informes";

type Item = { id: string; texto: string; norma: number; eje: "I" | "E" | "S" };
const DATOS = datos as { parteI: Item[]; parteII: Item[] };

type Fase = "intro" | "I" | "II" | "resultado";
/** Índice de ítem → ranking asignado. */
type Orden = Record<number, number | undefined>;

interface Datos {
  nombre: string;
  edad: string;
  sexo: string;
  estadoCivil: string;
  estudios: string;
  ocupacion: string;
}

const DATOS_VACIOS: Datos = {
  nombre: "",
  edad: "",
  sexo: "",
  estadoCivil: "",
  estudios: "",
  ocupacion: "",
};

const vacio = (): Orden => ({});

export default function Hartman() {
  const [fase, setFase] = useState<Fase>("intro");
  const [datosPersona, setDatosPersona] = useState<Datos>(DATOS_VACIOS);
  const participante = datosPersona.nombre;
  const [ordenI, setOrdenI] = useState<Orden>(vacio);
  const [ordenII, setOrdenII] = useState<Orden>(vacio);
  const { session: aplicante } = useApplicantSession();

  useEffect(() => {
    if (aplicante) {
      setDatosPersona((d) => ({
        ...d,
        nombre: aplicante.nombre,
        ocupacion: aplicante.puesto ?? d.ocupacion,
      }));
    }
  }, [aplicante]);

  if (fase === "intro") {
    return (
      <>
        <AmbientBackground />
        <main className={s.main}>
          <PhaseTransition phaseKey="intro">
            <div className={s.intro}>
              <BackLink />
              <span className="eyebrow">Hartman</span>
          <h1>Inventario de Valores</h1>

          <div className={s.instructions}>
            <p>
              La prueba tiene <strong>dos partes de dieciocho enunciados</strong>. En cada parte se
              asigna el número <strong>1</strong> a lo que representa el valor más alto y el{" "}
              <strong>18</strong> a lo que representa el menor.
            </p>
            <p>
              Cada número se usa una sola vez. No se juzga por importancia, sino por la bondad o
              maldad que contiene cada enunciado.
            </p>
          </div>

          <div className={s.datos}>
            <div className={`${s.field} ${s.ancho}`}>
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                value={datosPersona.nombre}
                onChange={(e) => setDatosPersona({ ...datosPersona, nombre: e.target.value })}
                placeholder="Nombre y apellidos"
                autoComplete="off"
                readOnly={!!aplicante}
              />
            </div>
            <div className={s.field}>
              <label htmlFor="edad">Edad</label>
              <input
                id="edad"
                inputMode="numeric"
                value={datosPersona.edad}
                onChange={(e) => setDatosPersona({ ...datosPersona, edad: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className={s.field}>
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                value={datosPersona.sexo}
                onChange={(e) => setDatosPersona({ ...datosPersona, sexo: e.target.value })}
              >
                <option value="">—</option>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </div>
            <div className={s.field}>
              <label htmlFor="ec">Estado civil</label>
              <input
                id="ec"
                value={datosPersona.estadoCivil}
                onChange={(e) => setDatosPersona({ ...datosPersona, estadoCivil: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className={s.field}>
              <label htmlFor="est">Estudios</label>
              <input
                id="est"
                value={datosPersona.estudios}
                onChange={(e) => setDatosPersona({ ...datosPersona, estudios: e.target.value })}
                autoComplete="off"
              />
            </div>
            <div className={`${s.field} ${s.ancho}`}>
              <label htmlFor="ocu">Ocupación</label>
              <input
                id="ocu"
                value={datosPersona.ocupacion}
                onChange={(e) => setDatosPersona({ ...datosPersona, ocupacion: e.target.value })}
                autoComplete="off"
              />
            </div>
          </div>

          <div className={s.row}>
            <button className="btn btn-primary" onClick={() => setFase("I")}>
              Comenzar con la Parte I →
            </button>
            <Link href="/" className="btn">Volver</Link>
          </div>
            </div>
          </PhaseTransition>
        </main>
      </>
    );
  }

  if (fase === "resultado") {
    const rI = Object.keys(ordenI).length === 18;
    const rII = Object.keys(ordenII).length === 18;
    if (rI && rII) {
      const a = DATOS.parteI.map((_, i) => ordenI[i] as number);
      const b = DATOS.parteII.map((_, i) => ordenII[i] as number);
      return (
        <Resultado
          participante={participante || "Sin nombre"}
          parteI={a}
          parteII={b}
        />
      );
    }
  }

  const esI = fase === "I";
  const items = esI ? DATOS.parteI : DATOS.parteII;
  const orden = esI ? ordenI : ordenII;
  const setOrden = esI ? setOrdenI : setOrdenII;

  return (
    <Ordenar
      key={fase}
      titulo={esI ? "Parte I — Frases" : "Parte II — Citas"}
      leyenda={
        esI
          ? "Ordene del valor más alto (1) al más bajo (18)."
          : "Ordene de aquella con la que está más de acuerdo (1) a la que menos (18)."
      }
      consignas={esI ? PARTE_I : PARTE_II}
      items={items}
      orden={orden}
      setOrden={setOrden}
      etiquetaSiguiente={esI ? "Continuar a la Parte II →" : "Ver calificación →"}
      onSiguiente={() => setFase(esI ? "II" : "resultado")}
      onVolver={() => setFase(esI ? "intro" : "I")}
    />
  );
}

/* ------------------------------------------------------------------ */

function Ordenar({
  titulo,
  leyenda,
  consignas,
  items,
  orden,
  setOrden,
  etiquetaSiguiente,
  onSiguiente,
  onVolver,
}: {
  titulo: string;
  leyenda: string;
  consignas: Consigna[];
  items: Item[];
  orden: Orden;
  setOrden: (o: Orden) => void;
  etiquetaSiguiente: string;
  onSiguiente: () => void;
  onVolver: () => void;
}) {
  const [verInstr, setVerInstr] = useState(true);
  const usados = useMemo(() => new Set(Object.values(orden).filter(Boolean) as number[]), [orden]);
  const siguienteLibre = useMemo(() => {
    for (let n = 1; n <= 18; n++) if (!usados.has(n)) return n;
    return null;
  }, [usados]);

  const activo = useMemo(() => items.findIndex((_, i) => orden[i] === undefined), [items, orden]);
  const suma = useMemo(
    () => (Object.values(orden).filter(Boolean) as number[]).reduce((a, b) => a + b, 0),
    [orden],
  );
  const completo = usados.size === 18;

  function asignar(idx: number, n: number) {
    const next: Orden = { ...orden };
    for (const k of Object.keys(next)) if (next[Number(k)] === n) delete next[Number(k)];
    next[idx] = n;
    setOrden(next);
  }

  function limpiar(idx: number) {
    const next = { ...orden };
    delete next[idx];
    setOrden(next);
  }

  return (
    <main className={s.main}>
      <div className={s.stage}>
        <div className={s.head}>
          <span className="eyebrow">Hartman</span>
          <h1>{titulo}</h1>
          <p style={{ color: "var(--ink-soft)" }}>{leyenda}</p>
          <div className={s.status}>
            <span>{usados.size} de 18 asignados</span>
            <span className={completo && suma === SUMA_ESPERADA ? s.ok : undefined}>
              Σ = {suma} {completo && `(esperado ${SUMA_ESPERADA})`}
            </span>
            {siguienteLibre && <span>Siguiente número: {siguienteLibre}</span>}
            <button className={s.verInstr} onClick={() => setVerInstr((v) => !v)}>
              {verInstr ? "ocultar instrucciones" : "instrucciones"}
            </button>
          </div>
        </div>

        {verInstr && (
          <div className={s.consignas}>
            {consignas.map((c) => (
              <div key={c.titulo}>
                <h3>{c.titulo}</h3>
                {c.cuerpo.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className={s.list}>
          {items.map((it, idx) => (
            <div
              key={it.id}
              className={s.item}
              data-idx={idx}
              data-set={orden[idx] !== undefined}
              data-active={idx === activo}
            >
              <span className={s.rank}>{orden[idx] ?? "—"}</span>
              <span className={s.frase}>{it.texto}</span>
              {orden[idx] !== undefined ? (
                <button className={s.clear} data-accion="quitar" onClick={() => limpiar(idx)}>
                  quitar
                </button>
              ) : (
                <button
                  data-accion="asignar"
                  className={s.clear}
                  onClick={() => siguienteLibre && asignar(idx, siguienteLibre)}
                  disabled={!siguienteLibre}
                >
                  asignar {siguienteLibre ?? ""}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className={s.pad}>
          <div className={s.nums}>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={s.num}
                data-next={n === siguienteLibre}
                disabled={usados.has(n) || activo === -1}
                onClick={() => activo !== -1 && asignar(activo, n)}
                title={`Asignar ${n} al siguiente enunciado sin número`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className={s.actions}>
            <button className="btn" onClick={onVolver}>← Volver</button>
            <button className="btn btn-primary" onClick={onSiguiente} disabled={!completo}>
              {etiquetaSiguiente}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Resultado({
  participante,
  parteI,
  parteII,
}: {
  participante: string;
  parteI: number[];
  parteII: number[];
}) {
  const [fin, setFin] = useState<Sesion<{ parteI: number[]; parteII: number[] }> | null>(null);

  useEffect(() => {
    if (fin) return;
    const r = calificarHartman(parteI, parteII);
    const ses = nuevaSesion("hartman", participante, { parteI, parteII });
    setFin(finalizarSesion(ses, r, interpretarHartman(r)));
  }, [parteI, parteII, participante, fin]);

  if (!fin?.finalizadaEn) return null;

  return (
    <ConfirmacionPrueba
      instrumento="hartman"
      participante={fin.participante}
      finalizadaEn={fin.finalizadaEn}
    />
  );
}

function Parte({
  titulo,
  p,
  axiograma,
  interpretable,
}: {
  titulo: string;
  p: ResultadoParte;
  axiograma: Axiograma;
  interpretable: boolean;
}) {
  const ax = AXIOGRAMAS[axiograma];
  const texto = (clave: string) => ax.indicadores.find((i) => i.clave === clave)?.texto ?? "";

  /** Los indicadores del axiograma que el motor ya calcula. */
  const filas: { clave: string; sigla: string; valor: number; columna: string }[] = [
    { clave: "DIM_I", sigla: "DIM I", valor: p.ejes.I.balance, columna: "DIM" },
    { clave: "DIM_E", sigla: "DIM E", valor: p.ejes.E.balance, columna: "DIM" },
    { clave: "DIM_S", sigla: "DIM S", valor: p.ejes.S.balance, columna: "DIM" },
    { clave: "DIM", sigla: "DIM", valor: p.DIM, columna: "DIM" },
    { clave: "DIM_PCT", sigla: "DIM %", valor: p.DIMpct, columna: "DIM_PCT" },
    { clave: "INT_I", sigla: "INT I", valor: p.ejes.I.INT, columna: "INT_EJE" },
    { clave: "INT_E", sigla: "INT E", valor: p.ejes.E.INT, columna: "INT_EJE" },
    { clave: "INT_S", sigla: "INT S", valor: p.ejes.S.INT, columna: "INT_EJE" },
    { clave: "INT", sigla: "INT", valor: p.INT, columna: "INT" },
    { clave: "INT_PCT", sigla: "INT %", valor: p.INTpct, columna: "INT_PCT" },
    { clave: "DIS", sigla: "DIS", valor: p.DIS, columna: "DI" },
  ];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <h2 className={s.sectionTitle}>{titulo}</h2>

      {p.alertas.map((a) => (
        <p key={a} className={s.alert}>{a}</p>
      ))}

      <div className={s.metrics}>
        <div className={s.metric}>
          <span className={s.k}>Σ rankings</span>
          <span className={s.v}>{p.DIF}</span>
          <span className={s.lvl}>{p.DIF === SUMA_ESPERADA ? "correcto" : "revisar"}</span>
        </div>
        <div className={s.metric}>
          <span className={s.k}>DIS</span>
          <span className={s.v}>{p.DIS}</span>
          <span className={s.lvl}>{p.DIS % 2 === 0 ? "par" : "impar"}</span>
        </div>
        {interpretable && (
          <>
            <div className={s.metric}>
              <span className={s.k}>Cantidad (1)</span>
              <span className={s.v}>{p.Q1}</span>
              <span className={s.lvl}>{etiquetaNivel(nivel("Q1", p.Q1))}</span>
            </div>
            <div className={s.metric}>
              <span className={s.k}>Calidad (2)</span>
              <span className={s.v}>{p.Q2}</span>
              <span className={s.lvl}>{etiquetaNivel(nivel("Q2", p.Q2))}</span>
            </div>
          </>
        )}
      </div>

      {!interpretable && (
        <p className={s.alert}>
          Los índices y niveles de desarrollo de esta parte no se muestran: se calculan contra una
          norma con la que este protocolo ya no guarda relación. Abajo queda el detalle reactivo por
          reactivo para su revisión.
        </p>
      )}

      {interpretable && (
      <div className={s.tableShell}>
        <table>
          <thead>
            <tr>
              <th>Indicador</th>
              <th className={s.n}>Valor</th>
              <th>Nivel</th>
              <th>Qué mide en este axiograma</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.clave}>
                <td className="mono">
                  <strong>{f.sigla}</strong>
                </td>
                <td className={s.n}>
                  {Number.isInteger(f.valor) ? f.valor : f.valor.toFixed(1)}
                </td>
                <td className={s.lvl}>{etiquetaNivel(nivel(f.columna as never, f.valor))}</td>
                <td style={{ fontSize: 13, color: "var(--muted)" }}>{texto(f.clave)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <div className={s.tableShell}>
        <table>
          <thead>
            <tr>
              <th>Ítem</th>
              <th>Eje</th>
              <th className={s.n}>Norma</th>
              <th className={s.n}>Respuesta</th>
              <th className={s.n}>Diferencia</th>
              <th className={s.n}>Ajustada</th>
              <th>Disimilitud</th>
            </tr>
          </thead>
          <tbody>
            {p.items.map((it) => (
              <tr key={it.id}>
                <td className="mono">{it.id}</td>
                <td className="mono">{it.eje}</td>
                <td className={s.n}>{it.norma}</td>
                <td className={s.n}>{it.respuesta}</td>
                <td className={s.n}>{it.diferencia > 0 ? `+${it.diferencia}` : it.diferencia}</td>
                <td className={s.n}>{it.ajustada > 0 ? `+${it.ajustada}` : it.ajustada}</td>
                <td className={it.disimilitud ? s.dis : undefined}>
                  {it.disimilitud ? "sí" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
