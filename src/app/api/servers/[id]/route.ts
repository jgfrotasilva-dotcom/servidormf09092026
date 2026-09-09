import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { validateCPF, validateEmail, validatePhone, validateBirthDate } from "@/lib/validators";
import { cleanCPF, cleanPhone } from "@/lib/format";

/**
 * GET /api/servers/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [server] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error("Erro ao obter servidor:", error);
    return NextResponse.json({ error: "Erro ao obter servidor" }, { status: 500 });
  }
}

/**
 * PUT /api/servers/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      cpf,
      rgCin,
      birthDate,
      phone,
      email,
      position,
      category,
      faixa,
      nivel,
      designatedFunction,
      ctdStartDate,
      ctdEndDate,
      active,
      notes,
    } = body;

    const [existingServer] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);

    if (!existingServer) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    if (!name || !cpf || !position || !category) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, CPF, cargo e categoria" },
        { status: 400 }
      );
    }

    const cleanCpf = cleanCPF(cpf);
    if (!validateCPF(cleanCpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    if (email && !validateEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    if (birthDate && !validateBirthDate(birthDate)) {
      return NextResponse.json(
        { error: "Data de nascimento inválida" },
        { status: 400 }
      );
    }

    const [updatedServer] = await db
      .update(servers)
      .set({
        name: name.trim(),
        cpf: cleanCpf,
        rgCin: rgCin?.toString().trim() || null,
        birthDate: birthDate || null,
        phone: phone ? cleanPhone(phone) : null,
        email: email?.toString().trim().toLowerCase() || null,
        position: position.toString().trim().toUpperCase(),
        category: category.toString().trim().toUpperCase(),
        faixa: faixa?.toString().trim().toUpperCase() || null,
        nivel: nivel?.toString().trim().toUpperCase() || null,
        designatedFunction: designatedFunction?.toString().trim().toUpperCase() || null,
        ctdStartDate: ctdStartDate || null,
        ctdEndDate: ctdEndDate || null,
        active: active === undefined ? existingServer.active : Boolean(active),
        notes: notes?.toString().trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(servers.id, id))
      .returning();

    return NextResponse.json({ server: updatedServer });
  } catch (error) {
    console.error("Erro ao atualizar servidor:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
    }

    return NextResponse.json({ error: "Erro ao atualizar servidor" }, { status: 500 });
  }
}

/**
 * DELETE /api/servers/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deletedServer] = await db.delete(servers).where(eq(servers.id, id)).returning();

    if (!deletedServer) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover servidor:", error);
    return NextResponse.json({ error: "Erro ao remover servidor" }, { status: 500 });
  }
}
