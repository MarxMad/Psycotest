import { getReadyDb, schema } from "./index";

async function main() {
  const db = await getReadyDb();
  const users = await db.select().from(schema.users).limit(5);
  console.log(
    "users",
    users.map((u) => ({ id: u.id, email: u.email, rol: u.rol })),
  );
  const sessions = await db.select().from(schema.assessmentSessions).limit(3);
  console.log("assessment_sessions", sessions.length);
  console.log("OK postgres/supabase path ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
