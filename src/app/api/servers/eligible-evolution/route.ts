import { db } from "@/db";
import { servers } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/servers/eligible-evolution
 * Lista apenas servidores com cargo PEB I, PEB II ou DIRETOR DE ESCOLA
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.active, true),
          inArray(servers.position, ["PEB I", "PEB II", "DIRETOR DE ESCOLA"])
        )
      )
      .orderBy(asc(servers.name));

    return NextResponse.json({ servers: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar servidores elegíveis para evolução:", error);
    return NextResponse.json({ error: "Erro ao listar servidores" }, { status: 500 });
  }
}
