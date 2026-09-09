"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Upload,
  Download,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Users,
  X,
  MoreVertical,
  FileSpreadsheet,
} from "lucide-react";
import type { Server } from "@/db/schema";
import { POSITIONS, CATEGORIES } from "@/db/schema";
import { formatCPF, formatPhone, formatDate, calculateAge } from "@/lib/format";
import { ServerFormModal } from "@/components/ServerFormModal";
import { ImportModal } from "@/components/ImportModal";
import { ServerDetails } from "@/components/ServerDetails";

export default function CadastrosPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [viewingServer, setViewingServer] = useState<Server | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadServers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterPosition) params.set("position", filterPosition);
      if (filterCategory) params.set("category", filterCategory);
      params.set("limit", "500");
      const res = await fetch(`/api/servers?${params.toString()}`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch (err) {
      showToast("error", "Erro ao carregar servidores");
    } finally {
      setLoading(false);
    }
  }, [search, filterPosition, filterCategory]);

  useEffect(() => {
    const t = setTimeout(loadServers, 300);
    return () => clearTimeout(t);
  }, [loadServers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.")) {
      setDeletingId(null);
      return;
    }
    try {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir");
        return;
      }
      showToast("success", "Servidor excluído com sucesso");
      loadServers();
    } catch (err) {
      showToast("error", "Erro ao excluir servidor");
    } finally {
      setDeletingId(null);
      setOpenMenuId(null);
    }
  };

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setShowFormModal(true);
    setOpenMenuId(null);
  };

  const handleView = (server: Server) => {
    setViewingServer(server);
    setOpenMenuId(null);
  };

  const handleExport = () => {
    if (servers.length === 0) {
      showToast("error", "Nenhum servidor para exportar");
      return;
    }
    const headers = [
      "Nome", "CPF", "RG/CIN", "Data Nasc.", "Telefone", "Email",
      "Cargo", "Categoria", "Faixa", "Nível", "Função Designada", "Início CTD", "Fim CTD", "Ativo", "Observações"
    ];
    const rows = servers.map((s) => [
      s.name,
      formatCPF(s.cpf),
      s.rgCin || "",
      formatDate(s.birthDate || ""),
      s.phone ? formatPhone(s.phone) : "",
      s.email || "",
      s.position,
      s.category,
      s.faixa || "",
      s.nivel || "",
      s.designatedFunction || "",
      s.ctdStartDate ? formatDate(s.ctdStartDate) : "",
      s.ctdEndDate ? formatDate(s.ctdEndDate) : "",
      s.active ? "Sim" : "Não",
      s.notes || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `servidores_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", `${servers.length} servidores exportados`);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterPosition("");
    setFilterCategory("");
  };

  const hasActiveFilters = search || filterPosition || filterCategory;

  const stats = {
    total: servers.length,
    byCategory: servers.reduce<Record<string, number>>((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <div className="min-h-screen">
      {toast && (
        <div className="fixed right-4 top-4 z-[100] animate-[slideIn_0.3s_ease-out]">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                <Users className="h-3.5 w-3.5" />
                Módulo Cadastro
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                Cadastro de Servidores
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gerencie o cadastro e dados funcionais dos servidores da escola
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar Excel</span>
              </button>
              <button
                onClick={() => {
                  setEditingServer(null);
                  setShowFormModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Servidor</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 sm:col-span-1">
            <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat.code} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{cat.code}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.byCategory[cat.code] || 0}
              </p>
              <p className="text-xs text-slate-500">{cat.label.split(" - ")[1]}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CPF ou email..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    showFilters || hasActiveFilters
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {hasActiveFilters && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      {[search, filterPosition, filterCategory].filter(Boolean).length}
                    </span>
                  )}
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </button>
                )}
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  title="Exportar CSV"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Cargo</label>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todos os cargos</option>
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    Categoria
                  </label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Todas as categorias</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="mt-4 text-sm text-slate-500">Carregando servidores...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <FileSpreadsheet className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                {hasActiveFilters
                  ? "Nenhum servidor encontrado com esses filtros"
                  : "Nenhum servidor cadastrado"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                {hasActiveFilters
                  ? "Tente ajustar os filtros ou limpar a busca."
                  : "Comece adicionando servidores individualmente ou importando uma planilha Excel."}
              </p>
              <div className="mt-4 flex gap-2">
                {!hasActiveFilters && (
                  <>
                    <button
                      onClick={() => {
                        setEditingServer(null);
                        setShowFormModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Manualmente
                    </button>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Upload className="h-4 w-4" />
                      Importar Excel
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-visible">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Servidor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      CPF
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Contato
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servers.map((server, index) => {
                    const age = calculateAge(server.birthDate);
                    const isLast = index === servers.length - 1;
                    return (
                      <tr
                        key={server.id}
                        className="group transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                              {server.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-slate-900">{server.name}</p>
                                {!server.active && (
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                    INATIVO
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-slate-500">
                                {server.email || server.phone ? formatPhone(server.phone || "") : "Sem contato"}
                                {age && ` • ${age} anos`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          {formatCPF(server.cpf)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                              {server.position}
                            </span>
                            {server.designatedFunction && (
                              <span className="block rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                ⚡ {server.designatedFunction}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <CategoryBadge code={server.category} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="text-xs">
                            {(server.faixa || server.nivel) && (
                              <p className="font-medium text-slate-700">
                                {server.faixa && <span>F{server.faixa}</span>}
                                {server.faixa && server.nivel && <span> </span>}
                                {server.nivel && <span>N{server.nivel}</span>}
                              </p>
                            )}
                            {server.phone && <p>{formatPhone(server.phone)}</p>}
                            {server.email && <p className="truncate">{server.email}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === server.id ? null : server.id)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Ações"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openMenuId === server.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setOpenMenuId(null)}
                                />
                                <div className={`absolute right-0 z-20 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg ${isLast ? "bottom-full mb-1" : "top-full mt-1"}`}>
                                  <button
                                    onClick={() => handleView(server)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Ver Detalhes
                                  </button>
                                  <button
                                    onClick={() => handleEdit(server)}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingId(server.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && servers.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Mostrando <span className="font-semibold">{servers.length}</span> servidor
              {servers.length !== 1 ? "es" : ""}
            </div>
          )}
        </div>
      </div>

      <ServerFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingServer(null);
        }}
        onSuccess={() => {
          loadServers();
          showToast("success", editingServer ? "Servidor atualizado" : "Servidor cadastrado");
        }}
        server={editingServer}
      />

      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadServers();
          showToast("success", "Importação concluída com sucesso");
        }}
      />

      {viewingServer && (
        <ServerDetails
          server={viewingServer}
          onClose={() => setViewingServer(null)}
          onEdit={() => {
            setEditingServer(viewingServer);
            setViewingServer(null);
            setShowFormModal(true);
          }}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir servidor</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBadge({ code }: { code: string }) {
  const styles: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ACT: "bg-blue-100 text-blue-800 border-blue-200",
    CTD: "bg-violet-100 text-violet-800 border-violet-200",
    CLT: "bg-amber-100 text-amber-800 border-amber-200",
  };
  const labels: Record<string, string> = {
    A: "Efetivo",
    ACT: "ACT",
    CTD: "CTD",
    CLT: "CLT",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
        styles[code] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      {code} • {labels[code] || code}
    </span>
  );
}
