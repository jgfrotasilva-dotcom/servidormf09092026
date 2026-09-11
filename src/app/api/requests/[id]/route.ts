import { db } from "@/db";
import { requests, requestInteractions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/requests/[id]
 * Atualiza um requerimento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { serverId, type, description, status, responseNotes } = body;

    // Busca requerimento existente
    const [existing] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    // Se for atualização de status (aprovar/rejeitar pela gestão)
    if (status && (status === "aprovado" || status === "rejeitado")) {
      // Salva a resposta como interação
      if (responseNotes) {
        await db.insert(requestInteractions).values({
          requestId: id,
          from: "gestao",
          message: responseNotes,
        });
      }

      const [updated] = await db
        .update(requests)
        .set({
          status,
          responseNotes: responseNotes || null,
        })
        .where(eq(requests.id, id))
        .returning();

      return NextResponse.json({ request: updated });
    }

    // Se for edição do servidor (requer serverId e type)
    if (serverId && type) {
      // Verifica se pertence ao servidor
      if (existing.serverId !== serverId) {
        return NextResponse.json(
          { error: "Você não tem permissão para editar este requerimento" },
          { status: 403 }
        );
      }

      // Verifica se está pendente
      if (existing.status !== "pendente") {
        return NextResponse.json(
          { error: "Somente requerimentos pendentes podem ser editados" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(requests)
        .set({
          type,
          description: description || null,
        })
        .where(eq(requests.id, id))
        .returning();

      return NextResponse.json({ request: updated });
    }

    return NextResponse.json(
      { error: "Dados inválidos para atualização" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao atualizar requerimento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar requerimento" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/requests/[id]
 * Exclui um requerimento (apenas se estiver pendente)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId é obrigatório" },
        { status: 400 }
      );
    }

    // Busca requerimento existente
    const [existing] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    // Verifica se pertence ao servidor
    if (existing.serverId !== serverId) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este requerimento" },
        { status: 403 }
      );
    }

    // Verifica se está pendente
    if (existing.status !== "pendente") {
      return NextResponse.json(
        { error: "Somente requerimentos pendentes podem ser excluídos" },
        { status: 400 }
      );
    }

    await db.delete(requests).where(eq(requests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir requerimento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir requerimento" },
      { status: 500 }
    );
  }
}
