"use client";

import { useEffect, useRef } from "react";
import { bindRevelado } from "@/lib/anime-revelado";

/** Revela con anime.js los nodos data-anime / data-reveal del árbol. */
export function RevelarAlEntrar({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return bindRevelado(root);
  }, []);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
