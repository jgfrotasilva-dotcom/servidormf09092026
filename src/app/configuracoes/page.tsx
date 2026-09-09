"use client";

import { useState } from "react";
import { Download, Upload, AlertTriangle, CheckCircle2, Database, Shield } from "lucide-react";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/config/backup");
      if (!res.ok) throw new Error("Erro ao gerar backup");

      const backup = await res.json();

      // Cria arquivo JSON para download
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_servidores_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({
        type: "success",
        text: "Backup gerado com sucesso! O download iniciará automaticamente.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao gerar backup. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackupFile(file);
      setMessage(null);
    }
  };

  const handleRestore = async () => {
    if (!backupFile) {
      setMessage({ type: "error", text: "Selecione um arquivo de backup" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const content = await backupFile.text();
      const backup = JSON.parse(content);

      const res = await fetch("/api/config/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backup),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao restaurar backup");
      }

      const data = await res.json();

      setMessage({
        type: "success",
        text: `Backup restaurado com sucesso! ${data.restoredCount.servers} servidores, ${data.restoredCount.atsBenefits} ATS, ${data.restoredCount.functionalEvolutions} evoluções, ${data.restoredCount.licenseCertificates} certidões, ${data.restoredCount.licenseUsages} usufrutos e ${data.restoredCount.absences} ausências restaurados.`,
      });

      setBackupFile(null);
      setShowConfirmRestore(false);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao restaurar backup",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Shield className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Configurações do Sistema</h1>
              <p className="text-sm text-slate-600">
                Gerenciamento de backup e restauração de dados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Backup do Sistema</h2>
                <p className="text-sm text-slate-600">Exportar todos os dados</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>O que será incluído:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Todos os servidores cadastrados</li>
                <li>• ATS (Adicional por Tempo de Serviço)</li>
                <li>• Evoluções Funcionais</li>
                <li>• Certidões de Licença Prêmio</li>
                <li>• Usufrutos de Licença</li>
                <li>• Ausências e Orientações Técnicas</li>
              </ul>
            </div>

            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              {loading ? "Gerando Backup..." : "Gerar Backup"}
            </button>

            <p className="text-xs text-slate-500 mt-3 text-center">
              O arquivo será baixado automaticamente em formato JSON
            </p>
          </div>

          {/* Restore Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Upload className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Restaurar Backup</h2>
                <p className="text-sm text-slate-600">Importar dados de backup</p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-900">
                <strong>⚠️ Atenção:</strong>
              </p>
              <ul className="text-sm text-orange-800 mt-2 space-y-1">
                <li>• Todos os dados atuais serão apagados</li>
                <li>• Os dados do backup substituirão tudo</li>
                <li>• Esta ação não pode ser desfeita</li>
                <li>• Faça backup antes de restaurar</li>
              </ul>
            </div>

            {!showConfirmRestore ? (
              <label className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                Selecionar Arquivo de Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <strong>Arquivo selecionado:</strong>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{backupFile?.name}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowConfirmRestore(false);
                      setBackupFile(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {loading ? "Restaurando..." : "Confirmar Restauração"}
                  </button>
                </div>
              </div>
            )}

            {backupFile && !showConfirmRestore && (
              <button
                onClick={() => setShowConfirmRestore(true)}
                className="w-full mt-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <AlertTriangle className="h-5 w-5" />
                Restaurar Backup
              </button>
            )}

            <p className="text-xs text-slate-500 mt-3 text-center">
              Aceita apenas arquivos JSON gerados pelo sistema
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-slate-600" />
            <h2 className="text-xl font-bold text-slate-900">Informações do Sistema</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Versão do Sistema</p>
              <p className="text-lg font-bold text-slate-900">1.0.0</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Última Atualização</p>
              <p className="text-lg font-bold text-slate-900">08/09/2026</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Banco de Dados</p>
              <p className="text-lg font-bold text-slate-900">PostgreSQL</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>💡 Recomendações:</strong>
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Faça backup regularmente (sugestão: semanalmente)</li>
              <li>• Armazene os backups em local seguro (nuvem, HD externo)</li>
              <li>• Teste a restauração periodicamente para garantir integridade</li>
              <li>• Mantenha pelo menos 3 backups recentes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
