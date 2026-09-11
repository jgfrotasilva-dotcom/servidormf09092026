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
    // Busca todos os requerimentos
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

    // Busca TODAS as interações de uma vez
    const allInteractions = await db
      .select()
      .from(requestInteractions)
      .orderBy(asc(requestInteractions.createdAt));

    // Agrupa interações por requestId
    const interactionsByRequest: Record<string, any[]> = {};
    allInteractions.forEach((interaction) => {
      if (!interactionsByRequest[interaction.requestId]) {
        interactionsByRequest[interaction.requestId] = [];
      }
      interactionsByRequest[interaction.requestId].push({
        id: interaction.id,
        from: interaction.from,
        message: interaction.message,
        createdAt: interaction.createdAt,
      });
    });

    // Monta resultado final com interações
    const requestsWithInteractions = requestsList.map((req) => ({
      ...req,
      interactions: interactionsByRequest[req.id] || [],
    }));

    return NextResponse.json({ 
      requests: requestsWithInteractions, 
      count: requestsWithInteractions.length 
    });
  } catch (error) {
    console.error("Erro ao listar requerimentos:", error);
    return NextResponse.json({ error: "Erro ao listar requerimentos" }, { status: 500 });
  }
}
