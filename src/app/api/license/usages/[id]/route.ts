import { db } from "@/db";
import { licenseCertificates, licenseUsages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/license/usages/[id]
 * Ao excluir um usufruto, devolve os dias ao saldo da certidão
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Busca o usufruto
    const [usage] = await db
      .select()
      .from(licenseUsages)
      .where(eq(licenseUsages.id, id))
      .limit(1);

    if (!usage) {
      return NextResponse.json({ error: "Usufruto não encontrado" }, { status: 404 });
    }

    // Remove o usufruto
    await db.delete(licenseUsages).where(eq(licenseUsages.id, id));

    // Devolve os dias ao saldo da certidão
    const [cert] = await db
      .select()
      .from(licenseCertificates)
      .where(eq(licenseCertificates.id, usage.certificateId))
      .limit(1);

    if (cert) {
      await db
        .update(licenseCertificates)
        .set({
          currentBalance: cert.currentBalance + usage.days,
          updatedAt: new Date(),
        })
        .where(eq(licenseCertificates.id, usage.certificateId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover usufruto:", error);
    return NextResponse.json({ error: "Erro ao remover usufruto" }, { status: 500 });
  }
}
