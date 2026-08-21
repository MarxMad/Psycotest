/** Enfoque comercial: qué se evalúa, sin nombrar el instrumento. */
export const COURSE_EVALUATION_FOCUS: Record<string, string> = {
  "course-intro-eval": "Diagnóstico organizacional integral",
  "course-papi": "Perfil conductual · estilo de trabajo",
  "course-hartman": "Valores · motivación · cultura",
  "course-mabe": "Ajuste candidato ↔ puesto",
};

export const DEFAULT_COURSE_THUMBNAIL = "/ige/banner.png";

export const COURSE_THUMBNAILS: Record<string, string> = {
  "course-intro-eval": "/ige/banner.png",
  "course-papi": "/ige/serv1.png",
  "course-hartman": "/ige/serv2.png",
  "course-mabe": "/ige/serv3.png",
};

export function courseThumbnail(courseId: string, thumbnailUrl: string | null) {
  return thumbnailUrl ?? COURSE_THUMBNAILS[courseId] ?? DEFAULT_COURSE_THUMBNAIL;
}

export function evaluationFocus(courseId: string) {
  return COURSE_EVALUATION_FOCUS[courseId] ?? "Competencias laborales";
}
