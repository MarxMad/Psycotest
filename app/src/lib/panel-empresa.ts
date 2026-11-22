import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { parseAllowedInstruments, parseCompletedInstruments } from "@/lib/access-codes";
import { codigoEnClaro } from "@/lib/pagos-psicologia";
import { limiteParaContestar, tiempoAgotado } from "@/lib/pruebas-catalogo";
import { NOMBRES as NOMBRES_PAPI, type Factor } from "@/lib/papi";
import { NOMBRES_CUADRANTE, NOMBRES_VALOR } from "@/lib/mabe";
import { NOMBRES_FACTOR as NOMBRES_CLEAVER } from "@/lib/cleaver";
import type { Instrumento } from "@/lib/storage";

/**
 * Lo que ve una empresa en su panel: los códigos que compró (cuántos le
 * quedan de cada prueba) y las personas que los usaron, con sus tiempos,
 * puntajes e informes. Sólo lo emitido bajo sus propios códigos.
 */

export type EstadoCodigo = "disponible" | "en-curso" | "terminado" | "tiempo-agotado" | "vencido" | "desactivado";

export const ETIQUETA_ESTADO: Record<EstadoCodigo, string> = {
  disponible: "Disponible",
  "en-curso": "En curso",
  terminado: "Contestado",
  "tiempo-agotado": "Tiempo agotado",
  vencido: "Vencido",
  desactivado: "Desactivado",
};

export type CodigoPanel = {
  id: string;
  /** En claro si se puede recalcular; si no, sólo los últimos cuatro. */
  codigo: string;
  completo: boolean;
  pruebas: Instrumento[];
  estado: EstadoCodigo;
  usos: number;
  maxUsos: number;
  vence: string | null;
  creado: string;
  /** Quién lo usó (la última persona, si es de varios usos). */
  persona: string | null;
  activado: string | null;
  limite: string | null;
};

export type PruebaAplicante = {
  sesionId: string | null;
  instrumento: Instrumento;
  codigo: string;
  activado: string;
  limite: string;
  inicio: string | null;
  fin: string | null;
  estado: "pendiente" | "contestando" | "en-revision" | "firmado" | "tiempo-agotado";
  puntajes: { etiqueta: string; valor: string }[];
  hayPdf: boolean;
};

export type Aplicante = {
  clave: string;
  nombre: string;
  puesto: string | null;
  empresa: string | null;
  primeraActivacion: string;
  ultimaActividad: string;
  pruebas: PruebaAplicante[];
};

