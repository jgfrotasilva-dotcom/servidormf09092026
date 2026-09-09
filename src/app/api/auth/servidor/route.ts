import { db } from "@/db";
import { servers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/servidor
 * Autentica servidor via CPF e data de nascimento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cpf, birthDate } = body;

    if (!cpf || !birthDate) {
      return NextResponse.json(
        { error: "CPF e data de nascimento são obrigatórios" },
        { status: 400 }
      );
    }

    // Remove formatação do CPF (deve ser apenas números)
    const cleanCpf = cpf.replace(/\D/g, "");
    
    // Valida formato do CPF (11 dígitos)
    if (cleanCpf.length !== 11) {
      return NextResponse.json(
        { error: "CPF deve conter 11 dígitos" },
        { status: 400 }
      );
    }

    // Remove formatação da data (deve ser apenas números: DDMMYYYY)
    const cleanBirthDate = birthDate.replace(/\D/g, "");
    
    // Valida formato da data (8 dígitos)
    if (cleanBirthDate.length !== 8) {
      return NextResponse.json(
        { error: "Data de nascimento deve conter 8 dígitos (DDMMAAAA)" },
        { status: 400 }
      );
    }

    // Converte para formato YYYY-MM-DD
    const day = cleanBirthDate.substring(0, 2);
    const month = cleanBirthDate.substring(2, 4);
    const year = cleanBirthDate.substring(4, 8);
    const formattedBirthDate = `${year}-${month}-${day}`;

    // Busca servidor com CPF e data de nascimento
    const [server] = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.cpf, cleanCpf),
          eq(servers.birthDate, formattedBirthDate)
        )
      )
      .limit(1);

    if (!server) {
      return NextResponse.json(
        { error: "CPF ou data de nascimento inválidos" },
        { status: 401 }
      );
    }

    // Retorna dados do servidor (sem informações sensíveis)
    return NextResponse.json({
      success: true,
      server: {
        id: server.id,
        name: server.name,
        position: server.position,
        category: server.category,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return NextResponse.json(
      { error: "Erro ao processar autenticação" },
      { status: 500 }
    );
  }
}
