"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";

interface OverviewData {
  eligibleServers: number;
  totalAts: number;
  lastAts: number;
  upcomingAts: Array<{
    serverName: string;
    nextDate: string;
    daysUntil: number;
    position: string;
  }>;
}

export default function VantagensPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Carrega servidores elegíveis
        const eligibleRes = await fetch("/api/servers/eligible");
        const eligibleData = await eligibleRes.json();
        const eligibleServers = eligibleData.servers || [];

        if (eligibleServers.length === 0) {
          setData({
            eligibleServers: 0,
            totalAts: 0,
            lastAts: 0,
            upcomingAts: [],
          });
          setLoading(false);
          return;
        }

        // Carrega todos os ATS
        const serverIds = eligibleServers.map((s: { id: string }) => s.id).join(",");
        const atsRes = await fetch(`/api/ats?serverIds=${serverIds}`);
        const atsData = await atsRes.json();
        const allAts = atsData.ats || [];

        const lastAts = allAts.filter((a: { isLast: boolean }) => a.isLast).length;

        // Calcula próximos ATS
        const today = new Date();
        const upcomingAts: OverviewData["upcomingAts"] = [];
        allAts.forEach((ats: any) => {
          if (ats.nextDate && ats.isLast) {
            const nextDateObj = new Date(ats.nextDate);
            const diffDays = Math.ceil(
              (nextDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const server = eligibleServers.find((s: { id: string }) => s.id === ats.serverId);
            if (server && diffDays >= 0 && diffDays <= 730) {
              upcomingAts.push({
                serverName: server.name,
                nextDate: ats.nextDate,
                daysUntil: diffDays,
                position: server.position,
              });
            }
          }
        });
        upcomingAts.sort((a, b) => a.daysUntil - b.daysUntil);

        setData({
          eligibleServers: eligibleServers.length,
          totalAts: allAts.length,
          lastAts,
          upcomingAts: upcomingAts.slice(0, 5),
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setData({ eligibleServers: 0, totalAts: 0, lastAts: 0, upcomingAts: [] });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <>
      <AdminHeader
        title="Vantagens Pessoais"
        subtitle="Visão geral das vantagens dos servidores"
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          <p className="mt-4 text-sm text-slate-500">Carregando dados...</p>
        </div>
      ) : data ? (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Servidores Elegíveis
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">
                    {data.eligibleServers}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Efetivos + ACT</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ATS Cadastrados
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">{data.totalAts}</p>
                  <p className="mt-1 text-xs text-slate-500">quinquênios registrados</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Últimos ATS
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">{data.lastAts}</p>
                  <p className="mt-1 text-xs text-slate-500">marcados como vigentes</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Módulo ATS - Principal */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      ATS - Adicional por Tempo de Serviço
                    </h3>
                    <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-bold text-violet-800">
                      ATIVO
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Gerencie os quinquênios adquiridos pelos servidores efetivos e ACT
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                      ✓ Até 10 quinquênios
                    </span>
                    <span className="rounded bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                      ✓ Cálculo automático de próximos
                    </span>
                    <span className="rounded bg-white px-2 py-1 text-slate-600 ring-1 ring-slate-200">
                      ✓ Controle de DOE
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/vantagens/ats"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700"
              >
                Acessar Módulo ATS
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Próximos ATS */}
          {data.upcomingAts.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-900">
                    Próximas Aquisições de ATS
                  </h3>
                  <p className="text-sm text-amber-800">
                    Servidores que adquirirão novo quinquênio em até 2 anos
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {data.upcomingAts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.serverName}
                      </p>
                      <p className="text-xs text-slate-600">
                        {item.position} • Próximo: {new Date(item.nextDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span
                      className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.daysUntil <= 180
                          ? "bg-red-100 text-red-800"
                          : item.daysUntil <= 365
                          ? "bg-orange-100 text-orange-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.daysUntil} dia{item.daysUntil !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder para futuros módulos */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 opacity-70">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Outras Vantagens
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Módulo em desenvolvimento
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    EM BREVE
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 opacity-70">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">
                    Relatórios de Vantagens
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Módulo em desenvolvimento
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    EM BREVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
    </>
  );
}
