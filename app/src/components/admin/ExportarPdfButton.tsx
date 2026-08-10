"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import s from "./ExportarPdfButton.module.css";

interface Props {
  sessionId: string;
  participante: string;
  aprobada?: boolean;
}

export function ExportarPdfButton({ sessionId, participante, aprobada }: Props) {
  const [loading, setLoading] = useState(false);

  async function descargar() {
    if (!aprobada) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pdf`);
      if (!res.ok) {
        alert("No se pudo generar el PDF. Verifica que el informe esté validado.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `informe-${participante.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={descargar}
        disabled={!aprobada || loading}
        title={
          aprobada
            ? "Descargar informe en PDF"
            : "Valida el informe antes de exportar"
        }
      >
        <FileDown size={16} />
        {loading ? "Generando PDF…" : "Exportar PDF"}
      </button>
      {!aprobada && (
        <p className={s.hint}>Valida el informe para habilitar la exportación.</p>
      )}
    </div>
  );
}
