import { db } from "@/db";
import {
  servers,
  atsBenefits,
  functionalEvolutions,
  licenseCertificates,
  licenseUsages,
  absences,
} from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/config/restore
 * Restaura backup completo do sistema
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Valida estrutura do backup
    if (!body.version || !body.data) {
      return NextResponse.json(
        { error: "Arquivo de backup inválido: estrutura incorreta" },
        { status: 400 }
      );
    }

    const { data } = body;

    // Valida se todas as tabelas estão presentes
    const requiredTables = [
      "servers",
      "atsBenefits",
      "functionalEvolutions",
      "licenseCertificates",
      "licenseUsages",
      "absences",
    ];

    for (const table of requiredTables) {
      if (!data[table] || !Array.isArray(data[table])) {
        return NextResponse.json(
          { error: `Arquivo de backup inválido: tabela ${table} ausente ou inválida` },
          { status: 400 }
        );
      }
    }

    // Limpa todas as tabelas (ordem importa por causa de foreign keys)
    await db.delete(absences);
    await db.delete(licenseUsages);
    await db.delete(licenseCertificates);
    await db.delete(functionalEvolutions);
    await db.delete(atsBenefits);
    await db.delete(servers);

    // Restaura dados (ordem inversa para respeitar foreign keys)
    let restoredCount = {
      servers: 0,
      atsBenefits: 0,
      functionalEvolutions: 0,
      licenseCertificates: 0,
      licenseUsages: 0,
      absences: 0,
    };

    // 1. Servidores
    if (data.servers.length > 0) {
      await db.insert(servers).values(data.servers);
      restoredCount.servers = data.servers.length;
    }

    // 2. ATS Benefits
    if (data.atsBenefits.length > 0) {
      await db.insert(atsBenefits).values(data.atsBenefits);
      restoredCount.atsBenefits = data.atsBenefits.length;
    }

    // 3. Functional Evolutions
    if (data.functionalEvolutions.length > 0) {
      await db.insert(functionalEvolutions).values(data.functionalEvolutions);
      restoredCount.functionalEvolutions = data.functionalEvolutions.length;
    }

    // 4. License Certificates
    if (data.licenseCertificates.length > 0) {
      await db.insert(licenseCertificates).values(data.licenseCertificates);
      restoredCount.licenseCertificates = data.licenseCertificates.length;
    }

    // 5. License Usages
    if (data.licenseUsages.length > 0) {
      await db.insert(licenseUsages).values(data.licenseUsages);
      restoredCount.licenseUsages = data.licenseUsages.length;
    }

    // 6. Absences
    if (data.absences.length > 0) {
      await db.insert(absences).values(data.absences);
      restoredCount.absences = data.absences.length;
    }

    return NextResponse.json({
      success: true,
      message: "Backup restaurado com sucesso",
      restoredCount,
    });
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    return NextResponse.json(
      { error: "Erro ao restaurar backup do sistema" },
      { status: 500 }
    );
  }
}
