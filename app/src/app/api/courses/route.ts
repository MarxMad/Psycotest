import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getReadyDb } from "@/db/index";
import { courseCategories, courses } from "@/db/schema";

/** Turso exige category_id NOT NULL; usa la pedida, la primera existente o crea General. */
async function resolveCategoryId(
  db: Awaited<ReturnType<typeof getReadyDb>>,
  requested?: string | null,
): Promise<string> {
  if (requested) {
    const [found] = await db
      .select({ id: courseCategories.id })
      .from(courseCategories)
      .where(eq(courseCategories.id, requested))
      .limit(1);
    if (found) return found.id;
  }

  const [first] = await db
    .select({ id: courseCategories.id })
    .from(courseCategories)
    .orderBy(asc(courseCategories.sortOrder))
    .limit(1);
  if (first) return first.id;

  await db
    .insert(courseCategories)
    .values({
      id: "cat-general",
      slug: "general",
      name: "General",
      description: "Cursos generales",
      sortOrder: 0,
    })
    .onConflictDoNothing();

  return "cat-general";
}

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
    const { title, slug, description, price, inventoryLimit, categoryId } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Título y slug requeridos" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const courseId = `course_${Date.now()}`;
    const priceMxn = Number(price);
    if (!Number.isFinite(priceMxn) || priceMxn < 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }

    const resolvedCategoryId = await resolveCategoryId(db, categoryId);
    // En Turso description es NOT NULL (sin default).
    const resolvedDescription =
      typeof description === "string" && description.trim() ? description.trim() : "";

    await db.insert(courses).values({
      id: courseId,
      title,
      slug,
      description: resolvedDescription,
      subtitle: null,
      categoryId: resolvedCategoryId,
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
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 });
  }
}
