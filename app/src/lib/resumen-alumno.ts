/**
 * Lo que una persona tiene contratado, para el inicio de «Mi cuenta».
 *
 * Una sola cuenta (un correo) puede tener cosas en las tres marcas. Cada
 * dominio enseña lo suyo y avisa, aparte, de lo que hay en las otras.
 */

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  accessCodes,
  assessmentSessions,
  courseCategories,
  courseCertificates,
  courseEnrollments,
  courseLessons,
  courseModules,
  courses,
  lessonProgress,
  studentExpedientes,
} from "@/db/schema";
import type { ChannelId } from "./channels";
import { contenidoPorCanal, type PertenenciaCanal } from "./canal-del-alumno";

export type CursoDelAlumno = {
  id: string;
  slug: string;
  titulo: string;
  canal: ChannelId;
  hechas: number;
  total: number;
  porcentaje: number;
};

export type ResumenAlumno = {
  conteo: PertenenciaCanal;
  cursos: CursoDelAlumno[];
  evaluaciones: {
    /** Códigos comprados o asignados a esta persona */
    codigos: number;
    /** Aplicaciones disponibles en total y las ya usadas */
    capacidad: number;
    usadas: number;
    /** Pruebas terminadas por sus candidatos (o por ella misma) */
    terminadas: number;
  };
  expedientes: { total: number; aprobados: number };
  constancias: number;
};

async function cursosDe(userId: string): Promise<CursoDelAlumno[]> {
  const db = getDb();
  const inscritos = await db
    .select({
      inscripcionId: courseEnrollments.id,
      id: courses.id,
      slug: courses.slug,
      titulo: courses.title,
      canal: courseCategories.channelId,
    })
    .from(courseEnrollments)
    .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
    .leftJoin(courseCategories, eq(courses.categoryId, courseCategories.id))
    .where(and(eq(courseEnrollments.userId, userId), eq(courseEnrollments.status, "active")));

  return Promise.all(
    inscritos.map(async (c) => {
      const [fila] = await db
        .select({
          total: sql<number>`count(distinct ${courseLessons.id})`,
          hechas: sql<number>`count(distinct ${lessonProgress.lessonId})`,
        })
        .from(courseModules)
        .leftJoin(courseLessons, eq(courseLessons.moduleId, courseModules.id))
        .leftJoin(
          lessonProgress,
          sql`${lessonProgress.lessonId} = ${courseLessons.id}
              and ${lessonProgress.enrollmentId} = ${c.inscripcionId}
              and ${lessonProgress.completed} = true`,
        )
        .where(eq(courseModules.courseId, c.id));
      const total = Number(fila?.total ?? 0);
      const hechas = Number(fila?.hechas ?? 0);
      return {
        id: c.id,
        slug: c.slug,
        titulo: c.titulo,
        // Mismo criterio que contenidoPorCanal: sin escuela, el curso es de IGE.
        canal: (c.canal ?? "ige") as ChannelId,
        hechas,
        total,
        porcentaje: total > 0 ? (hechas / total) * 100 : 0,
      };
    }),
  );
}

async function evaluacionesDe(userId: string): Promise<ResumenAlumno["evaluaciones"]> {
  const db = getDb();
  const codigos = await db
    .select({ id: accessCodes.id, max: accessCodes.maxUses, usados: accessCodes.usedCount })
    .from(accessCodes)
    .where(and(eq(accessCodes.clienteUserId, userId), eq(accessCodes.active, true)));

  if (codigos.length === 0) return { codigos: 0, capacidad: 0, usadas: 0, terminadas: 0 };

  const [fila] = await db
    .select({ total: sql<number>`count(*)` })
    .from(assessmentSessions)
    .where(
      and(
        inArray(
          assessmentSessions.accessCodeId,
          codigos.map((c) => c.id),
        ),
        eq(assessmentSessions.terminada, true),
      ),
    );

  return {
    codigos: codigos.length,
    capacidad: codigos.reduce((n, c) => n + c.max, 0),
    usadas: codigos.reduce((n, c) => n + c.usados, 0),
    terminadas: Number(fila?.total ?? 0),
  };
}

export async function resumenDelAlumno(userId: string): Promise<ResumenAlumno> {
  const db = getDb();
  const [conteo, cursos, evaluaciones, expedientes, constancias] = await Promise.all([
    contenidoPorCanal(userId),
    cursosDe(userId),
    evaluacionesDe(userId),
    db
      .select({ estado: studentExpedientes.status })
      .from(studentExpedientes)
      .where(eq(studentExpedientes.userId, userId)),
    db
      .select({ total: sql<number>`count(*)` })
      .from(courseCertificates)
      .where(and(eq(courseCertificates.userId, userId), isNull(courseCertificates.revokedAt))),
  ]);

  return {
    conteo,
    cursos,
    evaluaciones,
    expedientes: {
      total: expedientes.length,
      aprobados: expedientes.filter((e) => e.estado === "aprobado").length,
    },
    constancias: Number(constancias[0]?.total ?? 0),
  };
}
