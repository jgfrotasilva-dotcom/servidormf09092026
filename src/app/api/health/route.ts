import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * GET /api/health
 * Endpoint de diagnóstico para verificar conexão com banco de dados
 */
export async function GET() {
  const diagnostics: any = {
    status: "unknown",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check 1: DATABASE_URL configurada?
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    diagnostics.status = "error";
    diagnostics.checks.database_url = {
      status: "error",
      message: "DATABASE_URL não está configurada",
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Mask password for security
  const maskedUrl = databaseUrl.replace(/:([^@]+)@/, ":***@");
  diagnostics.checks.database_url = {
    status: "ok",
    message: "DATABASE_URL configurada",
    url: maskedUrl,
  };

  // Check 2: Conexão com banco de dados
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    diagnostics.checks.database_connection = {
      status: "ok",
      message: "Conexão com banco de dados estabelecida",
    };
  } catch (error: any) {
    diagnostics.status = "error";
    diagnostics.checks.database_connection = {
      status: "error",
      message: "Falha na conexão com banco de dados",
      error: error.message,
      code: error.code,
    };
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Check 3: Tabelas existem?
  try {
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const tables = (tablesResult as unknown) as any[];

    diagnostics.checks.tables = {
      status: "ok",
      message: `${tables.length} tabela(s) encontrada(s)`,
      tables: tables.map((t: any) => t.table_name),
    };
  } catch (error: any) {
    diagnostics.checks.tables = {
      status: "error",
      message: "Erro ao listar tabelas",
      error: error.message,
    };
  }

  // Check 4: Tabela servers existe e tem estrutura correta?
  try {
    const serversCountResult = await db.execute(sql`SELECT COUNT(*) as count FROM servers`);
    const serversCount = (serversCountResult as unknown) as any[];
    diagnostics.checks.servers_table = {
      status: "ok",
      message: `Tabela servers existe com ${serversCount[0]?.count || 0} registros`,
    };
  } catch (error: any) {
    diagnostics.checks.servers_table = {
      status: "error",
      message: "Erro ao acessar tabela servers",
      error: error.message,
    };
  }

  diagnostics.status = "ok";
  diagnostics.message = "Todos os sistemas operacionais";

  return NextResponse.json(diagnostics);
}
