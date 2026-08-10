"use client";

import { useEffect, useState } from "react";
import type { Instrumento } from "@/lib/storage";

export interface ApplicantSessionClient {
  nombre: string;
  empresa?: string;
  puesto?: string;
  allowed: Instrumento[];
  completed: Instrumento[];
  label?: string;
}

export function useApplicantSession() {
  const [session, setSession] = useState<ApplicantSessionClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/acceso")
      .then((r) => (r.ok ? r.json() : { session: null }))
      .then((d) => setSession(d.session ?? null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, []);

  return { session, loading, setSession };
}
