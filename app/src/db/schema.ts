import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "psicologo", "aplicador"] }).notNull().default("psicologo"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
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

// Cursos
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  subtitle: text("subtitle"),
  categoryId: text("category_id"),
  priceMxn: integer("price_mxn").notNull().default(0), // En centavos MXN
  stripePriceId: text("stripe_price_id"),
  thumbnailUrl: text("thumbnail_url"),
  instructorName: text("instructor_name").notNull().default("Instructor"),
  instructorBio: text("instructor_bio"),
  instructorId: text("instructor_id").references(() => users.id),
  level: text("level", { enum: ["basico", "intermedio", "avanzado"] }).notNull().default("basico"),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  inventoryLimit: integer("inventory_limit"), // null = ilimitado
  soldCount: integer("sold_count").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Módulos de curso
export const courseModules = sqliteTable("course_modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  createdAt: text("created_at").notNull(),
});

// Lecciones
export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => courseModules.id),
  title: text("title").notNull(),
  type: text("type", { enum: ["video", "text", "quiz", "file"] }).notNull(),
  contentUrl: text("content_url"),
  durationMinutes: integer("duration_minutes"),
  order: integer("order").notNull(),
  isFreePreview: integer("is_free_preview", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

// Inscripciones a cursos
export const enrollments = sqliteTable("enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  progressPercentage: integer("progress_percentage").notNull().default(0),
  enrolledAt: text("enrolled_at").notNull(),
  completedAt: text("completed_at"),
});

// Progreso por lección
export const lessonProgress = sqliteTable("lesson_progress", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => enrollments.id),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  watchedSeconds: integer("watched_seconds"),
  completedAt: text("completed_at"),
});

// Clases en vivo
export const liveClasses = sqliteTable("live_classes", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id),
  title: text("title").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  dailyRoomUrl: text("daily_room_url"),
  recordingUrl: text("recording_url"),
  status: text("status", { enum: ["scheduled", "live", "completed", "cancelled"] })
    .notNull()
    .default("scheduled"),
  createdAt: text("created_at").notNull(),
});

// Asistencia a clases en vivo
export const liveClassAttendances = sqliteTable("live_class_attendances", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id")
    .notNull()
    .references(() => liveClasses.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  joinedAt: text("joined_at").notNull(),
  leftAt: text("left_at"),
  durationSeconds: integer("duration_seconds"),
});

// Cupones
export const coupons = sqliteTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  type: text("type", { enum: ["percentage", "fixed"] }).notNull(),
  value: integer("value").notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: text("expires_at"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

// Órdenes de compra
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  total: integer("total").notNull(), // En centavos
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  status: text("status", { enum: ["pending", "completed", "cancelled", "refunded"] })
    .notNull()
    .default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  couponId: text("coupon_id").references(() => coupons.id),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

// Items de orden
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  price: integer("price").notNull(), // Precio al momento de compra
  createdAt: text("created_at").notNull(),
});

// Confirmación de emails
export const emailVerifications = sqliteTable("email_verifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull(),
});

// Tablas de cursos del consultorio (sistema CONOCER)
export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const courseLessons = lessons; // Alias para compatibilidad
export const courseEnrollments = enrollments; // Alias para compatibilidad

export const courseLessonProgress = sqliteTable("course_lesson_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => lessons.id, { onDelete: "cascade" }),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  lastPositionSeconds: integer("last_position_seconds").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

export type User = typeof users.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type AccessCode = typeof accessCodes.$inferSelect;
export type AccessRedemption = typeof accessRedemptions.$inferSelect;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseCategory = typeof courseCategories.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type CourseLesson = typeof courseLessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type LiveClass = typeof liveClasses.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Order = typeof orders.$inferSelect;
