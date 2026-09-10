import { db } from "@/db";
import { requests, servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/requests/[id]/document
 * Retorna dados formatados para gerar documento oficial do requerimento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Busca requerimento com dados do servidor
    const [req] = await db
      .select({
        request: requests,
        server: servers,
      })
      .from(requests)
      .leftJoin(servers, eq(requests.serverId, servers.id))
      .where(eq(requests.id, id))
      .limit(1);

    if (!req || !req.request || !req.server) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    // Formata dados para o documento
    const today = new Date();
    const formattedDate = today.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const getTypeLabel = (type: string) => {
      const labels: Record<string, string> = {
        ATS: "Adicional por Tempo de Serviço (ATS)",
        LICENCA_PREMIO: "Licença Prêmio",
        EVOLUCAO_FUNCIONAL: "Evolução Funcional",
        CERTIDAO: "Certidão de Tempo de Serviço",
        OUTRO: "Outros Assuntos",
      };
      return labels[type] || type;
    };

    const documentData = {
      requestNumber: req.request.requestNumber,
      date: formattedDate,
      server: {
        name: req.server.name,
        cpf: req.server.cpf,
        position: req.server.position,
        category: req.server.category,
      },
      type: getTypeLabel(req.request.type),
      description: req.request.description || "Sem descrição adicional",
      outrosDescricao: req.request.outrosDescricao || null,
      status: req.request.status,
    };

    return NextResponse.json(documentData);
  } catch (error) {
    console.error("Erro ao buscar documento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documento" },
      { status: 500 }
    );
  }
}
