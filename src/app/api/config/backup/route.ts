import { db } from "@/db";
import {
  servers,
  atsBenefits,
  functionalEvolutions,
  licenseCertificates,
  licenseUsages,
  absences,
} from "@/db/schema";
import { NextResponse } from "next/server";

/**
 * GET /api/config/backup
 * Gera backup completo do sistema em formato JSON
 */
export async function GET() {
  try {
    // Busca todos os dados
    const allServers = await db.select().from(servers);
    const allAts = await db.select().from(atsBenefits);
    const allEvolutions = await db.select().from(functionalEvolutions);
    const allCertificates = await db.select().from(licenseCertificates);
    const allUsages = await db.select().from(licenseUsages);
    const allAbsences = await db.select().from(absences);

    // Monta objeto de backup
    const backup = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      systemInfo: {
        application: "EE Profa. Marlene Frattini - Sistema de Gestão de Servidores",
        version: "1.0.0",
      },
      data: {
        servers: allServers,
        atsBenefits: allAts,
        functionalEvolutions: allEvolutions,
        licenseCertificates: allCertificates,
        licenseUsages: allUsages,
        absences: allAbsences,
      },
      statistics: {
        totalServers: allServers.length,
        totalAts: allAts.length,
        totalEvolutions: allEvolutions.length,
        totalCertificates: allCertificates.length,
        totalUsages: allUsages.length,
        totalAbsences: allAbsences.length,
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json(
      { error: "Erro ao gerar backup do sistema" },
      { status: 500 }
    );
  }
}
