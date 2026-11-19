"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Mail, Send } from "lucide-react";
import { Card, CardHeader } from "@/components/admin/Card";
import { Badge } from "@/components/admin/DataTable";
import { fechaCorta } from "@/lib/formato";
import f from "./Formulario.module.css";

type Marca = "ceduct" | "ige" | "psicologia";
type Audiencia = "alumnos" | "compradores" | "todos";

const MARCAS: Record<Marca, string> = {
  psicologia: "Psicología Aplicada",
  ceduct: "CEDUCT",
  ige: "IGE",
};

const AUDIENCIAS: Record<Audiencia, string> = {
  alumnos: "Alumnos y clientes de la marca",
  compradores: "Quienes han pagado algo a la marca",
  todos: "Todas las personas registradas",
};

type Campana = {
  id: string;
  marca: Marca;
  audiencia: Audiencia;
  asunto: string;
  estado: "enviando" | "enviada" | "con_errores";
  destinatarios: number;
  enviados: number;
  fallidos: number;
  createdAt: string;
};

type Mensaje = { tipo: "ok" | "error"; texto: string } | null;

/**
 * Promociones por correo. Se arma, se ve, se manda una prueba al propio
 * correo y solo entonces se envía a la audiencia.
 */
export function CampanasCorreo({ cupones }: { cupones: string[] }) {
  const [marca, setMarca] = useState<Marca>("psicologia");
  const [audiencia, setAudiencia] = useState<Audiencia>("alumnos");
  const [asunto, setAsunto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [botonTexto, setBotonTexto] = useState("");
  const [botonUrl, setBotonUrl] = useState("");
  const [cuponCodigo, setCuponCodigo] = useState("");

  const [alcance, setAlcance] = useState<number | null>(null);
  const [historial, setHistorial] = useState<Campana[]>([]);
  const [configurado, setConfigurado] = useState(true);
  const [vista, setVista] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [msg, setMsg] = useState<Mensaje>(null);

  const cargarHistorial = useCallback(async () => {
    const r = await fetch("/api/admin/campanas");
    if (!r.ok) return;
    const d = (await r.json()) as { campanas?: Campana[]; correoConfigurado?: boolean };
    setHistorial(d.campanas ?? []);
    setConfigurado(d.correoConfigurado ?? false);
  }, []);

  useEffect(() => {
    void cargarHistorial();
  }, [cargarHistorial]);

  useEffect(() => {
    let vivo = true;
    setAlcance(null);
    fetch(`/api/admin/campanas?marca=${marca}&audiencia=${audiencia}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { total?: number } | null) => vivo && setAlcance(d?.total ?? null))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [marca, audiencia]);

  const datos = { marca, audiencia, asunto, titulo, cuerpo, botonTexto, botonUrl, cuponCodigo };
  const completo = asunto.trim() && titulo.trim() && cuerpo.trim();

  async function llamar(accion: "vista" | "prueba" | "enviar") {
    setOcupado(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/campanas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, accion, confirmar: accion === "enviar" }),
      });
      const d = (await r.json()) as {
        error?: string;
        html?: string;
        enviadoA?: string;
        enviados?: number;
        fallidos?: number;
        destinatarios?: number;
      };
      if (!r.ok) {
        setMsg({ tipo: "error", texto: d.error ?? "No se pudo completar" });
        return;
      }
      if (accion === "vista") setVista(d.html ?? null);
      if (accion === "prueba") setMsg({ tipo: "ok", texto: `Prueba enviada a ${d.enviadoA}.` });
      if (accion === "enviar") {
        setMsg({
          tipo: d.fallidos ? "error" : "ok",
          texto: `Enviada: ${d.enviados} de ${d.destinatarios}${d.fallidos ? ` (${d.fallidos} fallaron)` : ""}.`,
        });
        setConfirmando(false);
        void cargarHistorial();
      }
    } catch {
      setMsg({ tipo: "error", texto: "Sin conexión. Intenta de nuevo." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Campañas por correo"
          subtitle="Promociones con el nombre, los colores y el dominio de cada marca"
        />
        {!configurado ? (
          <p className={f.error} style={{ marginBottom: "1rem" }}>
            El correo no está configurado (falta RESEND_API_KEY). Puedes armar y ver la campaña, pero no enviarla.
          </p>
        ) : null}
        <form className={f.form} onSubmit={(e) => e.preventDefault()}>
          <div className={f.fila}>
            <label className={f.campo}>
              Marca
              <select className={f.input} value={marca} onChange={(e) => setMarca(e.target.value as Marca)}>
                {Object.entries(MARCAS).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className={f.campo}>
              Para
              <select className={f.input} value={audiencia} onChange={(e) => setAudiencia(e.target.value as Audiencia)}>
                {Object.entries(AUDIENCIAS).map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </select>
              <span className={f.ayuda}>
                {alcance === null ? "Contando…" : `${alcance} persona${alcance === 1 ? "" : "s"} (sin las bajas)`}
              </span>
            </label>
          </div>
          <label className={f.campo}>
            Asunto
            <input className={f.input} value={asunto} onChange={(e) => setAsunto(e.target.value)} maxLength={150} />
          </label>
          <label className={f.campo}>
            Título dentro del correo
            <input className={f.input} value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={150} />
          </label>
          <label className={f.campo}>
            Mensaje
            <span className={f.ayuda}>Deja una línea en blanco entre párrafos.</span>
            <textarea className={f.area} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} maxLength={5000} />
          </label>
          <div className={f.fila}>
            <label className={f.campo}>
              Texto del botón (opcional)
              <input className={f.input} value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} maxLength={60} placeholder="Ver los cursos" />
            </label>
            <label className={f.campo}>
              Enlace del botón
              <input className={f.input} value={botonUrl} onChange={(e) => setBotonUrl(e.target.value)} placeholder="/cursos/mi-curso o https://…" />
              <span className={f.ayuda}>Vacío: la portada de la marca.</span>
            </label>
            <label className={f.campo}>
              Cupón (opcional)
              <select className={f.input} value={cuponCodigo} onChange={(e) => setCuponCodigo(e.target.value)}>
                <option value="">Sin cupón</option>
                {cupones.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={f.acciones}>
            <button type="button" className="btn" disabled={ocupado || !completo} onClick={() => void llamar("vista")}>
              <Eye size={16} />
              Ver correo
            </button>
            <button type="button" className="btn" disabled={ocupado || !completo || !configurado} onClick={() => void llamar("prueba")}>
              <Mail size={16} />
              Enviarme una prueba
            </button>
            {confirmando ? (
              <>
                <button type="button" className="btn btn-primary" disabled={ocupado} onClick={() => void llamar("enviar")}>
                  <Send size={16} />
                  {ocupado ? "Enviando…" : `Sí, enviar a ${alcance ?? "?"} personas`}
                </button>
                <button type="button" className="btn" disabled={ocupado} onClick={() => setConfirmando(false)}>
                  Cancelar
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={ocupado || !completo || !configurado || !alcance}
                onClick={() => setConfirmando(true)}
              >
                <Send size={16} />
                Enviar campaña
              </button>
            )}
          </div>
          {msg ? <p className={msg.tipo === "ok" ? f.ok : f.error}>{msg.texto}</p> : null}
        </form>

        {vista ? (
          <div style={{ marginTop: "1.25rem" }}>
            <iframe
              title="Vista previa del correo"
              srcDoc={vista}
              sandbox=""
              style={{ width: "100%", height: "640px", border: "1px solid var(--admin-border)", borderRadius: "var(--r)", background: "#fff" }}
            />
          </div>
        ) : null}
      </Card>

      <Card padding="none">
        <div style={{ padding: "1.25rem 1.25rem 0" }}>
          <CardHeader title="Campañas enviadas" subtitle="Las últimas 50" />
        </div>
        {historial.length === 0 ? (
          <p className={f.aviso} style={{ padding: "0 1.25rem 1.25rem" }}>
            Todavía no se ha enviado ninguna campaña.
          </p>
        ) : (
          <div className={f.tablaCaja}>
            <table className={f.tabla}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Marca</th>
                  <th>Asunto</th>
                  <th>Para</th>
                  <th>Enviados</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((c) => (
                  <tr key={c.id}>
                    <td>{fechaCorta(c.createdAt)}</td>
                    <td>{MARCAS[c.marca] ?? c.marca}</td>
                    <td>{c.asunto}</td>
                    <td>{AUDIENCIAS[c.audiencia] ?? c.audiencia}</td>
                    <td>
                      {c.enviados} / {c.destinatarios}
                    </td>
                    <td>
                      {c.estado === "enviada" ? (
                        <Badge tone="success">Enviada</Badge>
                      ) : c.estado === "enviando" ? (
                        <Badge tone="neutral">Enviando</Badge>
                      ) : (
                        <Badge tone="danger">Con errores</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
