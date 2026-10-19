import type { Config } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "[drizzle.config] DATABASE_URL no definida. Use Supabase URI o postgres local antes de db:push.",
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl ?? "postgresql://postgres:postgres@localhost:5432/sistemapsic",
  },
} satisfies Config;
