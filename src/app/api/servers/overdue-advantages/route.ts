import { db } from "@/db";
import { servers, atsBenefits, functionalEvolutions, licenseCertificates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/servers/overdue-advantages
 * Retorna lista de servidores com vantagens vencidas
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

    for (const server of activeServers) {
      const serverOverdue: any = {
        server,
        ats: null,
        evolution: null,
        license: null,
      };

      // === VERIFICAR ATS VENCIDO ===
      const atsList = await db
        .select()
        .from(atsBenefits)
        .where(eq(atsBenefits.serverId, server.id))
        .orderBy(desc(atsBenefits.quinquenioNumber));

      if (atsList.length > 0) {
        const lastAts = atsList[0];
        const lastDate = new Date(lastAts.startDate);
        const nextExpected = new Date(lastDate);
        nextExpected.setDate(nextExpected.getDate() + 1825); // +5 anos

        const diffDays = Math.floor((today.getTime() - nextExpected.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          // ATS vencido
          serverOverdue.ats = {
            type: "ATS",
            lastQuinquenio: lastAts.quinquenioNumber,
            lastDate: lastAts.startDate,
            nextExpected: nextExpected.toISOString().split("T")[0],
            daysOverdue: diffDays,
            nextQuinquenio: `${lastAts.quinquenioNumber + 1}º Quinquênio`,
          };
        }
      }

      // === VERIFICAR EVOLUÇÃO FUNCIONAL VENCIDA ===
      if (["PEB I", "PEB II", "DIRETOR DE ESCOLA"].includes(server.position)) {
        const evolutions = await db
          .select()
          .from(functionalEvolutions)
          .where(eq(functionalEvolutions.serverId, server.id))
          .orderBy(desc(functionalEvolutions.evolutionNumber));

        if (evolutions.length > 0) {
          const lastEvo = evolutions[0];
          
          // Se já tem nextEvolutionDate calculada, usa ela
          if (lastEvo.nextEvolutionDate && lastEvo.isLast) {
            const nextDate = new Date(lastEvo.nextEvolutionDate);
            const diffDays = Math.floor((today.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              serverOverdue.evolution = {
                type: "EVOLUCAO_FUNCIONAL",
                lastEvolution: lastEvo.evolutionNumber,
                lastDate: lastEvo.startDate,
                fromLevel: lastEvo.toLevel,
                toLevel: lastEvo.nextToLevel,
                nextExpected: lastEvo.nextEvolutionDate,
                daysOverdue: diffDays,
                nextEvolution: `${lastEvo.evolutionNumber + 1}ª Evolução`,
              };
            }
          }
        }
      }

      // === VERIFICAR LICENÇA PRÊMIO ===
      // Servidor com 5+ anos de serviço sem certidão ou com período aquisitivo vencido
      const certificates = await db
        .select()
        .from(licenseCertificates)
        .where(eq(licenseCertificates.serverId, server.id))
        .orderBy(desc(licenseCertificates.acquisitionEndDate));

      // Se tem ATS cadastrado, pode calcular período aquisitivo da licença
      if (atsList.length > 0) {
        const firstAts = atsList[atsList.length - 1]; // Primeiro ATS
        const firstDate = new Date(firstAts.startDate);
        
        // Calcula quantos períodos de 5 anos se passaram desde o primeiro ATS
        const yearsSinceFirst = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
        const expectedCertificates = Math.floor(yearsSinceFirst / 5);
        
        if (expectedCertificates > certificates.length) {
          // Servidor tem direito a mais certidões do que tem cadastrado
          const lastCertEndDate = certificates.length > 0 
            ? new Date(certificates[0].acquisitionEndDate)
            : firstDate;
          
          const nextPeriodStart = new Date(lastCertEndDate);
          nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
          
          const nextPeriodEnd = new Date(nextPeriodStart);
          nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 1825);
          
          const diffDays = Math.floor((today.getTime() - nextPeriodEnd.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0 && today > nextPeriodEnd) {
            serverOverdue.license = {
              type: "LICENCA_PREMIO",
              missingCertificates: expectedCertificates - certificates.length,
              lastCertificate: certificates.length > 0 ? certificates[0].certificateNumber : null,
              nextPeriodStart: nextPeriodStart.toISOString().split("T")[0],
              nextPeriodEnd: nextPeriodEnd.toISOString().split("T")[0],
              daysOverdue: diffDays,
            };
          }
        }
      }

      // Adiciona servidor à lista se tem alguma vantagem vencida
      if (serverOverdue.ats || serverOverdue.evolution || serverOverdue.license) {
        overdueList.push(serverOverdue);
      }
    }

    // Ordena por quantidade de vantagens vencidas (mais crítico primeiro)
    overdueList.sort((a, b) => {
      const aTotal = (a.ats ? 1 : 0) + (a.evolution ? 1 : 0) + (a.license ? 1 : 0);
      const bTotal = (b.ats ? 1 : 0) + (b.evolution ? 1 : 0) + (b.license ? 1 : 0);
      return bTotal - aTotal;
    });

    return NextResponse.json({ 
      servers: overdueList, 
      count: overdueList.length 
    });
  } catch (error) {
    console.error("Erro ao buscar vantagens vencidas:", error);
    return NextResponse.json({ error: "Erro ao buscar vantagens vencidas" }, { status: 500 });
  }
}
