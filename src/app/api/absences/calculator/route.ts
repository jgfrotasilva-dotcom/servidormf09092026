import { db } from "@/db";
import { absences } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/absences/calculator
 * Retorna ausências de um servidor no período aquisitivo para cálculo de licença prêmio
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!serverId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: serverId, startDate, endDate" },
        { status: 400 }
      );
    }

    // Busca todas as ausências do servidor no período
    const serverAbsences = await db
      .select()
      .from(absences)
      .where(
        and(
          eq(absences.serverId, serverId),
          eq(absences.type, "AUSENCIA"),
          gte(absences.systemDate, startDate),
          lte(absences.systemDate, endDate)
        )
      );

    // Exclui Falta-Aula e Falta Médica Parcial (não aumentam o período)
    const excludedTypes = ["FALTA_AULA", "FALTA_MEDICA_PARCIAL"];
    
    // Filtra ausências que aumentam o período
    const periodIncreasingAbsences = serverAbsences.filter(
      (absence) => !excludedTypes.includes(absence.subtype || "")
    );

    // Agrupa por ano
    const byYear: Record<string, any[]> = {};
    periodIncreasingAbsences.forEach((absence) => {
      const year = new Date(absence.systemDate).getFullYear().toString();
      if (!byYear[year]) {
        byYear[year] = [];
      }
      byYear[year].push({
        id: absence.id,
        date: absence.systemDate,
        subtype: absence.subtype,
        days: absence.days || 0,
        hours: absence.hours || 0,
      });
    });

    // Totaliza por tipo
    const byType: Record<string, number> = {};
    periodIncreasingAbsences.forEach((absence) => {
      const subtype = absence.subtype || "OUTRO";
      if (!byType[subtype]) {
        byType[subtype] = 0;
      }
      if (absence.days) {
        byType[subtype] += absence.days;
      }
    });

    // Total geral de dias
    const totalDays = periodIncreasingAbsences.reduce(
      (sum, absence) => sum + (absence.days || 0),
      0
    );

    return NextResponse.json({
      absences: periodIncreasingAbsences,
      byYear,
      byType,
      totalDays,
      excludedCount: serverAbsences.length - periodIncreasingAbsences.length,
    });
  } catch (error) {
    console.error("Erro ao buscar ausências para cálculo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ausências" },
      { status: 500 }
    );
  }
}
