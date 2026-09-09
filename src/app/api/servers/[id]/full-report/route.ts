import { db } from "@/db";
import { servers, atsBenefits, licenseCertificates, licenseUsages, functionalEvolutions } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { calculateNextEvolution } from "@/lib/evolution-rules";

/**
 * GET /api/servers/[id]/full-report
 * Retorna relatório completo de vantagens de um servidor
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Busca o servidor
    const [server] = await db.select().from(servers).where(eq(servers.id, id)).limit(1);

    if (!server) {
      return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });
    }

    // Busca ATS
    const atsList = await db
      .select()
      .from(atsBenefits)
      .where(eq(atsBenefits.serverId, id))
      .orderBy(asc(atsBenefits.quinquenioNumber));

    // Busca certidões de licença
    const certificates = await db
      .select()
      .from(licenseCertificates)
      .where(eq(licenseCertificates.serverId, id))
      .orderBy(asc(licenseCertificates.acquisitionStartDate));

    // Busca usufrutos de licença
    const allUsages = await db.select().from(licenseUsages);
    const usages = allUsages.filter((u) =>
      certificates.some((c) => c.id === u.certificateId)
    );

    // Busca evoluções funcionais
    const evolutions = await db
      .select()
      .from(functionalEvolutions)
      .where(eq(functionalEvolutions.serverId, id))
      .orderBy(asc(functionalEvolutions.evolutionNumber));

    // === CÁLCULO PRÓXIMO ATS ===
    const lastAts = atsList.length > 0 ? atsList[atsList.length - 1] : null;
    let nextAtsExpected = null;
    let nextAtsQuinquenio = null;
    if (lastAts) {
      const lastDate = new Date(lastAts.startDate);
      // O período inclui o dia inicial, então somamos 1824 dias
      lastDate.setDate(lastDate.getDate() + 1824);
      nextAtsExpected = lastDate.toISOString().split("T")[0];
      nextAtsQuinquenio = `${lastAts.quinquenioNumber + 1}º Quinquênio`;
    }

    // === CÁLCULO PRÓXIMA EVOLUÇÃO ===
    let nextEvolution = null;
    if (evolutions.length > 0) {
      const lastEvo = evolutions[evolutions.length - 1];
      // Usa cálculo já salvo se existir, ou recalcula
      if (lastEvo.nextEvolutionDate && lastEvo.isLast) {
        nextEvolution = {
          date: lastEvo.nextEvolutionDate,
          fromLevel: lastEvo.nextFromLevel,
          toLevel: lastEvo.nextToLevel,
          evolutionNumber: lastEvo.evolutionNumber + 1,
        };
      } else {
        const calc = calculateNextEvolution(server.position, lastEvo.toLevel, lastEvo.startDate);
        if (calc) {
          nextEvolution = {
            date: calc.nextDate,
            fromLevel: calc.nextFromLevel,
            toLevel: calc.nextToLevel,
            evolutionNumber: lastEvo.evolutionNumber + 1,
            intersticio: calc.intersticio,
          };
        }
      }
    }

    // === CÁLCULO PRÓXIMA LICENÇA PRÊMIO ===
    // Próximo período aquisitivo: precisa verificar quando servidor completará 5 anos sem certidão
    let nextLicense = null;
    
    // Se tem certidões, calcular próxima com base na última data fim do período aquisitivo
    if (certificates.length > 0) {
      const lastCert = certificates[certificates.length - 1];
      // Próximo período aquisitivo começa no dia seguinte ao fim do último
      const endDate = new Date(lastCert.acquisitionEndDate);
      endDate.setDate(endDate.getDate() + 1);
      // Próximo período tem duração de 5 anos (1825 dias)
      const nextEndDate = new Date(endDate);
      // O período inclui o dia inicial, então somamos 1824 dias
      nextEndDate.setDate(nextEndDate.getDate() + 1824);
      
      nextLicense = {
        startDate: endDate.toISOString().split("T")[0],
        endDate: nextEndDate.toISOString().split("T")[0],
        certificateNumber: String(parseInt(lastCert.certificateNumber) + 1).padStart(3, "0"),
        certificateYear: String(nextEndDate.getFullYear()),
      };
    } else {
      // Se não tem nenhuma certidão, a primeira é calculada com base em dados do servidor
      // Por enquanto, deixa vazio - precisa de mais dados (data de posse/exercício)
      nextLicense = null;
    }

    // Calcula nível atual
    const currentLevel = evolutions.length > 0 ? evolutions[evolutions.length - 1].toLevel : "I";

    // Calcula saldo total de licença
    const totalLicenseBalance = certificates.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalLicenseHistorical = certificates.reduce((sum, c) => sum + c.totalBalance, 0);

    return NextResponse.json({
      server,
      ats: {
        granted: atsList,
        nextExpected: nextAtsExpected,
        nextQuinquenio: nextAtsQuinquenio,
        totalGranted: atsList.length,
      },
      license: {
        certificates,
        usages,
        totalBalance: totalLicenseBalance,
        totalHistorical: totalLicenseHistorical,
        totalCerts: certificates.length,
        nextPeriod: nextLicense,
      },
      evolution: {
        granted: evolutions,
        currentLevel,
        totalGranted: evolutions.length,
        nextEvolution,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}
