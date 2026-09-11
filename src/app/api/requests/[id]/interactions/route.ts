import { db } from "@/db";
import { requestInteractions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/requests/[id]/interactions
 * Lista todas as interações de um requerimento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const interactions = await db
      .select()
      .from(requestInteractions)
      .where(eq(requestInteractions.requestId, id))
      .orderBy(asc(requestInteractions.createdAt));

    return NextResponse.json({ interactions });
  } catch (error) {
    console.error("Erro ao listar interações:", error);
    return NextResponse.json(
      { error: "Erro ao listar interações" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requests/[id]/interactions
 * Adiciona nova interação ao requerimento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { from, message } = body;

    if (!from || !message) {
      return NextResponse.json(
        { error: "Campos obrigatórios: from, message" },
        { status: 400 }
      );
    }

    if (!["servidor", "gestao"].includes(from)) {
      return NextResponse.json(
        { error: "Campo 'from' deve ser 'servidor' ou 'gestao'" },
        { status: 400 }
      );
    }

    const [interaction] = await db
      .insert(requestInteractions)
      .values({
        requestId: id,
        from,
        message,
      })
      .returning();

    return NextResponse.json({ interaction }, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar interação:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar interação" },
      { status: 500 }
    );
  }
}
