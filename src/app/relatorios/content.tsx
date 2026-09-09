"use client";

import { useEffect, useState } from "react";
import { Printer, FileText, Users, Filter, Download } from "lucide-react";
import type { Server } from "@/db/schema";
import { CATEGORIES, DESIGNATED_FUNCTIONS, POSITIONS } from "@/db/schema";
import { formatDate, formatCPF, formatPhone } from "@/lib/format";

type ReportType = "geral" | "cargo" | "categoria";

export default function RelatoriosContent() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>("geral");
  const [filterPosition, setFilterPosition] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
      "Nome", "CPF", "Cargo", "Categoria", "Função Designada",
      "Faixa", "Nível", "Situação", "Telefone", "Email", "Data Nasc."
    ];

    const rows = filtered.map((s) => [
      s.name,
      formatCPF(s.cpf),
      s.position,
      getDesignatedFunctionLabel(s.designatedFunction),
      getCategoryLabel(s.category),
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

    // Filtros
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

    // Ordenação conforme tipo de relatório
    switch (reportType) {
      case "cargo":
        filtered.sort((a, b) => {
          const posCompare = a.position.localeCompare(b.position);
          if (posCompare !== 0) return posCompare;
          return a.name.localeCompare(b.name);
        });
        break;
      case "categoria":
        filtered.sort((a, b) => {
          const catCompare = a.category.localeCompare(b.category);
          if (catCompare !== 0) return catCompare;
          return a.name.localeCompare(b.name);
        });
        break;
      default: // geral - ordem alfabética
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  };

  const filteredServers = getFilteredServers();

  const getReportTitle = (): string => {
    switch (reportType) {
      case "cargo":
        return "Relatório por Cargo";
      case "categoria":
        return "Relatório por Categoria";
      default:
        return "Relatório Geral de Servidores";
    }
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Estatísticas
  const totalAtivos = filteredServers.filter((s) => s.active).length;
  const totalInativos = filteredServers.filter((s) => !s.active).length;
  const byCategory = filteredServers.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
                <p className="text-sm text-slate-600">
                  Relatórios gerais e específicos de servidores
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={filteredServers.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </button>
              <button
                onClick={handlePrint}
                disabled={filteredServers.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tipo de Relatório */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 print:hidden">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Tipo de Relatório
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setReportType("geral")}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === "geral"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <h3 className="font-semibold text-slate-900">Relatório Geral</h3>
              <p className="text-sm text-slate-600 mt-1">
                Todos os servidores em ordem alfabética
              </p>
            </button>
            <button
              onClick={() => setReportType("cargo")}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === "cargo"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <h3 className="font-semibold text-slate-900">Por Cargo</h3>
              <p className="text-sm text-slate-600 mt-1">
                Agrupado por cargo, depois alfabético
              </p>
            </button>
            <button
              onClick={() => setReportType("categoria")}
              className={`p-4 rounded-lg border-2 transition-all ${
                reportType === "categoria"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <h3 className="font-semibold text-slate-900">Por Categoria</h3>
              <p className="text-sm text-slate-600 mt-1">
                Agrupado por categoria, depois alfabético
              </p>
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">Todos os cargos</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">Todas as categorias</option>
                {CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Situação</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="all">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900">{filteredServers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">Ativos</p>
            <p className="text-2xl font-bold text-emerald-700">{totalAtivos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">Inativos</p>
            <p className="text-2xl font-bold text-red-700">{totalInativos}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">A - Efetivo</p>
            <p className="text-2xl font-bold text-blue-700">{byCategory.A || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">ACT - F</p>
            <p className="text-2xl font-bold text-purple-700">{byCategory.ACT || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-slate-600">CLT/CTD</p>
            <p className="text-2xl font-bold text-amber-700">
              {(byCategory.CLT || 0) + (byCategory.CTD || 0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredServers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 mt-4">Nenhum servidor encontrado</h3>
            <p className="text-slate-600 mt-2">
              Ajuste os filtros ou cadastre servidores para gerar relatórios.
            </p>
          </div>
        ) : (
          <ReportContent
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
  );
}

function ReportContent({
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
  // Agrupar servidores conforme tipo de relatório
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
    groupedData["geral"] = servers;
  }

  return (
    <div className="bg-white report-container">
      {/* Cabeçalho Institucional */}
      <div className="p-6 border-b-2 border-black">
        <div className="text-center">
          <p className="text-sm font-bold uppercase">Governo do Estado de São Paulo</p>
          <p className="text-sm font-bold uppercase">Secretaria da Educação</p>
          <p className="mt-2 text-base font-bold uppercase">EE Profa. Marlene Frattini</p>
          <div className="mt-3 border-t-2 border-black pt-3">
            <p className="text-lg font-bold uppercase">{reportTitle}</p>
            <p className="text-sm mt-1">Emitido em {today}</p>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-bold">Total de Servidores:</p>
            <p className="text-lg">{servers.length}</p>
          </div>
          <div>
            <p className="font-bold">Ativos:</p>
            <p className="text-lg">{servers.filter((s) => s.active).length}</p>
          </div>
          <div>
            <p className="font-bold">Inativos:</p>
            <p className="text-lg">{servers.filter((s) => !s.active).length}</p>
          </div>
          <div>
            <p className="font-bold">Tipo de Relatório:</p>
            <p className="text-lg">
              {reportType === "geral" ? "Geral (Alfabético)" :
               reportType === "cargo" ? "Por Cargo" : "Por Categoria"}
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-6">
        {reportType === "geral" ? (
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-slate-200 print:bg-slate-200">
                <th className="border border-black px-2 py-1 text-left font-bold">Nº</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Nome</th>
                <th className="border border-black px-2 py-1 text-left font-bold">CPF</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Cargo</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Categoria</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Função Designada</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server, idx) => (
                <tr key={server.id}>
                  <td className="border border-black px-2 py-1">{idx + 1}</td>
                  <td className="border border-black px-2 py-1 font-medium">{server.name}</td>
                  <td className="border border-black px-2 py-1 font-mono text-xs">
                    {formatCPF(server.cpf)}
                  </td>
                  <td className="border border-black px-2 py-1">{server.position}</td>
                  <td className="border border-black px-2 py-1">
                    {getCategoryLabel(server.category)}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {server.designatedFunction
                      ? getDesignatedFunctionLabel(server.designatedFunction)
                      : "-"}
                  </td>
                  <td className="border border-black px-2 py-1">
                    {server.active ? "Ativo" : "Inativo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedData)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, groupServers]) => (
                <div key={group}>
                  <h3 className="text-base font-bold uppercase mb-2 border-b-2 border-slate-400 pb-1">
                    {reportType === "cargo" ? group : getCategoryLabel(group)} ({groupServers.length})
                  </h3>
                  <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border border-black px-2 py-1 text-left font-bold">Nº</th>
                        <th className="border border-black px-2 py-1 text-left font-bold">Nome</th>
                        <th className="border border-black px-2 py-1 text-left font-bold">CPF</th>
                        <th className="border border-black px-2 py-1 text-left font-bold">
                          {reportType === "categoria" ? "Cargo" : "Categoria"}
                        </th>
                        <th className="border border-black px-2 py-1 text-left font-bold">
                          Função Designada
                        </th>
                        <th className="border border-black px-2 py-1 text-left font-bold">Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupServers.map((server, idx) => (
                        <tr key={server.id}>
                          <td className="border border-black px-2 py-1">{idx + 1}</td>
                          <td className="border border-black px-2 py-1 font-medium">{server.name}</td>
                          <td className="border border-black px-2 py-1 font-mono text-xs">
                            {formatCPF(server.cpf)}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {reportType === "categoria" ? server.position : getCategoryLabel(server.category)}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {server.designatedFunction
                              ? getDesignatedFunctionLabel(server.designatedFunction)
                              : "-"}
                          </td>
                          <td className="border border-black px-2 py-1">
                            {server.active ? "Ativo" : "Inativo"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="p-6 border-t-2 border-black text-center text-xs">
        <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
        <p>EE Profa. Marlene Frattini • {today}</p>
      </div>
    </div>
  );
}
