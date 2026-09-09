import { db } from "@/db";
import { servers } from "@/db/schema";
import { asc, eq, ilike, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { validateCPF, validateEmail, validatePhone, validateBirthDate } from "@/lib/validators";
import { cleanCPF, cleanPhone } from "@/lib/format";

/**
 * GET /api/servers
 * Lista todos os servidores com filtros opcionais
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const position = searchParams.get("position");
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const limit = parseInt(searchParams.get("limit") || "500");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(servers);

    // Aplica filtros
    if (search) {
      query = query.where(
        or(
          ilike(servers.name, `%${search}%`),
          ilike(servers.cpf, `%${search}%`),
          ilike(servers.email, `%${search}%`)
        )
      ) as typeof query;
    }

    if (position) {
      query = query.where(eq(servers.position, position)) as typeof query;
    }

    if (category) {
      query = query.where(eq(servers.category, category)) as typeof query;
    }

    if (active !== null && active !== undefined && active !== "") {
      const isActive = active === "true" || active === "1";
      query = query.where(eq(servers.active, isActive)) as typeof query;
    }

    const result = await query
      .orderBy(asc(servers.name))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ servers: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar servidores:", error);
    return NextResponse.json(
      { error: "Erro ao listar servidores" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/servers
 * Cria um novo servidor
 */
export async function POST(request: NextRequest) {
  try {
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

    // Validações obrigatórias
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

    // Cria o servidor
    const [newServer] = await db
      .insert(servers)
      .values({
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
        active: active === undefined ? true : Boolean(active),
        notes: notes?.toString().trim() || null,
      })
      .returning();

    return NextResponse.json({ server: newServer }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar servidor:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json({ error: "CPF já cadastrado" }, { status: 409 });
    }

    return NextResponse.json({ error: "Erro ao criar servidor" }, { status: 500 });
  }
}
