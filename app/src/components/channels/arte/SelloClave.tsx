/**
 * El sello de la CLAVE: la acreditación como pieza gráfica.
 * Anillos concéntricos con el código al centro, como un timbre oficial.
 */
export function SelloClave({
  clave = "ECE 002-10",
  className,
}: {
  clave?: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 300 300"
      role="img"
      aria-label={`Clave de acreditación ${clave}`}
    >
      <defs>
        <path id="sc-arco" d="M150,150 m-108,0 a108,108 0 1,1 216,0 a108,108 0 1,1 -216,0" fill="none" />
        <linearGradient id="sc-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ch-accent)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--ch-accent)" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Anillo exterior con texto en curva */}
      <circle cx="150" cy="150" r="128" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      <circle cx="150" cy="150" r="120" fill="none" stroke="url(#sc-g)" strokeWidth="2" />
      <text fontSize="11" letterSpacing="4.2" fill="currentColor" opacity="0.6">
        <textPath href="#sc-arco" startOffset="50%" textAnchor="middle">
          ENTIDAD DE CERTIFICACIÓN Y EVALUACIÓN
        </textPath>
      </text>

      {/* Marcas del perímetro: una por cada grado de competencia */}
      {Array.from({ length: 48 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 48;
        const r1 = 103;
        const r2 = i % 4 === 0 ? 93 : 98;
        return (
          <line
            key={i}
            x1={150 + Math.cos(a) * r1}
            y1={150 + Math.sin(a) * r1}
            x2={150 + Math.cos(a) * r2}
            y2={150 + Math.sin(a) * r2}
            stroke="currentColor"
            strokeWidth={i % 4 === 0 ? 1.6 : 0.8}
            opacity={i % 4 === 0 ? 0.55 : 0.28}
          />
        );
      })}

      {/* Núcleo */}
      <circle cx="150" cy="150" r="78" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" />
      <text
        x="150"
        y="138"
        textAnchor="middle"
        fontSize="12"
        letterSpacing="3"
        fill="currentColor"
        opacity="0.55"
      >
        CLAVE
      </text>
      <text
        x="150"
        y="172"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        letterSpacing="-0.5"
        fill="var(--ch-accent)"
      >
        {clave}
      </text>
    </svg>
  );
}
