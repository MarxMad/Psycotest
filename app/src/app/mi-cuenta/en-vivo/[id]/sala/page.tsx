"use client";

import { useParams } from "next/navigation";
import { SalaEnVivo } from "@/components/live/sala/SalaEnVivo";

/** Sala de la clase para el alumno inscrito. Toma la marca de su canal. */
export default function AlumnoSalaPage() {
  const { id } = useParams<{ id: string }>();
  return <SalaEnVivo liveClassId={id} salida="/mi-cuenta/en-vivo" />;
}
