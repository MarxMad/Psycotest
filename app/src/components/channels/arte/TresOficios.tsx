/**
 * Los tres oficios de Martín como tres círculos que se cruzan.
 * El punto donde coinciden es exactamente lo que dice el hero:
 * poner valor donde hoy sólo hay intuición.
 */

const CIRCULOS = [
  { cx: 150, cy: 118, label: "Consultor" },
  { cx: 108, cy: 192, label: "Valuador" },
  { cx: 192, cy: 192, label: "Certificador" },
] as const;

const R = 74;

export function TresOficios({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 300"
      role="img"
      aria-label="Consultor, valuador y certificador: tres oficios que se cruzan en un mismo punto"
    >
      <defs>
        <radialGradient id="to-centro">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {CIRCULOS.map((c) => (
        <circle
          key={c.label}
          cx={c.cx}
          cy={c.cy}
          r={R}
          fill="var(--ch-accent)"
          fillOpacity="0.07"
          stroke="var(--ch-accent)"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />
      ))}

      {/* El cruce */}
      <circle cx="150" cy="168" r="34" fill="url(#to-centro)" />
      <circle cx="150" cy="168" r="4" fill="var(--ch-accent)" />

      {CIRCULOS.map((c) => {
        // Etiqueta empujada hacia afuera del centro del conjunto
        const dx = c.cx - 150;
        const dy = c.cy - 168;
        const d = Math.hypot(dx, dy) || 1;
        const x = c.cx + (dx / d) * 52;
        const y = c.cy + (dy / d) * 52;
        return (
          <text
            key={c.label}
            x={c.label === "Consultor" ? 150 : x}
            y={c.label === "Consultor" ? 28 : y}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="currentColor"
            opacity="0.8"
          >
            {c.label}
          </text>
        );
      })}
    </svg>
  );
}
