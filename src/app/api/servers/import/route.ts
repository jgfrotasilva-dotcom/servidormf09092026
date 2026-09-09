import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { servers } from "@/db/schema";
import * as XLSX from "xlsx";
import { eq } from "drizzle-orm";
import { validateCPF, validateEmail, validatePhone } from "@/lib/validators";
import { cleanCPF, cleanPhone } from "@/lib/format";
import { POSITIONS, CATEGORIES } from "@/db/schema";

/**
 * Normaliza nomes de colunas (aceita variações)
 */
function normalizeColumnName(name: string): string {
  const lower = (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const mapping: Record<string, string> = {
    nome: "nome",
    cpf: "cpf",
    rg: "rgcin",
    rgcin: "rgcin",
    cin: "rgcin",
    identidade: "rgcin",
    dtnasc: "dtnasc",
    datanasc: "dtnasc",
    nascimento: "dtnasc",
    nasc: "dtnasc",
    datanascimento: "dtnasc",
    telefone: "tel",
    tel: "tel",
    fone: "tel",
    celular: "tel",
    email: "email",
    mail: "email",
    cargo: "cargo",
    funcao: "cargo",
    categoria: "categoria",
    tipo: "categoria",
    vinculo: "categoria",
    faixa: "faixa",
    nivel: "nivel",
    nível: "nivel",
    dting: "dting_ctd",
    dtingctd: "dting_ctd",
    dtinicio: "dting_ctd",
    dtinicioctd: "dting_ctd",
    dtingressoctd: "dting_ctd",
    inicio: "dting_ctd",
    dtfim: "dtfimctd",
    dtfimctd: "dtfimctd",
    fim: "dtfimctd",
    fimctd: "dtfimctd",
    dtfimct: "dtfimctd",
    ativo: "ativo",
    status: "ativo",
    situacao: "ativo",
  };

  return mapping[lower] || lower;
}

function normalizePosition(pos: string | undefined): string | null {
  if (!pos) return null;
  const upper = (pos || "")
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const variants: Record<string, string> = {
    AOE: "AOE",
    "AUXILIAR DE LIMPEZA": "AUXILIAR DE LIMPEZA",
    "AUXILIAR LIMPEZA": "AUXILIAR DE LIMPEZA",
    LIMPEZA: "AUXILIAR DE LIMPEZA",
    CUIDORA: "CUIDADOR(A)",
    CUIDADORA: "CUIDADOR(A)",
    "CUIDADOR(A)": "CUIDADOR(A)",
    CUIDADOR: "CUIDADOR(A)",
    "DIRETOR DE ESCOLA": "DIRETOR DE ESCOLA",
    DIRETOR: "DIRETOR DE ESCOLA",
    MERENDEIRA: "MERENDEIRA",
    "PEB I": "PEB I",
    "PEB I1": "PEB I",
    PEBI: "PEB I",
    "PEB II": "PEB II",
    PEBII: "PEB II",
    PEB: "PEB II",
    PEFM: "PEFM",
    PROTA: "PROATI",
    PROATI: "PROATI",
    "SECRETARIO DE ESCOLA": "SECRETÁRIO DE ESCOLA",
    SECRETARIO: "SECRETÁRIO DE ESCOLA",
    "SECRETÁRIO DE ESCOLA": "SECRETÁRIO DE ESCOLA",
  };

  return variants[upper] || upper;
}

function normalizeCategory(cat: string | undefined): string | null {
  if (!cat) return null;
  // Remove pontos, traços, espaços extras e normaliza acentos
  const upper = (cat || "")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[\.\-\/]/g, "") // Remove pontos, traços, barras
    .replace(/\s+/g, " ") // Normaliza espaços
    .trim();

  // A - Efetivo
  if (
    upper === "A" ||
    upper.includes("EFETIVO") ||
    upper.includes("EFET") ||
    upper === "EFETIVO"
  )
    return "A";

  // ACT
  if (upper === "ACT" || upper.includes("ACT")) return "ACT";

  // CTD
  if (upper === "CTD" || upper.includes("CTD")) return "CTD";

  // CLT - aceita várias variações
  if (
    upper === "CLT" ||
    upper.includes("CLT") ||
    upper === "CELETISTA" ||
    upper.includes("CELET")
  )
    return "CLT";

  return null;
}

/**
 * Converte data do Excel para string ISO yyyy-mm-dd
 */
function parseExcelDate(value: unknown): string | null {
  if (!value && value !== 0) return null;

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    const isoDate = new Date(trimmed);
    if (!isNaN(isoDate.getTime())) {
      return isoDate.toISOString().split("T")[0];
    }
  }

  return null;
}

/**
 * Normaliza campo "ativo" (Sim/Não, S/N, true/false, 1/0)
 */
