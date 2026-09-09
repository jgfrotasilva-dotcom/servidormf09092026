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
      {/* Header (não imprimível) */}
      <div className="mb-6 print:hidden">
        <h2 className="text-2xl font-bold text-slate-900">Relatório Funcional</h2>
        <p className="mt-1 text-sm text-slate-600">
          Histórico completo de vantagens concedidas e próximas aquisições
        </p>
      </div>

      {/* Seletor de Servidor (não imprimível) */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 print:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Selecionar Servidor</h3>
            <p className="text-sm text-slate-500">
              Selecione um servidor para gerar o relatório
            </p>
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
    <div className="report-container bg-white">
      {/* Cabeçalho Institucional */}
      <div className="mb-6 border-2 border-black p-4">
        <div className="text-center">
          <p className="text-sm font-bold uppercase">Governo do Estado de São Paulo</p>
          <p className="text-sm font-bold uppercase">Secretaria da Educação</p>
          <p className="mt-2 text-base font-bold uppercase">
            EE Profa. Marlene Frattini
          </p>
          <div className="mt-3 border-t border-black pt-3">
            <p className="text-lg font-bold uppercase">Relatório Funcional do Servidor</p>
            <p className="mt-1 text-sm">Emitido em {today}</p>
          </div>
        </div>
      </div>

      {/* Dados do Servidor */}
      <div className="mb-6 border border-black p-4">
        <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
          I. Dados do Servidor
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-bold">Nome:</p>
            <p>{server.name}</p>
          </div>
          <div>
            <p className="font-bold">CPF:</p>
            <p className="font-mono">{formatCPF(server.cpf)}</p>
          </div>
          <div>
            <p className="font-bold">Cargo:</p>
            <p>{server.position}</p>
          </div>
          <div>
            <p className="font-bold">Categoria:</p>
            <p>{server.category}</p>
          </div>
          {server.faixa && (
            <div>
              <p className="font-bold">Faixa:</p>
              <p>{server.faixa}</p>
            </div>
          )}
          {server.nivel && (
            <div>
              <p className="font-bold">Nível Cadastral:</p>
              <p>{server.nivel}</p>
            </div>
          )}
        </div>
      </div>

      {/* PRÓXIMAS AQUISIÇÕES - SEÇÃO PRIORITÁRIA */}
      <div className="mb-6 border-2 border-black p-4">
        <h2 className="mb-3 border-b-2 border-black pb-2 text-base font-bold uppercase">
          II. Próximas Aquisições de Vantagens
        </h2>
        <div className="space-y-4 text-sm">
          {/* Próxima Evolução Funcional */}
          <div className="border border-black p-3">
            <p className="mb-2 font-bold uppercase">1. Evolução Funcional pela Via Não Acadêmica</p>
            {report.evolution.nextEvolution ? (
              <div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="w-1/2 py-1 font-bold">Número da Evolução:</td>
                      <td className="py-1">{report.evolution.nextEvolution.evolutionNumber}ª</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">Progressão:</td>
                      <td className="py-1">
                        Nível {report.evolution.nextEvolution.fromLevel} → Nível{" "}
                        {report.evolution.nextEvolution.toLevel}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">Data Prevista:</td>
                      <td className="py-1 font-bold">
                        {formatDate(report.evolution.nextEvolution.date)}
                      </td>
                    </tr>
                    {report.evolution.nextEvolution.intersticio && (
                      <tr>
                        <td className="py-1 font-bold">Interstício:</td>
                        <td className="py-1">
                          {report.evolution.nextEvolution.intersticio}{" "}
                          {report.evolution.nextEvolution.intersticio === 1 ? "ano" : "anos"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="italic text-slate-600">
                {report.evolution.totalGranted === 0
                  ? "Nenhuma evolução cadastrada ainda."
                  : "Nível máximo atingido ou dados insuficientes."}
              </p>
            )}
          </div>

          {/* Próximo ATS */}
          <div className="border border-black p-3">
            <p className="mb-2 font-bold uppercase">
              2. Adicional por Tempo de Serviço (ATS)
            </p>
            {report.ats.nextExpected ? (
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="w-1/2 py-1 font-bold">Próximo Quinquênio:</td>
                    <td className="py-1">{report.ats.nextQuinquenio}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Data Prevista:</td>
                    <td className="py-1 font-bold">{formatDate(report.ats.nextExpected)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Base de Cálculo:</td>
                    <td className="py-1">Último ATS + 1825 dias (5 anos)</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="italic text-slate-600">
                {report.ats.totalGranted === 0
                  ? "Nenhum ATS cadastrado ainda."
                  : "Quinquênio máximo atingido."}
              </p>
            )}
          </div>

          {/* Próxima Licença Prêmio */}
          <div className="border border-black p-3">
            <p className="mb-2 font-bold uppercase">3. Licença Prêmio</p>
            {report.license.nextPeriod ? (
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="w-1/2 py-1 font-bold">Próxima Certidão:</td>
                    <td className="py-1">
                      Nº {report.license.nextPeriod.certificateNumber}/
                      {report.license.nextPeriod.certificateYear}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Período Aquisitivo Início:</td>
                    <td className="py-1">{formatDate(report.license.nextPeriod.startDate)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Período Aquisitivo Fim:</td>
                    <td className="py-1 font-bold">
                      {formatDate(report.license.nextPeriod.endDate)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 font-bold">Duração:</td>
                    <td className="py-1">5 anos (1825 dias)</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="italic text-slate-600">
                Dados insuficientes para calcular próximo período aquisitivo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* VANTAGENS CONCEDIDAS - EVOLUÇÃO FUNCIONAL */}
      <div className="mb-6 border border-black p-4">
        <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
          III. Evolução Funcional pela Via Não Acadêmica - Histórico
        </h2>
        <p className="mb-2 text-sm">
          <strong>Nível Atual:</strong> Nível {report.evolution.currentLevel}
        </p>
        {report.evolution.granted.length === 0 ? (
          <p className="text-sm italic text-slate-600">
            Nenhuma evolução funcional registrada.
          </p>
        ) : (
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="print-table-header">
                <th className="border border-black px-2 py-1 text-left font-bold">Nº</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Progressão</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Data Vigência</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Data DOE</th>
              </tr>
            </thead>
            <tbody>
              {report.evolution.granted.map((evo: any) => (
                <tr key={evo.id}>
                  <td className="border border-black px-2 py-1">{evo.evolutionNumber}ª</td>
                  <td className="border border-black px-2 py-1">
                    {evo.fromLevel} → {evo.toLevel}
                  </td>
                  <td className="border border-black px-2 py-1">{formatDate(evo.startDate)}</td>
                  <td className="border border-black px-2 py-1">
                    {evo.doeDate ? formatDate(evo.doeDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VANTAGENS CONCEDIDAS - ATS */}
      <div className="mb-6 border border-black p-4">
        <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
          IV. Adicional por Tempo de Serviço (ATS) - Histórico
        </h2>
        {report.ats.granted.length === 0 ? (
          <p className="text-sm italic text-slate-600">Nenhum ATS registrado.</p>
        ) : (
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="print-table-header">
                <th className="border border-black px-2 py-1 text-left font-bold">Quinquênio</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Data Vigência</th>
                <th className="border border-black px-2 py-1 text-left font-bold">Data DOE</th>
              </tr>
            </thead>
            <tbody>
              {report.ats.granted.map((ats: any) => (
                <tr key={ats.id}>
                  <td className="border border-black px-2 py-1">{ats.quinquenioNumber}º</td>
                  <td className="border border-black px-2 py-1">{formatDate(ats.startDate)}</td>
                  <td className="border border-black px-2 py-1">
                    {ats.doeDate ? formatDate(ats.doeDate) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* VANTAGENS CONCEDIDAS - LICENÇA PRÊMIO */}
      <div className="mb-6 border border-black p-4">
        <h2 className="mb-3 border-b border-black pb-2 text-base font-bold uppercase">
          V. Licença Prêmio - Certidões
        </h2>
        {report.license.certificates.length === 0 ? (
          <p className="text-sm italic text-slate-600">Nenhuma certidão registrada.</p>
        ) : (
          <div className="space-y-4">
            {report.license.certificates.map((cert: any) => {
              const certUsages = report.license.usages.filter(
                (u: any) => u.certificateId === cert.id
              );
              return (
                <div key={cert.id} className="border border-black p-3">
                  <p className="mb-2 font-bold">
                    Certidão Nº {cert.certificateNumber}/{cert.certificateYear}
                  </p>
                  <table className="mb-2 w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="w-1/2 py-0.5 font-bold">Período Aquisitivo:</td>
                        <td className="py-0.5">
                          {formatDate(cert.acquisitionStartDate)} →{" "}
                          {formatDate(cert.acquisitionEndDate)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-bold">Saldo Disponível:</td>
                        <td className="py-0.5 font-bold">{cert.currentBalance} dias</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 font-bold">Saldo Total:</td>
                        <td className="py-0.5">{cert.totalBalance} dias</td>
                      </tr>
                      {cert.doeDate && (
                        <tr>
                          <td className="py-0.5 font-bold">Data do DOE:</td>
                          <td className="py-0.5">{formatDate(cert.doeDate)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {certUsages.length > 0 && (
                    <div>
                      <p className="mb-1 text-sm font-bold">Usufrutos Registrados:</p>
                      <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                          <tr className="print-table-header">
                            <th className="border border-black px-2 py-1 text-left font-bold">
                              Tipo
                            </th>
                            <th className="border border-black px-2 py-1 text-left font-bold">
                              Período/Ano
                            </th>
                            <th className="border border-black px-2 py-1 text-left font-bold">
                              Dias
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {certUsages.map((usage: any) => (
                            <tr key={usage.id}>
                              <td className="border border-black px-2 py-1">
                                {usage.type === "FRUICAO" ? "Fruição" : "Pecúnia"}
                              </td>
                              <td className="border border-black px-2 py-1">
                                {usage.type === "FRUICAO"
                                  ? `${formatDate(usage.startDate)} → ${formatDate(usage.endDate)}`
                                  : `Ano ${usage.year}`}
                              </td>
                              <td className="border border-black px-2 py-1">{usage.days}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="border-t border-black pt-2 text-sm">
              <p>
                <strong>Saldo Total Disponível:</strong> {report.license.totalBalance} dias
              </p>
              <p>
                <strong>Total Utilizado:</strong>{" "}
                {report.license.totalHistorical - report.license.totalBalance} dias
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="mt-8 border-t-2 border-black pt-4 text-center text-xs">
        <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
        <p>EE Profa. Marlene Frattini • {today}</p>
      </div>
    </div>
  );
}
