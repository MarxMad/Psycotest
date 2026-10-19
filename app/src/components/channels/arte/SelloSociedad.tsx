/**
 * Sello de la Sociedad de Psicología Aplicada A.C.
 *
 * Respalda el sistema: quien contrata una evaluación ve de quién viene.
 * Dibujado, no fotografiado, para que escale a cualquier tamaño.
 */

/** Node y el navegador serializan los flotantes distinto: redondear evita el aviso de hidratación. */
const r3 = (n: number) => Number(n.toFixed(3));

const MARCAS = Array.from({ length: 36 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 36 + Math.PI / 36;
  const fuerte = i % 3 === 0;
  const interior = fuerte ? 84 : 90;
  return {
    i,
    fuerte,
    x1: r3(130 + Math.cos(a) * 96),
    y1: r3(130 + Math.sin(a) * 96),
    x2: r3(130 + Math.cos(a) * interior),
    y2: r3(130 + Math.sin(a) * interior),
  };
});

export function SelloSociedad({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 260"
      role="img"
      aria-label="Sello de la Sociedad de Psicología Aplicada A.C."
    >
      <defs>
        <path id="ss-arco-sup" d="M130,130 m-106,0 a106,106 0 0,1 212,0" fill="none" />
        <path id="ss-arco-inf" d="M130,130 m-110,0 a110,110 0 0,0 220,0" fill="none" />
      </defs>

      {/* Anillos */}
      <circle cx="130" cy="130" r="127" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="130" cy="130" r="100" fill="none" stroke="var(--ch-accent)" strokeWidth="2.5" />
      <circle cx="130" cy="130" r="72" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

      {/* Texto curvo */}
      <text fontSize="15" fontWeight="700" letterSpacing="0.9" fill="currentColor">
        <textPath href="#ss-arco-sup" startOffset="50%" textAnchor="middle">
          SOCIEDAD DE PSICOLOGÍA APLICADA
        </textPath>
      </text>
      <text fontSize="15" fontWeight="600" letterSpacing="4" fill="currentColor" opacity="0.72">
        <textPath href="#ss-arco-inf" startOffset="50%" textAnchor="middle">
          ASOCIACIÓN CIVIL
        </textPath>
      </text>

      {/* Marcas del perímetro */}
      {MARCAS.map((m) => (
        <line
          key={m.i}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke="currentColor"
          strokeWidth={m.fuerte ? 2 : 1}
          opacity={m.fuerte ? 0.55 : 0.3}
        />
      ))}

      {/* Núcleo: la psique como círculo sobre una base, abierta hacia arriba */}
      <g transform="translate(130, 124)">
        <circle cx="0" cy="-14" r="18" fill="none" stroke="var(--ch-accent)" strokeWidth="3" />
        <path
          d="M-29 18 Q0 34 29 18"
          fill="none"
          stroke="var(--ch-accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line x1="0" y1="4" x2="0" y2="18" stroke="var(--ch-accent)" strokeWidth="3" strokeLinecap="round" />
      </g>

      <text
        x="130"
        y="176"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        letterSpacing="2.5"
        fill="var(--ch-accent)"
      >
        A.C.
      </text>
    </svg>
  );
}
