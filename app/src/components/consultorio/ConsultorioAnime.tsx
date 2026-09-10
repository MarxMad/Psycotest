"use client";

import { useEffect, useRef } from "react";
import { bindConsultorioAnime } from "@/lib/anime-consultorio";

/** Activa anime.js en el árbol del consultorio (data-anime / data-reveal). */
export function ConsultorioAnime({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return bindConsultorioAnime(root);
  }, []);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
