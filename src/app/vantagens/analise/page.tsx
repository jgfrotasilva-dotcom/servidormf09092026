"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { formatDate } from "@/lib/format";

interface ServerAnalysis {
  serverId: string;
  serverName: string;
  position: string;
  category: string;
  faixa: string | null;
  nivel: string | null;
  ats: {
    total: number;
    lastQuinquenio: number | null;
    lastStartDate: string | null;
    nextExpected: string | null;
    daysUntil: number | null;
    status: "OK" | "ATENCAO" | "VENCIDO" | "SEM_DADOS";
  };
  license: {
    totalCerts: number;
    totalBalance: number;
    totalHistorical: number;
    usedBalance: number;
    exhaustedCerts: number;
    status: "OK" | "ATENCAO" | "VENCIDO" | "SEM_DADOS";
    alert: string | null;
  };
  overallStatus: "OK" | "ATENCAO" | "VENCIDO";
}

interface Summary {
  totalServers: number;
  ok: number;
  atencao: number;
  vencido: number;
  atsVencidos: number;
  atsAtencao: number;
  semCertidoes: number;
}

export default function AnalisePage() {
  const [analysis, setAnalysis] = useState<ServerAnalysis[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/servers/advantages-analysis");
      const data = await res.json();
      setAnalysis(data.analysis || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalysis = analysis.filter((a) => {
    if (filterStatus !== "all" && a.overallStatus !== filterStatus) return false;
    if (filterType === "ats_vencido" && a.ats.status !== "VENCIDO") return false;
    if (filterType === "ats_atencao" && a.ats.status !== "ATENCAO") return false;
    if (filterType === "ats_sem_dados" && a.ats.status !== "SEM_DADOS") return false;
    if (filterType === "lic_sem_cert" && a.license.totalCerts === 0) return false;
    if (filterType === "lic_esgotada" && a.license.exhaustedCerts !== a.license.totalCerts)
      return false;
    if (search && !a.serverName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-1 text-xs font-semibold text-indigo-800">
          <TrendingUp className="h-3.5 w-3.5" />
          Visão do Gestor
        </div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Análise Consolidada</h2>
        <p className="mt-1 text-sm text-slate-600">
          Monitoramento de vantagens vencidas ou próximas do vencimento
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Analisando vantagens...</p>
        </div>
      ) : summary ? (
        <>
          {/* Cards de Estatísticas */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-6">
            <SummaryCard
              label="Total de Servidores"
              value={summary.totalServers}
              icon={Users}
              color="slate"
            />
            <SummaryCard
              label="Situação OK"
              value={summary.ok}
              icon={CheckCircle2}
              color="emerald"
            />
            <SummaryCard
              label="Atenção"
              value={summary.atencao}
              icon={AlertTriangle}
              color="amber"
            />
            <SummaryCard
              label="Vencido"
              value={summary.vencido}
              icon={XCircle}
              color="red"
            />
            <SummaryCard
              label="ATS a Vencer"
              value={summary.atsAtencao}
              icon={Clock}
              color="blue"
            />
            <SummaryCard
              label="Sem Certidão"
              value={summary.semCertidoes}
              icon={FileText}
              color="violet"
            />
          </div>

          {/* Alertas Principais */}
          {(summary.vencido > 0 || summary.atsVencidos > 0) && (
            <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-red-900">
                    Situações que Requerem Ação Imediata
                  </h3>
                  <p className="mt-1 text-sm text-red-800">
                    {summary.vencido > 0 && (
                      <span>
                        <strong>{summary.vencido}</strong> servidor(es) com situação vencida.
                      </span>
                    )}{" "}
                    {summary.atsVencidos > 0 && (
                      <span>
                        <strong>{summary.atsVencidos}</strong> servidor(es) com ATS já devido.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar servidor..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">Todos os status</option>
                  <option value="OK">✓ OK</option>
                  <option value="ATENCAO">⚠ Atenção</option>
                  <option value="VENCIDO">✗ Vencido</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="ats_vencido">ATS Vencido</option>
                  <option value="ats_atencao">ATS Vencerá em Breve</option>
                  <option value="ats_sem_dados">ATS Não Cadastrado</option>
                  <option value="lic_sem_cert">Sem Certidão</option>
                  <option value="lic_esgotada">Licença Esgotada</option>
                </select>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setFilterType("all");
                    setSearch("");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Análise */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Servidor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      ATS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Próximo ATS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Licença Prêmio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Saldo Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Situação Geral
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAnalysis.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                            <CheckCircle2 className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="mt-3 text-sm text-slate-500">
                            Nenhum servidor encontrado com esses filtros
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAnalysis.map((item) => (
                      <tr
                        key={item.serverId}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                              {item.serverName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {item.serverName}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {item.position} • {item.category}
                                {item.faixa && ` • F${item.faixa}`}
                                {item.nivel && ` N${item.nivel}`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={item.ats.status}
                            label={
                              item.ats.status === "SEM_DADOS"
                                ? "Não cadastrado"
                                : `${item.ats.total} quinq.`
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {item.ats.nextExpected ? (
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {formatDate(item.ats.nextExpected)}
                              </p>
                              <p
                                className={`text-xs font-semibold ${
                                  item.ats.daysUntil !== null && item.ats.daysUntil < 0
                                    ? "text-red-600"
                                    : item.ats.daysUntil !== null && item.ats.daysUntil <= 180
                                    ? "text-amber-600"
                                    : "text-slate-600"
                                }`}
                              >
                                {item.ats.daysUntil !== null && item.ats.daysUntil < 0
                                  ? `Vencido há ${Math.abs(item.ats.daysUntil)} dias`
                                  : item.ats.daysUntil !== null
                                  ? `em ${item.ats.daysUntil} dias`
                                  : ""}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={item.license.status}
                            label={`${item.license.totalCerts} cert.`}
                            tooltip={item.license.alert}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {item.license.totalBalance}{" "}
                              <span className="text-xs font-normal text-slate-500">
                                / {item.license.totalHistorical} dias
                              </span>
                            </p>
                            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${
                                  item.license.totalBalance === 0
                                    ? "bg-slate-400"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600"
                                }`}
                                style={{
                                  width: `${
                                    item.license.totalHistorical > 0
                                      ? (item.license.totalBalance /
                                          item.license.totalHistorical) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OverallBadge status={item.overallStatus} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/vantagens/ats?server=${item.serverId}`}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                              title="Ver ATS"
                            >
                              <Calendar className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/vantagens/licenca-premio?server=${item.serverId}`}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                              title="Ver Licença Prêmio"
                            >
                              <FileText className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              Mostrando{" "}
              <span className="font-semibold">{filteredAnalysis.length}</span> de{" "}
              <span className="font-semibold">{analysis.length}</span> servidores
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Legenda de Situações</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <LegendItem
                status="OK"
                title="Situação Regular"
                description="Vantagens em dia, sem pendências"
                color="emerald"
              />
              <LegendItem
                status="ATENCAO"
                title="Requer Atenção"
                description="ATS ou licença próximo do vencimento / pendência"
                color="amber"
              />
              <LegendItem
                status="VENCIDO"
                title="Vencido"
                description="ATS já devido ou situação irregular"
                color="red"
              />
              <LegendItem
                status="SEM_DADOS"
                title="Sem Dados"
                description="Vantagem ainda não cadastrada no sistema"
                color="slate"
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "slate" | "emerald" | "amber" | "red" | "blue" | "violet";
}) {
  const colors = {
    slate: "from-slate-600 to-slate-700",
    emerald: "from-emerald-600 to-teal-700",
    amber: "from-amber-500 to-orange-600",
    red: "from-red-600 to-rose-700",
    blue: "from-blue-600 to-indigo-700",
    violet: "from-violet-600 to-purple-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
        </div>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${colors[color]} text-white shadow-md`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  label,
  tooltip,
}: {
  status: string;
  label: string;
  tooltip?: string | null;
}) {
  const styles: Record<string, string> = {
    OK: "bg-emerald-100 text-emerald-800 border-emerald-200",
    ATENCAO: "bg-amber-100 text-amber-800 border-amber-200",
    VENCIDO: "bg-red-100 text-red-800 border-red-200",
    SEM_DADOS: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const icons: Record<string, string> = {
    OK: "✓",
    ATENCAO: "⚠",
    VENCIDO: "✗",
    SEM_DADOS: "-",
  };
  return (
    <span
      title={tooltip || undefined}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span>{icons[status]}</span>
      <span>{label}</span>
    </span>
  );
}

function OverallBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    OK: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      label: "Regular",
      icon: CheckCircle2,
    },
    ATENCAO: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      label: "Atenção",
      icon: AlertTriangle,
    },
    VENCIDO: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      label: "Vencido",
      icon: XCircle,
    },
  };
  const c = config[status] || config.OK;
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${c.bg} ${c.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {c.label}
    </span>
  );
}

function LegendItem({
  status,
  title,
  description,
  color,
}: {
  status: string;
  title: string;
  description: string;
  color: string;
}) {
  const dotColors: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  };
  return (
    <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2">
      <div className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${dotColors[color]}`} />
      <div>
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-slate-600">{description}</p>
      </div>
    </div>
  );
}
