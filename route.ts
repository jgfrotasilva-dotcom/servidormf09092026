import { db } from "@/db";
import { servers } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const result = await db
      .select()
      .from(servers)
      .where(
        and(
          inArray(servers.category, ["A", "F"]),  // ✅ CORRETO
          eq(servers.active, true)
        )
      )
      .orderBy(asc(servers.name));

    return NextResponse.json({ servers: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar servidores elegíveis para licença:", error);
    return NextResponse.json({ error: "Erro ao listar servidores" }, { status: 500 });
  }
}