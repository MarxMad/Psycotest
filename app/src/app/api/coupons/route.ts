import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { coupons } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allCoupons = await db.select().from(coupons);

    return NextResponse.json({ coupons: allCoupons });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Error al cargar cupones" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, type, value, maxUses, expiresAt } = body;

    const now = new Date().toISOString();
    const couponId = `coupon_${Date.now()}`;

    await db.insert(coupons).values({
      id: couponId,
      code: code.toUpperCase(),
      type,
      value,
      maxUses: maxUses || null,
      currentUses: 0,
      expiresAt: expiresAt || null,
      active: true,
      createdAt: now,
    });

    const [coupon] = await db.select().from(coupons).where(eq(coupons.id, couponId));

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
