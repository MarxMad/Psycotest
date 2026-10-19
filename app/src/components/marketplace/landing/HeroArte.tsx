import l from "./landing.module.css";

/**
 * Ilustración del hero: un certificado en órbita, con el sello oficial y
 * etiquetas que flotan. Es SVG puro —pesa unos KB, escala a cualquier
 * pantalla y no necesita placeholder de carga—.
 */
export function HeroArte() {
  const lineas = [0, 1, 2, 3];
  return (
    <svg
      viewBox="0 0 640 640"
      className={l.heroArte}
      role="img"
      aria-label="Ilustración: un certificado oficial con sello de validación rodeado de órbitas"
    >
      <defs>
        <radialGradient id="ha-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ha-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbe7ff" />
        </linearGradient>
        <linearGradient id="ha-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0b2a6f" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="ha-sombra" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="26" floodColor="#020a28" floodOpacity="0.6" />
        </filter>
      </defs>

      <circle cx="320" cy="320" r="300" fill="url(#ha-glow)" />

      {/* Órbitas */}
      <g fill="none" stroke="#a8c4ff">
        <circle cx="320" cy="320" r="270" strokeOpacity="0.16" />
        <circle cx="320" cy="320" r="210" strokeOpacity="0.22" strokeDasharray="4 10" className={l.giro} />
        <circle cx="320" cy="320" r="150" strokeOpacity="0.14" />
      </g>
      <g className={l.giroLento}>
        <circle cx="320" cy="50" r="7" fill="#facc15" />
        <circle cx="590" cy="320" r="5" fill="#f97316" />
        <circle cx="110" cy="470" r="4" fill="#f0f6ff" opacity="0.7" />
      </g>

      {/* Certificado */}
      <g transform="rotate(-7 320 330)" filter="url(#ha-sombra)">
        <rect x="140" y="210" width="360" height="250" rx="18" fill="url(#ha-card)" />
        <rect x="140" y="210" width="360" height="54" rx="18" fill="url(#ha-band)" />
        <rect x="140" y="246" width="360" height="18" fill="url(#ha-band)" />
        <text x="166" y="244" fill="#f0f6ff" fontSize="15" fontWeight="700" letterSpacing="3" fontFamily="var(--mk-font-display), sans-serif">
          CERTIFICADO DE COMPETENCIA
        </text>
        <text x="166" y="304" fill="#0b2a6f" fontSize="26" fontWeight="700" fontFamily="var(--mk-font-display), sans-serif" letterSpacing="-0.5">
          EC0217.01
        </text>
        {lineas.map((i) => (
          <rect key={i} x="166" y={326 + i * 22} width={i === 3 ? 120 : 210 - i * 24} height="9" rx="4.5" fill="#0b2a6f" opacity={0.16 - i * 0.02} />
        ))}
        <line x1="166" y1="430" x2="290" y2="430" stroke="#0b2a6f" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M172 424 q14 -16 26 -2 t24 -4 t22 2" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" />

        {/* Sello */}
        <g transform="translate(420 380)">
          {Array.from({ length: 16 }, (_, i) => (
            <rect key={i} x="-6" y="-58" width="12" height="16" rx="3" fill="#facc15" transform={`rotate(${i * 22.5})`} />
          ))}
          <circle r="46" fill="#facc15" />
          <circle r="36" fill="none" stroke="#0a1b45" strokeWidth="1.5" strokeDasharray="2 4" />
          <path d="M-16 0 L-4 12 L18 -12" fill="none" stroke="#0a1b45" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Etiquetas flotantes */}
      <g className={l.flota1}>
        <rect x="380" y="118" width="196" height="48" rx="24" fill="#f97316" />
        <text x="478" y="149" textAnchor="middle" fill="#0a1b45" fontSize="15" fontWeight="800" letterSpacing="1.5" fontFamily="var(--mk-font-body), sans-serif">
          VALIDEZ OFICIAL
        </text>
      </g>
      <g className={l.flota2}>
        <rect x="56" y="150" width="200" height="64" rx="16" fill="#123a8a" stroke="#a8c4ff" strokeOpacity="0.4" />
        <circle cx="88" cy="182" r="14" fill="#facc15" />
        <path d="M81 182 l5 5 l9 -10" fill="none" stroke="#0a1b45" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <text x="112" y="177" fill="#f0f6ff" fontSize="15" fontWeight="700" fontFamily="var(--mk-font-body), sans-serif">Acceso inmediato</text>
        <text x="112" y="197" fill="#bccdf0" fontSize="12" fontFamily="var(--mk-font-body), sans-serif">al confirmar tu pago</text>
      </g>
      <g className={l.flota3}>
        <rect x="408" y="500" width="176" height="64" rx="16" fill="#0e3280" stroke="#a8c4ff" strokeOpacity="0.4" />
        <text x="430" y="528" fill="#facc15" fontSize="22" fontWeight="700" fontFamily="var(--mk-font-display), sans-serif">120 h</text>
        <text x="430" y="548" fill="#bccdf0" fontSize="12" fontFamily="var(--mk-font-body), sans-serif">Diplomado · En línea</text>
      </g>
    </svg>
  );
}
