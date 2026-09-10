import { redirect } from "next/navigation";

/** Portal único de miembros — evita un segundo login en /consultorio/ingreso. */
export default async function IngresoPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ? `?next=${encodeURIComponent(sp.next)}` : "";
  redirect(`/login${next}`);
}