/** Mismo nombre escrito con otras mayúsculas o espacios = la misma persona. */
export function claveDe(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function mostrarCodigo(id: string, sufijo: string): { codigo: string; completo: boolean } {
  const claro = codigoEnClaro(id);
  return claro ? { codigo: claro, completo: true } : { codigo: `••••-••••-${sufijo}`, completo: false };
}

export async function panelDeEmpresa(userId: string) {
  const db = getDb();
  const codigos = await db
    .select()
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.clienteUserId, userId))
    .orderBy(desc(schema.accessCodes.createdAt));
  const ids = codigos.map((c) => c.id);

  const canjes = ids.length
    ? await db
        .select()
        .from(schema.accessRedemptions)
        .where(inArray(schema.accessRedemptions.accessCodeId, ids))
        .orderBy(desc(schema.accessRedemptions.createdAt))
    : [];
  const sesiones = ids.length
    ? await db
        .select({
          id: schema.assessmentSessions.id,
          instrumento: schema.assessmentSessions.instrumento,
          aprobada: schema.assessmentSessions.aprobada,
          calificacion: schema.assessmentSessions.calificacion,
          interpretacion: schema.assessmentSessions.interpretacion,
          iniciada: schema.assessmentSessions.iniciada,
          finalizada: schema.assessmentSessions.finalizada,
          actualizada: schema.assessmentSessions.actualizada,
          canje: schema.assessmentSessions.accessRedemptionId,
        })
        .from(schema.assessmentSessions)
        .where(inArray(schema.assessmentSessions.accessCodeId, ids))
    : [];

  const ahora = new Date();
  const canjesPorCodigo = new Map<string, typeof canjes>();
  for (const c of canjes) {
    const lista = canjesPorCodigo.get(c.accessCodeId) ?? [];
    lista.push(c);
    canjesPorCodigo.set(c.accessCodeId, lista);
  }

  /* ---------------- códigos ---------------- */
  const filas: CodigoPanel[] = codigos.map((c) => {
    const pruebas = parseAllowedInstruments(c.allowedInstruments);
    const usados = canjesPorCodigo.get(c.id) ?? [];
    const ultimo = usados[0] ?? null;
    const hechas = ultimo ? parseCompletedInstruments(ultimo.completedInstruments) : [];
    let estado: EstadoCodigo;
    if (!c.active) estado = "desactivado";
    else if (ultimo && pruebas.every((p) => hechas.includes(p)) && c.usedCount >= c.maxUses) estado = "terminado";
    else if (ultimo && c.usedCount >= c.maxUses)
      estado = tiempoAgotado(ultimo.createdAt, ahora) ? "tiempo-agotado" : "en-curso";
    else if (c.expiresAt && new Date(c.expiresAt) < ahora) estado = "vencido";
    else estado = "disponible";
    return {
      id: c.id,
      ...mostrarCodigo(c.id, c.codeSuffix),
      pruebas,
      estado,
      usos: c.usedCount,
      maxUsos: c.maxUses,
      vence: c.expiresAt,
      creado: c.createdAt,
      persona: ultimo?.participantNombre ?? null,
      activado: ultimo?.createdAt ?? null,
      limite: ultimo ? limiteParaContestar(ultimo.createdAt) : null,
    };
  });

  // Cuántos códigos libres quedan de cada prueba (un código multiprueba cuenta en cada una).
  const disponibles: Partial<Record<Instrumento, number>> = {};
  for (const f of filas) {
    if (f.estado !== "disponible") continue;
    const libres = Math.max(0, f.maxUsos - f.usos);
    for (const p of f.pruebas) disponibles[p] = (disponibles[p] ?? 0) + libres;
  }

  /* ---------------- aplicantes ---------------- */
  const porCodigo = new Map(codigos.map((c) => [c.id, c]));
  const sesionesPorCanje = new Map<string, typeof sesiones>();
  for (const s of sesiones) {
    if (!s.canje) continue;
    const lista = sesionesPorCanje.get(s.canje) ?? [];
    lista.push(s);
    sesionesPorCanje.set(s.canje, lista);
  }

  const aplicantes = new Map<string, Aplicante>();
  for (const r of canjes) {
    const codigo = porCodigo.get(r.accessCodeId);
    if (!codigo) continue;
    const clave = claveDe(r.participantNombre);
    const ap =
      aplicantes.get(clave) ??
      ({
        clave,
        nombre: r.participantNombre,
        puesto: r.puesto,
        empresa: r.empresa,
        primeraActivacion: r.createdAt,
        ultimaActividad: r.createdAt,
        pruebas: [],
      } satisfies Aplicante);
    if (r.createdAt < ap.primeraActivacion) ap.primeraActivacion = r.createdAt;
    ap.puesto = ap.puesto ?? r.puesto;
    ap.empresa = ap.empresa ?? r.empresa;

    const hechas = parseCompletedInstruments(r.completedInstruments);
    const suyas = sesionesPorCanje.get(r.id) ?? [];
    const agotado = tiempoAgotado(r.createdAt, ahora);
    const { codigo: texto } = mostrarCodigo(codigo.id, codigo.codeSuffix);
    for (const instrumento of parseAllowedInstruments(codigo.allowedInstruments)) {
      const ses = suyas.find((s) => s.instrumento === instrumento) ?? null;
      const inicio = ses?.iniciada ?? r.iniciadas?.[instrumento] ?? null;
      const fin = ses?.finalizada ?? null;
      const estado: PruebaAplicante["estado"] = ses
        ? ses.aprobada
          ? "firmado"
          : "en-revision"
        : hechas.includes(instrumento)
          ? "en-revision"
          : inicio
            ? agotado
              ? "tiempo-agotado"
              : "contestando"
            : agotado
              ? "tiempo-agotado"
              : "pendiente";
      const ultima = ses?.actualizada ?? inicio ?? r.createdAt;
      if (ultima > ap.ultimaActividad) ap.ultimaActividad = ultima;
      ap.pruebas.push({
        sesionId: ses?.id ?? null,
        instrumento,
        codigo: texto,
        activado: r.createdAt,
        limite: limiteParaContestar(r.createdAt),
        inicio,
        fin,
        estado,
        puntajes: ses ? resumenPuntajes(instrumento, ses.calificacion) : [],
        hayPdf: Boolean(ses?.interpretacion) && (instrumento !== "socioeconomico" || Boolean(ses?.aprobada)),
      });
    }
    aplicantes.set(clave, ap);
  }

  const listaAplicantes = [...aplicantes.values()].sort((a, b) =>
    b.ultimaActividad.localeCompare(a.ultimaActividad),
  );
  for (const a of listaAplicantes) a.pruebas.sort((x, y) => (x.inicio ?? x.activado).localeCompare(y.inicio ?? y.activado));

  return { codigos: filas, disponibles, aplicantes: listaAplicantes };
}

