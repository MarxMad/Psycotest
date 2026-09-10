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

// Categorías de cursos (CONOCER / consultorio)
export const courseCategories = sqliteTable("course_categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Cursos
export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  /** En Turso de producción es NOT NULL (sin default). */
  description: text("description").notNull().default(""),
  subtitle: text("subtitle"),
  /** En Turso de producción es NOT NULL. */
  categoryId: text("category_id")
    .notNull()
    .references(() => courseCategories.id),
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
  /** Compat con LMS quizzes: no desbloquear siguiente lección sin aprobar quiz */
  requireQuizPass: integer("require_quiz_pass", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Módulos de curso
export const courseModules = sqliteTable("course_modules", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Lecciones (nombre principal del consultorio CONOCER)
export const courseLessons = sqliteTable("course_lessons", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => courseModules.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["video", "quiz", "live_replay", "reading"] })
    .notNull()
    .default("video"),
  contentMarkdown: text("content_markdown"),
  videoUrl: text("video_url"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  freePreview: integer("free_preview", { mode: "boolean" }).notNull().default(false),
});

/** Alias para APIs del panel admin */
export const lessons = courseLessons;

// Inscripciones a cursos
export const courseEnrollments = sqliteTable("course_enrollments", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  status: text("status", { enum: ["pending", "active", "refunded", "completed", "cancelled"] })
    .notNull()
    .default("pending"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  progressPercent: integer("progress_percent").notNull().default(0),
  enrolledAt: text("enrolled_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/** Alias para APIs del panel admin */
export const enrollments = courseEnrollments;

// Progreso por lección
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
  /** Segundos reales de reproducción (play/heartbeat VOD) */
  watchedSeconds: integer("watched_seconds").notNull().default(0),
  /** % de permanencia vs duración de la lección */
  permanencePercent: integer("permanence_percent").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
});

/** Eventos de permanencia VOD (play / pause / heartbeat / ended) */
export const vodEvents = sqliteTable("vod_events", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => courseEnrollments.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id")
    .notNull()
    .references(() => courseLessons.id, { onDelete: "cascade" }),
  eventType: text("event_type", {
    enum: ["play", "pause", "heartbeat", "seek", "ended"],
  }).notNull(),
  positionSeconds: integer("position_seconds").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

// Clases en vivo (provider-agnostic: jitsi | daily | none)
export const liveClasses = sqliteTable("live_classes", {
  id: text("id").primaryKey(),
  courseId: text("course_id").references(() => courses.id),
  title: text("title").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  provider: text("provider", { enum: ["jitsi", "daily", "none"] }).notNull().default("none"),
  roomUrl: text("room_url"),
  /** @deprecated Usar roomUrl; se mantiene por compatibilidad de lecturas antiguas */
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
  /** Segundos acumulados vía heartbeats (presencia real) */
  connectedSeconds: integer("connected_seconds").notNull().default(0),
  /** % de presencia vs duración programada de la clase */
  presencePercent: integer("presence_percent").notNull().default(0),
  lastHeartbeatAt: text("last_heartbeat_at"),
});

/** Salas de división (breakouts) dentro de una clase en vivo */
export const liveBreakoutRooms = sqliteTable("live_breakout_rooms", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id")
    .notNull()
    .references(() => liveClasses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  roomSlug: text("room_slug").notNull(),
  roomUrl: text("room_url").notNull(),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const liveBreakoutAssignments = sqliteTable("live_breakout_assignments", {
  id: text("id").primaryKey(),
  breakoutRoomId: text("breakout_room_id")
    .notNull()
    .references(() => liveBreakoutRooms.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  assignedAt: text("assigned_at").notNull(),
});

/** Documento colaborativo de pizarra (tldraw JSON) */
export const liveWhiteboardDocs = sqliteTable("live_whiteboard_docs", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id")
    .notNull()
    .references(() => liveClasses.id, { onDelete: "cascade" }),
  /** null = sala principal */
  breakoutRoomId: text("breakout_room_id").references(() => liveBreakoutRooms.id, {
    onDelete: "cascade",
  }),
  documentJson: text("document_json", { mode: "json" }).$type<Record<string, unknown>>(),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: text("updated_at").notNull(),
});

export const liveWhiteboardSnapshots = sqliteTable("live_whiteboard_snapshots", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id")
    .notNull()
    .references(() => liveClasses.id, { onDelete: "cascade" }),
  breakoutRoomId: text("breakout_room_id").references(() => liveBreakoutRooms.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull().default("Captura"),
  /** Data URL PNG o URL de storage */
  imageData: text("image_data").notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const liveIcebreakerSessions = sqliteTable("live_icebreaker_sessions", {
  id: text("id").primaryKey(),
  liveClassId: text("live_class_id")
    .notNull()
    .references(() => liveClasses.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["pregunta_rapida", "dos_verdades", "asociacion"],
  }).notNull(),
  prompt: text("prompt").notNull(),
  stateJson: text("state_json", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
  closedAt: text("closed_at"),
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
  /** Cupón auto-generado al completar 100% de un curso */
  grantOnCourseComplete: integer("grant_on_course_complete", { mode: "boolean" })
    .notNull()
    .default(false),
  sourceEnrollmentId: text("source_enrollment_id"),
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

// ——— CONOCER: quizzes ———
export const courseQuizzes = sqliteTable("course_quizzes", {
  id: text("id").primaryKey(),
  lessonId: text("lesson_id")
    .notNull()
    .unique()
    .references(() => courseLessons.id, { onDelete: "cascade" }),
  passScore: integer("pass_score").notNull().default(70),
  maxAttempts: integer("max_attempts").notNull().default(3),
  shuffleQuestions: integer("shuffle_questions", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const quizQuestions = sqliteTable("quiz_questions", {
  id: text("id").primaryKey(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => courseQuizzes.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  type: text("type", { enum: ["single", "multiple", "true_false"] }).notNull().default("single"),
  options: text("options", { mode: "json" })
    .$type<Array<{ key: string; label: string }>>()
    .notNull()
    .default([]),
  correctKeys: text("correct_keys", { mode: "json" }).$type<string[]>().notNull().default([]),
  explanation: text("explanation"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey(),
  enrollmentId: text("enrollment_id")
    .notNull()
    .references(() => courseEnrollments.id, { onDelete: "cascade" }),
  quizId: text("quiz_id")
    .notNull()
    .references(() => courseQuizzes.id, { onDelete: "cascade" }),
  answers: text("answers", { mode: "json" })
    .$type<Record<string, string[]>>()
    .notNull()
    .default({}),
  score: integer("score").notNull().default(0),
  passed: integer("passed", { mode: "boolean" }).notNull().default(false),
  attemptNumber: integer("attempt_number").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

// ——— CONOCER: expediente formal (tipo EC) ———
export const certificationPrograms = sqliteTable("certification_programs", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  version: text("version").notNull().default("1.0"),
  description: text("description"),
  minPresencePercent: integer("min_presence_percent").notNull().default(80),
  minAprovechamientoPercent: integer("min_aprovechamiento_percent").notNull().default(70),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const studentExpedientes = sqliteTable("student_expedientes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  programId: text("program_id")
    .notNull()
    .references(() => certificationPrograms.id),
  enrollmentId: text("enrollment_id").references(() => courseEnrollments.id),
  status: text("status", {
    enum: ["abierto", "en_revision", "aprobado", "rechazado", "cerrado"],
  })
    .notNull()
    .default("abierto"),
  aprovechamientoPercent: integer("aprovechamiento_percent").notNull().default(0),
  presencePercentAvg: integer("presence_percent_avg").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const expedienteEvaluations = sqliteTable("expediente_evaluations", {
  id: text("id").primaryKey(),
  expedienteId: text("expediente_id")
    .notNull()
    .references(() => studentExpedientes.id, { onDelete: "cascade" }),
  type: text("type", {
    enum: ["diagnostico", "inicial", "final", "satisfaccion", "clinica"],
  }).notNull(),
  answersJson: text("answers_json", { mode: "json" })
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  score: integer("score"),
  submittedAt: text("submitted_at").notNull(),
  reviewedBy: text("reviewed_by").references(() => users.id),
});

export const portfolioEvidences = sqliteTable("portfolio_evidences", {
  id: text("id").primaryKey(),
  expedienteId: text("expediente_id")
    .notNull()
    .references(() => studentExpedientes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  evidenceType: text("evidence_type", {
    enum: ["documento", "imagen", "enlace", "pizarra", "otro"],
  })
    .notNull()
    .default("documento"),
  fileUrl: text("file_url"),
  metaJson: text("meta_json", { mode: "json" }).$type<Record<string, unknown>>(),
  createdAt: text("created_at").notNull(),
});

export const courseCertificates = sqliteTable("course_certificates", {
  id: text("id").primaryKey(),
  expedienteId: text("expediente_id").references(() => studentExpedientes.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  folio: text("folio").notNull().unique(),
  verificationCode: text("verification_code").notNull().unique(),
  dictamenJson: text("dictamen_json", { mode: "json" }).$type<Record<string, unknown>>(),
  issuedAt: text("issued_at").notNull(),
  revokedAt: text("revoked_at"),
});

// ——— Fase C: documentos legales ———
export const legalDocuments = sqliteTable("legal_documents", {
  id: text("id").primaryKey(),
  type: text("type", {
    enum: ["finiquito", "liquidacion", "aviso_privacidad", "terminos", "otro"],
  }).notNull(),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull(),
  version: text("version").notNull().default("1.0"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const legalAcknowledgements = sqliteTable("legal_acknowledgements", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  documentId: text("document_id")
    .notNull()
    .references(() => legalDocuments.id),
  acknowledgedAt: text("acknowledged_at").notNull(),
  ipHash: text("ip_hash"),
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
export type StudentExpediente = typeof studentExpedientes.$inferSelect;
export type CourseCertificate = typeof courseCertificates.$inferSelect;
export type CertificationProgram = typeof certificationPrograms.$inferSelect;
