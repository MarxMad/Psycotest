import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const allCoupons = await db.select().from(coupons);

    return NextResponse.json({ coupons: allCoupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Error al cargar cupones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const db = getDb();
    const body = await request.json();
    const { type, maxUses, expiresAt } = body;
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    const value = Math.round(Number(body.value));

    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      return NextResponse.json(
        { error: "El código lleva de 3 a 32 letras, números, guiones o guiones bajos" },
        { status: 400 },
      );
    }
    if (type !== "percentage" && type !== "fixed") {
      return NextResponse.json({ error: "Tipo de cupón inválido" }, { status: 400 });
    }
    if (!Number.isFinite(value) || value < 1 || (type === "percentage" && value > 100)) {
      return NextResponse.json({ error: "Valor de descuento inválido" }, { status: 400 });
    }
    const [repetido] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
    if (repetido) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const couponId = `coupon_${Date.now()}`;

    await db.insert(coupons).values({
      id: couponId,
      code,
      type,
      value,
      maxUses: maxUses || null,
      currentUses: 0,
      expiresAt: expiresAt || null,
      active: true,
      grantOnCourseComplete: false,
      sourceEnrollmentId: null,
      createdAt: now,
    });

    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, couponId));

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
