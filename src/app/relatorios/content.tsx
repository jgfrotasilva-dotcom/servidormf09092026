"use client";

import { useEffect, useState } from "react";
import { Printer, Download } from "lucide-react";
import type { Server } from "@/db/schema";
import { CATEGORIES, DESIGNATED_FUNCTIONS } from "@/db/schema";
import { formatDate, formatCPF, formatPhone } from "@/lib/format";
import { AdminHeader } from "@/components/AdminHeader";

type ReportType = "geral" | "cargo" | "categoria";

export default function RelatoriosContent() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("geral");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("ativo");

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const res = await fetch("/api/servers?limit=1000");
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const filtered = getFilteredServers();
    if (filtered.length === 0) return;

    const headers = [
      "Nº", "Nome", "CPF", "Cargo", "Categoria", "Função Designada",
      "Faixa", "Nível", "Situação", "Telefone", "Email", "Data Nasc."
    ];

    const rows = filtered.map((s, idx) => [
      idx + 1,
      s.name,
      formatCPF(s.cpf),
      s.position,
      getCategoryLabel(s.category),
      s.designatedFunction ? getDesignatedFunctionLabel(s.designatedFunction) : "",
      s.faixa || "",
      s.nivel || "",
      s.active ? "Ativo" : "Inativo",
      s.phone ? formatPhone(s.phone) : "",
      s.email || "",
      s.birthDate ? formatDate(s.birthDate) : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${reportType}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryLabel = (code: string): string => {
    const cat = CATEGORIES.find((c) => c.code === code);
    return cat ? cat.label : code;
  };

  const getDesignatedFunctionLabel = (code: string | null): string => {
    if (!code) return "";
    const func = DESIGNATED_FUNCTIONS.find((f) => f.code === code);
    return func ? func.label : code;
  };

  const getFilteredServers = (): Server[] => {
    let filtered = [...servers];

    if (filterPosition !== "all") {
      filtered = filtered.filter((s) => s.position === filterPosition);
    }
    if (filterCategory !== "all") {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }
    if (filterStatus !== "all") {
      const isActive = filterStatus === "ativo";
      filtered = filtered.filter((s) => s.active === isActive);
    }

    if (reportType === "cargo") {
      filtered.sort((a, b) => a.position.localeCompare(b.position) || a.name.localeCompare(b.name));
    } else if (reportType === "categoria") {
      filtered.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const getReportTitle = (): string => {
    const titles: Record<ReportType, string> = {
      geral: "Relatório Geral de Servidores",
      cargo: "Relatório de Servidores por Cargo",
      categoria: "Relatório de Servidores por Categoria",
    };
    return titles[reportType];
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const filteredServers = getFilteredServers();

  return (
    <>
      <AdminHeader
        title="Relatórios"
        subtitle="Geração de relatórios de servidores"
      />
      <div className="min-h-screen bg-slate-50">
        {/* Controles (não imprimíveis) */}
        <div className="bg-white border-b border-slate-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-2 justify-end mb-4">
              <button
                onClick={handleExportCSV}
                disabled={filteredServers.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={handlePrint}
                disabled={filteredServers.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>

            {/* Tipo de Relatório */}
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Relatório:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setReportType("geral")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    reportType === "geral" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => setReportType("cargo")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    reportType === "cargo" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                  }`}
                >
                  Por Cargo
                </button>
                <button
                  onClick={() => setReportType("categoria")}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    reportType === "categoria" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border border-slate-300"
                  }`}
                >
                  Por Categoria
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cargo:</label>
                <select
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos</option>
                  {Array.from(new Set(servers.map((s) => s.position))).map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria:</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="all">Todas</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situação:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="ativo">Apenas Ativos</option>
                  <option value="all">Todos</option>
                  <option value="inativo">Apenas Inativos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Relatório */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredServers.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <h3 className="text-lg font-medium text-slate-900 mt-4">Nenhum servidor encontrado</h3>
              <p className="text-slate-600 mt-2">
                Ajuste os filtros ou cadastre servidores para gerar relatórios.
              </p>
            </div>
          ) : (
            <ReportDocument
              servers={filteredServers}
              reportType={reportType}
              reportTitle={getReportTitle()}
              today={today}
              getCategoryLabel={getCategoryLabel}
              getDesignatedFunctionLabel={getDesignatedFunctionLabel}
            />
          )}
        </div>
      </div>
    </>
  );
}

function ReportDocument({
  servers,
  reportType,
  reportTitle,
  today,
  getCategoryLabel,
  getDesignatedFunctionLabel,
}: {
  servers: Server[];
  reportType: ReportType;
  reportTitle: string;
  today: string;
  getCategoryLabel: (code: string) => string;
  getDesignatedFunctionLabel: (code: string | null) => string;
}) {
  const groupedData: Record<string, Server[]> = {};

  if (reportType === "cargo") {
    servers.forEach((s) => {
      if (!groupedData[s.position]) groupedData[s.position] = [];
      groupedData[s.position].push(s);
    });
  } else if (reportType === "categoria") {
    servers.forEach((s) => {
      if (!groupedData[s.category]) groupedData[s.category] = [];
      groupedData[s.category].push(s);
    });
  } else {
    groupedData["Servidores"] = servers;
  }

  return (
    <div className="report-document bg-white shadow">
      {/* Cabeçalho Institucional */}
      <div className="report-header p-8 border-b-2 border-black">
        <div className="text-center space-y-0.5">
          <p className="text-xs uppercase tracking-wider font-semibold">Governo do Estado de São Paulo</p>
          <p className="text-xs uppercase tracking-wider font-semibold">Secretaria de Estado da Educação</p>
          <p className="text-xs uppercase tracking-wider font-semibold">Unidade Regional de Ensino de Araraquara</p>
          <p className="text-sm font-bold uppercase mt-2 tracking-wide">
            EE Profa. Marlene Frattini
          </p>
        </div>
      </div>

      {/* Título do Relatório */}
      <div className="report-title p-6 border-b border-slate-300 bg-slate-50">
        <h2 className="text-xl font-bold text-center text-slate-900">{reportTitle}</h2>
        <p className="text-sm text-center text-slate-600 mt-2">Emitido em {today}</p>
        <p className="text-sm text-center text-slate-600">Total: {servers.length} servidor(es)</p>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {Object.entries(groupedData).map(([group, groupServers]) => (
          <div key={group} className="mb-8">
            {reportType !== "geral" && (
              <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b-2 border-slate-300">
                {reportType === "cargo" ? group : getCategoryLabel(group)} ({groupServers.length})
              </h3>
            )}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Nº</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Nome</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">CPF</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Cargo</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Categoria</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Função</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Faixa</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Nível</th>
                  <th className="border border-slate-300 px-3 py-2 text-left text-xs font-bold text-slate-700">Situação</th>
                </tr>
              </thead>
              <tbody>
                {groupServers.map((server, idx) => (
                  <tr key={server.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 px-3 py-2 text-sm">{idx + 1}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm font-medium">{server.name}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm font-mono">{formatCPF(server.cpf)}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{server.position}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{getCategoryLabel(server.category)}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{getDesignatedFunctionLabel(server.designatedFunction)}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{server.faixa || "-"}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{server.nivel || "-"}</td>
                    <td className="border border-slate-300 px-3 py-2 text-sm">{server.active ? "Ativo" : "Inativo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="report-footer p-6 border-t border-slate-300 bg-slate-50 text-center">
        <p className="text-xs text-slate-600">Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
        <p className="text-xs text-slate-600 mt-1">EE Profa. Marlene Frattini • {today}</p>
      </div>
    </div>
  );
}
