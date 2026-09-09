import { db } from "@/db";
import { servers } from "@/db/schema";
import { and, asc, eq, ne, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/servers/eligible
 * Lista servidores elegíveis para ATS:
 * - ACT (qualquer cargo)
 * - A (Efetivo) EXCETO cargo PEFM
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.active, true),
          or(
            eq(servers.category, "ACT"),
            and(eq(servers.category, "A"), ne(servers.position, "PEFM"))
          )
        )
      )
      .orderBy(asc(servers.name));

    return NextResponse.json({ servers: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar servidores elegíveis:", error);
    return NextResponse.json({ error: "Erro ao listar servidores" }, { status: 500 });
  }
}
