"use client";

import { useEffect, useState } from "react";
import { Printer, AlertTriangle, Calendar, TrendingUp, Award } from "lucide-react";
import { formatDate, formatCPF } from "@/lib/format";

interface OverdueAdvantage {
  server: any;
  ats: {
    type: string;
    lastQuinquenio: number;
    lastDate: string;
    nextExpected: string;
    daysOverdue: number;
    nextQuinquenio: string;
  } | null;
  evolution: {
    type: string;
    lastEvolution: number;
    lastDate: string;
    fromLevel: string;
    toLevel: string;
    nextExpected: string;
    daysOverdue: number;
    nextEvolution: string;
  } | null;
  license: {
    type: string;
    missingCertificates: number;
    lastCertificate: string | null;
    nextPeriodStart: string;
    nextPeriodEnd: string;
    daysOverdue: number;
  } | null;
}

export default function VantagensVencidasContent() {
  const [overdueServers, setOverdueServers] = useState<OverdueAdvantage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServer, setSelectedServer] = useState<OverdueAdvantage | null>(null);
  const [selectedAdvantage, setSelectedAdvantage] = useState<"ats" | "evolution" | "license" | null>(null);

  useEffect(() => {
    loadOverdueAdvantages();
  }, []);

  const loadOverdueAdvantages = async () => {
    try {
      const res = await fetch("/api/servers/overdue-advantages");
      const data = await res.json();
      setOverdueServers(data.servers || []);
    } catch (error) {
      console.error("Erro ao carregar vantagens vencidas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequirement = (server: OverdueAdvantage, type: "ats" | "evolution" | "license") => {
    setSelectedServer(server);
    setSelectedAdvantage(type);
  };

  const handleCloseRequirement = () => {
    setSelectedServer(null);
    setSelectedAdvantage(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const getOverdueSeverity = (days: number) => {
    if (days >= 365) return "critical";
    if (days >= 180) return "high";
    return "medium";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
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
              <h1 className="text-2xl font-bold text-slate-900">Vantagens Vencidas</h1>
              <p className="text-sm text-slate-600">
                Servidores com direitos adquiridos pendentes de concessão
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : overdueServers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma vantagem vencida</h3>
            <p className="text-slate-600">Todos os servidores estão com suas vantagens em dia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Resumo</h2>
                <span className="text-sm text-slate-600">
                  {overdueServers.length} servidor(es) com vantagem(s) vencida(s)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">ATS Vencidos</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {overdueServers.filter(s => s.ats).length}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Evoluções Vencidas</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {overdueServers.filter(s => s.evolution).length}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Licenças Pendentes</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {overdueServers.filter(s => s.license).length}
                  </p>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Servidores com Vantagens Vencidas</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {overdueServers.map((item) => (
                  <div key={item.server.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {item.server.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{item.server.name}</h3>
                          <p className="text-sm text-slate-600">{item.server.position} • {item.server.category}</p>
                          <p className="text-xs text-slate-500 font-mono mt-1">CPF: {formatCPF(item.server.cpf)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 ml-16">
                      {/* ATS Vencido */}
                      {item.ats && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-5 w-5 text-red-600" />
                                <span className="font-semibold text-red-900">ATS Vencido</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(getOverdueSeverity(item.ats.daysOverdue))}`}>
                                  {item.ats.daysOverdue} dias atrasado
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 space-y-1">
                                <p><span className="font-medium">Último ATS:</span> {item.ats.lastQuinquenio}º Quinquênio ({formatDate(item.ats.lastDate)})</p>
                                <p><span className="font-medium">Próximo ATS devido:</span> {item.ats.nextQuinquenio} (previsto para {formatDate(item.ats.nextExpected)})</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenRequirement(item, "ats")}
                              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Requerimento
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Evolução Vencida */}
                      {item.evolution && (
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-orange-600" />
                                <span className="font-semibold text-orange-900">Evolução Funcional Vencida</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(getOverdueSeverity(item.evolution.daysOverdue))}`}>
                                  {item.evolution.daysOverdue} dias atrasado
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 space-y-1">
                                <p><span className="font-medium">Última evolução:</span> {item.evolution.lastEvolution}ª ({formatDate(item.evolution.lastDate)})</p>
                                <p><span className="font-medium">Próxima evolução devida:</span> {item.evolution.nextEvolution} - Nível {item.evolution.fromLevel} → {item.evolution.toLevel}</p>
                                <p><span className="font-medium">Previsto para:</span> {formatDate(item.evolution.nextExpected)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenRequirement(item, "evolution")}
                              className="ml-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Requerimento
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Licença Prêmio Pendente */}
                      {item.license && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="h-5 w-5 text-yellow-600" />
                                <span className="font-semibold text-yellow-900">Licença Prêmio Pendente</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(getOverdueSeverity(item.license.daysOverdue))}`}>
                                  {item.license.daysOverdue} dias atrasado
                                </span>
                              </div>
                              <div className="text-sm text-slate-700 space-y-1">
                                <p><span className="font-medium">Certidões faltantes:</span> {item.license.missingCertificates}</p>
                                {item.license.lastCertificate && (
                                  <p><span className="font-medium">Última certidão:</span> {item.license.lastCertificate}</p>
                                )}
                                <p><span className="font-medium">Próximo período aquisitivo:</span> {formatDate(item.license.nextPeriodStart)} → {formatDate(item.license.nextPeriodEnd)}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenRequirement(item, "license")}
                              className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm flex items-center gap-2"
                            >
                              <Printer className="h-4 w-4" />
                              Requerimento
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Requerimento */}
      {selectedServer && selectedAdvantage && (
        <RequirementModal
          server={selectedServer}
          advantageType={selectedAdvantage}
          onClose={handleCloseRequirement}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
}

function RequirementModal({
  server,
  advantageType,
  onClose,
  onPrint,
}: {
  server: OverdueAdvantage;
  advantageType: "ats" | "evolution" | "license";
  onClose: () => void;
  onPrint: () => void;
}) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const getAdvantageDetails = () => {
    switch (advantageType) {
      case "ats":
        return {
          title: "ADICIONAL POR TEMPO DE SERVIÇO (ATS)",
          description: `Concessão do ${server.ats!.nextQuinquenio}`,
          details: `O servidor completou 5 (cinco) anos de efetivo exercício desde a concessão do ${server.ats!.lastQuinquenio}º Quinquênio em ${formatDate(server.ats!.lastDate)}, fazendo jus ao ${server.ats!.nextQuinquenio}, conforme previsto em legislação vigente.`,
          legalBasis: "Lei Complementar Estadual vigente - Adicional por Tempo de Serviço",
          overdueDays: server.ats!.daysOverdue,
        };
      case "evolution":
        return {
          title: "EVOLUÇÃO FUNCIONAL PELA VIA NÃO ACADÊMICA",
          description: `${server.evolution!.nextEvolution} - Nível ${server.evolution!.fromLevel} → ${server.evolution!.toLevel}`,
          details: `O servidor completou o interstício necessário para a ${server.evolution!.nextEvolution}, progredindo do Nível ${server.evolution!.fromLevel} para o Nível ${server.evolution!.toLevel}, conforme registrado em ${formatDate(server.evolution!.lastDate)}, atendendo aos requisitos legais para progressão funcional.`,
          legalBasis: "Legislação estadual vigente - Evolução Funcional pela Via Não Acadêmica",
          overdueDays: server.evolution!.daysOverdue,
        };
      case "license":
        return {
          title: "LICENÇA PRÊMIO",
          description: `Registro de ${server.license!.missingCertificates} certidão(ões) de período aquisitivo`,
          details: `O servidor completou ${server.license!.missingCertificates} período(s) aquisitivo(s) de 5 (cinco) anos de efetivo exercício, fazendo jus ao registro da(s) respectiva(s) certidão(ões) de Licença Prêmio, totalizando 90 (noventa) dias de licença por período aquisitivo completado.`,
          legalBasis: "Legislação estadual vigente - Licença Prêmio por Assiduidade",
          overdueDays: server.license!.daysOverdue,
        };
    }
  };

  const details = getAdvantageDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <h2 className="text-xl font-bold text-slate-900">Requerimento de Concessão</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo do Requerimento */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto">
            {/* Cabeçalho Institucional */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
              <h1 className="text-lg font-bold mb-1">GOVERNO DO ESTADO DE SÃO PAULO</h1>
              <h2 className="text-base mb-1">SECRETARIA DA EDUCAÇÃO</h2>
              <h3 className="text-base font-semibold">EE PROFA. MARLENE FRATTINI</h3>
            </div>

            {/* Título do Requerimento */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold mb-2">REQUERIMENTO DE CONCESSÃO DE VANTAGEM</h2>
              <p className="text-sm text-slate-600">{details.title}</p>
            </div>

            {/* Dados do Servidor */}
            <div className="mb-6">
              <p className="text-base leading-relaxed text-justify mb-4">
                Eu, <strong>{server.server.name}</strong>, servidor(a) público(a) estadual, 
                portador(a) do CPF nº <strong>{formatCPF(server.server.cpf)}</strong>, 
                ocupante do cargo de <strong>{server.server.position}</strong>, 
                {server.server.category && <> categoria <strong>{server.server.category}</strong>,</>}
                lotado(a) nesta Unidade Escolar, venho respeitosamente requerer a Vossa Senhoria 
                a concessão da vantagem abaixo especificada:
              </p>
            </div>

            {/* Detalhes da Vantagem */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-300 rounded">
              <h3 className="text-base font-bold mb-3">DETALHES DA VANTAGEM REQUERIDA:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Tipo:</strong> {details.title}</p>
                <p><strong>Descrição:</strong> {details.description}</p>
                {advantageType === "ats" && (
                  <>
                    <p><strong>Último ATS concedido:</strong> {server.ats!.lastQuinquenio}º Quinquênio em {formatDate(server.ats!.lastDate)}</p>
                    <p><strong>Próximo ATS devido:</strong> {server.ats!.nextQuinquenio} (previsto para {formatDate(server.ats!.nextExpected)})</p>
                  </>
                )}
                {advantageType === "evolution" && (
                  <>
                    <p><strong>Última evolução:</strong> {server.evolution!.lastEvolution}ª em {formatDate(server.evolution!.lastDate)}</p>
                    <p><strong>Progressão devida:</strong> Nível {server.evolution!.fromLevel} → Nível {server.evolution!.toLevel}</p>
                    <p><strong>Data prevista:</strong> {formatDate(server.evolution!.nextExpected)}</p>
                  </>
                )}
                {advantageType === "license" && (
                  <>
                    <p><strong>Certidões pendentes:</strong> {server.license!.missingCertificates}</p>
                    {server.license!.lastCertificate && (
                      <p><strong>Última certidão registrada:</strong> {server.license!.lastCertificate}</p>
                    )}
                    <p><strong>Período aquisitivo:</strong> {formatDate(server.license!.nextPeriodStart)} → {formatDate(server.license!.nextPeriodEnd)}</p>
                  </>
                )}
              </div>
            </div>

            {/* Fundamentação */}
            <div className="mb-6">
              <h3 className="text-base font-bold mb-3">FUNDAMENTAÇÃO:</h3>
              <p className="text-base leading-relaxed text-justify mb-4">
                {details.details}
              </p>
              <p className="text-base leading-relaxed text-justify mb-4">
                O requerimento encontra-se amparado pela {details.legalBasis}, 
                tendo em vista o cumprimento dos requisitos legais e regulamentares necessários 
                para a concessão da vantagem pleiteada.
              </p>
              {details.overdueDays > 0 && (
                <p className="text-base leading-relaxed text-justify mb-4">
                  <strong>Observação:</strong> A vantagem encontra-se vencida há <strong>{details.overdueDays} dias</strong>, 
                  conforme cálculo automático realizado pelo sistema de gestão.
                </p>
              )}
            </div>

            {/* Fechamento */}
            <div className="mb-12">
              <p className="text-base leading-relaxed text-justify mb-4">
                Nestes termos,<br />
                Pede deferimento.
              </p>
            </div>

            {/* Local e Data */}
            <div className="mb-12 text-right">
              <p className="text-base">São Paulo, {formattedDate}.</p>
            </div>

            {/* Assinatura do Servidor */}
            <div className="mb-12">
              <div className="border-t border-black w-96 mx-auto pt-2 text-center">
                <p className="text-base font-semibold">{server.server.name}</p>
                <p className="text-sm">CPF: {formatCPF(server.server.cpf)}</p>
                <p className="text-sm">Requerente</p>
              </div>
            </div>

            {/* Espaço para Despacho */}
            <div className="mb-8 p-4 border border-slate-300 rounded">
              <h3 className="text-base font-bold mb-3">DESPACHO DA DIREÇÃO:</h3>
              <div className="space-y-4">
                <div className="min-h-[100px] border-b border-slate-300"></div>
                <div className="text-right">
                  <p className="text-sm">Data: ___/___/_____</p>
                </div>
                <div className="border-t border-black w-96 mx-auto pt-2 text-center mt-8">
                  <p className="text-base font-semibold">Diretor(a) da Unidade Escolar</p>
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
              <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
              <p>EE Profa. Marlene Frattini • {formattedDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
