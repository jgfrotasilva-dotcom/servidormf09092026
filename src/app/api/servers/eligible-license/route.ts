import { db } from "@/db";
import { servers } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/servers/eligible-license
 * Lista apenas servidores categoria A (Efetivo) - elegíveis para Licença Prêmio
 */
export async function GET(_request: NextRequest) {
  try {
    const result = await db
      .select()
      .from(servers)
      .where(and(eq(servers.category, "A"), eq(servers.active, true)))
      .orderBy(asc(servers.name));

    return NextResponse.json({ servers: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar servidores elegíveis para licença:", error);
    return NextResponse.json({ error: "Erro ao listar servidores" }, { status: 500 });
  }
}
