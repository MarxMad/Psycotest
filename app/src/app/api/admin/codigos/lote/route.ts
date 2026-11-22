import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { logAudit, requireUser } from "@/lib/auth";
import { hashAccessCodeLookup, normalizeAccessCode } from "@/lib/access-codes";
import { codigosDeLote, nombresDe } from "@/lib/pagos-psicologia";
import { usuarioPorCorreo } from "@/lib/pagos";
import { DIGITALES, type PruebaDigital } from "@/lib/pruebas-catalogo";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_POR_PRUEBA_LOTE = 500;

/**
 * Banco de códigos: genera de una vez un código por cada aplicación de cada
 * prueba (p. ej. 40 de Personalidad y 25 de Valores). Si se indica el correo
 * de la empresa, los códigos quedan en su panel igual que si los hubiera
 * comprado en línea: ve cuántos le quedan, quién los usó y sus informes.
 */
export async function POST(request: Request) {
  let user;
  try {
    user = await requireUser(["admin", "psicologo"]);
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    empresa?: unknown;
    clienteEmail?: unknown;
    clienteNombre?: unknown;
    cantidades?: unknown;
    vigenciaDias?: unknown;
  };

  const empresa = typeof body.empresa === "string" ? body.empresa.trim().slice(0, 160) : "";
  const email = typeof body.clienteEmail === "string" ? body.clienteEmail.trim().toLowerCase().slice(0, 200) : "";
  const nombre = typeof body.clienteNombre === "string" ? body.clienteNombre.trim().slice(0, 120) : "";
  if (email && !CORREO.test(email)) return NextResponse.json({ error: "Revisa el correo de la empresa." }, { status: 400 });

  const cantidades: Partial<Record<PruebaDigital, number>> = {};
  const crudas = (body.cantidades && typeof body.cantidades === "object" ? body.cantidades : {}) as Record<string, unknown>;
  for (const id of DIGITALES) {
    const n = Math.floor(Number(crudas[id]));
    if (Number.isFinite(n) && n > 0) cantidades[id] = Math.min(MAX_POR_PRUEBA_LOTE, n);
  }
  if (Object.keys(cantidades).length === 0) {
    return NextResponse.json({ error: "Indica cuántos códigos de al menos una prueba." }, { status: 400 });
  }

  const dias = Math.min(730, Math.max(1, Math.floor(Number(body.vigenciaDias)) || 180));
  const ahora = new Date();
  const vence = new Date(ahora.getTime() + dias * 86_400_000).toISOString();
  const clienteUserId = email ? await usuarioPorCorreo({ email, nombre: nombre || empresa || email }) : null;

  const loteId = `lote-${ahora.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const codigos = codigosDeLote(loteId, cantidades, empresa || nombre || "Lote");

  const db = getDb();
  // De a cien para no armar una sola consulta enorme.
  for (let i = 0; i < codigos.length; i += 100) {
    await db.insert(schema.accessCodes).values(
      codigos.slice(i, i + 100).map((c) => {
        const normal = normalizeAccessCode(c.plano);
        return {
          id: c.id,
          label: c.etiqueta,
          empresa: empresa || null,
          clienteUserId,
          lookupHash: hashAccessCodeLookup(normal),
          codeSuffix: normal.slice(-4),
          allowedInstruments: c.pruebas,
          maxUses: 1,
          usedCount: 0,
          active: true,
          expiresAt: vence,
          createdById: user.id,
          createdAt: ahora.toISOString(),
          updatedAt: ahora.toISOString(),
        };
      }),
    );
  }

  await logAudit(user.id, "create", "access_code", loteId, {
    lote: true,
    cantidades,
    codigos: codigos.length,
    empresa: empresa || null,
    cliente: clienteUserId,
  });

  return NextResponse.json(
    {
      lote: loteId,
      vence,
      codigos: codigos.map((c) => ({ codigo: c.plano, prueba: nombresDe(c.pruebas)[0] })),
    },
    { status: 201 },
  );
}
