import { db } from "@/db";
import { servers, atsBenefits, licenseCertificates } from "@/db/schema";
import { and, asc, eq, ne, or } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * GET /api/servers/advantages-analysis
 * Retorna análise consolidada de vantagens de todos os servidores elegíveis
 */
export async function GET() {
  try {
    // Busca todos os servidores elegíveis (ACT + A exceto PEFM)
    const eligibleServers = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.active, true),
          or(
            eq(servers.category, "ACT"),
            and(eq(servers.category, "A"), ne(servers.position, "PEFM"))
          )
        )
      )
      .orderBy(asc(servers.name));

    // Busca todos os ATS e certidões de uma vez
    const allAts = await db.select().from(atsBenefits).orderBy(asc(atsBenefits.serverId));
    const allCerts = await db
      .select()
      .from(licenseCertificates)
      .orderBy(asc(licenseCertificates.serverId));

    // Agrupa por servidor
    const atsByServer: Record<string, (typeof allAts)[number][]> = {};
    const certsByServer: Record<string, (typeof allCerts)[number][]> = {};

    allAts.forEach((ats) => {
      if (!atsByServer[ats.serverId]) atsByServer[ats.serverId] = [];
      atsByServer[ats.serverId].push(ats);
    });

    allCerts.forEach((cert) => {
      if (!certsByServer[cert.serverId]) certsByServer[cert.serverId] = [];
      certsByServer[cert.serverId].push(cert);
    });

    const today = new Date();
    const ANALYSIS = {
      OK: "OK",
      ATENCAO: "ATENCAO",
      VENCIDO: "VENCIDO",
      SEM_DADOS: "SEM_DADOS",
    } as const;

    const analysis = eligibleServers.map((server) => {
      const serverAts = (atsByServer[server.id] || []).sort(
        (a, b) => a.quinquenioNumber - b.quinquenioNumber
      );
      const serverCerts = certsByServer[server.id] || [];

      // Análise de ATS
      let atsAnalysis;
      if (serverAts.length === 0) {
        atsAnalysis = {
          total: 0,
          lastQuinquenio: null,
          lastStartDate: null,
          nextExpected: null,
          daysUntil: null,
          status: ANALYSIS.SEM_DADOS,
        };
      } else {
        const last = serverAts[serverAts.length - 1];
        const lastStartDate = new Date(last.startDate);
        const nextExpected = new Date(lastStartDate);
        // O período inclui o dia inicial, então somamos 1824 dias
        nextExpected.setDate(nextExpected.getDate() + 1824);

        const diffMs = nextExpected.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let status: string = ANALYSIS.OK;
        if (daysUntil < 0) {
          status = ANALYSIS.VENCIDO;
        } else if (daysUntil <= 180) {
          status = ANALYSIS.ATENCAO;
        }

        atsAnalysis = {
          total: serverAts.length,
          lastQuinquenio: last.quinquenioNumber,
          lastStartDate: last.startDate,
          nextExpected: nextExpected.toISOString().split("T")[0],
          daysUntil,
          status,
        };
      }

      // Análise de Licença Prêmio
      const totalBalance = serverCerts.reduce((sum, c) => sum + c.currentBalance, 0);
      const totalHistorical = serverCerts.reduce((sum, c) => sum + c.totalBalance, 0);
      const usedBalance = totalHistorical - totalBalance;
      const exhaustedCerts = serverCerts.filter((c) => c.currentBalance === 0).length;

      let licenseStatus: string = ANALYSIS.OK;
      let licenseAlert: string | null = null;

      // Usa apenas a ÚLTIMA certidão como base para verificar vencimento
      if (serverCerts.length === 0) {
        // Sem certidões - não há base para cálculo
        licenseStatus = ANALYSIS.SEM_DADOS;
        licenseAlert = "Nenhuma certidão cadastrada";
      } else {
        // Tem certidões - usa a última como base
        // Ordena por acquisitionEndDate DESC para pegar a mais recente
        const sortedCerts = [...serverCerts].sort((a, b) => 
          new Date(b.acquisitionEndDate).getTime() - new Date(a.acquisitionEndDate).getTime()
        );
        const lastCert = sortedCerts[0];
        const lastStartDate = new Date(lastCert.acquisitionStartDate);
        const lastEndDate = new Date(lastCert.acquisitionEndDate);
        
        // Calcula quando deveria ter a próxima certidão
        const nextPeriodStart = new Date(lastEndDate);
        nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
        
        const nextPeriodEnd = new Date(nextPeriodStart);
        // Período de 5 anos (1825 dias)
        nextPeriodEnd.setDate(nextPeriodEnd.getDate() + 1824);
        
        const diffDays = Math.ceil((nextPeriodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          // Período aquisitivo vencido
          licenseStatus = ANALYSIS.VENCIDO;
          licenseAlert = `Período aquisitivo vencido há ${Math.abs(diffDays)} dias (deveria ter nova certidão)`;
        } else if (diffDays <= 180) {
          // Período aquisitivo a vencer em até 180 dias
          licenseStatus = ANALYSIS.ATENCAO;
          licenseAlert = `Período aquisitivo vence em ${diffDays} dias`;
        } else if (exhaustedCerts === serverCerts.length) {
          // Todas certidões com saldo esgotado
          licenseStatus = ANALYSIS.ATENCAO;
          licenseAlert = "Todas as certidões com saldo esgotado";
        } else if (totalBalance > 0) {
          // Tem saldo disponível
          licenseStatus = ANALYSIS.OK;
        }
      }

      const licenseAnalysis = {
        totalCerts: serverCerts.length,
        totalBalance,
        totalHistorical,
        usedBalance,
        exhaustedCerts,
        status: licenseStatus,
        alert: licenseAlert,
      };

      // Status geral do servidor
      let overallStatus: string = ANALYSIS.OK;
      if (
        atsAnalysis.status === ANALYSIS.VENCIDO ||
        licenseAnalysis.status === ANALYSIS.VENCIDO
      ) {
        overallStatus = ANALYSIS.VENCIDO;
      } else if (
        atsAnalysis.status === ANALYSIS.ATENCAO ||
        licenseAnalysis.status === ANALYSIS.ATENCAO ||
        atsAnalysis.status === ANALYSIS.SEM_DADOS ||
        licenseAnalysis.status === ANALYSIS.SEM_DADOS
      ) {
        overallStatus = ANALYSIS.ATENCAO;
      }

      return {
        serverId: server.id,
        serverName: server.name,
        position: server.position,
        category: server.category,
        faixa: server.faixa,
        nivel: server.nivel,
        ats: atsAnalysis,
        license: licenseAnalysis,
        overallStatus,
      };
    });

    // Estatísticas gerais
    const summary = {
      totalServers: analysis.length,
      ok: analysis.filter((a) => a.overallStatus === ANALYSIS.OK).length,
      atencao: analysis.filter((a) => a.overallStatus === ANALYSIS.ATENCAO).length,
      vencido: analysis.filter((a) => a.overallStatus === ANALYSIS.VENCIDO).length,
      atsVencidos: analysis.filter((a) => a.ats.status === ANALYSIS.VENCIDO).length,
      atsAtencao: analysis.filter((a) => a.ats.status === ANALYSIS.ATENCAO).length,
      semCertidoes: analysis.filter(
        (a) => a.license.status === ANALYSIS.SEM_DADOS || a.license.status === ANALYSIS.ATENCAO
      ).length,
    };

    return NextResponse.json({ analysis, summary });
  } catch (error) {
    console.error("Erro ao analisar vantagens:", error);
    return NextResponse.json({ error: "Erro ao analisar vantagens" }, { status: 500 });
  }
}
