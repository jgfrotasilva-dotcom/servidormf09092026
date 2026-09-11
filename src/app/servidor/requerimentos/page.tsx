"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Clock, CheckCircle, XCircle, ArrowLeft, Download, Edit, Trash2, MessageCircle, X } from "lucide-react";
import { formatDate } from "@/lib/format";

interface Interaction {
  id: string;
  from: "servidor" | "gestao";
  message: string;
  createdAt: string;
}

interface Request {
  id: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
  responseNotes: string | null;
  documentName: string | null;
  interactions?: Interaction[];
}

export default function RequerimentosPage() {
  const router = useRouter();
  const [serverId, setServerId] = useState<string | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Request | null>(null);
  const [newType, setNewType] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showChat, setShowChat] = useState<Request | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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
      const url = editingRequest ? `/api/requests/${editingRequest.id}` : "/api/requests";
      const method = editingRequest ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverId,
          type: newType,
          description: newDescription || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || (editingRequest ? "Erro ao editar requerimento" : "Erro ao criar requerimento"));
        return;
      }

      setShowModal(false);
      setEditingRequest(null);
      setNewType("");
      setNewDescription("");
      if (serverId) loadRequests(serverId);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (request: Request) => {
    setEditingRequest(request);
    setNewType(request.type);
    setNewDescription(request.description || "");
    setShowModal(true);
  };

  const handleDelete = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}?serverId=${serverId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao excluir requerimento");
        return;
      }

      setShowDeleteConfirm(null);
      if (serverId) loadRequests(serverId);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
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

      // Busca interações
      const interactionsRes = await fetch(`/api/requests/${requestId}/interactions`);
      const interactionsData = await interactionsRes.json();
      const interactions = interactionsData.interactions || [];

      // Cria HTML das interações
      const interactionsHtml = interactions.length > 0 
        ? interactions.map((i: any) => `
          <div style="margin: 10px 0; padding: 10px; border-left: 3px solid ${i.from === 'servidor' ? '#3b82f6' : '#10b981'}; background: ${i.from === 'servidor' ? '#eff6ff' : '#f0fdf4'}; padding-left: 15px;">
            <p style="margin: 0; font-size: 11px; color: #666;">
              <strong>${i.from === 'servidor' ? 'Servidor' : 'Gestão'}</strong> - ${new Date(i.createdAt).toLocaleDateString('pt-BR')} às ${new Date(i.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </p>
            <p style="margin: 5px 0 0 0;">${i.message}</p>
          </div>
        `).join('')
        : '<p style="color: #999; font-style: italic;">Nenhuma interação registrada</p>';

      // Cria documento HTML para impressão
      const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Requerimento ${data.id}</title>
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
    .header h1 { font-size: 18px; margin: 5px 0; }
    .header h2 { font-size: 16px; margin: 5px 0; }
    .request-info { margin: 20px 0; }
    .request-info p { margin: 10px 0; }
    .server-data, .description, .interactions {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ccc;
    }
    .server-data h3, .description h3, .interactions h3 {
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
      body { margin: 0; padding: 20px; }
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
    <p>${data.description || 'Sem descrição'}</p>
  </div>

  <div class="interactions">
    <h3>HISTÓRICO DE INTERAÇÕES</h3>
    ${interactionsHtml}
  </div>

  ${data.responseNotes ? `
  <div class="description">
    <h3>RESPOSTA DA GESTÃO</h3>
    <p>${data.responseNotes}</p>
  </div>
  ` : ''}

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

  const handleSendMessage = async (requestId: string) => {
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "servidor",
          message: newMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao enviar mensagem");
        return;
      }

      setNewMessage("");
      // Recarrega requerimentos para mostrar nova interação
      if (serverId) loadRequests(serverId);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSendingMessage(false);
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

                {request.status === "pendente" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(request)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Edit className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Editar</span>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(request.id)}
                      className="flex-1 flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-900">Excluir</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowChat(request)}
                  className="mt-3 w-full flex items-center justify-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">
                    Ver Histórico de Interações {request.interactions && request.interactions.length > 0 && `(${request.interactions.length})`}
                  </span>
                </button>
                <button
                  onClick={() => handleGenerateOfficialDocument(request.id)}
                  className="mt-2 w-full flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Gerar Documento Oficial</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Chat/Histórico */}
        {showChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Histórico de Interações</h3>
                  <p className="text-sm text-slate-600">
                    Requerimento: {showChat.type} - {new Date(showChat.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => setShowChat(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {showChat.interactions && showChat.interactions.length > 0 ? (
                  showChat.interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        interaction.from === "servidor"
                          ? "bg-blue-50 border-blue-500"
                          : "bg-green-50 border-green-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">
                          {interaction.from === "servidor" ? "👤 Servidor" : "👔 Gestão"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(interaction.createdAt).toLocaleDateString('pt-BR')} às{" "}
                          {new Date(interaction.createdAt).toLocaleTimeString('pt-BR', {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{interaction.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    Nenhuma interação registrada ainda
                  </p>
                )}
              </div>

              <div className="p-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage(showChat.id);
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => handleSendMessage(showChat.id)}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Requerimento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingRequest ? "Editar Requerimento" : "Novo Requerimento"}
            </h2>
            
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

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRequest(null);
                    setNewType("");
                    setNewDescription("");
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
                  {submitting ? "Salvando..." : editingRequest ? "Salvar Alterações" : "Enviar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">Excluir Requerimento</h3>
                <p className="text-sm text-slate-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-6">
              Tem certeza que deseja excluir este requerimento? Ele será removido permanentemente do sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
