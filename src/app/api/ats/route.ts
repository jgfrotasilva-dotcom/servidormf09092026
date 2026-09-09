import { db } from "@/db";
import { atsBenefits, servers } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ats
 * Lista ATS de um servidor ou de múltiplos servidores
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const serverIds = searchParams.get("serverIds");

    if (!serverId && !serverIds) {
      return NextResponse.json(
        { error: "serverId ou serverIds é obrigatório" },
        { status: 400 }
      );
    }

    let result;
    if (serverId) {
      result = await db
        .select()
        .from(atsBenefits)
        .where(eq(atsBenefits.serverId, serverId))
        .orderBy(asc(atsBenefits.quinquenioNumber));
    } else if (serverIds) {
      const ids = serverIds.split(",").filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ ats: [] });
      }
      result = await db
        .select()
        .from(atsBenefits)
        .where(inArray(atsBenefits.serverId, ids))
        .orderBy(asc(atsBenefits.quinquenioNumber));
    } else {
      return NextResponse.json({ ats: [] });
    }

    return NextResponse.json({ ats: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar ATS:", error);
    return NextResponse.json({ error: "Erro ao listar ATS" }, { status: 500 });
  }
}

/**
 * POST /api/ats
 * Cria um novo registro de ATS
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverId, quinquenioNumber, startDate, doeDate, isLast } = body;

    if (!serverId || !quinquenioNumber || !startDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios: serverId, quinquenioNumber, startDate" },
        { status: 400 }
      );
    }

    if (quinquenioNumber < 1 || quinquenioNumber > 10) {
      return NextResponse.json(
        { error: "Quinquênio deve ser entre 1 e 10" },
        { status: 400 }
      );
    }

    // Verifica se o servidor existe e tem categoria A ou ACT
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    if (!["A", "ACT"].includes(server.category)) {
      return NextResponse.json(
        { error: "Servidor não elegível (apenas Efetivos e ACT)" },
        { status: 400 }
      );
    }

    // Verifica duplicidade do número do quinquênio para o mesmo servidor
    const [existing] = await db
      .select()
      .from(atsBenefits)
      .where(
        and(
          eq(atsBenefits.serverId, serverId),
          eq(atsBenefits.quinquenioNumber, quinquenioNumber)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: `Já existe um ${quinquenioNumber}º Quinquênio cadastrado para este servidor` },
        { status: 409 }
      );
    }

    // Calcula data do próximo (startDate + 1825 dias)
    const startDateObj = new Date(startDate);
    startDateObj.setDate(startDateObj.getDate() + 1825);
    const nextDate = startDateObj.toISOString().split("T")[0];

    const type = `${quinquenioNumber}º Quinquênio`;

    // Se este é o último, desmarca os outros
    if (isLast) {
      await db
        .update(atsBenefits)
        .set({ isLast: false, updatedAt: new Date() })
        .where(eq(atsBenefits.serverId, serverId));
    }

    const [newAts] = await db
      .insert(atsBenefits)
      .values({
        serverId,
        quinquenioNumber,
        type,
        startDate,
        doeDate: doeDate || null,
        isLast: Boolean(isLast),
        nextDate,
      })
      .returning();

    return NextResponse.json({ ats: newAts }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ATS:", error);
    return NextResponse.json({ error: "Erro ao criar ATS" }, { status: 500 });
  }
}
