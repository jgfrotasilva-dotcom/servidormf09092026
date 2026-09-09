import { db } from "@/db";
import { licenseCertificates, licenseUsages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/license/usages
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("certificateId");

    if (!certificateId) {
      return NextResponse.json(
        { error: "certificateId é obrigatório" },
        { status: 400 }
      );
    }

    const result = await db
      .select()
      .from(licenseUsages)
      .where(eq(licenseUsages.certificateId, certificateId))
      .orderBy(asc(licenseUsages.createdAt));

    return NextResponse.json({ usages: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar usufrutos:", error);
    return NextResponse.json({ error: "Erro ao listar usufrutos" }, { status: 500 });
  }
}

/**
 * POST /api/license/usages
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateId, type, days, startDate, endDate, doeDate, year } = body;

    if (!certificateId || !type || !days) {
      return NextResponse.json(
        { error: "Campos obrigatórios: certificateId, type, days" },
        { status: 400 }
      );
    }

    if (!["FRUICAO", "PECUNIA"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo deve ser FRUICAO ou PECUNIA" },
        { status: 400 }
      );
    }

    // Verifica certidão
    const [cert] = await db
      .select()
      .from(licenseCertificates)
      .where(eq(licenseCertificates.id, certificateId))
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: "Certidão não encontrada" }, { status: 404 });
    }

    // Validação de saldo
    if (cert.currentBalance <= 0) {
      return NextResponse.json(
        { error: "Saldo da certidão é zero. Não é possível registrar usufruto." },
        { status: 400 }
      );
    }

    if (days > cert.currentBalance) {
      return NextResponse.json(
        { error: `Dias solicitados (${days}) excedem o saldo disponível (${cert.currentBalance})` },
        { status: 400 }
      );
    }

    // Validações específicas por tipo
    if (type === "FRUICAO") {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: "Fruição requer data início e data fim" },
          { status: 400 }
        );
      }
      if (![15, 30, 45, 75, 90].includes(days)) {
        return NextResponse.json(
          { error: "Quantidade de dias para fruição deve ser 15, 30, 45, 75 ou 90" },
          { status: 400 }
        );
      }
    } else if (type === "PECUNIA") {
      if (days !== 30) {
        return NextResponse.json(
          { error: "Pecúnia sempre consome 30 dias" },
          { status: 400 }
        );
      }
      if (!year) {
        return NextResponse.json(
          { error: "Pecúnia requer o ano" },
          { status: 400 }
        );
      }
    }

    // Cria o usufruto
    const [newUsage] = await db
      .insert(licenseUsages)
      .values({
        certificateId,
        type,
        days,
        startDate: startDate || null,
        endDate: endDate || null,
        doeDate: doeDate || null,
        year: year || null,
      })
      .returning();

    // Atualiza o saldo da certidão
    await db
      .update(licenseCertificates)
      .set({
        currentBalance: cert.currentBalance - days,
        updatedAt: new Date(),
      })
      .where(eq(licenseCertificates.id, certificateId));

    return NextResponse.json({ usage: newUsage }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usufruto:", error);
    return NextResponse.json({ error: "Erro ao criar usufruto" }, { status: 500 });
  }
}
