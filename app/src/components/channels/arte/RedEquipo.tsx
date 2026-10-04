/**
 * Un equipo que deja de depender del héroe.
 *
 * A la izquierda, todo pasa por un solo nodo. A la derecha, la red se
 * sostiene sola. Es literalmente la promesa del canal, dibujada.
 */

const ESTRELLA = [
  [60, 40], [20, 85], [100, 85], [38, 135], [82, 135],
] as const;

const MALLA = [
  [250, 38], [206, 72], [294, 72], [222, 128], [278, 128], [250, 160],
] as const;

export function RedEquipo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 200"
      role="img"
      aria-label="De un equipo que depende de una sola persona a una red que se sostiene sola"
    >
      {/* Izquierda: todo pasa por el centro */}
      {ESTRELLA.slice(1).map(([x, y], i) => (
        <line
          key={i}
          x1={ESTRELLA[0][0]}
          y1={ESTRELLA[0][1]}
          x2={x}
          y2={y}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
      {ESTRELLA.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 ? 9 : 5}
          fill={i === 0 ? "var(--ch-accent-2, currentColor)" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          opacity={i === 0 ? 1 : 0.55}
        />
      ))}
      <text x="60" y="178" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">
        depende del héroe
      </text>

      {/* Flecha */}
      <path
        d="M140 92 L176 92 M170 86 L176 92 L170 98"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
      />

      {/* Derecha: malla distribuida */}
      {MALLA.map(([x1, y1], i) =>
        MALLA.slice(i + 1).map(([x2, y2], j) => {
          const d = Math.hypot(x2 - x1, y2 - y1);
          if (d > 68) return null;
          return (
            <line
              key={`${i}-${j}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--ch-accent)"
              strokeWidth="1"
              opacity="0.4"
            />
          );
        }),
      )}
      {MALLA.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" fill="var(--ch-accent)" opacity="0.9" />
      ))}
      <text x="250" y="190" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.5">
        se sostiene solo
      </text>
    </svg>
  );
}
