"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Gift,
  ArrowRight,
  AlertCircle,
  Calendar,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Server } from "@/db/schema";
import { POSITIONS, CATEGORIES } from "@/db/schema";
import { formatDate, calculateAge } from "@/lib/format";

interface Stats {
  servers: Server[];
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  byPosition: Record<string, number>;
  byDesignatedFunction: Record<string, number>;
  ctdActive: number;
  withCtdDates: Server[];
  upcomingCtdEnd: Server[];
  byFaixa: Record<string, number>;
  byNivel: Record<string, number>;
  missingData: {
    semFaixa: number;
    semNivel: number;
    semDataNasc: number;
    semEmail: number;
    semTelefone: number;
  };
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/servers?limit=1000")
      .then((r) => r.json())
      .then((data) => {
        const servers: Server[] = data.servers || [];
        const byCat: Record<string, number> = {};
        const byPos: Record<string, number> = {};
        const byDesignatedFunction: Record<string, number> = {};
        const byFaixa: Record<string, number> = {};
        const byNivel: Record<string, number> = {};
        const withCtdDates: Server[] = [];
        const upcomingCtdEnd: Server[] = [];
        let ctdActive = 0;
        let active = 0;
        let inactive = 0;
        let semFaixa = 0;
        let semNivel = 0;
        let semDataNasc = 0;
        let semEmail = 0;
        let semTelefone = 0;
        const today = new Date();

        servers.forEach((s) => {
          byCat[s.category] = (byCat[s.category] || 0) + 1;
          byPos[s.position] = (byPos[s.position] || 0) + 1;
          if (s.designatedFunction) {
            byDesignatedFunction[s.designatedFunction] = (byDesignatedFunction[s.designatedFunction] || 0) + 1;
          }
          if (s.faixa) byFaixa[s.faixa] = (byFaixa[s.faixa] || 0) + 1;
          if (s.nivel) byNivel[s.nivel] = (byNivel[s.nivel] || 0) + 1;

          if (s.active) active++;
          else inactive++;

          if (s.category === "CTD") ctdActive++;

          if (s.ctdStartDate || s.ctdEndDate) {
            withCtdDates.push(s);
          }

          if (s.ctdEndDate) {
            const endDate = new Date(s.ctdEndDate);
            const diffDays = Math.ceil(
              (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays >= 0 && diffDays <= 90) {
              upcomingCtdEnd.push({ ...s, _diffDays: diffDays } as Server & { _diffDays: number });
            }
          }

          // Contar dados faltantes
          if (!s.faixa) semFaixa++;
          if (!s.nivel) semNivel++;
          if (!s.birthDate) semDataNasc++;
          if (!s.email) semEmail++;
          if (!s.phone) semTelefone++;
        });

        setStats({
          servers,
          total: servers.length,
          active,
          inactive,
          byCategory: byCat,
          byPosition: byPos,
          byDesignatedFunction,
          ctdActive,
          withCtdDates,
          upcomingCtdEnd: upcomingCtdEnd.sort(
            (a, b) => (a as any)._diffDays - (b as any)._diffDays
          ),
          byFaixa,
          byNivel,
          missingData: {
            semFaixa,
            semNivel,
            semDataNasc,
            semEmail,
            semTelefone,
          },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryInfo: Record<string, { label: string; color: string; gradient: string }> = {
    A: { label: "Efetivo", color: "emerald", gradient: "from-emerald-500 to-teal-600" },
    ACT: { label: "F", color: "blue", gradient: "from-blue-500 to-indigo-600" },
    CTD: { label: "O", color: "violet", gradient: "from-violet-500 to-purple-600" },
    CLT: { label: "CLT", color: "amber", gradient: "from-amber-500 to-orange-600" },
  };

  const topPositions = stats
    ? Object.entries(stats.byPosition)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                <GraduationCap className="h-3.5 w-3.5" />
                EE Profa. Marlene Frattini
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">
                Painel de Gestão
              </h1>
              <p className="mt-1 text-slate-600">
                Visão geral do quadro de servidores
              </p>
            </div>
            <Link
              href="/cadastros"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700"
            >
              Acessar Cadastros
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-slate-500">Carregando dados...</p>
          </div>
        ) : stats ? (
          <>
            {/* Cards Principais */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MainStatCard
                title="Total de Servidores"
                value={stats.total}
                subtitle="quadro completo"
                icon={Users}
                gradient="from-blue-600 to-indigo-700"
              />
              <MainStatCard
                title="Servidores Ativos"
                value={stats.active}
                subtitle={`${stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% do total`}
                icon={UserCheck}
                gradient="from-emerald-600 to-teal-700"
              />
              <MainStatCard
                title="Servidores Inativos"
                value={stats.inactive}
                subtitle={stats.inactive > 0 ? "afastados/exonerados" : "nenhum afastado"}
                icon={UserX}
                gradient={stats.inactive > 0 ? "from-red-600 to-rose-700" : "from-slate-500 to-slate-600"}
              />
              <MainStatCard
                title="Servidores CTD"
                value={stats.ctdActive}
                subtitle="contrato temporário"
                icon={Clock}
                gradient="from-violet-600 to-purple-700"
              />
            </div>

            {/* Alertas e Ações */}
            {stats.upcomingCtdEnd.length > 0 && (
              <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold text-amber-900">
                        Atenção: CTDs próximos do vencimento
                      </h3>
                      <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                        {stats.upcomingCtdEnd.length} caso{stats.upcomingCtdEnd.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-amber-800">
                      Servidores com contrato CTD vencendo nos próximos 90 dias
                    </p>
                    <div className="mt-3 space-y-2">
                      {stats.upcomingCtdEnd.slice(0, 3).map((s) => {
                        const diff = (s as any)._diffDays as number;
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {s.name}
                              </p>
                              <p className="text-xs text-slate-600">
                                {s.position} • Término: {formatDate(s.ctdEndDate)}
                              </p>
                            </div>
                            <span
                              className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                diff <= 30
                                  ? "bg-red-100 text-red-800"
                                  : diff <= 60
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {diff === 0 ? "Hoje" : `${diff} dia${diff !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                        );
                      })}
                      {stats.upcomingCtdEnd.length > 3 && (
                        <p className="text-xs text-amber-700">
                          + {stats.upcomingCtdEnd.length - 3} outro(s) caso(s)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Distribuição por Categoria */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Distribuição por Categoria</h2>
                    <p className="text-sm text-slate-500">Vínculo funcional dos servidores</p>
                  </div>
                  <div className="rounded-lg bg-slate-100 p-2">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  {CATEGORIES.map((cat) => {
                    const count = stats.byCategory[cat.code] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    const info = categoryInfo[cat.code];
                    return (
                      <div key={cat.code}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${info.gradient}`}
                            />
                            <span className="font-semibold text-slate-800">
                              {cat.code} - {info.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{count}</span>
                            <span className="text-xs text-slate-500">
                              ({pct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${info.gradient} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-4">
                  <MiniStat label="Efetivos" value={stats.byCategory.A || 0} color="emerald" />
                  <MiniStat label="ACT" value={stats.byCategory.ACT || 0} color="blue" />
                  <MiniStat label="CTD" value={stats.byCategory.CTD || 0} color="violet" />
                  <MiniStat label="CLT" value={stats.byCategory.CLT || 0} color="amber" />
                </div>
              </div>

              {/* Funções Designadas */}
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Funções Designadas</h2>
                  <p className="text-sm text-slate-500">Servidores em funções diferentes do cargo base</p>
                </div>
                {Object.keys(stats.byDesignatedFunction).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Nenhum servidor com função designada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.byDesignatedFunction)
                      .sort((a, b) => b[1] - a[1])
                      .map(([func, count]) => {
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        const funcLabel = func === "CGPG" ? "Coord. Gestão Pedagógica" :
                                         func === "GOE" ? "Gerente Organização Escolar" :
                                         func === "VICE-DIRETOR" ? "Vice-Diretor" : func;
                        return (
                          <div
                            key={func}
                            className="flex items-center justify-between rounded-lg bg-amber-50 p-3 border border-amber-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                                ⚡
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {func}
                                </p>
                                <p className="text-xs text-slate-600">{funcLabel}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-slate-900">{count}</span>
                              <p className="text-xs text-slate-500">{pct.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Faixas Salariais</h2>
                  <p className="text-sm text-slate-500">Distribuição por faixa</p>
                </div>
                {Object.keys(stats.byFaixa).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <TrendingUp className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Nenhuma faixa cadastrada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(stats.byFaixa)
                      .sort((a, b) => a[0].localeCompare(b[0]))
                      .map(([faixa, count]) => {
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <div
                            key={faixa}
                            className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                                {faixa}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  Faixa {faixa}
                                </p>
                                <p className="text-xs text-slate-500">{count} servidor{count !== 1 ? "es" : ""}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Cargos e Níveis */}
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Distribuição por Cargo</h2>
                  <p className="text-sm text-slate-500">
                    {Object.keys(stats.byPosition).length} cargos diferentes
                  </p>
                </div>
                {topPositions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-10 w-10 text-slate-300" />
                    <p className="mt-3 text-sm text-slate-500">
                      Nenhum servidor cadastrado ainda.{" "}
                      <Link href="/cadastros" className="font-medium text-blue-600 hover:underline">
                        Começar agora →
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topPositions.map(([pos, count]) => {
                      const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      return (
                        <div key={pos} className="group">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="truncate font-medium text-slate-700 group-hover:text-slate-900">
                              {pos}
                            </span>
                            <span className="ml-2 flex items-center gap-2">
                              <span className="font-bold text-slate-900">{count}</span>
                              <span className="text-xs text-slate-500">
                                ({pct.toFixed(0)}%)
                              </span>
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Distribuição por Nível</h2>
                  <p className="text-sm text-slate-500">
                    {Object.keys(stats.byNivel).length} níveis diferentes
                  </p>
                </div>
                {Object.keys(stats.byNivel).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <TrendingUp className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Nenhum nível cadastrado
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(stats.byNivel)
                      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
                      .map(([nivel, count]) => (
                        <div
                          key={nivel}
                          className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white">
                              {nivel}
                            </div>
                            <p className="text-2xl font-bold text-slate-900">{count}</p>
                          </div>
                          <p className="mt-2 text-xs text-slate-500">
                            Nível {nivel}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

          {/* Dados Faltantes - Cadastro Incompleto */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dados Pendentes de Preenchimento
                  </h3>
                  <p className="text-xs text-slate-600">
                    Servidores com informações incompletas no cadastro
                  </p>
                </div>
              </div>
              <Link
                href="/cadastros"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
              >
                Ir para Cadastros
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <MissingDataCard
                label="Sem Faixa"
                value={stats.missingData.semFaixa}
                total={stats.total}
                color="amber"
              />
              <MissingDataCard
                label="Sem Nível"
                value={stats.missingData.semNivel}
                total={stats.total}
                color="orange"
              />
              <MissingDataCard
                label="Sem Data Nasc."
                value={stats.missingData.semDataNasc}
                total={stats.total}
                color="red"
              />
              <MissingDataCard
                label="Sem Email"
                value={stats.missingData.semEmail}
                total={stats.total}
                color="rose"
              />
              <MissingDataCard
                label="Sem Telefone"
                value={stats.missingData.semTelefone}
                total={stats.total}
                color="pink"
              />
            </div>
          </div>

          {/* Próximo Módulo */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Próximo módulo: Vantagens Pessoais
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Em breve você poderá gerenciar as vantagens pessoais já adquiridas pelos servidores.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                EM BREVE
              </span>
            </div>
          </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              Erro ao carregar dados
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Não foi possível conectar ao servidor. Tente recarregar a página.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MainStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10`}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "emerald" | "blue" | "violet" | "amber";
}) {
  const colors = {
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    violet: "text-violet-700 bg-violet-50 border-violet-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function MissingDataCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: "amber" | "orange" | "red" | "rose" | "pink";
}) {
  const colors = {
    amber: "border-amber-300 bg-amber-100 text-amber-900",
    orange: "border-orange-300 bg-orange-100 text-orange-900",
    red: "border-red-300 bg-red-100 text-red-900",
    rose: "border-rose-300 bg-rose-100 text-rose-900",
    pink: "border-pink-300 bg-pink-100 text-pink-900",
  };

  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  return (
    <div className={`rounded-lg border-2 p-3 ${colors[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs opacity-75">/ {total}</p>
      </div>
      <p className="mt-0.5 text-[10px] font-semibold">{percent}%</p>
    </div>
  );
}
