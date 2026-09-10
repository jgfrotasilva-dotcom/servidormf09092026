import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { requests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const requestId = formData.get("requestId") as string;
    const file = formData.get("document") as File;

    if (!requestId || !file) {
      return NextResponse.json(
        { error: "requestId e document são obrigatórios" },
        { status: 400 }
      );
    }

    // Converte arquivo para base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Atualiza requerimento com documento
    const [updated] = await db
      .update(requests)
      .set({
        documentUrl: dataUrl,
        documentName: file.name,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, requestId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Requerimento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do documento" },
      { status: 500 }
    );
  }
}
