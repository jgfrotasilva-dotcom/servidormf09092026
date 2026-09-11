import { db } from "@/db";
import { requests, servers, requestInteractions } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/requests/all
 * Lista todos os requerimentos de todos os servidores (para gestão)
 */
export async function GET() {
  try {
    const requestsList = await db
      .select({
        id: requests.id,
        serverId: requests.serverId,
        serverName: servers.name,
        serverPosition: servers.position,
        type: requests.type,
        description: requests.description,
        status: requests.status,
        createdAt: requests.createdAt,
        responseNotes: requests.responseNotes,
      })
      .from(requests)
      .leftJoin(servers, eq(requests.serverId, servers.id))
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