/** ¿Esta sesión salió de un código de esta empresa? */
export async function sesionEsDelCliente(sesionId: string, userId: string) {
  const db = getDb();
  const [ses] = await db
    .select()
    .from(schema.assessmentSessions)
    .where(eq(schema.assessmentSessions.id, sesionId))
    .limit(1);
  if (!ses?.accessCodeId) return null;
  const [codigo] = await db
    .select({ cliente: schema.accessCodes.clienteUserId })
    .from(schema.accessCodes)
    .where(eq(schema.accessCodes.id, ses.accessCodeId))
    .limit(1);
  return codigo?.cliente === userId ? ses : null;
}

/* ---------------- puntajes ---------------- */

const NOMBRES_LIFO: Record<string, string> = {
  da: "Dar / Apoyar",
  tc: "Tomar / Controlar",
  mc: "Mantener / Conservar",
  an: "Adaptar / Negociar",
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const redondo = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/**
 * Los puntajes principales de cada prueba, en pocas líneas. La lectura
 * completa está en el informe; esto es para comparar de un vistazo.
 */
export function resumenPuntajes(instrumento: Instrumento, cal: unknown): { etiqueta: string; valor: string }[] {
  if (!cal || typeof cal !== "object") return [];
  const c = cal as Record<string, unknown>;
  try {
    switch (instrumento) {
      case "papi": {
        const p = c.puntajes as Record<Factor, number>;
        return Object.entries(p)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([f, v]) => ({ etiqueta: NOMBRES_PAPI[f as Factor] ?? f, valor: `${v} / 9` }));
      }
      case "hartman": {
        const fila = (nombre: string, parte: Record<string, unknown>) => ({
          etiqueta: nombre,
          valor: `DIM ${num(parte.DIMpct) ?? "—"}% · INT ${num(parte.INTpct) ?? "—"}% · DIS ${num(parte.DIS) ?? "—"}`,
        });
        const out = [fila("Visión del mundo", c.VQ as Record<string, unknown>), fila("Visión de sí mismo", c.SQ as Record<string, unknown>)];
        const comp = (c.compuestos as { BQr: number; CQ: number }[] | undefined)?.[0];
        if (comp) out.push({ etiqueta: "Balance (BQr · CQ)", valor: `${comp.BQr} · ${comp.CQ}` });
        return out;
      }
      case "mabe": {
        const persona = (c.procPersona as { cuadrantes: { cuadrante: keyof typeof NOMBRES_CUADRANTE; escalado: number }[] })
          .cuadrantes;
        const valores = (c.valPersona as { valores: { valor: keyof typeof NOMBRES_VALOR; escalado: number }[] }).valores;
        const top = [...valores].sort((a, b) => b.escalado - a.escalado).slice(0, 2);
        return [
          ...persona.map((q) => ({ etiqueta: NOMBRES_CUADRANTE[q.cuadrante], valor: redondo(q.escalado) })),
          ...top.map((v) => ({ etiqueta: `Valor ${NOMBRES_VALOR[v.valor]}`, valor: redondo(v.escalado) })),
        ];
      }
      case "cleaver": {
        const t = (c.grafica as { T: Record<keyof typeof NOMBRES_CLEAVER, number> }).T;
        const out = (Object.keys(NOMBRES_CLEAVER) as (keyof typeof NOMBRES_CLEAVER)[]).map((f) => ({
          etiqueta: NOMBRES_CLEAVER[f],
          valor: `${Math.round(t[f])} / 100`,
        }));
        const estilo = (c.estiloClasico as { nombre?: string } | null)?.nombre;
        if (estilo) out.push({ etiqueta: "Patrón", valor: estilo });
        return out;
      }
      case "lifo": {
        const h = (c.habitual as { puntajes: Record<string, number> }).puntajes;
        const e = (c.estres as { puntajes: Record<string, number> }).puntajes;
        return Object.keys(NOMBRES_LIFO).map((k) => ({
          etiqueta: NOMBRES_LIFO[k],
          valor: `${h[k] ?? "—"} habitual · ${e[k] ?? "—"} estrés`,
        }));
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}
