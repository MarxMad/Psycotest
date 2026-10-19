/** Manuales públicos descargables desde la plataforma. */
export const MANUAL_GUIA_PSICOLOGO = {
  /** Archivo estático en /public */
  href: "/manuales/guia-del-psicologo.pdf",
  /** Forzar descarga con Content-Disposition */
  apiHref: "/api/manuales/guia-psicologo",
  filename: "Guia-del-psicologo.pdf",
  title: "Guía del psicólogo",
  subtitle: "Manual ejecutivo de uso (PDF)",
} as const;
