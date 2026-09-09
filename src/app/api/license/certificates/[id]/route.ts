import { db } from "@/db";
import { licenseCertificates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/license/certificates/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [cert] = await db
      .select()
      .from(licenseCertificates)
      .where(eq(licenseCertificates.id, id))
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: "Certidão não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ certificate: cert });
  } catch (error) {
    console.error("Erro ao obter certidão:", error);
    return NextResponse.json({ error: "Erro ao obter certidão" }, { status: 500 });
  }
}

/**
 * PUT /api/license/certificates/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { certificateNumber, certificateYear, acquisitionStartDate, acquisitionEndDate, doeDate } = body;

    const [existing] = await db
      .select()
      .from(licenseCertificates)
      .where(eq(licenseCertificates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Certidão não encontrada" }, { status: 404 });
    }

    const [updated] = await db
      .update(licenseCertificates)
      .set({
        certificateNumber: certificateNumber || existing.certificateNumber,
        certificateYear: certificateYear || existing.certificateYear,
        acquisitionStartDate: acquisitionStartDate || existing.acquisitionStartDate,
        acquisitionEndDate: acquisitionEndDate || existing.acquisitionEndDate,
        doeDate: doeDate !== undefined ? doeDate : existing.doeDate,
        updatedAt: new Date(),
      })
      .where(eq(licenseCertificates.id, id))
      .returning();

    return NextResponse.json({ certificate: updated });
  } catch (error) {
    console.error("Erro ao atualizar certidão:", error);
    return NextResponse.json({ error: "Erro ao atualizar certidão" }, { status: 500 });
  }
}

/**
 * DELETE /api/license/certificates/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(licenseCertificates)
      .where(eq(licenseCertificates.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Certidão não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover certidão:", error);
    return NextResponse.json({ error: "Erro ao remover certidão" }, { status: 500 });
  }
}
