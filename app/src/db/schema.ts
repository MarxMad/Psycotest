import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "psicologo", "aplicador", "alumno"] }).notNull().default("psicologo"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: text("created_at").notNull(),
});

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  edad: text("edad"),
  sexo: text("sexo"),
  estadoCivil: text("estado_civil"),
  estudios: text("estudios"),
  ocupacion: text("ocupacion"),
  empresa: text("empresa"),
  notas: text("notas"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const jobProfiles = sqliteTable("job_profiles", {
  id: text("id").primaryKey(),
  titulo: text("titulo").notNull(),
  empresa: text("empresa"),
  /** Respuestas MABE del bloque puesto (proc + valores) */
  mabePuesto: text("mabe_puesto", { mode: "json" }).$type<Record<string, number>>(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const accessCodes = sqliteTable("access_codes", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  empresa: text("empresa"),
  /** SHA-256 con pepper — búsqueda sin almacenar el código en claro */
  lookupHash: text("lookup_hash").notNull().unique(),
  /** Últimos 4 caracteres para identificación en panel (no secretos) */
  codeSuffix: text("code_suffix").notNull(),
  allowedInstruments: text("allowed_instruments", { mode: "json" })
    .$type<Array<"papi" | "hartman" | "mabe">>()
    .notNull(),
  maxUses: integer("max_uses").notNull(),
  usedCount: integer("used_count").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  expiresAt: text("expires_at"),
  createdById: text("created_by_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const accessRedemptions = sqliteTable("access_redemptions", {
  id: text("id").primaryKey(),
  accessCodeId: text("access_code_id")
    .notNull()
    .references(() => accessCodes.id),
  participantNombre: text("participant_nombre").notNull(),
  empresa: text("empresa"),
  puesto: text("puesto"),
  /** Instrumentos ya completados por esta persona */
  completedInstruments: text("completed_instruments", { mode: "json" })
    .$type<Array<"papi" | "hartman" | "mabe">>()
    .notNull()
    .default([]),
  ipHash: text("ip_hash"),
  createdAt: text("created_at").notNull(),
});

export const assessmentSessions = sqliteTable("assessment_sessions", {
  id: text("id").primaryKey(),
  instrumento: text("instrumento", { enum: ["papi", "hartman", "mabe"] }).notNull(),
  estado: text("estado", { enum: ["borrador", "calificada", "aprobada"] }).notNull().default("calificada"),
  participantId: text("participant_id").references(() => participants.id),
  participantNombre: text("participant_nombre").notNull(),
  jobProfileId: text("job_profile_id").references(() => jobProfiles.id),
  puesto: text("puesto"),
  empresa: text("empresa"),
  respuestas: text("respuestas", { mode: "json" }).notNull(),
  calificacion: text("calificacion", { mode: "json" }),
  interpretacion: text("interpretacion"),
  notasPsicologo: text("notas_psicologo"),
  aprobada: integer("aprobada", { mode: "boolean" }).notNull().default(false),
  validityFlags: text("validity_flags", { mode: "json" }).$type<string[]>(),
  createdById: text("created_by_id").references(() => users.id),
  approvedById: text("approved_by_id").references(() => users.id),
  accessCodeId: text("access_code_id").references(() => accessCodes.id),
  accessRedemptionId: text("access_redemption_id").references(() => accessRedemptions.id),
  iniciada: text("iniciada").notNull(),
  actualizada: text("actualizada").notNull(),
  terminada: integer("terminada", { mode: "boolean" }).notNull().default(true),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  detail: text("detail", { mode: "json" }),
  createdAt: text("created_at").notNull(),
});

export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  instructorName: text("instructor_name").notNull(),
  instructorBio: text("instructor_bio"),
  priceMxn: integer("price_mxn").notNull().default(0),
  /** Price ID en Stripe (mode: payment) */
  stripePriceId: text("stripe_price_id"),
  level: text("level", { enum: ["basico", "intermedio", "avanzado"] }).notNull().default("basico"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const courseModules = sqliteTable("course_modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courseLessons = sqliteTable("course_lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => courseModules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  freePreview: integer("free_preview", { mode: "boolean" }).notNull().default(false),
});

export const courseEnrollments = sqliteTable("course_enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  status: text("status", { enum: ["pending", "active", "refunded"] }).notNull().default("pending"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  progressPercent: integer("progress_percent").notNull().default(0),
  enrolledAt: text("enrolled_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => courseEnrollments.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => courseLessons.id, { onDelete: "cascade" }),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  lastPositionSeconds: integer("last_position_seconds").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export const stripeWebhookEvents = sqliteTable("stripe_webhook_events", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  type: text("type").notNull(),
  createdAt: text("created_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type AccessCode = typeof accessCodes.$inferSelect;
export type AccessRedemption = typeof accessRedemptions.$inferSelect;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseCategory = typeof courseCategories.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
