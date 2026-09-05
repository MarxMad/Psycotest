import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { courses } from "@/db/schema";

export async function GET(request: Request) {
  try {
    const db = await getReadyDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const allCourses =
      status && (status === "draft" || status === "published" || status === "archived")
        ? await db.select().from(courses).where(eq(courses.status, status))
        : await db.select().from(courses);

    return NextResponse.json({ courses: allCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Error al cargar cursos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getReadyDb();
    const body = await request.json();
    const { title, slug, description, price, inventoryLimit } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Título y slug requeridos" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const courseId = `course_${Date.now()}`;
    const priceMxn = Number(price);
    if (!Number.isFinite(priceMxn) || priceMxn < 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }

    await db.insert(courses).values({
      id: courseId,
      title,
      slug,
      description: description || null,
      subtitle: null,
      categoryId: null,
      priceMxn,
      stripePriceId: null,
      thumbnailUrl: null,
      instructorName: "Instructor",
      instructorBio: null,
      instructorId: null,
      level: "basico",
      durationMinutes: 0,
      published: false,
      status: "draft",
      inventoryLimit: inventoryLimit || null,
      soldCount: 0,
      sortOrder: 0,
      requireQuizPass: false,
      createdAt: now,
      updatedAt: now,
    });

    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    const parts: string[] = [];
    let cur: unknown = error;
    for (let i = 0; i < 4 && cur; i++) {
      if (cur instanceof Error) {
        parts.push(cur.message);
        cur = (cur as Error & { cause?: unknown }).cause;
      } else {
        parts.push(String(cur));
        break;
      }
    }
    return NextResponse.json(
      { error: "Error al crear curso", detail: parts.join(" | ") },
      { status: 500 },
    );
  }
}
