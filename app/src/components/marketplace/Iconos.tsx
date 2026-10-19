import {
  Briefcase,
  Cpu,
  GraduationCap,
  HeartPulse,
  Megaphone,
  Users,
  type LucideProps,
} from "lucide-react";
import type { IconoCategoria } from "@/lib/ceduct/config";

const MAPA = {
  megafono: Megaphone,
  chip: Cpu,
  maletin: Briefcase,
  pulso: HeartPulse,
  birrete: GraduationCap,
  personas: Users,
} satisfies Record<IconoCategoria, React.ComponentType<LucideProps>>;

export function IconoDeCategoria({ icono, ...props }: { icono: IconoCategoria } & LucideProps) {
  const Icono = MAPA[icono] ?? Briefcase;
  return <Icono aria-hidden {...props} />;
}

/** Engrane + libro: el emblema de CEDUCT, simplificado para fondo oscuro. */
export function Emblema({ className }: { className?: string }) {
  const dientes = Array.from({ length: 10 }, (_, i) => (i * 360) / 10);
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        {dientes.map((a) => (
          <rect key={a} x="17.5" y="1.5" width="5" height="7" rx="1.2" transform={`rotate(${a} 20 17)`} />
        ))}
        <circle cx="20" cy="17" r="11.5" />
      </g>
      <circle cx="20" cy="17" r="6" fill="#0b2a6f" />
      <path
        d="M6 30 Q13 27 20 31 Q27 27 34 30 L34 36 Q27 33 20 37 Q13 33 6 36 Z"
        fill="currentColor"
      />
      <path d="M20 31 L20 37" stroke="#0b2a6f" strokeWidth="1.4" />
    </svg>
  );
}

type RedProps = { className?: string };

export function IconoFacebook({ className }: RedProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z"
      />
    </svg>
  );
}

export function IconoInstagram({ className }: RedProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
      </g>
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function IconoLinkedin({ className }: RedProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 9h3v11H5V9Zm1.5-5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM10 9h2.9v1.5h.1c.4-.8 1.4-1.7 3-1.7 3.1 0 3.7 2 3.7 4.7V20h-3v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V20H10V9Z"
      />
    </svg>
  );
}

export function IconoYoutube({ className }: RedProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z"
      />
    </svg>
  );
}
