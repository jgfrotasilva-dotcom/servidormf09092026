"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle, XCircle, Clock, MessageSquare, ArrowLeft, Upload, Download, LogOut } from "lucide-react";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/AdminHeader";

interface Interaction {
  id: string;
  from: "servidor" | "gestao";
  message: string;
  createdAt: string;
}

interface Request {
  id: string;
  serverId: string;
  serverName: string;
  serverPosition: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
  responseNotes: string | null;
  documentUrl: string | null;
  documentName: string | null;
  interactions?: Interaction[];
}

export default function AdminRequerimentosPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [responseStatus, setResponseStatus] = useState<"aprovado" | "rejeitado">("aprovado");
  const [responseNotes, setResponseNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Verifica se está logado como admin
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }

    loadRequests();
  }, []);

  useEffect(() => {
    if (requests.length > 0) {
      loadRequests();
    }
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests/all");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error("Erro ao carregar requerimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (request: Request, status: "aprovado" | "rejeitado") => {
    setSelectedRequest(request);
    setResponseStatus(status);
    setResponseNotes("");
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: responseStatus,
          responseNotes: responseNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao enviar resposta");
        return;
      }

      // Se tem arquivo selecionado, faz upload
      if (selectedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("requestId", selectedRequest.id);
        formData.append("document", selectedFile);

        const uploadRes = await fetch("/api/requests/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          alert("Erro ao fazer upload do documento");
        }
      }

      setShowResponseModal(false);
      setSelectedRequest(null);
      setResponseNotes("");
      setSelectedFile(null);
      loadRequests();
      alert(`Requerimento ${responseStatus} com sucesso!`);
    } catch (error) {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
      setUploading(false);
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ATS: "ATS - Adicional por Tempo de Serviço",
      LICENCA_PREMIO: "Licença Prêmio",
      EVOLUCAO_FUNCIONAL: "Evolução Funcional",
      CERTIDAO: "Certidão de Tempo de Serviço",
      OUTRO: "Outro",
    };
    return labels[type] || type;
  };

  const filteredRequests = filter === "all" 
    ? requests 
    : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === "pendente").length;
  const approvedCount = requests.filter(r => r.status === "aprovado").length;
  const rejectedCount = requests.filter(r => r.status === "rejeitado").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader
        title="Gerenciar Requerimentos"
        subtitle="Aprove ou rejeite requerimentos dos servidores"
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-4">
            <p className="text-sm text-slate-600">Total</p>
            <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
          </div>
          <div className="bg-amber-50 rounded-xl shadow p-4 border border-amber-200">
            <p className="text-sm text-amber-700">Pendentes</p>
            <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow p-4 border border-green-200">
            <p className="text-sm text-green-700">Aprovados</p>
            <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow p-4 border border-red-200">
            <p className="text-sm text-red-700">Rejeitados</p>
            <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Filtrar por status:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter("pendente")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "pendente"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilter("aprovado")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "aprovado"
                    ? "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Aprovados
              </button>
              <button
                onClick={() => setFilter("rejeitado")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "rejeitado"
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Rejeitados
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Requerimentos */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Nenhum requerimento encontrado
            </h2>
            <p className="text-slate-600">
              {filter === "all" 
                ? "Ainda não há requerimentos no sistema" 
                : "Nenhum requerimento com este status"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-slate-900">{request.serverName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        {request.serverPosition}
                      </p>
                      <p className="text-sm text-slate-700 font-medium">
                        {getTypeLabel(request.type)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Criado em {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {request.description && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-700 mb-1">Descrição:</p>
                    <p className="text-sm text-slate-700">{request.description}</p>
                  </div>
                )}

                {request.responseNotes && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-900 mb-1">Resposta:</p>
                    <p className="text-sm text-blue-800">{request.responseNotes}</p>
                  </div>
                )}

              {request.status === "pendente" && (
                <div className="flex gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleRespond(request, "aprovado")}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleRespond(request, "rejeitado")}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Resposta */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {responseStatus === "aprovado" ? "Aprovar Requerimento" : "Rejeitar Requerimento"}
            </h2>
            
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">Servidor:</p>
              <p className="text-slate-900">{selectedRequest.serverName}</p>
              <p className="text-sm text-slate-700 mt-2">Tipo:</p>
              <p className="text-slate-900">{getTypeLabel(selectedRequest.type)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
                placeholder={
                  responseStatus === "aprovado"
                    ? "Ex: Requerimento aprovado. Entre em contato com a secretaria..."
                    : "Ex: Requerimento rejeitado porque..."
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            {responseStatus === "aprovado" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Anexar Documento (opcional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-1">
                    {selectedFile ? selectedFile.name : "Clique para selecionar ou arraste um arquivo"}
                  </p>
                  <p className="text-xs text-slate-500">PDF, DOC, DOCX, JPG, PNG</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Selecionar Arquivo
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedRequest(null);
                  setResponseNotes("");
                  setSelectedFile(null);
                }}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg font-medium hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={submitting || uploading}
                className={`flex-1 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  responseStatus === "aprovado"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {uploading ? "Enviando documento..." : submitting ? "Enviando..." : responseStatus === "aprovado" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
