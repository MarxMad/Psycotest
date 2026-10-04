/**
 * Sello de la Sociedad de Psicología Aplicada A.C.
 *
 * Respalda el sistema: quien contrata una evaluación ve de quién viene.
 * Dibujado, no fotografiado, para que escale a cualquier tamaño.
 */
export function SelloSociedad({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 260"
      role="img"
      aria-label="Sello de la Sociedad de Psicología Aplicada A.C."
    >
      <defs>
        <path
          id="ss-arco-sup"
          d="M130,130 m-92,0 a92,92 0 0,1 184,0"
          fill="none"
        />
        <path
          id="ss-arco-inf"
          d="M130,130 m-82,0 a82,82 0 0,0 164,0"
          fill="none"
        />
      </defs>

      {/* Anillos */}
      <circle cx="130" cy="130" r="112" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" />
      <circle cx="130" cy="130" r="104" fill="none" stroke="var(--ch-accent)" strokeWidth="2" />
      <circle cx="130" cy="130" r="70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />

      {/* Texto curvo */}
      <text fontSize="12.5" fontWeight="600" letterSpacing="2.6" fill="currentColor" opacity="0.75">
        <textPath href="#ss-arco-sup" startOffset="50%" textAnchor="middle">
          SOCIEDAD DE PSICOLOGÍA APLICADA
        </textPath>
      </text>
      <text fontSize="11" fontWeight="600" letterSpacing="3.4" fill="currentColor" opacity="0.55">
        <textPath href="#ss-arco-inf" startOffset="50%" textAnchor="middle">
          ASOCIACIÓN CIVIL
        </textPath>
      </text>

      {/* Marcas del perímetro */}
      {Array.from({ length: 36 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 36 + Math.PI / 36;
        const r1 = 96;
        const r2 = i % 3 === 0 ? 86 : 91;
        return (
          <line
            key={i}
            x1={130 + Math.cos(a) * r1}
            y1={130 + Math.sin(a) * r1}
            x2={130 + Math.cos(a) * r2}
            y2={130 + Math.sin(a) * r2}
            stroke="currentColor"
            strokeWidth={i % 3 === 0 ? 1.5 : 0.8}
            opacity={i % 3 === 0 ? 0.5 : 0.25}
          />
        );
      })}

      {/* Núcleo: la psique como círculo sobre una base, abierta hacia arriba */}
      <g transform="translate(130, 126)">
        <circle cx="0" cy="-12" r="16" fill="none" stroke="var(--ch-accent)" strokeWidth="2.4" />
        <path
          d="M-26 16 Q0 30 26 16"
          fill="none"
          stroke="var(--ch-accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line x1="0" y1="4" x2="0" y2="16" stroke="var(--ch-accent)" strokeWidth="2.4" strokeLinecap="round" />
      </g>

      <text
        x="130"
        y="186"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        letterSpacing="2"
        fill="var(--ch-accent)"
      >
        A.C.
      </text>
    </svg>
  );
}
