import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/requests
 * Lista requerimentos de um servidor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(requests)
      .where(eq(requests.serverId, serverId))
      .orderBy(desc(requests.createdAt));

    return NextResponse.json({ requests: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar requerimentos:", error);
    return NextResponse.json({ error: "Erro ao listar requerimentos" }, { status: 500 });
  }
}

/**
 * POST /api/requests
 * Cria novo requerimento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, type, description } = body;

    if (!serverId || !type) {
      return NextResponse.json(
        { error: "Campos obrigatórios: serverId, type" },
        { status: 400 }
      );
    }

    const [newRequest] = await db
      .insert(requests)
      .values({
        serverId,
        type,
        description: description || null,
      })
      .returning();

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar requerimento:", error);
    return NextResponse.json({ error: "Erro ao criar requerimento" }, { status: 500 });
  }
}
