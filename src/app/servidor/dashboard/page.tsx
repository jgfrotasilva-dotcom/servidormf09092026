"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Calendar,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { formatDate } from "@/lib/format";

interface ServerInfo {
  id: string;
  name: string;
  position: string;
  category: string;
}

interface FullReport {
  server: any;
  ats: {
    granted: any[];
    nextExpected: string | null;
    nextQuinquenio: string | null;
    totalGranted: number;
  };
  license: {
    certificates: any[];
    usages: any[];
    totalBalance: number;
    totalHistorical: number;
    totalCerts: number;
    nextPeriod: any;
  };
  evolution: {
    granted: any[];
    currentLevel: string;
    totalGranted: number;
    nextEvolution: any;
  };
}

export default function DashboardServidorPage() {
  const router = useRouter();
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se está logado
    const storedServer = localStorage.getItem("servidor");
    if (!storedServer) {
      router.push("/servidor/login");
      return;
    }

    const serverData = JSON.parse(storedServer);
    setServer(serverData);
    loadReport(serverData.id);
  }, []);

  const loadReport = async (serverId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/full-report`);
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("servidor");
    router.push("/");
  };

  if (!server) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Portal do Servidor</h1>
              <p className="text-blue-100 mt-1">Bem-vindo, {server.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Info do Servidor */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Meus Dados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Cargo</p>
                  <p className="font-medium text-slate-900">{server.position}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Categoria</p>
                  <p className="font-medium text-slate-900">{server.category}</p>
                </div>
                {report.evolution.currentLevel && (
                  <div>
                    <p className="text-sm text-slate-600">Nível Atual</p>
                    <p className="font-medium text-slate-900">{report.evolution.currentLevel}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ATS */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Adicional por Tempo de Serviço</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {report.ats.totalGranted} quinquênio(s)
                </span>
              </div>
              
              {report.ats.granted.length > 0 ? (
                <div className="space-y-3">
                  {report.ats.granted.map((ats: any) => (
                    <div key={ats.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{ats.type}</p>
                        <p className="text-sm text-slate-600">
                          Vigência: {formatDate(ats.startDate)}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                  
                  {report.ats.nextExpected && (
                    <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">Próximo ATS</p>
                      <p className="text-sm text-blue-700">
                        {report.ats.nextQuinquenio} previsto para {formatDate(report.ats.nextExpected)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhum ATS registrado ainda</p>
              )}
            </div>

            {/* Licença Prêmio */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-green-600" />
                  <h2 className="text-lg font-bold text-slate-900">Licença Prêmio</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {report.license.totalCerts} certidão(ões)
                </span>
              </div>
              
              {report.license.totalCerts > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-slate-600">Saldo Disponível</p>
                      <p className="text-2xl font-bold text-green-700">{report.license.totalBalance}</p>
                      <p className="text-xs text-slate-600">dias</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600">Total Histórico</p>
                      <p className="text-2xl font-bold text-slate-900">{report.license.totalHistorical}</p>
                      <p className="text-xs text-slate-600">dias</p>
                    </div>
                  </div>
                  
                  {report.license.nextPeriod && (
                    <div className="p-3 border border-blue-200 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900">Próximo Período Aquisitivo</p>
                      <p className="text-sm text-blue-700">
                        {formatDate(report.license.nextPeriod.startDate)} → {formatDate(report.license.nextPeriod.endDate)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma certidão registrada ainda</p>
              )}
            </div>

            {/* Evolução Funcional */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <h2 className="text-lg font-bold text-slate-900">Evolução Funcional</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {report.evolution.totalGranted} evolução(ões)
                </span>
              </div>
              
              {report.evolution.granted.length > 0 ? (
                <div className="space-y-3">
                  {report.evolution.granted.map((evo: any) => (
                    <div key={evo.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">
                          {evo.evolutionNumber}ª Evolução: {evo.fromLevel} → {evo.toLevel}
                        </p>
                        <p className="text-sm text-slate-600">
                          Vigência: {formatDate(evo.startDate)}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                  
                  {report.evolution.nextEvolution && (
                    <div className="p-3 border border-purple-200 bg-purple-50 rounded-lg">
                      <p className="font-medium text-purple-900">Próxima Evolução</p>
                      <p className="text-sm text-purple-700">
                        {report.evolution.nextEvolution.evolutionNumber}ª ({report.evolution.nextEvolution.fromLevel} → {report.evolution.nextEvolution.toLevel}) prevista para {formatDate(report.evolution.nextEvolution.date)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Nenhuma evolução registrada ainda</p>
              )}
            </div>

            {/* Meus Requerimentos */}
            <MeusRequerimentos serverId={server.id} />

            {/* Botão Requerimento */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Precisa de algo?</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Faça um requerimento de vantagem ou solicitação
                  </p>
                </div>
                <button
                  onClick={() => router.push("/servidor/requerimentos")}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Ver Todos
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <p className="text-slate-900 font-medium">Não foi possível carregar seus dados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeusRequerimentos({ serverId }: { serverId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [serverId]);

  const loadRequests = async () => {
    try {
      const res = await fetch(`/api/requests?serverId=${serverId}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Erro ao carregar requerimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "aprovado":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejeitado":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Pendente";
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-amber-50 text-amber-900 border-amber-200";
      case "aprovado":
        return "bg-green-50 text-green-900 border-green-200";
      case "rejeitado":
        return "bg-red-50 text-red-900 border-red-200";
      default:
        return "bg-slate-50 text-slate-900 border-slate-200";
    }
  };

  const recentRequests = requests.slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Meus Requerimentos</h2>
        </div>
        <span className="text-sm text-slate-500">
          {requests.length} total
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : recentRequests.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum requerimento ainda
        </p>
      ) : (
        <div className="space-y-3">
          {recentRequests.map((request) => (
            <div key={request.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              {getStatusIcon(request.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-slate-900">{request.type}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {formatDate(request.createdAt)}
                </p>
                {request.responseNotes && (
                  <p className="text-xs text-slate-700 mt-1 italic">
                    "{request.responseNotes}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
