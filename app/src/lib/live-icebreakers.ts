import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { liveIcebreakerSessions } from "@/db/schema";

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const PROMPTS: Record<string, string[]> = {
  pregunta_rapida: [
    "Si pudieras resolver un solo reto laboral hoy, ¿cuál sería?",
    "¿Qué hábito profesional te gustaría reforzar este mes?",
    "Comparte una herramienta que te ahorre tiempo en el trabajo.",
    "¿Qué te motivó a tomar esta certificación?",
  ],
  dos_verdades: [
    "Escribe dos verdades y una mentira sobre tu trayectoria profesional. El grupo votará la mentira.",
  ],
  asociacion: [
    "Escribe la primera palabra que asocias con «competencia laboral».",
    "Escribe una palabra que represente el clima laboral ideal.",
  ],
};

export function pickPrompt(type: keyof typeof PROMPTS, custom?: string) {
  if (custom?.trim()) return custom.trim();
  const list = PROMPTS[type] || PROMPTS.pregunta_rapida;
  return list[Math.floor(Math.random() * list.length)];
}

export async function listIcebreakers(liveClassId: string) {
  const db = getDb();
  return db
    .select()
    .from(liveIcebreakerSessions)
    .where(eq(liveIcebreakerSessions.liveClassId, liveClassId));
}

export async function startIcebreaker(input: {
  liveClassId: string;
  type: "pregunta_rapida" | "dos_verdades" | "asociacion";
  prompt?: string;
  userId: string;
}) {
  const db = getDb();
  const now = new Date().toISOString();

  await db
    .update(liveIcebreakerSessions)
    .set({ status: "closed", closedAt: now })
    .where(
      and(
        eq(liveIcebreakerSessions.liveClassId, input.liveClassId),
        eq(liveIcebreakerSessions.status, "active"),
      ),
    );

  const sessionId = id("ice");
  const prompt = pickPrompt(input.type, input.prompt);
  await db.insert(liveIcebreakerSessions).values({
    id: sessionId,
    liveClassId: input.liveClassId,
    type: input.type,
    prompt,
    stateJson: { responses: [] },
    status: "active",
    createdBy: input.userId,
    createdAt: now,
  });

  const [row] = await db
    .select()
    .from(liveIcebreakerSessions)
    .where(eq(liveIcebreakerSessions.id, sessionId));
  return row;
}

export async function submitIcebreakerResponse(
  sessionId: string,
  userId: string,
  nombre: string,
  text: string,
  extra?: Record<string, unknown>,
) {
  const db = getDb();
  const [session] = await db
    .select()
    .from(liveIcebreakerSessions)
    .where(eq(liveIcebreakerSessions.id, sessionId));
  if (!session || session.status !== "active") return null;

  const state = (session.stateJson || { responses: [] }) as {
    responses: Array<Record<string, unknown>>;
  };
  const responses = Array.isArray(state.responses) ? [...state.responses] : [];
  const filtered = responses.filter((r) => r.userId !== userId);
  filtered.push({
    userId,
    nombre,
    text: text.slice(0, 500),
    at: new Date().toISOString(),
    ...extra,
  });

  await db
    .update(liveIcebreakerSessions)
    .set({ stateJson: { ...state, responses: filtered } })
    .where(eq(liveIcebreakerSessions.id, sessionId));

  const [updated] = await db
    .select()
    .from(liveIcebreakerSessions)
    .where(eq(liveIcebreakerSessions.id, sessionId));
  return updated;
}

export async function closeIcebreaker(sessionId: string) {
  const db = getDb();
  await db
    .update(liveIcebreakerSessions)
    .set({ status: "closed", closedAt: new Date().toISOString() })
    .where(eq(liveIcebreakerSessions.id, sessionId));
  const [row] = await db
    .select()
    .from(liveIcebreakerSessions)
    .where(eq(liveIcebreakerSessions.id, sessionId));
  return row;
}

export async function getActiveIcebreaker(liveClassId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(liveIcebreakerSessions)
    .where(
      and(
        eq(liveIcebreakerSessions.liveClassId, liveClassId),
        eq(liveIcebreakerSessions.status, "active"),
      ),
    )
    .limit(1);
  return row ?? null;
}
