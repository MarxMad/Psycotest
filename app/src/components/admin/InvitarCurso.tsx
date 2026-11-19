"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Card, CardHeader } from "@/components/admin/Card";
import f from "./Formulario.module.css";

type Resultado = {
  email: string;
  estado: "invitado" | "ya_inscrito" | "invalido";
  correo: "enviado" | "no_configurado" | "error" | "no_aplica";
};

const ESTADO: Record<Resultado["estado"], string> = {
  invitado: "Inscrito",
  ya_inscrito: "Ya estaba inscrito",
  invalido: "Correo no válido",
};

const CORREO: Record<Resultado["correo"], string> = {
  enviado: "correo enviado",
  no_configurado: "correo no configurado",
  error: "el correo falló",
  no_aplica: "",
};

/** Inscribe correos en un curso y les manda la invitación con la marca del curso. */
export function InvitarCurso({ cursoId, alTerminar }: { cursoId: string; alTerminar?: () => void }) {
  const [correos, setCorreos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [resultados, setResultados] = useState<Resultado[] | null>(null);

  async function invitar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    setResultados(null);
    try {
      const r = await fetch(`/api/courses/${cursoId}/invitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correos, mensaje }),
      });
      const datos = (await r.json()) as { resultados?: Resultado[]; error?: string };
      if (!r.ok) {
        setError(datos.error ?? "No se pudo invitar");
        return;
      }
      setResultados(datos.resultados ?? []);
      setCorreos("");
      alTerminar?.();
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const enviados = resultados?.filter((r) => r.correo === "enviado").length ?? 0;

  return (
    <Card>
      <CardHeader
        title="Invitar alumnos"
        subtitle="Quedan inscritos sin pago y reciben un correo con el enlace al curso"
      />
      <form className={f.form} onSubmit={invitar}>
        <label className={f.campo}>
          Correos
          <span className={f.ayuda}>Uno por línea o separados por comas. Máximo 200.</span>
          <textarea
            className={f.area}
            value={correos}
            onChange={(e) => setCorreos(e.target.value)}
            placeholder={"ana@empresa.com\nluis@empresa.com"}
            required
          />
        </label>
        <label className={f.campo}>
          Mensaje (opcional)
          <textarea
            className={f.area}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={2000}
            placeholder="Por ejemplo: este curso es parte del programa de capacitación de tu empresa."
          />
        </label>
        <div className={f.acciones}>
          <button type="submit" className="btn btn-primary" disabled={enviando || !correos.trim()}>
            <Send size={16} />
            {enviando ? "Invitando…" : "Invitar"}
          </button>
          {error ? <p className={f.error}>{error}</p> : null}
          {resultados ? (
            <p className={f.ok}>
              Listo: {resultados.filter((r) => r.estado !== "invalido").length} inscritos, {enviados} correos enviados.
            </p>
          ) : null}
        </div>
      </form>
      {resultados && resultados.length > 0 ? (
        <ul className={f.lista} style={{ marginTop: "1rem" }}>
          {resultados.map((r) => (
            <li key={r.email}>
              <span>{r.email}</span>
              <span className={r.estado === "invalido" || r.correo === "error" ? f.error : f.aviso}>
                {ESTADO[r.estado]}
                {CORREO[r.correo] ? ` · ${CORREO[r.correo]}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
