import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { inicioDelPanel, operaElPanel, puedeVerSeccion } from "@/lib/auth-rutas";
import { AdminShell } from "./AdminShell";

// La sesión se revisa en cada petición; nada del panel se sirve desde caché.
export const dynamic = "force-dynamic";

/**
 * Segunda cerradura del panel, después del middleware. El middleware solo
 * puede leer el token, cuyo rol puede tener hasta siete días; aquí el rol se
 * consulta en la base, así que una cuenta degradada o borrada deja de ver el
 * panel —o la sección que ya no le toca— en el acto.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!operaElPanel(user.rol)) redirect("/mi-cuenta");

  const ruta = (await headers()).get("x-ruta-panel") ?? "/admin";
  if (!puedeVerSeccion(user.rol, ruta)) redirect(inicioDelPanel(user.rol));

  return <AdminShell>{children}</AdminShell>;
}
