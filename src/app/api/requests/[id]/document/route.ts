import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [req] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!req) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    if (!req.documentUrl || !req.documentName) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      );
    }

    // Retorna o documento em base64
    return NextResponse.json({
      documentUrl: req.documentUrl,
      documentName: req.documentName,
    });
  } catch (error) {
    console.error("Erro ao buscar documento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar documento" },
      { status: 500 }
    );
  }
}
