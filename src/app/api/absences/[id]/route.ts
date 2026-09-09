import { db } from "@/db";
import { absences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * DELETE /api/absences/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db.delete(absences).where(eq(absences.id, id)).returning();

    if (!deleted) {
      return NextResponse.json({ error: "Ausência não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover ausência:", error);
    return NextResponse.json({ error: "Erro ao remover ausência" }, { status: 500 });
  }
}
