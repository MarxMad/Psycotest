import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { operaElPanel } from "@/lib/auth-rutas";
import { AdminShell } from "./AdminShell";

// La sesión se revisa en cada petición; nada del panel se sirve desde caché.
export const dynamic = "force-dynamic";

/**
 * Segunda cerradura del panel, después del middleware. El middleware solo
 * puede leer el token; aquí el rol se consulta en la base, así que una cuenta
 * degradada o borrada deja de ver el panel en el acto.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!operaElPanel(user.rol)) redirect("/mi-cuenta");
  return <AdminShell>{children}</AdminShell>;
}
