import { db } from "@/db";
import { absences } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/absences
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const type = searchParams.get("type");

    if (!serverId) {
      return NextResponse.json({ error: "serverId é obrigatório" }, { status: 400 });
    }

    let result;
    if (type === "AUSENCIA" || type === "ORIENTACAO_TECNICA") {
      result = await db
        .select()
        .from(absences)
        .where(and(eq(absences.serverId, serverId), eq(absences.type, type)))
        .orderBy(desc(absences.systemDate));
    } else {
      result = await db
        .select()
        .from(absences)
        .where(eq(absences.serverId, serverId))
        .orderBy(desc(absences.systemDate));
    }

    return NextResponse.json({ absences: result, count: result.length });
  } catch (error) {
    console.error("Erro ao listar ausências:", error);
    return NextResponse.json({ error: "Erro ao listar ausências" }, { status: 500 });
  }
}

/**
 * POST /api/absences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      serverId,
      type,
      subtype,
      systemDate,
      startDate,
      endDate,
      days,
      doeDate,
      title,
      location,
      startTime,
      endTime,
      dateTBD,
      notes,
      hours,
    } = body;

    if (!serverId || !type || !systemDate) {
      return NextResponse.json(
        { error: "Campos obrigatórios: serverId, type, systemDate" },
        { status: 400 }
      );
    }

    if (!["AUSENCIA", "ORIENTACAO_TECNICA"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo deve ser AUSENCIA ou ORIENTACAO_TECNICA" },
        { status: 400 }
      );
    }

    // Validações específicas por tipo
    if (type === "AUSENCIA") {
      if (!subtype) {
        return NextResponse.json(
          { error: "Subtipo é obrigatório para ausência" },
          { status: 400 }
        );
      }

      // Para tipos com período
      const periodTypes = ["LICENCA_SAUDE", "AUXILIO_DOENCA", "LICENCA_PREMIO"];
      if (periodTypes.includes(subtype)) {
        if (!startDate || !endDate || !days || !doeDate) {
          return NextResponse.json(
            { error: "Para este tipo de ausência, informe data início, data fim, dias e DOE" },
            { status: 400 }
          );
        }
      }

      // Para Falta Aula e Falta Médica Parcial, horas é obrigatório
      const hoursRequiredTypes = ["FALTA_AULA", "FALTA_MEDICA_PARCIAL"];
      if (hoursRequiredTypes.includes(subtype)) {
        if (!hours || hours <= 0) {
          return NextResponse.json(
            { error: "Para Falta Aula ou Falta Médica Parcial, informe a quantidade de horas/aulas" },
            { status: 400 }
          );
        }
      }
    }

    if (type === "ORIENTACAO_TECNICA") {
      if (!title || !location || !startTime || !endTime) {
        return NextResponse.json(
          { error: "Para Orientação Técnica, informe título, local, horário início e término" },
          { status: 400 }
        );
      }
    }

    const [newAbsence] = await db
      .insert(absences)
      .values({
        serverId,
        type,
        subtype: subtype || null,
        systemDate,
        startDate: startDate || null,
        endDate: endDate || null,
        days: days || null,
        doeDate: doeDate || null,
        title: title || null,
        location: location || null,
        startTime: startTime || null,
        endTime: endTime || null,
        dateTBD: Boolean(dateTBD),
        notes: notes || null,
        hours: hours || null,
      })
      .returning();

    return NextResponse.json({ absence: newAbsence }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ausência:", error);
    return NextResponse.json({ error: "Erro ao criar ausência" }, { status: 500 });
  }
}
