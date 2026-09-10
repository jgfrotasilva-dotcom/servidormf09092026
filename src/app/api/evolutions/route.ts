import { db } from "@/db";
import { functionalEvolutions, servers } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/evolutions
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
      .from(functionalEvolutions)
      .where(eq(functionalEvolutions.serverId, serverId))
      .orderBy(asc(functionalEvolutions.evolutionNumber));

    return NextResponse.json({ evolutions: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar evoluções:", error);
    return NextResponse.json({ error: "Erro ao listar evoluções" }, { status: 500 });
  }
}

/**
 * POST /api/evolutions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, evolutionNumber, startDate, doeDate, fromLevel, toLevel, isLast } = body;

    if (!serverId || !evolutionNumber || !startDate || !fromLevel || !toLevel) {
      return NextResponse.json(
        { error: "Campos obrigatórios: serverId, evolutionNumber, startDate, fromLevel, toLevel" },
        { status: 400 }
      );
    }

    if (evolutionNumber < 1 || evolutionNumber > 10) {
      return NextResponse.json(
        { error: "Número da evolução deve ser entre 1 e 10" },
        { status: 400 }
      );
    }

    // Verifica se o servidor existe e tem cargo elegível
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    if (!["PEB I", "PEB II", "DIRETOR DE ESCOLA"].includes(server.position)) {
      return NextResponse.json(
        { error: "Servidor não elegível (apenas PEB I, PEB II e DIRETOR DE ESCOLA)" },
        { status: 400 }
      );
    }

    // Verifica duplicidade
    const [existing] = await db
      .select()
      .from(functionalEvolutions)
      .where(
        and(
          eq(functionalEvolutions.serverId, serverId),
          eq(functionalEvolutions.evolutionNumber, evolutionNumber)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `${evolutionNumber}ª Evolução já cadastrada para este servidor` },
        { status: 409 }
      );
    }

    // Calcula próxima evolução se marcado como última
    let nextEvolutionDate = null;
    let nextFromLevel = null;
    let nextToLevel = null;

    if (isLast) {
      // Import dinâmico para evitar problemas de compilação
      const { calculateNextEvolution } = await import("@/lib/evolution-rules");
      const next = calculateNextEvolution(server.position, toLevel, startDate);
      if (next) {
        nextEvolutionDate = next.nextDate;
        nextFromLevel = next.nextFromLevel;
        nextToLevel = next.nextToLevel;
      }
    }

    // Se marcado como última, desativa isLast das outras evoluções
    if (isLast) {
      await db
        .update(functionalEvolutions)
        .set({ isLast: false, updatedAt: new Date() })
        .where(eq(functionalEvolutions.serverId, serverId));
    }

    const [newEvolution] = await db
      .insert(functionalEvolutions)
      .values({
        serverId,
        evolutionNumber,
        startDate,
        doeDate: doeDate || null,
        fromLevel,
        toLevel,
        isLast: Boolean(isLast),
        nextEvolutionDate,
        nextFromLevel,
        nextToLevel,
      })
      .returning();

    return NextResponse.json({ evolution: newEvolution }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evolução:", error);
    return NextResponse.json({ error: "Erro ao criar evolução" }, { status: 500 });
  }
}
