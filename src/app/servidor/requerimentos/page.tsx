"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Clock, CheckCircle, XCircle, ArrowLeft, Download } from "lucide-react";
import { formatDate } from "@/lib/format";

interface Request {
  id: string;
  requestNumber: string;
  type: string;
  description: string | null;
  outrosDescricao: string | null;
  status: string;
  createdAt: string;
  responseNotes: string | null;
  documentName: string | null;
}

export default function RequerimentosPage() {
  const router = useRouter();
  const [serverId, setServerId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [outrosDescricao, setOutrosDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Verifica se está logado
    const storedServer = localStorage.getItem("servidor");
    if (!storedServer) {
      router.push("/servidor/login");
      return;
    }

    const server = JSON.parse(storedServer);
    setServerId(server.id);
    loadRequests(server.id);
  }, []);

  const loadRequests = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests?serverId=${id}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Erro ao carregar requerimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverId || !newType) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId,
          type: newType,
          description: newDescription || null,
          outrosDescricao: outrosDescricao || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao criar requerimento");
        return;
      }

      const data = await res.json();
      setShowModal(false);
      setNewType("");
      setNewDescription("");
      setOutrosDescricao("");
      
      // Mostra mensagem de sucesso com número do requerimento
      alert(`Requerimento criado com sucesso!\n\nNúmero: ${data.request.requestNumber}`);
      
      loadRequests(serverId);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-5 w-5 text-amber-600" />;
      case "aprovado":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "rejeitado":
        return <XCircle className="h-5 w-5 text-red-600" />;
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

  const handleDownloadDocument = async (requestId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/document`);
      const data = await res.json();
      
      if (data.documentUrl) {
        // Converter base64 para blob
        const base64Data = data.documentUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.documentUrl.split(';')[0].split(':')[1] });
        
        // Criar URL e fazer download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      alert("Erro ao baixar documento");
    }
  };

  const handleGenerateOfficialDocument = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/official-document`);
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }

      // Cria documento HTML para impressão
      const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Requerimento ${data.requestNumber}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 18px;
      margin: 5px 0;
    }
    .header h2 {
      font-size: 16px;
      margin: 5px 0;
    }
    .request-info {
      margin: 20px 0;
    }
    .request-info p {
      margin: 10px 0;
    }
    .server-data {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
      background-color: #f9f9f9;
    }
    .server-data h3 {
      margin-top: 0;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .description {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
      background-color: #fff;
    }
    .description h3 {
      margin-top: 0;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 20px;
    }
    @media print {
      body {
        margin: 0;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>GOVERNO DO ESTADO DE SÃO PAULO</h1>
    <h2>SECRETARIA DA EDUCAÇÃO</h2>
    <h2>EE PROFA. MARLENE FRATTINI</h2>
  </div>

  <div class="request-info">
    <p><strong>REQUERIMENTO Nº:</strong> ${data.requestNumber}</p>
    <p><strong>DATA:</strong> ${data.date}</p>
    <p><strong>TIPO:</strong> ${data.type}</p>
  </div>

  <div class="server-data">
    <h3>DADOS DO SERVIDOR</h3>
    <p><strong>Nome:</strong> ${data.server.name}</p>
    <p><strong>CPF:</strong> ${data.server.cpf}</p>
    <p><strong>Cargo:</strong> ${data.server.position}</p>
    <p><strong>Categoria:</strong> ${data.server.category}</p>
  </div>

  <div class="description">
    <h3>DESCRIÇÃO DO REQUERIMENTO</h3>
    <p>${data.description}</p>
    ${data.outrosDescricao ? `<p><strong>Detalhamento:</strong> ${data.outrosDescricao}</p>` : ''}
  </div>

  <div class="footer">
    <p>Documento gerado eletronicamente pelo Sistema de Gestão de Servidores</p>
    <p>EE Profa. Marlene Frattini • ${data.date}</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
      `;

      // Abre nova janela com o documento
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
      alert("Erro ao gerar documento oficial");
    }
  };

  if (!serverId) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/servidor/dashboard")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold">Meus Requerimentos</h1>
              <p className="text-blue-100 mt-1">Solicite e acompanhe seus requerimentos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Botão Novo Requerimento */}
        <div className="mb-6">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Novo Requerimento
          </button>
        </div>

        {/* Lista de Requerimentos */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum requerimento encontrado
            </h2>
            <p className="text-slate-600">
              Clique em "Novo Requerimento" para fazer sua primeira solicitação
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{request.type}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        <strong>Nº:</strong> {request.requestNumber}
                      </p>
                      <p className="text-sm text-slate-600">
                        Criado em {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {request.description && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700">{request.description}</p>
                  </div>
                )}

                {request.outrosDescricao && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-medium text-amber-900 mb-1">Detalhamento:</p>
                    <p className="text-sm text-amber-800">{request.outrosDescricao}</p>
                  </div>
                )}

                {request.responseNotes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Resposta:</p>
                    <p className="text-sm text-blue-800">{request.responseNotes}</p>
                  </div>
                )}

                {request.documentName && request.status === "aprovado" && (
                  <button
                    onClick={() => handleDownloadDocument(request.id, request.documentName!)}
                    className="mt-3 flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Download className="h-5 w-5 text-indigo-600" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-indigo-900">Documento Anexado</p>
                      <p className="text-xs text-indigo-700">{request.documentName}</p>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => handleGenerateOfficialDocument(request.id)}
                  className="mt-3 w-full flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Gerar Documento Oficial</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Novo Requerimento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Novo Requerimento</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Vantagem *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Selecione...</option>
                  <option value="ATS">ATS - Adicional por Tempo de Serviço</option>
                  <option value="LICENCA_PREMIO">Licença Prêmio</option>
                  <option value="EVOLUCAO_FUNCIONAL">Evolução Funcional</option>
                  <option value="CERTIDAO">Certidão de Tempo de Serviço</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Descreva detalhes do seu requerimento..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {newType === "OUTRO" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Especifique sua necessidade *
                  </label>
                  <textarea
                    value={outrosDescricao}
                    onChange={(e) => setOutrosDescricao(e.target.value)}
                    rows={4}
                    required
                    placeholder="Descreva detalhadamente o que você precisa..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewType("");
                    setNewDescription("");
                    setOutrosDescricao("");
                  }}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newType}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
