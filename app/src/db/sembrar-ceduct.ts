/**
 * Siembra la oferta de CEDUCT en la base: los sectores, las certificaciones
 * por estándar y los diplomados.
 *
 *   npm run ceduct:sembrar
 *
 * Es idempotente. Refresca texto, categoría y orden, pero no toca el precio:
 * eso se decide en /admin/cursos. Cualquier otro curso publicado del canal
 * que no esté en `oferta.ts` queda archivado —no se borra, por si tiene
 * pedidos o inscripciones colgando.
 */
import { config } from "dotenv";
import { and, eq, inArray, notInArray } from "drizzle-orm";
import { CATEGORIAS_CEDUCT, PROGRAMAS_CEDUCT } from "@/lib/ceduct/oferta";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { getDb } = await import("./index");
  const { courseCategories, courses } = await import("./schema");

  const db = getDb();
  const ahora = new Date().toISOString();

  for (const cat of CATEGORIAS_CEDUCT) {
    const valores = {
      slug: cat.slug,
      name: cat.nombre,
      description: cat.descripcion,
      sortOrder: cat.orden,
      channelId: "ceduct",
    };
    await db
      .insert(courseCategories)
      .values({ id: cat.id, ...valores })
      .onConflictDoUpdate({ target: courseCategories.id, set: valores });
  }
  console.log(`categorías: ${CATEGORIAS_CEDUCT.length}`);

  for (const p of PROGRAMAS_CEDUCT) {
    const categoria = CATEGORIAS_CEDUCT.find((c) => c.slug === p.categoria);
    if (!categoria) throw new Error(`${p.slug} apunta a una categoría que no existe.`);

    // Los diplomados van primero en el orden global; luego cada sector.
    const orden = categoria.orden * 100 + p.orden;
    const valores = {
      title: p.titulo,
      slug: p.slug,
      subtitle: p.resumen,
      description: p.descripcion,
      categoryId: categoria.id,
      level: p.nivel,
      modalidad: p.modalidad,
      estandarClave: p.estandarClave,
      durationMinutes: p.horas * 60,
      sortOrder: orden,
      updatedAt: ahora,
    };

    await db
      .insert(courses)
      .values({
        id: p.id,
        ...valores,
        priceMxn: 0,
        instructorName: "CEDUCT A.C.",
        published: true,
        status: "published",
        createdAt: ahora,
      })
      .onConflictDoUpdate({ target: courses.id, set: valores });
  }
  console.log(`programas: ${PROGRAMAS_CEDUCT.length}`);

  const delCanal = db
    .select({ id: courseCategories.id })
    .from(courseCategories)
    .where(eq(courseCategories.channelId, "ceduct"));

  const archivados = await db
    .update(courses)
    .set({ status: "archived", published: false, updatedAt: ahora })
    .where(
      and(
        inArray(courses.categoryId, delCanal),
        notInArray(
          courses.id,
          PROGRAMAS_CEDUCT.map((p) => p.id),
        ),
        eq(courses.status, "published"),
      ),
    )
    .returning({ slug: courses.slug });
  for (const a of archivados) console.log(`  archivado: ${a.slug}`);

  console.log("Listo. Ponles precio en /admin/cursos cuando quieras cobrarlos con tarjeta.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
