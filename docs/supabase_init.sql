CREATE TABLE "access_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"empresa" text,
	"lookup_hash" text NOT NULL,
	"code_suffix" text NOT NULL,
	"allowed_instruments" jsonb NOT NULL,
	"max_uses" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" text,
	"created_by_id" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "access_codes_lookup_hash_unique" UNIQUE("lookup_hash")
);
--> statement-breakpoint
CREATE TABLE "access_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"access_code_id" text NOT NULL,
	"participant_nombre" text NOT NULL,
	"empresa" text,
	"puesto" text,
	"completed_instruments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ip_hash" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"instrumento" text NOT NULL,
	"estado" text DEFAULT 'calificada' NOT NULL,
	"participant_id" text,
	"participant_nombre" text NOT NULL,
	"job_profile_id" text,
	"puesto" text,
	"empresa" text,
	"respuestas" jsonb NOT NULL,
	"calificacion" jsonb,
	"interpretacion" text,
	"notas_psicologo" text,
	"aprobada" boolean DEFAULT false NOT NULL,
	"validity_flags" jsonb,
	"created_by_id" text,
	"approved_by_id" text,
	"access_code_id" text,
	"access_redemption_id" text,
	"iniciada" text NOT NULL,
	"actualizada" text NOT NULL,
	"terminada" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"detail" jsonb,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"description" text,
	"min_presence_percent" integer DEFAULT 80 NOT NULL,
	"min_aprovechamiento_percent" integer DEFAULT 70 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" text,
	"active" boolean DEFAULT true NOT NULL,
	"grant_on_course_complete" boolean DEFAULT false NOT NULL,
	"source_enrollment_id" text,
	"created_at" text NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "course_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "course_certificates" (
	"id" text PRIMARY KEY NOT NULL,
	"expediente_id" text,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"folio" text NOT NULL,
	"verification_code" text NOT NULL,
	"dictamen_json" jsonb,
	"issued_at" text NOT NULL,
	"revoked_at" text,
	CONSTRAINT "course_certificates_folio_unique" UNIQUE("folio"),
	CONSTRAINT "course_certificates_verification_code_unique" UNIQUE("verification_code")
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"enrolled_at" text,
	"completed_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "course_enrollments_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'video' NOT NULL,
	"content_markdown" text,
	"video_url" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"free_preview" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_quizzes" (
	"id" text PRIMARY KEY NOT NULL,
	"lesson_id" text NOT NULL,
	"pass_score" integer DEFAULT 70 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "course_quizzes_lesson_id_unique" UNIQUE("lesson_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"subtitle" text,
	"category_id" text NOT NULL,
	"price_mxn" integer DEFAULT 0 NOT NULL,
	"stripe_price_id" text,
	"thumbnail_url" text,
	"instructor_name" text DEFAULT 'Instructor' NOT NULL,
	"instructor_bio" text,
	"instructor_id" text,
	"level" text DEFAULT 'basico' NOT NULL,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"inventory_limit" integer,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"require_quiz_pass" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" text NOT NULL,
	"verified_at" text,
	"created_at" text NOT NULL,
	CONSTRAINT "email_verifications_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "expediente_evaluations" (
	"id" text PRIMARY KEY NOT NULL,
	"expediente_id" text NOT NULL,
	"type" text NOT NULL,
	"answers_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer,
	"submitted_at" text NOT NULL,
	"reviewed_by" text
);
--> statement-breakpoint
CREATE TABLE "job_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"empresa" text,
	"mabe_puesto" jsonb,
	"cleaver_puesto" jsonb,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_acknowledgements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_id" text NOT NULL,
	"acknowledged_at" text NOT NULL,
	"ip_hash" text
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"last_position_seconds" integer DEFAULT 0 NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"permanence_percent" integer DEFAULT 0 NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_breakout_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"breakout_room_id" text NOT NULL,
	"user_id" text NOT NULL,
	"assigned_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_breakout_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"live_class_id" text NOT NULL,
	"name" text NOT NULL,
	"room_slug" text NOT NULL,
	"room_url" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_class_attendances" (
	"id" text PRIMARY KEY NOT NULL,
	"live_class_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" text NOT NULL,
	"left_at" text,
	"duration_seconds" integer,
	"connected_seconds" integer DEFAULT 0 NOT NULL,
	"presence_percent" integer DEFAULT 0 NOT NULL,
	"last_heartbeat_at" text
);
--> statement-breakpoint
CREATE TABLE "live_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"title" text NOT NULL,
	"scheduled_at" text NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"provider" text DEFAULT 'none' NOT NULL,
	"room_url" text,
	"daily_room_url" text,
	"recording_url" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_icebreaker_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"live_class_id" text NOT NULL,
	"type" text NOT NULL,
	"prompt" text NOT NULL,
	"state_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" text,
	"created_at" text NOT NULL,
	"closed_at" text
);
--> statement-breakpoint
CREATE TABLE "live_whiteboard_docs" (
	"id" text PRIMARY KEY NOT NULL,
	"live_class_id" text NOT NULL,
	"breakout_room_id" text,
	"document_json" jsonb,
	"updated_by" text,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_whiteboard_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"live_class_id" text NOT NULL,
	"breakout_room_id" text,
	"label" text DEFAULT 'Captura' NOT NULL,
	"image_data" text NOT NULL,
	"created_by" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"course_id" text NOT NULL,
	"price" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"total" integer NOT NULL,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"stripe_payment_intent_id" text,
	"coupon_id" text,
	"created_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"edad" text,
	"sexo" text,
	"estado_civil" text,
	"estudios" text,
	"ocupacion" text,
	"empresa" text,
	"notas" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_evidences" (
	"id" text PRIMARY KEY NOT NULL,
	"expediente_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"evidence_type" text DEFAULT 'documento' NOT NULL,
	"file_url" text,
	"meta_json" jsonb,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"passed" boolean DEFAULT false NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_id" text NOT NULL,
	"prompt" text NOT NULL,
	"type" text DEFAULT 'single' NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"explanation" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_expedientes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"program_id" text NOT NULL,
	"enrollment_id" text,
	"status" text DEFAULT 'abierto' NOT NULL,
	"aprovechamiento_percent" integer DEFAULT 0 NOT NULL,
	"presence_percent_avg" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nombre" text NOT NULL,
	"password_hash" text NOT NULL,
	"rol" text DEFAULT 'psicologo' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vod_events" (
	"id" text PRIMARY KEY NOT NULL,
	"enrollment_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"event_type" text NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_redemptions" ADD CONSTRAINT "access_redemptions_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_job_profile_id_job_profiles_id_fk" FOREIGN KEY ("job_profile_id") REFERENCES "public"."job_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_access_redemption_id_access_redemptions_id_fk" FOREIGN KEY ("access_redemption_id") REFERENCES "public"."access_redemptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_programs" ADD CONSTRAINT "certification_programs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_expediente_id_student_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."student_expedientes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_quizzes" ADD CONSTRAINT "course_quizzes_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_evaluations" ADD CONSTRAINT "expediente_evaluations_expediente_id_student_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."student_expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expediente_evaluations" ADD CONSTRAINT "expediente_evaluations_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acknowledgements" ADD CONSTRAINT "legal_acknowledgements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acknowledgements" ADD CONSTRAINT "legal_acknowledgements_document_id_legal_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."legal_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_breakout_assignments" ADD CONSTRAINT "live_breakout_assignments_breakout_room_id_live_breakout_rooms_id_fk" FOREIGN KEY ("breakout_room_id") REFERENCES "public"."live_breakout_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_breakout_assignments" ADD CONSTRAINT "live_breakout_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_breakout_rooms" ADD CONSTRAINT "live_breakout_rooms_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class_attendances" ADD CONSTRAINT "live_class_attendances_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class_attendances" ADD CONSTRAINT "live_class_attendances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_icebreaker_sessions" ADD CONSTRAINT "live_icebreaker_sessions_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_icebreaker_sessions" ADD CONSTRAINT "live_icebreaker_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_docs" ADD CONSTRAINT "live_whiteboard_docs_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_docs" ADD CONSTRAINT "live_whiteboard_docs_breakout_room_id_live_breakout_rooms_id_fk" FOREIGN KEY ("breakout_room_id") REFERENCES "public"."live_breakout_rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_docs" ADD CONSTRAINT "live_whiteboard_docs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_snapshots" ADD CONSTRAINT "live_whiteboard_snapshots_live_class_id_live_classes_id_fk" FOREIGN KEY ("live_class_id") REFERENCES "public"."live_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_snapshots" ADD CONSTRAINT "live_whiteboard_snapshots_breakout_room_id_live_breakout_rooms_id_fk" FOREIGN KEY ("breakout_room_id") REFERENCES "public"."live_breakout_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_whiteboard_snapshots" ADD CONSTRAINT "live_whiteboard_snapshots_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_evidences" ADD CONSTRAINT "portfolio_evidences_expediente_id_student_expedientes_id_fk" FOREIGN KEY ("expediente_id") REFERENCES "public"."student_expedientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_course_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."course_quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_expedientes" ADD CONSTRAINT "student_expedientes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_expedientes" ADD CONSTRAINT "student_expedientes_program_id_certification_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."certification_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_expedientes" ADD CONSTRAINT "student_expedientes_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vod_events" ADD CONSTRAINT "vod_events_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vod_events" ADD CONSTRAINT "vod_events_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE cascade ON UPDATE no action;