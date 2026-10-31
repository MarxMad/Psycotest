import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { coupons, orders } from "@/db/schema";
import { logAudit, requireUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function staff() {
  try {
    return await requireUser(["admin", "psicologo"]);
  } catch {
    return null;
  }
}

/** Activa/desactiva un cupón o cambia su tope de usos y vigencia. El código y el valor no cambian. */
export async function PATCH(request: Request, { params }: Params) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as { active?: boolean; maxUses?: number | null; expiresAt?: string | null };

  const cambios: Partial<typeof coupons.$inferInsert> = {};
  if (typeof body.active === "boolean") cambios.active = body.active;
  if (body.maxUses !== undefined) {
    const tope = body.maxUses === null ? null : Math.round(Number(body.maxUses));
    if (tope !== null && (!Number.isFinite(tope) || tope < 1)) {
      return NextResponse.json({ error: "El tope de usos debe ser 1 o más" }, { status: 400 });
    }
    cambios.maxUses = tope;
  }
  if (body.expiresAt !== undefined) {
    if (body.expiresAt !== null && Number.isNaN(Date.parse(body.expiresAt))) {
      return NextResponse.json({ error: "Fecha de vencimiento inválida" }, { status: 400 });
    }
    cambios.expiresAt = body.expiresAt;
  }
  if (!Object.keys(cambios).length) {
    return NextResponse.json({ error: "Nada que cambiar" }, { status: 400 });
  }

  try {
    const db = getDb();
    const [cupon] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!cupon) return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });

    await db.update(coupons).set(cambios).where(eq(coupons.id, id));
    await logAudit(actor.id, "update", "coupon", id, cambios);
    const [actualizado] = await db.select().from(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ coupon: actualizado });
  } catch (error) {
    console.error("[api/coupons/:id] PATCH", error);
    return NextResponse.json({ error: "Error al actualizar el cupón" }, { status: 500 });
  }
}

/** Borra un cupón que nunca se usó. Uno con pedidos se desactiva, no se borra. */
export async function DELETE(_request: Request, { params }: Params) {
  const actor = await staff();
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  try {
    const db = getDb();
    const [cupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!cupon) return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });

    const [pedido] = await db.select({ id: orders.id }).from(orders).where(eq(orders.couponId, id)).limit(1);
    if (pedido || cupon.currentUses > 0) {
      return NextResponse.json(
        { error: "Este cupón ya se usó en pedidos: desactívalo en lugar de borrarlo." },
        { status: 409 },
      );
    }

    await db.delete(coupons).where(eq(coupons.id, id));
    await logAudit(actor.id, "delete", "coupon", id, { code: cupon.code });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/coupons/:id] DELETE", error);
    return NextResponse.json({ error: "Error al borrar el cupón" }, { status: 500 });
  }
}
