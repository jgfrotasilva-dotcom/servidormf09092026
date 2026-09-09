"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import type { Server } from "@/db/schema";
import { formatDate, formatCPF } from "@/lib/format";

interface FullReport {
  server: Server;
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
    nextPeriod: {
      startDate: string;
      endDate: string;
      certificateNumber: string;
      certificateYear: string;
    } | null;
  };
  evolution: {
    granted: any[];
    currentLevel: string;
    totalGranted: number;
    nextEvolution: {
      date: string;
      fromLevel: string;
      toLevel: string;
      evolutionNumber: number;
      intersticio?: number;
    } | null;
  };
}

export default function RelatorioFuncionalContent() {
  const searchParams = useSearchParams();
  const serverParam = searchParams.get("server");

  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadAllServers();
  }, []);

  useEffect(() => {
    if (serverParam && servers.length > 0 && !selectedServerId) {
      setSelectedServerId(serverParam);
    }
  }, [serverParam, servers, selectedServerId]);

  useEffect(() => {
    if (selectedServerId) {
      loadReport(selectedServerId);
    } else {
      setReport(null);
    }
  }, [selectedServerId]);

  const loadAllServers = async () => {
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

  const loadReport = async (serverId: string) => {
    setLoadingReport(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/full-report`);
      const data = await res.json();
      if (data.error) {
        setReport(null);
      } else {
        setReport(data);
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      setReport(null);
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Interface (não imprimível) */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Relatório Funcional</h2>
            <p className="mt-1 text-sm text-slate-600">Histórico de vantagens do servidor</p>
          </div>
          {report && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6">
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
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            >
              <option value="">Selecione um servidor...</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} - {server.position}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Relatório */}
      {loadingReport ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          <p className="mt-4 text-sm text-slate-500">Gerando relatório...</p>
        </div>
      ) : report ? (
        <ReportContent report={report} server={selectedServer!} />
      ) : null}
    </div>
  );
}

function ReportContent({ report, server }: { report: FullReport; server: Server }) {
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="report-func bg-white">
      {/* Cabeçalho Oficial */}
      <div className="rf-header">
        <p>GOVERNO DO ESTADO DE SÃO PAULO</p>
        <p>SECRETARIA DE ESTADO DA EDUCAÇÃO</p>
        <p>UNIDADE REGIONAL DE ENSINO DE ARARAQUARA</p>
        <p className="rf-school">EE PROFA. MARLENE FRATTINI</p>
      </div>

      {/* Título */}
      <div className="rf-title">
        <h1>RELATÓRIO FUNCIONAL DO SERVIDOR</h1>
        <p>Emitido em {today}</p>
      </div>

      {/* Dados do Servidor */}
      <div className="rf-section">
        <h2>1. DADOS DO SERVIDOR</h2>
        <div className="rf-data">
          <p><strong>Nome:</strong> {server.name}</p>
          <p>
            <strong>CPF:</strong> {formatCPF(server.cpf)}
            {server.rgCin && (
              <>
                {" | "}
                <strong>RG:</strong> {server.rgCin}
              </>
            )}
          </p>
          <p>
            <strong>Cargo:</strong> {server.position}
            {server.designatedFunction && (
              <>
                {" | "}
                <strong>DESIGNADO:</strong> {server.designatedFunction}
              </>
            )}
          </p>
          <p>
            <strong>Categoria:</strong> {server.category}
            {server.faixa && (
              <>
                {" | "}
                <strong>Faixa:</strong> {server.faixa}
              </>
            )}
            {server.nivel && (
              <>
                {" | "}
                <strong>Nível:</strong> {server.nivel}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Evolução Funcional */}
      <div className="rf-section">
        <h2>2. EVOLUÇÃO FUNCIONAL</h2>
        <p className="rf-info">Nível Atual: <strong>{report.evolution.currentLevel}</strong> | Total de evoluções: <strong>{report.evolution.totalGranted}</strong></p>
        
        {report.evolution.granted.length > 0 && (
          <>
            <p className="rf-subtitle">Histórico:</p>
            <table>
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Progressão</th>
                  <th>Data Vigência</th>
                  <th>DOE</th>
                </tr>
              </thead>
              <tbody>
                {report.evolution.granted.map((evo: any) => (
                  <tr key={evo.id}>
                    <td>{evo.evolutionNumber}ª</td>
                    <td>{evo.fromLevel} → {evo.toLevel}</td>
                    <td>{formatDate(evo.startDate)}</td>
                    <td>{evo.doeDate ? formatDate(evo.doeDate) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {report.evolution.nextEvolution && (
          <p className="rf-next">
            Próxima: <strong>{report.evolution.nextEvolution.evolutionNumber}ª Evolução</strong> ({report.evolution.nextEvolution.fromLevel} → {report.evolution.nextEvolution.toLevel}) prevista para {formatDate(report.evolution.nextEvolution.date)}
          </p>
        )}
      </div>

      {/* ATS */}
      <div className="rf-section">
        <h2>3. ADICIONAL POR TEMPO DE SERVIÇO (ATS)</h2>
        <p className="rf-info">Total de quinquênios: <strong>{report.ats.totalGranted}</strong></p>
        
        {report.ats.granted.length > 0 && (
          <>
            <p className="rf-subtitle">Histórico:</p>
            <table>
              <thead>
                <tr>
                  <th>Quinquênio</th>
                  <th>Data Vigência</th>
                  <th>DOE</th>
                </tr>
              </thead>
              <tbody>
                {report.ats.granted.map((ats: any) => (
                  <tr key={ats.id}>
                    <td>{ats.quinquenioNumber}º</td>
                    <td>{formatDate(ats.startDate)}</td>
                    <td>{ats.doeDate ? formatDate(ats.doeDate) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {report.ats.nextExpected && (
          <p className="rf-next">
            Próximo: <strong>{report.ats.nextQuinquenio}</strong> previsto para {formatDate(report.ats.nextExpected)}
          </p>
        )}
      </div>

      {/* Licença Prêmio */}
      <div className="rf-section">
        <h2>4. LICENÇA PRÊMIO</h2>
        <p className="rf-info">Total de certidões: <strong>{report.license.totalCerts}</strong> | Saldo disponível: <strong>{report.license.totalBalance} dias</strong></p>
        
        {report.license.certificates.length > 0 && (
          <>
            <p className="rf-subtitle">Certidões:</p>
            <table>
              <thead>
                <tr>
                  <th>Nº/Ano</th>
                  <th>Período Aquisitivo</th>
                  <th>Saldo</th>
                  <th>DOE</th>
                </tr>
              </thead>
              <tbody>
                {report.license.certificates.map((cert: any) => (
                  <tr key={cert.id}>
                    <td>{cert.certificateNumber}/{cert.certificateYear}</td>
                    <td>{formatDate(cert.acquisitionStartDate)} → {formatDate(cert.acquisitionEndDate)}</td>
                    <td>{cert.currentBalance}/{cert.totalBalance} dias</td>
                    <td>{cert.doeDate ? formatDate(cert.doeDate) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {report.license.usages.length > 0 && (
              <>
                <p className="rf-subtitle">Usufrutos:</p>
                <table>
                  <thead>
                    <tr>
                      <th>Certidão</th>
                      <th>Tipo</th>
                      <th>Período/Ano</th>
                      <th>Dias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.license.usages.map((usage: any) => {
                      const cert = report.license.certificates.find((c: any) => c.id === usage.certificateId);
                      return (
                        <tr key={usage.id}>
                          <td>{cert ? `${cert.certificateNumber}/${cert.certificateYear}` : "-"}</td>
                          <td>{usage.type === "FRUICAO" ? "Fruição" : "Pecúnia"}</td>
                          <td>
                            {usage.type === "FRUICAO"
                              ? `${formatDate(usage.startDate)} → ${formatDate(usage.endDate)}`
                              : `Ano ${usage.year}`}
                          </td>
                          <td>{usage.days}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {report.license.nextPeriod && (
          <p className="rf-next">
            Próxima certidão: <strong>Nº {report.license.nextPeriod.certificateNumber}/{report.license.nextPeriod.certificateYear}</strong> (período aquisitivo: {formatDate(report.license.nextPeriod.startDate)} → {formatDate(report.license.nextPeriod.endDate)})
          </p>
        )}
      </div>

      {/* Rodapé */}
      <div className="rf-footer">
        <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
        <p>EE Profa. Marlene Frattini • {today}</p>
      </div>
    </div>
  );
}
