"use client";

import { useParams } from "next/navigation";
import { SalaEnVivo } from "@/components/live/sala/SalaEnVivo";

/** Sala de la clase para quien la dirige (admin o profesor asignado). */
export default function AdminLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  return <SalaEnVivo liveClassId={id} salida={`/admin/clases-vivo/${id}`} />;
}
