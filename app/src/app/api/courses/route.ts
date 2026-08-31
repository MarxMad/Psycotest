import { NextResponse } from "next/server";
import { getDb } from "@/db/index";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = db.select().from(courses);

    if (status && (status === "draft" || status === "published" || status === "archived")) {
      query = query.where(eq(courses.status, status));
    }

    const allCourses = await query;

    return NextResponse.json({ courses: allCourses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Error al cargar cursos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, description, price, inventoryLimit } = body;

    const now = new Date().toISOString();
    const courseId = `course_${Date.now()}`;

    await db.insert(courses).values({
      id: courseId,
      title,
      slug,
      description: description || null,
      price,
      thumbnailUrl: null,
      instructorId: null,
      status: "draft",
      inventoryLimit: inventoryLimit || null,
      soldCount: 0,
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
