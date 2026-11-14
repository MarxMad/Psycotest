/** Lo que devuelve /api/live-classes/[id]/join: el pase y el contexto de la clase. */
export type Pase = {
  token: string;
  serverUrl: string;
  sala: string;
  breakout: { id: string; name: string } | null;
  anfitrion: boolean;
  puedeGrabar: boolean;
  clase: {
    id: string;
    title: string;
    status: "scheduled" | "live" | "completed" | "cancelled";
    scheduledAt: string;
    durationMinutes: number;
  };
  user: { id: string; nombre: string };
};

/** Lo que eligió la persona en la antesala. */
export type Preferencias = {
  audio: boolean;
  video: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
};

export type SalaDivision = {
  id: string;
  name: string;
  status: "open" | "closed";
  assignments: Array<{ userId: string; nombre: string | null }>;
};

export type Dinamica = {
  id: string;
  type: string;
  prompt: string;
  status: string;
  stateJson?: { responses?: Array<{ userId: string; nombre: string; text: string }> };
};

export function iniciales(nombre: string | undefined): string {
  return (
    (nombre ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "·"
  );
}
