import { db } from "@/db";
import { atsBenefits } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ats/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [ats] = await db
      .select()
      .from(atsBenefits)
      .where(eq(atsBenefits.id, id))
      .limit(1);

    if (!ats) {
      return NextResponse.json({ error: "ATS não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ ats });
  } catch (error) {
    console.error("Erro ao obter ATS:", error);
    return NextResponse.json({ error: "Erro ao obter ATS" }, { status: 500 });
  }
}

/**
 * PUT /api/ats/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { quinquenioNumber, startDate, doeDate, isLast } = body;

    const [existing] = await db
      .select()
      .from(atsBenefits)
      .where(eq(atsBenefits.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "ATS não encontrado" }, { status: 404 });
    }

    const newQuinquenio = quinquenioNumber || existing.quinquenioNumber;
    const newStartDate = startDate || existing.startDate;

    if (newQuinquenio < 1 || newQuinquenio > 10) {
      return NextResponse.json(
        { error: "Quinquênio deve ser entre 1 e 10" },
        { status: 400 }
      );
    }

    // Calcula próxima data
    const startDateObj = new Date(newStartDate);
    // O período inclui o dia inicial, então somamos 1824 dias
    startDateObj.setDate(startDateObj.getDate() + 1824);
    const nextDate = startDateObj.toISOString().split("T")[0];

    const type = `${newQuinquenio}º Quinquênio`;

    // Se este é o último, desmarca os outros do mesmo servidor
    if (isLast) {
      await db
        .update(atsBenefits)
        .set({ isLast: false, updatedAt: new Date() })
        .where(
          and(eq(atsBenefits.serverId, existing.serverId), eq(atsBenefits.isLast, true))
        );
    }

    const [updated] = await db
      .update(atsBenefits)
      .set({
        quinquenioNumber: newQuinquenio,
        type,
        startDate: newStartDate,
        doeDate: doeDate !== undefined ? doeDate : existing.doeDate,
        isLast: isLast !== undefined ? Boolean(isLast) : existing.isLast,
        nextDate,
        updatedAt: new Date(),
      })
      .where(eq(atsBenefits.id, id))
      .returning();

    return NextResponse.json({ ats: updated });
  } catch (error) {
    console.error("Erro ao atualizar ATS:", error);
    return NextResponse.json({ error: "Erro ao atualizar ATS" }, { status: 500 });
  }
}

/**
 * DELETE /api/ats/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(atsBenefits)
      .where(eq(atsBenefits.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "ATS não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover ATS:", error);
    return NextResponse.json({ error: "Erro ao remover ATS" }, { status: 500 });
  }
}
