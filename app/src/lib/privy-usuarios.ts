/**
 * Puente entre la identidad de Privy y la tabla `users`.
 *
 * Privy dice quién es la persona; la base dice qué puede hacer. La primera vez
 * que alguien entra por Privy se crea su fila con el rol que le corresponde
 * según ADMIN_EMAILS — no se inventa ningún usuario de prueba.
 */

import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { users } from "@/db/schema";
import type { AuthUser } from "@/lib/auth";
import { esAdminPorCorreo, type PrivyIdentidad } from "@/lib/privy";

/** Nombre inicial a partir del correo: "martin.hernandez@x.com" → "Martin Hernandez". */
function nombreDesdeCorreo(email: string): string {
  const local = email.split("@")[0] ?? email;
  return (
    local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || email
  );
}

/**
 * Devuelve el usuario de la base para una identidad de Privy, creándolo si es
 * su primera entrada. Si el correo está en ADMIN_EMAILS, el rol se eleva a
 * admin también en cuentas que ya existían.
 */
export async function usuarioDesdePrivy(identidad: PrivyIdentidad): Promise<AuthUser | null> {
  if (!identidad.email) return null;

  const db = getDb();
  const email = identidad.email.toLowerCase();
  const debeSerAdmin = esAdminPorCorreo(email);

  // ¿Ya existe por privyId?
  const [porPrivy] = await db
    .select()
    .from(users)
    .where(eq(users.privyId, identidad.privyId))
    .limit(1);

  if (porPrivy) {
    if (debeSerAdmin && porPrivy.rol !== "admin") {
      await db.update(users).set({ rol: "admin" }).where(eq(users.id, porPrivy.id));
      return { id: porPrivy.id, email: porPrivy.email, nombre: porPrivy.nombre, rol: "admin" };
    }
    return { id: porPrivy.id, email: porPrivy.email, nombre: porPrivy.nombre, rol: porPrivy.rol };
  }

  // ¿Existe por correo? (cuenta creada antes con contraseña) → se vincula.
  const [porCorreo] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (porCorreo) {
    const rol = debeSerAdmin ? "admin" : porCorreo.rol;
    await db
      .update(users)
      .set({ privyId: identidad.privyId, rol, emailVerified: true })
      .where(eq(users.id, porCorreo.id));
    return { id: porCorreo.id, email: porCorreo.email, nombre: porCorreo.nombre, rol };
  }

  // Primera entrada: se crea la cuenta.
  const nuevo = {
    id: `usr-${identidad.privyId.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`,
    email,
    nombre: nombreDesdeCorreo(email),
    // Sin contraseña local: esta cuenta solo entra por Privy.
    passwordHash: "",
    privyId: identidad.privyId,
    rol: (debeSerAdmin ? "admin" : "psicologo") as AuthUser["rol"],
    emailVerified: true,
    createdAt: new Date().toISOString(),
  };
  await db.insert(users).values(nuevo).onConflictDoNothing();

  return { id: nuevo.id, email: nuevo.email, nombre: nuevo.nombre, rol: nuevo.rol };
}
