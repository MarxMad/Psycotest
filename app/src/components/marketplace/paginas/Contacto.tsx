"use client";

import { useState } from "react";
import { Building2, Clock, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { CONTACTO, tel, whatsapp } from "@/lib/contacto";
import s from "../mk.module.css";
import p from "./paginas.module.css";

const ASUNTOS = [
  { id: "informes", label: "Informes de un programa" },
  { id: "empresas", label: "Capacitación para empresas" },
  { id: "facturacion", label: "Facturación y pagos" },
  { id: "soporte", label: "Soporte de la plataforma" },
];

/**
 * Formulario de contacto. No hay buzón en el servidor todavía: al enviar se
 * abre WhatsApp (o el correo) con el mensaje ya redactado, y se dice así.
 */
export function Contacto({ asuntoInicial, programa }: { asuntoInicial: string; programa?: string }) {
  const [d, setD] = useState({
    nombre: "",
    email: "",
    empresa: "",
    asunto: ASUNTOS.some((a) => a.id === asuntoInicial) ? asuntoInicial : "informes",
    mensaje: programa ? `Me interesa el programa «${programa.replace(/-/g, " ")}».` : "",
  });
  const [canal, setCanal] = useState<"whatsapp" | "correo">("whatsapp");
  const empresas = d.asunto === "empresas";

  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setD((x) => ({ ...x, [k]: e.target.value }));

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const asunto = ASUNTOS.find((a) => a.id === d.asunto)?.label ?? "Contacto";
    const texto = [
      `Hola, soy ${d.nombre}${d.empresa ? ` de ${d.empresa}` : ""}.`,
      `Asunto: ${asunto}.`,
      d.mensaje,
      `Mi correo: ${d.email}`,
    ]
      .filter(Boolean)
      .join("\n");
    const url =
      canal === "whatsapp"
        ? whatsapp(texto)
        : `mailto:${CONTACTO.email}?subject=${encodeURIComponent(`CEDUCT · ${asunto}`)}&body=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={`${s.contenedor} ${p.contacto}`}>
      <div>
        <p className={s.eyebrow}>{empresas ? "Para empresas" : "Contacto"}</p>
        <h1 className={p.titulo}>{empresas ? "Certifica a todo tu equipo." : "Hablemos."}</h1>
        <p className={s.lead}>
          {empresas
            ? "Grupos cerrados con calendario a tu medida, precio por volumen, una sola factura y reporte de avance por colaborador."
            : "Un asesor te responde el mismo día hábil. Cuéntanos qué buscas y te recomendamos el programa adecuado."}
        </p>

        <ul className={p.canales}>
          <li>
            <a className={`${s.tarjeta} ${s.tarjetaInteractiva}`} href={whatsapp("Hola, quiero información sobre CEDUCT.")} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={22} aria-hidden />
              <span><strong>WhatsApp</strong>{CONTACTO.phoneDisplay}</span>
            </a>
          </li>
          <li>
            <a className={`${s.tarjeta} ${s.tarjetaInteractiva}`} href={tel()}>
              <Phone size={22} aria-hidden />
              <span><strong>Teléfono</strong>{CONTACTO.phoneDisplay}</span>
            </a>
          </li>
          <li>
            <a className={`${s.tarjeta} ${s.tarjetaInteractiva}`} href={`mailto:${CONTACTO.email}`}>
              <Mail size={22} aria-hidden />
              <span><strong>Correo</strong>{CONTACTO.email}</span>
            </a>
          </li>
          <li>
            <div className={s.tarjeta}>
              <Clock size={22} aria-hidden />
              <span><strong>Horario</strong>[Lunes a viernes, 9:00 a 18:00]</span>
            </div>
          </li>
        </ul>

        {empresas && (
          <ul className={p.ventajas}>
            {["Diagnóstico de necesidades de capacitación", "Sesiones en tus instalaciones o en línea", "Evaluación y certificación en grupo", "Reporte de avance por colaborador"].map((x) => (
              <li key={x}><Building2 size={18} aria-hidden /> {x}</li>
            ))}
          </ul>
        )}
      </div>

      <form className={`${s.tarjeta} ${p.form}`} onSubmit={enviar}>
        <h2 className={p.formTitulo}>Escríbenos</h2>
        <label className={s.campo}>
          <span>Nombre *</span>
          <input className={s.entrada} value={d.nombre} onChange={set("nombre")} required autoComplete="name" />
        </label>
        <label className={s.campo}>
          <span>Correo *</span>
          <input className={s.entrada} type="email" value={d.email} onChange={set("email")} required autoComplete="email" />
        </label>
        <label className={s.campo}>
          <span>Asunto</span>
          <select className={s.entrada} value={d.asunto} onChange={set("asunto")}>
            {ASUNTOS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        {empresas && (
          <label className={s.campo}>
            <span>Empresa</span>
            <input className={s.entrada} value={d.empresa} onChange={set("empresa")} autoComplete="organization" />
          </label>
        )}
        <label className={s.campo}>
          <span>Mensaje *</span>
          <textarea className={s.entrada} rows={5} value={d.mensaje} onChange={set("mensaje")} required />
        </label>
        <fieldset className={p.canalEnvio}>
          <legend className={s.etiqueta}>Enviar por</legend>
          <label><input type="radio" name="canal" checked={canal === "whatsapp"} onChange={() => setCanal("whatsapp")} /> WhatsApp</label>
          <label><input type="radio" name="canal" checked={canal === "correo"} onChange={() => setCanal("correo")} /> Correo</label>
        </fieldset>
        <button type="submit" className={`${s.btn} ${s.btnPrimario} ${s.btnGrande} ${s.btnBloque}`}>
          <Send size={18} aria-hidden /> Enviar mensaje
        </button>
        <p className={s.ayuda}>Se abrirá {canal === "whatsapp" ? "WhatsApp" : "tu correo"} con el mensaje listo para enviar.</p>
      </form>
    </div>
  );
}
