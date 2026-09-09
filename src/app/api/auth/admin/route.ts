import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/admin
 * Autentica usuário administrativo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuário e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Credenciais de demonstração
    // Em produção, isso deve ser substituído por um sistema de autenticação real
    const validCredentials = {
      username: "admin",
      password: "admin123",
    };

    if (username !== validCredentials.username || password !== validCredentials.password) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        role: "admin",
        username: username,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação admin:", error);
    return NextResponse.json(
      { error: "Erro ao processar autenticação" },
      { status: 500 }
    );
  }
}
