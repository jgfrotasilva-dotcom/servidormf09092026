import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Calculator,
} from "lucide-react";
import type { Server, AtsBenefit } from "@/db/schema";
import { formatDate } from "@/lib/format";

interface AtsFormData {
  quinquenioNumber: number;
  startDate: string;
  doeDate: string;
  isLast: boolean;
}

export default function AtsContent() {
  const [eligibleServers, setEligibleServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [atsList, setAtsList] = useState<AtsBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAts, setLoadingAts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAts, setEditingAts] = useState<AtsBenefit | null>(null);
  const [viewingAts, setViewingAts] = useState<AtsBenefit | null>(null);
  const [deletingAtsId, setDeletingAtsId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const searchParams = useSearchParams();
  const serverParam = searchParams.get("server");

  useEffect(() => {
    loadEligibleServers();
  }, []);

  // Auto-seleciona servidor vindo da análise
  useEffect(() => {
    if (serverParam && eligibleServers.length > 0 && !selectedServerId) {
      const found = eligibleServers.find((s) => s.id === serverParam);
      if (found) setSelectedServerId(found.id);
    }
  }, [serverParam, eligibleServers, selectedServerId]);

  useEffect(() => {
    if (selectedServerId) {
      loadAtsList(selectedServerId);
      const server = eligibleServers.find((s) => s.id === selectedServerId);
      setSelectedServer(server || null);
    } else {
      setAtsList([]);
      setSelectedServer(null);
    }
  }, [selectedServerId, eligibleServers]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadEligibleServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/servers/eligible");
      const data = await res.json();
      setEligibleServers(data.servers || []);
    } catch (error) {
      showToast("error", "Erro ao carregar servidores");
    } finally {
      setLoading(false);
    }
  };

  const loadAtsList = async (serverId: string) => {
    setLoadingAts(true);
    try {
      const res = await fetch(`/api/ats?serverId=${serverId}`);
      const data = await res.json();
      setAtsList(data.ats || []);
    } catch (error) {
      showToast("error", "Erro ao carregar ATS");
    } finally {
      setLoadingAts(false);
    }
  };

  const handleDeleteAts = async (id: string) => {
    try {
      const res = await fetch(`/api/ats/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir ATS");
        return;
      }
      showToast("success", "ATS excluído com sucesso");
      if (selectedServerId) loadAtsList(selectedServerId);
    } catch (error) {
      showToast("error", "Erro ao excluir ATS");
    } finally {
      setDeletingAtsId(null);
    }
  };

  const getNextQuinquenio = () => {
    if (atsList.length === 0) return 1;
    return Math.max(...atsList.map((a) => a.quinquenioNumber)) + 1;
  };

  const getLastAts = () => atsList.find((a) => a.isLast);

  const getNextAtsDate = () => {
    const last = getLastAts();
    if (!last) return null;
    return last.nextDate;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed right-4 top-4 z-[100]">
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Seletor de Servidor */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Selecionar Servidor</h2>
            <p className="text-sm text-slate-500">
              Apenas servidores Efetivos (A) e ACT podem receber ATS
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
          </div>
        ) : eligibleServers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhum servidor elegível encontrado. Cadastre servidores com categoria A ou ACT primeiro.
            </p>
          </div>
        ) : (
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            <option value="">Selecione um servidor...</option>
            {eligibleServers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} - {server.position} ({server.category === "A" ? "Efetivo" : "ACT"})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Informações do Servidor e ATS */}
      {selectedServer && (
        <div className="mt-6 space-y-6">
          {/* Card do Servidor */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg">
                  {selectedServer.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedServer.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedServer.position} • Categoria{" "}
                    {selectedServer.category === "A" ? "A - Efetivo" : "ACT"}
                  </p>
                  {selectedServer.faixa && selectedServer.nivel && (
                    <p className="mt-1 text-xs text-slate-500">
                      Faixa {selectedServer.faixa} • Nível {selectedServer.nivel}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingAts(null);
                  setShowModal(true);
                }}
                disabled={atsList.length >= 10}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Novo ATS
              </button>
            </div>

            {/* Resumo de ATS */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Total ATS</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{atsList.length}</p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Último ATS</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {getLastAts() ? `${getLastAts()!.quinquenioNumber}º` : "-"}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Próximo ATS</p>
                <p className="mt-1 text-2xl font-bold text-violet-700">
                  {atsList.length < 10 ? `${getNextQuinquenio()}º` : "Máximo"}
                </p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Data Próximo</p>
                <p className="mt-1 text-lg font-bold text-amber-700">
                  {getNextAtsDate() ? formatDate(getNextAtsDate()!) : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de ATS */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Histórico de ATS</h3>
              <p className="text-sm text-slate-500">
                Quinquênios cadastrados para este servidor
              </p>
            </div>

            {loadingAts ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              </div>
            ) : atsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <Award className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="mt-4 text-base font-semibold text-slate-900">
                  Nenhum ATS cadastrado
                </h4>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Comece cadastrando o primeiro quinquênio deste servidor
                </p>
                <button
                  onClick={() => {
                    setEditingAts(null);
                    setShowModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro ATS
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {atsList.map((ats) => (
                  <AtsCard
                    key={ats.id}
                    ats={ats}
                    onView={() => setViewingAts(ats)}
                    onEdit={() => {
                      setEditingAts(ats);
                      setShowModal(true);
                    }}
                    onDelete={() => setDeletingAtsId(ats.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && selectedServer && (
        <AtsFormModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingAts(null);
          }}
          onSuccess={() => {
            loadAtsList(selectedServerId);
            showToast("success", editingAts ? "ATS atualizado" : "ATS cadastrado");
          }}
          server={selectedServer}
          ats={editingAts}
          existingAts={atsList}
        />
      )}

      {/* Modal de Visualização */}
      {viewingAts && (
        <AtsDetailsModal
          ats={viewingAts}
          onClose={() => setViewingAts(null)}
          onEdit={() => {
            setEditingAts(viewingAts);
            setViewingAts(null);
            setShowModal(true);
          }}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingAtsId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDeletingAtsId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir ATS</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingAtsId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteAts(deletingAtsId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AtsCard({
  ats,
  onView,
  onEdit,
  onDelete,
}: {
  ats: AtsBenefit;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 transition hover:bg-slate-50">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
            ats.isLast
              ? "bg-gradient-to-br from-emerald-500 to-teal-600"
              : "bg-gradient-to-br from-slate-400 to-slate-500"
          }`}
        >
          {ats.quinquenioNumber}º
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{ats.type}</p>
            {ats.isLast && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                ÚLTIMO
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Vigência: {formatDate(ats.startDate)}
            </span>
            {ats.doeDate && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                DOE: {formatDate(ats.doeDate)}
              </span>
            )}
            {ats.nextDate && (
              <span className="flex items-center gap-1 text-violet-700">
                <Clock className="h-3 w-3" />
                Próximo: {formatDate(ats.nextDate)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onView}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Ver detalhes"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Editar"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          aria-label="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AtsFormModal({
  open,
  onClose,
  onSuccess,
  server,
  ats,
  existingAts,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  server: Server;
  ats: AtsBenefit | null;
  existingAts: AtsBenefit[];
}) {
  const [form, setForm] = useState<AtsFormData>({
    quinquenioNumber: 1,
    startDate: "",
    doeDate: "",
    isLast: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AtsFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (ats) {
      setForm({
        quinquenioNumber: ats.quinquenioNumber,
        startDate: ats.startDate,
        doeDate: ats.doeDate || "",
        isLast: ats.isLast,
      });
    } else {
      const nextNum =
        existingAts.length === 0 ? 1 : Math.max(...existingAts.map((a) => a.quinquenioNumber)) + 1;
      setForm({
        quinquenioNumber: nextNum <= 10 ? nextNum : 10,
        startDate: "",
        doeDate: "",
        isLast: false,
      });
    }
    setErrors({});
    setGlobalError(null);
  }, [open, ats, existingAts]);

  if (!open) return null;

  const isEditing = Boolean(ats);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AtsFormData, string>> = {};
    if (!form.startDate) newErrors.startDate = "Data de vigência é obrigatória";
    if (form.quinquenioNumber < 1 || form.quinquenioNumber > 10)
      newErrors.quinquenioNumber = "Quinquênio deve ser entre 1 e 10";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setGlobalError(null);

    try {
      const payload = {
        serverId: server.id,
        quinquenioNumber: form.quinquenioNumber,
        startDate: form.startDate,
        doeDate: form.doeDate || null,
        isLast: form.isLast,
      };

      const url = isEditing ? `/api/ats/${ats!.id}` : "/api/ats";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Erro ao salvar");
        setSaving(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setGlobalError("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const calculateNextDate = () => {
    if (!form.startDate) return null;
    const date = new Date(form.startDate);
    date.setDate(date.getDate() + 1825);
    return date.toISOString().split("T")[0];
  };

  const nextQuinquenioOptions = Array.from({ length: 10 }, (_, i) => i + 1).filter((num) => {
    if (isEditing && ats) return true;
    return !existingAts.some((a) => a.quinquenioNumber === num);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar ATS" : "Novo ATS"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing
                  ? "Atualize os dados do quinquênio"
                  : `Cadastrar quinquênio para ${server.name}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {globalError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Tipo de Quinquênio *
              </label>
              <select
                value={form.quinquenioNumber}
                onChange={(e) => setForm({ ...form, quinquenioNumber: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                {nextQuinquenioOptions.map((num) => (
                  <option key={num} value={num}>
                    {num}º Quinquênio
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Data de Vigência *
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
              {form.startDate && (
                <p className="mt-1 text-xs text-slate-500">
                  Vigência a partir de: {formatDate(form.startDate)}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Data do DOE (Diário Oficial)
              </label>
              <input
                type="date"
                value={form.doeDate}
                onChange={(e) => setForm({ ...form, doeDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
              {form.doeDate && (
                <p className="mt-1 text-xs text-slate-500">
                  Publicado em: {formatDate(form.doeDate)}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.isLast}
                  onChange={(e) => setForm({ ...form, isLast: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-violet-900">
                    Marcar como Último ATS?
                  </p>
                  <p className="mt-1 text-xs text-violet-700">
                    Se marcado, este será considerado o ATS mais recente do servidor
                  </p>
                </div>
              </label>
            </div>

            {form.startDate && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <Calculator className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">
                      Cálculo Automático
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                      Data do próximo quinquênio: <strong>{formatDate(calculateNextDate())}</strong>
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-600">
                      (Data de vigência + 1825 dias = 5 anos)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar ATS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AtsDetailsModal({
  ats,
  onClose,
  onEdit,
}: {
  ats: AtsBenefit;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-violet-100">
                Detalhes do ATS
              </p>
              <h2 className="mt-1 text-xl font-bold">{ats.type}</h2>
              {ats.isLast && (
                <span className="mt-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                  ✓ ÚLTIMO ATS
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Data de Vigência
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Calendar className="h-4 w-4 text-violet-600" />
              {formatDate(ats.startDate)}
            </p>
          </div>

          {ats.doeDate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Data do DOE
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                <FileText className="h-4 w-4 text-violet-600" />
                {formatDate(ats.doeDate)}
              </p>
            </div>
          )}

          {ats.nextDate && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Próximo Quinquênio
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-emerald-900">
                <Clock className="h-4 w-4" />
                {formatDate(ats.nextDate)}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                (Vigência atual + 1825 dias)
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-violet-700 hover:to-indigo-700"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
