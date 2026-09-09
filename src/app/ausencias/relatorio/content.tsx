"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Calendar, FileText } from "lucide-react";
import type { Server, Absence } from "@/db/schema";
import { ABSENCE_ALL } from "@/db/schema";
import { formatDate } from "@/lib/format";

interface ServerAbsences {
  server: Server;
  absences: Absence[];
}

export default function RelatorioAusenciasContent() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  const [servers, setServers] = useState<Server[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthParam || new Date().getMonth() + 1 < 10
      ? `0${new Date().getMonth() + 1}`
      : `${new Date().getMonth() + 1}`
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    yearParam || new Date().getFullYear().toString()
  );
  const [selectedServerId, setSelectedServerId] = useState<string>("all");
  const [reportData, setReportData] = useState<ServerAbsences[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    if (servers.length > 0) {
      loadReport();
    }
  }, [selectedMonth, selectedYear, selectedServerId, servers]);

  const loadServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/servers?limit=500");
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const serversToFetch =
        selectedServerId === "all" ? servers : servers.filter((s) => s.id === selectedServerId);

      const results: ServerAbsences[] = [];

      for (const server of serversToFetch) {
        const res = await fetch(`/api/absences?serverId=${server.id}`);
        const data = await res.json();
        const absences: Absence[] = data.absences || [];

        // Filtra por mês/ano
        const filtered = absences.filter((a) => {
          const date = new Date(a.systemDate);
          return (
            date.getMonth() + 1 === parseInt(selectedMonth) &&
            date.getFullYear() === parseInt(selectedYear)
          );
        });

        if (filtered.length > 0) {
          results.push({ server, absences: filtered });
        }
      }

      setReportData(results);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getMonthName = (month: number): string => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[month - 1];
  };

  const getSubtypeLabel = (subtype: string | null): string => {
    if (!subtype) return "";
    const found = ABSENCE_ALL.find((a) => a.code === subtype);
    return found ? found.label : subtype;
  };

  const isPeriodType = (subtype: string) =>
    ["LICENCA_SAUDE", "AUXILIO_DOENCA", "LICENCA_PREMIO"].includes(subtype);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header (não imprimível) */}
      <div className="mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-slate-900">Relatório de Ausências</h2>
        <p className="mt-1 text-sm text-slate-600">
          Relatório mensal de ausências e orientações técnicas
        </p>
      </div>

      {/* Filtros (não imprimível) */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Filtros do Relatório</h3>
            <p className="text-sm text-slate-500">Selecione o período e servidor</p>
          </div>
          {reportData.length > 0 && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Imprimir Relatório
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m < 10 ? `0${m}` : `${m}`}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Ano</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(
                  (y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Servidor</label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              >
                <option value="all">Todos os Servidores</option>
                {servers.map((server) => (
                  <option key={server.id} value={server.id}>
                    {server.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Relatório */}
      {loadingReport ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          <p className="mt-4 text-sm text-slate-500">Gerando relatório...</p>
        </div>
      ) : reportData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center print:hidden">
          <Calendar className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">
            Nenhum registro encontrado para o período selecionado
          </p>
        </div>
      ) : (
        <ReportContent
          data={reportData}
          month={parseInt(selectedMonth)}
          year={parseInt(selectedYear)}
          getMonthName={getMonthName}
          getSubtypeLabel={getSubtypeLabel}
          isPeriodType={isPeriodType}
        />
      )}
    </div>
  );
}

function ReportContent({
  data,
  month,
  year,
  getMonthName,
  getSubtypeLabel,
  isPeriodType,
}: {
  data: ServerAbsences[];
  month: number;
  year: number;
  getMonthName: (m: number) => string;
  getSubtypeLabel: (s: string | null) => string;
  isPeriodType: (s: string) => boolean;
}) {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="report-container bg-white">
      {data.map((item, index) => (
        <div key={item.server.id} className={index > 0 ? "mt-8 print:mt-8" : ""}>
          {/* Cabeçalho Institucional */}
          <div className="mb-6 border-2 border-black p-4">
            <div className="text-center">
              <p className="text-sm font-bold uppercase">Governo do Estado de São Paulo</p>
              <p className="text-sm font-bold uppercase">Secretaria da Educação</p>
              <p className="mt-2 text-base font-bold uppercase">EE Profa. Marlene Frattini</p>
              <div className="mt-3 border-t border-black pt-3">
                <p className="text-lg font-bold uppercase">
                  Relatório de Ausências - {getMonthName(month)}/{year}
                </p>
                <p className="mt-1 text-sm">Emitido em {today}</p>
              </div>
            </div>
          </div>

          {/* Dados do Servidor */}
          <div className="mb-6 border border-black p-4">
            <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
              I. Dados do Servidor
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-bold">Nome:</p>
                <p>{item.server.name}</p>
              </div>
              <div>
                <p className="font-bold">Cargo:</p>
                <p>{item.server.position}</p>
              </div>
              <div>
                <p className="font-bold">Categoria:</p>
                <p>{item.server.category}</p>
              </div>
              <div>
                <p className="font-bold">Período do Relatório:</p>
                <p>
                  {getMonthName(month)}/{year}
                </p>
              </div>
            </div>
          </div>

          {/* Resumo */}
          <div className="mb-6 border-2 border-black p-4">
            <h2 className="mb-3 border-b-2 border-black pb-2 text-base font-bold uppercase">
              II. Resumo do Período
            </h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="border border-black p-3">
                <p className="font-bold">Total de Registros:</p>
                <p className="mt-1 text-2xl font-bold">{item.absences.length}</p>
              </div>
              <div className="border border-black p-3">
                <p className="font-bold">Ausências:</p>
                <p className="mt-1 text-2xl font-bold">
                  {item.absences.filter((a) => a.type === "AUSENCIA").length}
                </p>
              </div>
              <div className="border border-black p-3">
                <p className="font-bold">Orientações Técnicas:</p>
                <p className="mt-1 text-2xl font-bold">
                  {item.absences.filter((a) => a.type === "ORIENTACAO_TECNICA").length}
                </p>
              </div>
            </div>
          </div>

          {/* Detalhamento - Ausências */}
          {item.absences.filter((a) => a.type === "AUSENCIA").length > 0 && (
            <div className="mb-6 border border-black p-4">
              <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
                III. Ausências Registradas
              </h2>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="print-table-header">
                    <th className="border border-black px-2 py-1 text-left font-bold">Data</th>
                    <th className="border border-black px-2 py-1 text-left font-bold">Tipo</th>
                    <th className="border border-black px-2 py-1 text-left font-bold">
                      Período/Dias
                    </th>
                    <th className="border border-black px-2 py-1 text-left font-bold">DOE</th>
                  </tr>
                </thead>
                <tbody>
                  {item.absences
                    .filter((a) => a.type === "AUSENCIA")
                    .map((absence) => (
                      <tr key={absence.id}>
                        <td className="border border-black px-2 py-1">
                          {formatDate(absence.systemDate)}
                        </td>
                        <td className="border border-black px-2 py-1">
                          {getSubtypeLabel(absence.subtype)}
                        </td>
                        <td className="border border-black px-2 py-1">
                          {isPeriodType(absence.subtype || "") ? (
                            <>
                              {formatDate(absence.startDate)} → {formatDate(absence.endDate)}
                              <br />
                              <strong>{absence.days} dias</strong>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="border border-black px-2 py-1">
                          {absence.doeDate ? formatDate(absence.doeDate) : "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detalhamento - Orientações Técnicas */}
          {item.absences.filter((a) => a.type === "ORIENTACAO_TECNICA").length > 0 && (
            <div className="mb-6 border border-black p-4">
              <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
                IV. Orientações Técnicas / Formações
              </h2>
              <table className="w-full border-collapse border border-black text-sm">
                <thead>
                  <tr className="print-table-header">
                    <th className="border border-black px-2 py-1 text-left font-bold">Data</th>
                    <th className="border border-black px-2 py-1 text-left font-bold">Título</th>
                    <th className="border border-black px-2 py-1 text-left font-bold">Local</th>
                    <th className="border border-black px-2 py-1 text-left font-bold">Horário</th>
                  </tr>
                </thead>
                <tbody>
                  {item.absences
                    .filter((a) => a.type === "ORIENTACAO_TECNICA")
                    .map((absence) => (
                      <tr key={absence.id}>
                        <td className="border border-black px-2 py-1">
                          {absence.dateTBD ? "A informar" : formatDate(absence.systemDate)}
                        </td>
                        <td className="border border-black px-2 py-1">{absence.title}</td>
                        <td className="border border-black px-2 py-1">{absence.location}</td>
                        <td className="border border-black px-2 py-1">
                          {absence.startTime} - {absence.endTime}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé */}
          <div className="mt-8 border-t-2 border-black pt-4 text-center text-xs">
            <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
            <p>EE Profa. Marlene Frattini • {today}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
