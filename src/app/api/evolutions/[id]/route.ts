import { db } from "@/db";
import { functionalEvolutions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/evolutions/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [evolution] = await db
      .select()
      .from(functionalEvolutions)
      .where(eq(functionalEvolutions.id, id))
      .limit(1);

    if (!evolution) {
      return NextResponse.json({ error: "Evolução não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ evolution });
  } catch (error) {
    console.error("Erro ao obter evolução:", error);
    return NextResponse.json({ error: "Erro ao obter evolução" }, { status: 500 });
  }
}

/**
 * PUT /api/evolutions/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { evolutionNumber, startDate, doeDate, fromLevel, toLevel, isLast } = body;

    const [existing] = await db
      .select()
      .from(functionalEvolutions)
      .where(eq(functionalEvolutions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Evolução não encontrada" }, { status: 404 });
    }

    // Busca dados do servidor para calcular próxima evolução
    const { servers } = await import("@/db/schema");
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, existing.serverId))
      .limit(1);

    const finalToLevel = toLevel || existing.toLevel;
    const finalStartDate = startDate || existing.startDate;

    // Calcula próxima evolução se marcado como última
    let nextEvolutionDate = existing.nextEvolutionDate;
    let nextFromLevel = existing.nextFromLevel;
    let nextToLevel = existing.nextToLevel;

    const isLastBool = isLast !== undefined ? Boolean(isLast) : existing.isLast;

    if (isLastBool && server) {
      const { calculateNextEvolution } = await import("@/lib/evolution-rules");
      const next = calculateNextEvolution(server.position, finalToLevel, finalStartDate);
      if (next) {
        nextEvolutionDate = next.nextDate;
        nextFromLevel = next.nextFromLevel;
        nextToLevel = next.nextToLevel;
      } else {
        nextEvolutionDate = null;
        nextFromLevel = null;
        nextToLevel = null;
      }
    } else if (!isLastBool) {
      nextEvolutionDate = null;
      nextFromLevel = null;
      nextToLevel = null;
    }

    // Se marcado como última, desativa isLast das outras evoluções
    if (isLastBool) {
      await db
        .update(functionalEvolutions)
        .set({ isLast: false, updatedAt: new Date() })
        .where(eq(functionalEvolutions.serverId, existing.serverId));
    }

    const [updated] = await db
      .update(functionalEvolutions)
      .set({
        evolutionNumber: evolutionNumber || existing.evolutionNumber,
        startDate: finalStartDate,
        doeDate: doeDate !== undefined ? doeDate : existing.doeDate,
        fromLevel: fromLevel || existing.fromLevel,
        toLevel: finalToLevel,
        isLast: isLastBool,
        nextEvolutionDate,
        nextFromLevel,
        nextToLevel,
        updatedAt: new Date(),
      })
      .where(eq(functionalEvolutions.id, id))
      .returning();

    return NextResponse.json({ evolution: updated });
  } catch (error) {
    console.error("Erro ao atualizar evolução:", error);
    return NextResponse.json({ error: "Erro ao atualizar evolução" }, { status: 500 });
  }
}

/**
 * DELETE /api/evolutions/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(functionalEvolutions)
      .where(eq(functionalEvolutions.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Evolução não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover evolução:", error);
    return NextResponse.json({ error: "Erro ao remover evolução" }, { status: 500 });
  }
}
