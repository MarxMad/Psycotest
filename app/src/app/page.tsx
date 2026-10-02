import type { Metadata } from "next";
import { CHANNELS, channelPublicUrl, type ChannelId } from "@/lib/channels";

export const metadata: Metadata = {
  title: "Sistema Psic — Canales",
  description: "CEDUCT, Psicología Aplicada, Ingeniería de Grupos Efectivos y portafolio Martín Hernández.",
};

const ORDER: ChannelId[] = ["martin", "ceduct", "psicologia", "ige"];

export default function HubPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "clamp(2rem, 6vw, 4rem)",
        background: "#0b1020",
        color: "#f4f1ea",
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}
    >
      <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", color: "#d4a24c", fontSize: 12 }}>
        Sistema Psic · Hub
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.4rem)", maxWidth: "14ch" }}>
        Cuatro canales. Una operación.
      </h1>
      <p style={{ color: "#9aa3b5", maxWidth: 480, lineHeight: 1.55 }}>
        Elige el sitio según tu necesidad. En producción cada canal vive en su subdominio.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        {ORDER.map((id) => {
          const ch = CHANNELS[id];
          return (
            <a
              key={id}
              href={`/sites/${id}`}
              style={{
                display: "block",
                padding: "1.25rem",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                textDecoration: "none",
                color: "inherit",
                background: "#141c2e",
              }}
            >
              <small style={{ color: "#d4a24c" }}>{ch.accentLabel}</small>
              <strong style={{ display: "block", marginTop: 6, fontSize: "1.2rem" }}>{ch.name}</strong>
              <span style={{ display: "block", marginTop: 8, color: "#9aa3b5", fontSize: 14 }}>
                {ch.tagline}
              </span>
              <span style={{ display: "block", marginTop: 14, fontSize: 13, color: "#d4a24c" }}>
                Abrir →
              </span>
              <span style={{ display: "block", marginTop: 6, fontSize: 11, color: "#667085" }}>
                {channelPublicUrl(id)}
              </span>
            </a>
          );
        })}
      </div>
    </main>
  );
}
