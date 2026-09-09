"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Calendar, TrendingUp } from "lucide-react";
import type { Server } from "@/db/schema";
import { formatDate } from "@/lib/format";

interface AdvantageIssue {
  type: string;
  label: string;
  expectedDate: string;
  daysPast?: number;
  daysRemaining?: number;
  details: string;
}

interface ServerIssues {
  server: Server;
  overdue: AdvantageIssue[];
  upcoming: AdvantageIssue[];
}

export default function VantagensVencidasPage() {
  const [overdueServers, setOverdueServers] = useState<ServerIssues[]>([]);
  const [upcomingServers, setUpcomingServers] = useState<ServerIssues[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/servers/overdue-advantages");
      const data = await res.json();
      setOverdueServers(data.overdue || []);
      setUpcomingServers(data.upcoming || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ATS":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "EVOLUÇÃO":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "LICENÇA PRÊMIO":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ATS":
        return <Calendar className="h-4 w-4" />;
      case "EVOLUÇÃO":
        return <TrendingUp className="h-4 w-4" />;
      case "LICENÇA PRÊMIO":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Vantagens Vencidas e a Vencer
              </h1>
              <p className="text-sm text-slate-600">
                Controle de vantagens pendentes e próximas do vencimento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <h2 className="text-xl font-bold text-red-900">Vantagens Vencidas</h2>
                </div>
                <p className="text-3xl font-bold text-red-700">
                  {overdueServers.length} servidor{overdueServers.length !== 1 ? "es" : ""}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  com vantagens que já deveriam ter sido concedidas
                </p>
              </div>

              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-8 w-8 text-amber-600" />
                  <h2 className="text-xl font-bold text-amber-900">Vantagens a Vencer</h2>
                </div>
                <p className="text-3xl font-bold text-amber-700">
                  {upcomingServers.length} servidor{upcomingServers.length !== 1 ? "es" : ""}
                </p>
                <p className="text-sm text-amber-600 mt-1">
                  com vantagens vencendo nos próximos 180 dias
                </p>
              </div>
            </div>

            {/* Vantagens Vencidas */}
            {overdueServers.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b-2 border-red-200 bg-red-50">
                  <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Vantagens Vencidas ({overdueServers.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {overdueServers.map((item) => (
                    <div key={item.server.id} className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-lg">
                            {item.server.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{item.server.name}</h3>
                          <p className="text-sm text-slate-600">
                            {item.server.position} • {item.server.category}
                          </p>
                        </div>
                      </div>

                      <div className="ml-16 space-y-3">
                        {item.overdue.map((issue, idx) => (
                          <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2 rounded border ${getTypeColor(issue.type)}`}>
                                  {getTypeIcon(issue.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(issue.type)}`}>
                                      {issue.type}
                                    </span>
                                    <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                      {issue.daysPast} dias atrasado{issue.daysPast !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-slate-900">{issue.label}</p>
                                  <p className="text-sm text-slate-600 mt-1">{issue.details}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Previsto para: {formatDate(issue.expectedDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vantagens a Vencer */}
            {upcomingServers.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b-2 border-amber-200 bg-amber-50">
                  <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Vantagens a Vencer ({upcomingServers.length})
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {upcomingServers.map((item) => (
                    <div key={item.server.id} className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                            {item.server.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{item.server.name}</h3>
                          <p className="text-sm text-slate-600">
                            {item.server.position} • {item.server.category}
                          </p>
                        </div>
                      </div>

                      <div className="ml-16 space-y-3">
                        {item.upcoming.map((issue, idx) => (
                          <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2 rounded border ${getTypeColor(issue.type)}`}>
                                  {getTypeIcon(issue.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTypeColor(issue.type)}`}>
                                      {issue.type}
                                    </span>
                                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                      Faltam {issue.daysRemaining} dia{issue.daysRemaining !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-slate-900">{issue.label}</p>
                                  <p className="text-sm text-slate-600 mt-1">{issue.details}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    Data prevista: {formatDate(issue.expectedDate)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estado Vazio */}
            {overdueServers.length === 0 && upcomingServers.length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900">Tudo em dia!</h3>
                <p className="text-slate-600 mt-2">
                  Não há vantagens vencidas ou próximas do vencimento no momento.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
