import { db } from "@/db";
import { servers, atsBenefits, functionalEvolutions, licenseCertificates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/servers/overdue-advantages
 * Retorna lista de servidores com vantagens vencidas e a vencer
 */
export async function GET() {
  try {
    const today = new Date();
    
    // Busca todos os servidores ativos
    const activeServers = await db
      .select()
      .from(servers)
      .where(eq(servers.active, true));

    const overdueList: any[] = [];
    const upcomingList: any[] = [];

    for (const server of activeServers) {
      const serverIssues: any = {
        server,
        overdue: [], // Vantagens vencidas
        upcoming: [], // Vantagens a vencer
      };

      // === VERIFICAR ATS ===
      const atsList = await db
        .select()
        .from(atsBenefits)
        .where(eq(atsBenefits.serverId, server.id))
        .orderBy(desc(atsBenefits.quinquenioNumber));

      if (atsList.length > 0) {
        const lastAts = atsList[0];
        const lastDate = new Date(lastAts.startDate);
        const nextExpected = new Date(lastDate);
        // O período inclui o dia inicial, então somamos 1824 dias
        nextExpected.setDate(nextExpected.getDate() + 1824);

        const diffDays = Math.floor((today.getTime() - nextExpected.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          // ATS vencido
          serverIssues.overdue.push({
            type: "ATS",
            label: `${lastAts.quinquenioNumber + 1}º Quinquênio`,
            expectedDate: nextExpected.toISOString().split("T")[0],
            daysPast: diffDays,
            details: `Último ATS: ${lastAts.quinquenioNumber}º (${lastAts.startDate})`,
          });
        } else if (diffDays >= -180 && diffDays <= 0) {
          // ATS a vencer nos próximos 180 dias
          serverIssues.upcoming.push({
            type: "ATS",
            label: `${lastAts.quinquenioNumber + 1}º Quinquênio`,
            expectedDate: nextExpected.toISOString().split("T")[0],
            daysRemaining: Math.abs(diffDays),
            details: `Último ATS: ${lastAts.quinquenioNumber}º (${lastAts.startDate})`,
          });
        }
      }

      // === VERIFICAR EVOLUÇÃO FUNCIONAL ===
      if (["PEB I", "PEB II", "DIRETOR DE ESCOLA"].includes(server.position)) {
        const evolutions = await db
          .select()
          .from(functionalEvolutions)
          .where(eq(functionalEvolutions.serverId, server.id))
          .orderBy(desc(functionalEvolutions.evolutionNumber));

        if (evolutions.length > 0) {
          const lastEvo = evolutions[0];
          
          if (lastEvo.nextEvolutionDate && lastEvo.isLast) {
            const nextDate = new Date(lastEvo.nextEvolutionDate);
            const diffDays = Math.floor((today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              serverIssues.overdue.push({
                type: "EVOLUÇÃO",
                label: `${lastEvo.evolutionNumber + 1}ª Evolução (${lastEvo.toLevel} → ${lastEvo.nextToLevel})`,
                expectedDate: lastEvo.nextEvolutionDate,
                daysPast: diffDays,
                details: `Última evolução: ${lastEvo.evolutionNumber}ª (${lastEvo.startDate})`,
              });
            } else if (diffDays >= -180 && diffDays <= 0) {
              serverIssues.upcoming.push({
                type: "EVOLUÇÃO",
                label: `${lastEvo.evolutionNumber + 1}ª Evolução (${lastEvo.toLevel} → ${lastEvo.nextToLevel})`,
                expectedDate: lastEvo.nextEvolutionDate,
                daysRemaining: Math.abs(diffDays),
                details: `Última evolução: ${lastEvo.evolutionNumber}ª (${lastEvo.startDate})`,
              });
            }
          }
        }
      }

      // === VERIFICAR LICENÇA PRÊMIO ===
      const certificates = await db
        .select()
        .from(licenseCertificates)
        .where(eq(licenseCertificates.serverId, server.id))
        .orderBy(desc(licenseCertificates.acquisitionEndDate));

      // Usa apenas a ÚLTIMA certidão como base para calcular a próxima
      if (certificates.length > 0) {
        const lastCert = certificates[0]; // Mais recente (ordenado por acquisitionEndDate DESC)
        const lastEndDate = new Date(lastCert.acquisitionEndDate);
        
        // Próximo período começa no dia após o fim do último
        const nextPeriodStart = new Date(lastEndDate);
        nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
        
        // Próximo período tem duração de 5 anos (1825 dias)
        const nextPeriodEnd = new Date(nextPeriodStart);
        // O período inclui o dia inicial, então somamos 1824 dias
        nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 1824);
        
        const diffDays = Math.floor((today.getTime() - nextPeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
        
          if (diffDays > 0 && today > nextPeriodEnd) {
            // Período aquisitivo vencido
            serverIssues.overdue.push({
              type: "LICENÇA PRÊMIO",
              label: "Período aquisitivo vencido",
              expectedDate: nextPeriodEnd.toISOString().split("T")[0],
              daysPast: diffDays,
              details: `Última certidão: ${lastCert.certificateNumber}/${lastCert.certificateYear}`,
            });
          } else if (diffDays >= -180 && diffDays <= 0) {
            // Período aquisitivo a vencer nos próximos 180 dias
            serverIssues.upcoming.push({
              type: "LICENÇA PRÊMIO",
              label: "Período aquisitivo a vencer",
              expectedDate: nextPeriodEnd.toISOString().split("T")[0],
              daysRemaining: Math.abs(diffDays),
              details: `Última certidão: ${lastCert.certificateNumber}/${lastCert.certificateYear}`,
            });
          }
      }

      // Adiciona servidor às listas apropriadas
      if (serverIssues.overdue.length > 0) {
        overdueList.push(serverIssues);
      }
      if (serverIssues.upcoming.length > 0) {
        upcomingList.push(serverIssues);
      }
    }

    // Ordena por criticidade (mais dias vencidos/a vencer primeiro)
    overdueList.sort((a, b) => {
      const aMaxDays = Math.max(...a.overdue.map((o: any) => o.daysPast));
      const bMaxDays = Math.max(...b.overdue.map((o: any) => o.daysPast));
      return bMaxDays - aMaxDays;
    });

    upcomingList.sort((a, b) => {
      const aMinDays = Math.min(...a.upcoming.map((u: any) => u.daysRemaining));
      const bMinDays = Math.min(...b.upcoming.map((u: any) => u.daysRemaining));
      return aMinDays - bMinDays;
    });

    return NextResponse.json({ 
      overdue: overdueList,
      upcoming: upcomingList,
      overdueCount: overdueList.length,
      upcomingCount: upcomingList.length
    });
  } catch (error) {
    console.error("Erro ao buscar vantagens:", error);
    return NextResponse.json({ error: "Erro ao buscar vantagens" }, { status: 500 });
  }
}
