-- ================================================================== --
-- Migración — noviembre 2026: campañas de correo y bajas
--
--   1. email_campaigns — promociones enviadas desde Panel → Marketing.
--   2. email_bajas     — quién pidió no recibir promociones (por marca).
--
-- Es idempotente: se puede ejecutar varias veces sin romper nada.
-- Pégalo en Supabase → SQL Editor → Run (o `npm run db:push`).
-- ================================================================== --

CREATE TABLE IF NOT EXISTS email_campaigns (
  id             text PRIMARY KEY,
  marca          text    NOT NULL,
  audiencia      text    NOT NULL,
  asunto         text    NOT NULL,
  titulo         text    NOT NULL,
  cuerpo         text    NOT NULL,
  boton_texto    text,
  boton_url      text,
  cupon_codigo   text,
  estado         text    NOT NULL,
  destinatarios  integer NOT NULL DEFAULT 0,
  enviados       integer NOT NULL DEFAULT 0,
  fallidos       integer NOT NULL DEFAULT 0,
  creado_por     text REFERENCES users(id),
  created_at     text    NOT NULL,
  enviada_at     text
);

CREATE TABLE IF NOT EXISTS email_bajas (
  id          text PRIMARY KEY,
  email       text NOT NULL,
  marca       text NOT NULL,
  created_at  text NOT NULL
);

CREATE INDEX IF NOT EXISTS email_bajas_email_idx ON email_bajas (email);

-- Supabase expone las tablas por su API pública: se cierran como las demás.
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_bajas     ENABLE ROW LEVEL SECURITY;
