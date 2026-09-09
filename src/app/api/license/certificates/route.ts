import { db } from "@/db";
import { licenseCertificates, servers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/license/certificates
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
      .from(licenseCertificates)
      .where(eq(licenseCertificates.serverId, serverId))
      .orderBy(asc(licenseCertificates.acquisitionStartDate));

    return NextResponse.json({ certificates: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar certidões:", error);
    return NextResponse.json({ error: "Erro ao listar certidões" }, { status: 500 });
  }
}

/**
 * POST /api/license/certificates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serverId,
      certificateNumber,
      certificateYear,
      acquisitionStartDate,
      acquisitionEndDate,
      doeDate,
    } = body;

    if (
      !serverId ||
      !certificateNumber ||
      !certificateYear ||
      !acquisitionStartDate ||
      !acquisitionEndDate
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios: serverId, certificateNumber, certificateYear, acquisitionStartDate, acquisitionEndDate" },
        { status: 400 }
      );
    }

    // Verifica se o servidor existe e tem categoria A
    const [server] = await db
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1);

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    if (server.category !== "A") {
      return NextResponse.json(
        { error: "Servidor não elegível (apenas Efetivos categoria A)" },
        { status: 400 }
      );
    }

    const [newCert] = await db
      .insert(licenseCertificates)
      .values({
        serverId,
        certificateNumber,
        certificateYear,
        acquisitionStartDate,
        acquisitionEndDate,
        doeDate: doeDate || null,
        totalBalance: 90,
        currentBalance: 90,
      })
      .returning();

    return NextResponse.json({ certificate: newCert }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar certidão:", error);
    return NextResponse.json({ error: "Erro ao criar certidão" }, { status: 500 });
  }
}
