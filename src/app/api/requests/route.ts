import { db } from "@/db";
import { requests, requestInteractions } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
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

    const requestsList = await db
      .select()
      .from(requests)
      .where(eq(requests.serverId, serverId))
      .orderBy(desc(requests.createdAt));

    // Busca interações para cada requerimento
    const requestsWithInteractions = await Promise.all(
      requestsList.map(async (req) => {
        const interactions = await db
          .select()
          .from(requestInteractions)
          .where(eq(requestInteractions.requestId, req.id))
          .orderBy(asc(requestInteractions.createdAt));

        return {
          ...req,
          interactions: interactions.map((i) => ({
            id: i.id,
            from: i.from,
            message: i.message,
            createdAt: i.createdAt,
          })),
        };
      })
    );

    return NextResponse.json({ 
      requests: requestsWithInteractions, 
      count: requestsWithInteractions.length 
    });
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
