import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/requests/[id]
 * Atualiza status e observações de um requerimento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, responseNotes } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 }
      );
    }

    if (!["pendente", "aprovado", "rejeitado"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido. Use: pendente, aprovado ou rejeitado" },
        { status: 400 }
      );
    }

    const [updatedRequest] = await db
      .update(requests)
      .set({
        status,
        responseNotes: responseNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    if (!updatedRequest) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error("Erro ao atualizar requerimento:", error);
    return NextResponse.json({ error: "Erro ao atualizar requerimento" }, { status: 500 });
  }
}