function parseActive(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true; // padrão: ativo
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const str = value.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["sim", "s", "true", "1", "ativo", "yes", "y"].includes(str)) return true;
  if (["nao", "n", "false", "0", "inativo", "no"].includes(str)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "upsert";

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Planilha vazia" }, { status: 400 });
    }

    const firstRow = rows[0];
    const colMap: Record<string, string> = {};
    Object.keys(firstRow).forEach((col) => {
      colMap[col] = normalizeColumnName(col);
    });

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      total: rows.length,
      errors: [] as Array<{ row: number; message: string; data?: unknown }>,
    };

    const importMode = mode === "create" ? "create" : mode === "update" ? "update" : "upsert";

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const getValue = (field: string): unknown => {
          const originalCol = Object.keys(colMap).find((k) => colMap[k] === field);
          if (!originalCol) return null;
          const v = row[originalCol];
          return v === "" || v === null || v === undefined ? null : v;
        };

        const name = getValue("nome")?.toString().trim();
        const rawCpf = getValue("cpf");
        // Garante que CPF seja sempre string
        const cpfString = rawCpf ? String(rawCpf).trim() : null;
        const cpf = cpfString ? cleanCPF(cpfString).padStart(11, '0') : null;
        const rgCin = getValue("rgcin")?.toString().trim() || null;
        const birthDateRaw = getValue("dtnasc");
        const birthDate = birthDateRaw ? parseExcelDate(birthDateRaw) : null;
        const rawPhone = getValue("tel")?.toString();
        const phone = rawPhone ? cleanPhone(rawPhone) : null;
        const email = getValue("email")?.toString().trim().toLowerCase() || null;
        const rawPosition = getValue("cargo")?.toString();
        const position = normalizePosition(rawPosition);
        const rawCategory = getValue("categoria")?.toString();
        const category = normalizeCategory(rawCategory);

        // Novos campos
        const faixa = getValue("faixa")?.toString().trim().toUpperCase() || null;
        const nivel = getValue("nivel")?.toString().trim().toUpperCase() || null;
        const ctdStartDateRaw = getValue("dting_ctd");
        const ctdStartDate = ctdStartDateRaw ? parseExcelDate(ctdStartDateRaw) : null;
        const ctdEndDateRaw = getValue("dtfimctd");
        const ctdEndDate = ctdEndDateRaw ? parseExcelDate(ctdEndDateRaw) : null;
        const active = parseActive(getValue("ativo"));

        if (!name) {
          results.skipped++;
          results.errors.push({ row: rowNum, message: "Nome ausente" });
          continue;
        }

        if (!cpf || !validateCPF(cpf)) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            message: "CPF ausente ou inválido",
            data: { nome: name, cpf: rawCpf },
          });
          continue;
        }

        if (email && !validateEmail(email)) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            message: "Email inválido",
            data: { nome: name, email },
          });
          continue;
        }

        if (phone && !validatePhone(phone)) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            message: "Telefone inválido",
            data: { nome: name, phone: rawPhone },
          });
          continue;
        }

        if (!position || !POSITIONS.includes(position as (typeof POSITIONS)[number])) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            message: `Cargo inválido: "${rawPosition || "(vazio)"}"`,
            data: { nome: name, cargo: rawPosition },
          });
          continue;
        }

        if (
          !category ||
          !CATEGORIES.map((c) => c.code).includes(
            category as (typeof CATEGORIES)[number]["code"]
          )
        ) {
          results.skipped++;
          results.errors.push({
            row: rowNum,
            message: `Categoria inválida: "${rawCategory || "(vazio)"}"`,
            data: { nome: name, categoria: rawCategory },
          });
          continue;
        }

        const [existing] = await db
          .select()
          .from(servers)
          .where(eq(servers.cpf, cpf))
          .limit(1);

        if (existing) {
          if (importMode === "create") {
            results.skipped++;
            results.errors.push({
              row: rowNum,
              message: "CPF já cadastrado (modo criação)",
              data: { nome: name, cpf },
            });
            continue;
          }

          await db
            .update(servers)
            .set({
              name,
              rgCin,
              birthDate,
              phone,
              email,
              position,
              category,
              faixa,
              nivel,
              ctdStartDate,
              ctdEndDate,
              active,
              updatedAt: new Date(),
            })
            .where(eq(servers.cpf, cpf));
          results.updated++;
        } else {
          if (importMode === "update") {
            results.skipped++;
            results.errors.push({
              row: rowNum,
              message: "Servidor não encontrado (modo atualização)",
              data: { nome: name, cpf },
            });
            continue;
          }

          await db.insert(servers).values({
            name,
            cpf,
            rgCin,
            birthDate,
            phone,
            email,
            position,
            category,
            faixa,
            nivel,
            ctdStartDate,
            ctdEndDate,
            active,
          });
          results.imported++;
        }
      } catch (err) {
        results.skipped++;
        results.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : "Erro desconhecido",
          data: row,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Erro ao importar planilha:", error);
    return NextResponse.json({ error: "Erro ao processar a planilha" }, { status: 500 });
  }
}
