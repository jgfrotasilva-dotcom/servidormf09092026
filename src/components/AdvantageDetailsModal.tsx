"use client";

import { X, Calendar, Award, TrendingUp, FileText } from "lucide-react";
import { formatDate } from "@/lib/format";

interface AdvantageDetailsModalProps {
  type: "ats" | "license" | "evolution";
  data: any;
  onClose: () => void;
}

export function AdvantageDetailsModal({ type, data, onClose }: AdvantageDetailsModalProps) {
  const getTitle = () => {
    switch (type) {
      case "ats":
        return "Adicional por Tempo de Serviço (ATS)";
      case "license":
        return "Licença Prêmio";
      case "evolution":
        return "Evolução Funcional";
      default:
        return "Detalhes";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "ats":
        return <Award className="h-6 w-6 text-blue-600" />;
      case "license":
        return <Calendar className="h-6 w-6 text-green-600" />;
      case "evolution":
        return <TrendingUp className="h-6 w-6 text-purple-600" />;
      default:
        return <FileText className="h-6 w-6 text-slate-600" />;
    }
  };

  const renderContent = () => {
    switch (type) {
      case "ats":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-900 mb-2">Resumo</h4>
              <p className="text-sm text-blue-800">
                Total de quinquênios: <strong>{data.totalGranted}</strong>
              </p>
              {data.nextExpected && (
                <p className="text-sm text-blue-800 mt-2">
                  Próximo ATS: <strong>{data.nextQuinquenio}</strong> previsto para {formatDate(data.nextExpected)}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3">Histórico de Quinquênios</h4>
              {data.granted.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum quinquênio registrado</p>
              ) : (
                <div className="space-y-2">
                  {data.granted.map((ats: any) => (
                    <div key={ats.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">{ats.type}</span>
                        {ats.isLast && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Vigente
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        Data de Vigência: {formatDate(ats.startDate)}
                      </p>
                      {ats.doeDate && (
                        <p className="text-sm text-slate-600">
                          Data do DOE: {formatDate(ats.doeDate)}
                        </p>
                      )}
                      {ats.nextDate && (
                        <p className="text-sm text-slate-600">
                          Próximo previsto: {formatDate(ats.nextDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "license":
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-900 mb-2">Resumo</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-green-700">Certidões</p>
                  <p className="text-2xl font-bold text-green-900">{data.totalCerts}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-green-900">{data.totalBalance} dias</p>
                </div>
              </div>
              {data.nextPeriod && (
                <p className="text-sm text-green-800 mt-2">
                  Próximo período: {formatDate(data.nextPeriod.startDate)} → {formatDate(data.nextPeriod.endDate)}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3">Certidões Registradas</h4>
              {data.certificates.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma certidão registrada</p>
              ) : (
                <div className="space-y-3">
                  {data.certificates.map((cert: any) => {
                    const certUsages = data.usages.filter((u: any) => u.certificateId === cert.id);
                    return (
                      <div key={cert.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-900">
                            Certidão Nº {cert.certificateNumber}/{cert.certificateYear}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {cert.currentBalance} dias disponíveis
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          Período Aquisitivo: {formatDate(cert.acquisitionStartDate)} → {formatDate(cert.acquisitionEndDate)}
                        </p>
                        {cert.doeDate && (
                          <p className="text-sm text-slate-600 mb-2">
                            Data do DOE: {formatDate(cert.doeDate)}
                          </p>
                        )}
                        {certUsages.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-700 mb-2">Usufrutos:</p>
                            {certUsages.map((usage: any) => (
                              <div key={usage.id} className="text-xs text-slate-600 mb-1">
                                • {usage.type === "FRUICAO" ? "Fruição" : "Pecúnia"}: {usage.days} dias
                                {usage.type === "FRUICAO" && usage.startDate && (
                                  <span> ({formatDate(usage.startDate)} → {formatDate(usage.endDate)})</span>
                                )}
                                {usage.type === "PECUNIA" && usage.year && (
                                  <span> (Ano {usage.year})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case "evolution":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-bold text-purple-900 mb-2">Resumo</h4>
              {data.currentLevel && (
                <p className="text-sm text-purple-800">
                  Nível Atual: <strong>{data.currentLevel}</strong>
                </p>
              )}
              <p className="text-sm text-purple-800 mt-1">
                Total de evoluções: <strong>{data.totalGranted}</strong>
              </p>
              {data.nextEvolution && (
                <p className="text-sm text-purple-800 mt-2">
                  Próxima: {data.nextEvolution.evolutionNumber}ª ({data.nextEvolution.fromLevel} → {data.nextEvolution.toLevel}) prevista para {formatDate(data.nextEvolution.date)}
                </p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3">Histórico de Evoluções</h4>
              {data.granted.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma evolução registrada</p>
              ) : (
                <div className="space-y-2">
                  {data.granted.map((evo: any) => (
                    <div key={evo.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900">
                          {evo.evolutionNumber}ª Evolução
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {evo.fromLevel} → {evo.toLevel}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        Data de Vigência: {formatDate(evo.startDate)}
                      </p>
                      {evo.doeDate && (
                        <p className="text-sm text-slate-600">
                          Data do DOE: {formatDate(evo.doeDate)}
                        </p>
                      )}
                      {evo.nextEvolutionDate && (
                        <p className="text-sm text-slate-600">
                          Próxima evolução: {formatDate(evo.nextEvolutionDate)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h2 className="text-xl font-bold text-slate-900">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <div className="p-6">{renderContent()}</div>
      </div>
    </div>
  );
}
