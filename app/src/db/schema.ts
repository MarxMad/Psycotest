import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  nombre: text("nombre").notNull(),
  passwordHash: text("password_hash").notNull(),
  rol: text("rol", { enum: ["admin", "psicologo", "aplicador"] }).notNull().default("psicologo"),
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

export type User = typeof users.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type AccessCode = typeof accessCodes.$inferSelect;
export type AccessRedemption = typeof accessRedemptions.$inferSelect;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
