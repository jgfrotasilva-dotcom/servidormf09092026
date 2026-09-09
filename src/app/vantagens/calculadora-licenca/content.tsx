"use client";

import { useState, useEffect } from "react";
import { Calculator, AlertCircle, CheckCircle } from "lucide-react";
import type { Server } from "@/db/schema";
import { formatDate } from "@/lib/format";

interface AbsenceData {
  id: string;
  date: string;
  subtype: string | null;
  days: number;
  hours: number;
}

interface CalculatorResult {
  absences: AbsenceData[];
  byYear: Record<string, AbsenceData[]>;
  byType: Record<string, number>;
  totalDays: number;
  excludedCount: number;
}

export default function CalculatorContent() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [licenseAvailable, setLicenseAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

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

  useEffect(() => {
    if (selectedServerId) {
      const server = servers.find((s) => s.id === selectedServerId);
      setSelectedServer(server || null);
      if (server) {
        checkLicenseAvailability(server);
      }
    } else {
      setSelectedServer(null);
      setResult(null);
      setLicenseAvailable(null);
    }
  }, [selectedServerId, servers]);

  const checkLicenseAvailability = async (server: Server | null) => {
    if (!server) return;

    try {
      // Busca vantagens vencidas para verificar se a licença está disponível
      const res = await fetch("/api/servers/overdue-advantages");
      const data = await res.json();
      
      const serverData = data.overdue?.find((s: any) => s.server.id === server.id) ||
                        data.upcoming?.find((s: any) => s.server.id === server.id);
      
      if (serverData) {
        const hasLicenseIssue = serverData.overdue?.some((o: any) => o.type === "LICENÇA PRÊMIO") ||
                               serverData.upcoming?.some((u: any) => u.type === "LICENÇA PRÊMIO" && u.daysRemaining <= 15);
        setLicenseAvailable(hasLicenseIssue);
      } else {
        setLicenseAvailable(false);
      }
    } catch (error) {
      console.error("Erro ao verificar licença:", error);
      setLicenseAvailable(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedServerId || !periodStart || !periodEnd) return;

    setCalculating(true);
    try {
      const res = await fetch(
        `/api/absences/calculator?serverId=${selectedServerId}&startDate=${periodStart}&endDate=${periodEnd}`
      );
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Erro ao calcular:", error);
    } finally {
      setCalculating(false);
    }
  };

  const getSubtypeLabel = (subtype: string | null): string => {
    if (!subtype) return "Outro";
    const labels: Record<string, string> = {
      FALTA_MEDICA_TOTAL: "Falta Médica Total",
      JUSTIFICADA: "Justificada",
      DOACAO_SANGUE: "Doação de Sangue",
      LICENCA_SAUDE: "Licença Saúde",
      AUXILIO_DOENCA: "Auxílio-Doença",
      LICENCA_PREMIO: "Licença Prêmio",
    };
    return labels[subtype] || subtype;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Calculator className="h-7 w-7 text-indigo-600" />
          Calculadora de Licença Prêmio
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Calcula o impacto das ausências no período aquisitivo
        </p>
      </div>

      {/* Seleção de Servidor */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Selecionar Servidor
        </label>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : (
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Selecione um servidor...</option>
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} - {server.position}
              </option>
            ))}
          </select>
        )}

        {/* Status da Licença */}
        {selectedServer && licenseAvailable !== null && (
          <div className={`mt-4 p-4 rounded-lg ${
            licenseAvailable 
              ? "bg-green-50 border border-green-200" 
              : "bg-slate-50 border border-slate-200"
          }`}>
            <div className="flex items-start gap-3">
              {licenseAvailable ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-slate-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  licenseAvailable ? "text-green-900" : "text-slate-900"
                }`}>
                  {licenseAvailable 
                    ? "Licença Prêmio disponível para cálculo" 
                    : "Licença Prêmio não está vencida nem vencerá em 15 dias"}
                </p>
                {licenseAvailable && (
                  <p className="text-xs text-green-700 mt-1">
                    Você pode calcular o impacto das ausências no período aquisitivo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calculadora */}
      {selectedServer && licenseAvailable && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Período Aquisitivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Início do Período
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Fim do Período
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={!periodStart || !periodEnd || calculating}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {calculating ? "Calculando..." : "Calcular Impacto das Ausências"}
          </button>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Nota:</strong> Falta-Aula e Falta Médica Parcial são excluídas do cálculo 
              pois não aumentam o período final.
            </p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Resultado do Cálculo</h3>

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-semibold">Total de Dias</p>
              <p className="text-2xl font-bold text-blue-900">{result.totalDays}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-700 font-semibold">Ausências Consideradas</p>
              <p className="text-2xl font-bold text-green-900">{result.absences.length}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-700 font-semibold">Ausências Excluídas</p>
              <p className="text-2xl font-bold text-slate-900">{result.excludedCount}</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-xs text-indigo-700 font-semibold">Tipos Diferentes</p>
              <p className="text-2xl font-bold text-indigo-900">{Object.keys(result.byType).length}</p>
            </div>
          </div>

          {/* Por Tipo */}
          {Object.keys(result.byType).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Total por Tipo de Falta</h4>
              <div className="space-y-2">
                {Object.entries(result.byType).map(([type, days]) => (
                  <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">
                      {getSubtypeLabel(type)}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{days} dias</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por Ano */}
          {Object.keys(result.byYear).length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3">Ausências por Ano</h4>
              <div className="space-y-4">
                {Object.entries(result.byYear)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([year, absences]) => {
                    const yearTotal = absences.reduce((sum, a) => sum + a.days, 0);
                    return (
                      <div key={year} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-bold text-slate-900">{year}</h5>
                          <span className="text-sm font-bold text-slate-700">Total: {yearTotal} dias</span>
                        </div>
                        <div className="space-y-2">
                          {absences.map((absence) => (
                            <div key={absence.id} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{formatDate(absence.date)}</span>
                              <span className="text-slate-700 font-medium">
                                {getSubtypeLabel(absence.subtype)}
                              </span>
                              <span className="text-slate-900 font-bold">{absence.days} dias</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Mensagem se não houver ausências */}
          {result.absences.length === 0 && (
            <div className="p-8 text-center bg-green-50 rounded-lg">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-green-900">
                Nenhuma ausência que aumente o período foi encontrada
              </p>
              <p className="text-xs text-green-700 mt-1">
                O período aquisitivo não será estendido
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
