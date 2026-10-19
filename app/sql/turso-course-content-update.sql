-- Actualiza textos de cursos (sin nombres PAPI/Hartman/MABE) en una BD que YA tiene datos.
-- Ejecutar en Turso SQL shell o: turso db shell <nombre-db> < sql/turso-course-content-update.sql
-- También corre solo al visitar la app (syncCourseMarketingContent en seed-courses.ts).

UPDATE course_categories
SET description = 'Protocolos, interpretación clínica y enfoque por competencias — sin exponer el instrumento al evaluado.'
WHERE id = 'cat-eval';

UPDATE courses SET
  slug = 'introduccion-evaluacion-organizacional',
  title = 'Introducción a la evaluación organizacional',
  subtitle = 'Diagnóstico, clasificación y primeros criterios',
  description = 'Aprende a diseñar evaluaciones organizacionales con rigor clínico: clasificación de empresas, escalas de diagnóstico e integración con evaluación en línea y certificación CONOCER.',
  instructor_bio = 'Psicólogo especializado en psicología organizacional y certificación de competencias.',
  thumbnail_url = '/ige/banner.png',
  sort_order = 1,
  updated_at = datetime('now')
WHERE id = 'course-intro-eval';

UPDATE courses SET
  slug = 'perfil-conductual-organizacional',
  title = 'Perfil conductual en el trabajo',
  subtitle = 'Estilo de relación, liderazgo y adaptación al puesto',
  description = 'Domina la aplicación, calificación e interpretación de perfiles conductuales en selección, desarrollo y certificación — enfocado en lo que la persona hace y cómo se relaciona en el trabajo.',
  instructor_bio = 'Experiencia en evaluación de personal para sector público e iniciativa privada.',
  thumbnail_url = '/ige/serv1.png',
  sort_order = 2,
  updated_at = datetime('now')
WHERE id = 'course-papi';

UPDATE courses SET
  slug = 'ajuste-candidato-puesto',
  title = 'Ajuste candidato–puesto de trabajo',
  subtitle = 'Brechas entre perfil del puesto y la persona',
  description = 'Califica el puesto, perfila al candidato y lee brechas de ajuste con criterio clínico — ideal para procesos de selección y certificación por competencias.',
  instructor_bio = 'Consultor en evaluación de personal y desarrollo organizacional.',
  thumbnail_url = '/ige/serv3.png',
  sort_order = 4,
  updated_at = datetime('now')
WHERE id = 'course-mabe';

-- Curso valores (nuevo): solo si no existe
INSERT OR IGNORE INTO courses (
  id, slug, category_id, title, subtitle, description, thumbnail_url,
  instructor_name, instructor_bio, price_mxn, stripe_price_id, level,
  duration_minutes, published, sort_order, created_at, updated_at
) VALUES (
  'course-hartman',
  'valores-motivacion-organizacional',
  'cat-eval',
  'Valores y motivación organizacional',
  'Alineación persona–cultura–puesto',
  'Interpreta sistemas de valores, motivación intrínseca y compatibilidad con la cultura organizacional.',
  '/ige/serv2.png',
  'Martín Hernández González',
  'Consultor en diagnóstico de clima, valores y desarrollo humano.',
  6200,
  NULL,
  'intermedio',
  210,
  1,
  3,
  datetime('now'),
  datetime('now')
);

INSERT OR IGNORE INTO course_modules (id, course_id, title, sort_order) VALUES
  ('mod-hartman-1', 'course-hartman', 'Sistema de valores', 1),
  ('mod-hartman-2', 'course-hartman', 'Motivación y cultura', 2);

INSERT OR IGNORE INTO course_lessons (
  id, module_id, slug, title, description, video_url, duration_seconds, sort_order, free_preview
) VALUES
  (
    'les-hartman-1', 'mod-hartman-1', 'mapa-valores', 'Mapa de valores personales',
    'Jerarquía de valores y lectura clínica.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    780, 1, 1
  ),
  (
    'les-hartman-2', 'mod-hartman-2', 'motivacion-cultura', 'Motivación y cultura organizacional',
    'Compatibilidad persona–organización.',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    840, 1, 0
  );

UPDATE course_modules SET title = 'Fundamentos' WHERE id = 'mod-intro-1';
UPDATE course_modules SET title = 'Aplicación práctica' WHERE id = 'mod-intro-2';
UPDATE course_modules SET title = 'Perfil conductual' WHERE id = 'mod-papi-1';
UPDATE course_modules SET title = 'Interpretación clínica' WHERE id = 'mod-papi-2';
UPDATE course_modules SET title = 'Puesto y candidato' WHERE id = 'mod-mabe-1';

UPDATE course_lessons SET title = 'Evaluación en línea integrada', slug = 'evaluacion-en-linea',
  description = 'Flujo confidencial para evaluados y panel del profesional.' WHERE id = 'les-intro-4';
UPDATE course_lessons SET title = 'Aplicación del perfil conductual', slug = 'aplicacion-perfil',
  description = 'Instrucciones, tiempos y validez del protocolo.' WHERE id = 'les-papi-1';
UPDATE course_lessons SET title = 'Lectura de dimensiones conductuales', slug = 'lectura-perfil',
  description = 'Interpretación clínica del perfil gráfico en contexto laboral.' WHERE id = 'les-papi-2';
UPDATE course_lessons SET title = 'Brechas de ajuste al puesto', slug = 'brechas-ajuste',
  description = 'Superposición de perfiles y criterio clínico.' WHERE id = 'les-mabe-1';
