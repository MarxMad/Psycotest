"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./mk.module.css";

/**
 * Imagen con placeholder animado mientras carga y respaldo si falla.
 *
 * `respaldo` (normalmente una <Portada/> generada) se pinta debajo: si la
 * foto no existe o tarda, el usuario ve la ilustración en lugar de un hueco.
 */
export function Imagen({
  src,
  alt,
  className,
  respaldo,
  prioridad = false,
  sizes,
}: {
  src: string | null;
  alt: string;
  className?: string;
  respaldo?: ReactNode;
  prioridad?: boolean;
  sizes?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [estado, setEstado] = useState<"cargando" | "lista" | "error">(src ? "cargando" : "error");

  // Si la imagen ya estaba en caché, `onLoad` pudo dispararse antes de hidratar.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth > 0) setEstado("lista");
  }, []);

  return (
    <div
      className={`${s.media} ${className ?? ""}`}
      data-cargada={estado === "lista" ? "true" : estado === "cargando" ? "false" : "error"}
    >
      {respaldo}
      {src && estado !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          sizes={sizes}
          loading={prioridad ? "eager" : "lazy"}
          fetchPriority={prioridad ? "high" : "auto"}
          decoding="async"
          onLoad={() => setEstado("lista")}
          onError={() => setEstado("error")}
        />
      )}
    </div>
  );
}
