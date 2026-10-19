/**
 * Siembra la academia de Ingeniería de Grupos Efectivos en la base.
 *
 *   npm run ige:sembrar
 *
 * Es idempotente: vuelve a correrse sin duplicar nada. Refresca el texto, la
 * foto y el orden del catálogo, pero no toca el precio ni si el curso está
 * publicado — eso se decide en /admin/cursos y una semilla no tiene por qué
 * pisarlo.
 */
import { config } from "dotenv";
import { CATEGORIAS_IGE, CURSOS_IGE, categoriaDe, minutosDe, modalidadDe } from "@/lib/academia-ige";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { getDb } = await import("./index");
  const { courseCategories, courses } = await import("./schema");

  const db = getDb();
  const ahora = new Date().toISOString();

  for (const cat of CATEGORIAS_IGE) {
    await db
      .insert(courseCategories)
      .values({
        id: cat.id,
        slug: cat.slug,
        name: cat.nombre,
        description: cat.descripcion,
        sortOrder: cat.orden,
        channelId: "ige",
      })
      .onConflictDoUpdate({
        target: courseCategories.id,
        set: {
          slug: cat.slug,
          name: cat.nombre,
          description: cat.descripcion,
          sortOrder: cat.orden,
          channelId: "ige",
        },
      });
  }
  console.log(`categorías: ${CATEGORIAS_IGE.length}`);

  let n = 0;
  for (const curso of CURSOS_IGE) {
    const cat = categoriaDe(curso.categoria);
    if (!cat) throw new Error(`El curso ${curso.slug} apunta a una categoría que no existe.`);

    // El orden global respeta primero el bloque y luego el curso dentro de él.
    const orden = cat.orden * 100 + curso.orden;

    await db
      .insert(courses)
      .values({
        id: curso.id,
        title: curso.titulo,
        slug: curso.slug,
        subtitle: curso.resumen,
        description: curso.descripcion,
        categoryId: cat.id,
        priceMxn: 0,
        thumbnailUrl: curso.imagen,
        instructorName: "Ingeniería de Grupos Efectivos",
        level: curso.nivel,
        modalidad: modalidadDe(cat.formato),
        durationMinutes: minutosDe(curso),
        published: true,
        status: "published",
        sortOrder: orden,
        createdAt: ahora,
        updatedAt: ahora,
      })
      .onConflictDoUpdate({
        target: courses.id,
        set: {
          title: curso.titulo,
          slug: curso.slug,
          subtitle: curso.resumen,
          description: curso.descripcion,
          categoryId: cat.id,
          thumbnailUrl: curso.imagen,
          level: curso.nivel,
          modalidad: modalidadDe(cat.formato),
          durationMinutes: minutosDe(curso),
          sortOrder: orden,
          updatedAt: ahora,
        },
      });
    n += 1;
  }

  console.log(`cursos: ${n}`);
  console.log("Listo. Ponles precio en /admin/cursos cuando quieras cobrarlos con tarjeta.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
