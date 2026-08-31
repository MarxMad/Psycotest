import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()));

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Cupón no encontrado" }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, error: "Cupón inactivo" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "Cupón expirado" }, { status: 400 });
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { valid: false, error: "Cupón sin usos disponibles" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Error al validar cupón" }, { status: 500 });
  }
}
