"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  User,
  AlertCircle,
  FileText,
  Clock,
} from "lucide-react";
import type { Server, Absence } from "@/db/schema";
import { ABSENCE_ALL } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { AdminHeader } from "@/components/AdminHeader";

type AbsenceFormData = {
  type: "AUSENCIA" | "ORIENTACAO_TECNICA";
  subtype: string;
  systemDate: string;
  startDate: string;
  endDate: string;
  days: string;
  doeDate: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  dateTBD: boolean;
  notes: string;
  hours: string;
};

const emptyForm: AbsenceFormData = {
  type: "AUSENCIA",
  subtype: "",
  systemDate: new Date().toISOString().split("T")[0],
  startDate: "",
  endDate: "",
  days: "",
  doeDate: "",
  title: "",
  location: "",
  startTime: "",
  endTime: "",
  dateTBD: false,
  notes: "",
  hours: "",
};

export default function AusenciasContent() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<AbsenceFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    if (selectedServerId) {
      loadAbsences(selectedServerId);
      const server = servers.find((s) => s.id === selectedServerId);
      setSelectedServer(server || null);
    } else {
      setAbsences([]);
      setSelectedServer(null);
    }
  }, [selectedServerId, servers]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadServers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/servers?limit=500");
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      showToast("error", "Erro ao carregar servidores");
    } finally {
      setLoading(false);
    }
  };

  const loadAbsences = async (serverId: string) => {
    setLoadingList(true);
    try {
      const res = await fetch(`/api/absences?serverId=${serverId}`);
      const data = await res.json();
      setAbsences(data.absences || []);
    } catch (error) {
      showToast("error", "Erro ao carregar ausências");
    } finally {
      setLoadingList(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/absences/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir");
        return;
      }
      showToast("success", "Registro excluído com sucesso");
      if (selectedServerId) loadAbsences(selectedServerId);
    } catch (error) {
      showToast("error", "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setGlobalError(null);

    try {
      const payload: any = {
        serverId: selectedServerId,
        type: form.type,
        systemDate: form.systemDate,
        notes: form.notes || null,
      };

      if (form.type === "AUSENCIA") {
        payload.subtype = form.subtype;
        const periodTypes = ["LICENCA_SAUDE", "AUXILIO_DOENCA", "LICENCA_PREMIO"];
        if (periodTypes.includes(form.subtype)) {
          payload.startDate = form.startDate;
          payload.endDate = form.endDate;
          payload.days = parseInt(form.days);
          payload.doeDate = form.doeDate;
        }
        
        // Adiciona horas para Falta Aula e Falta Médica Parcial
        const hoursRequiredTypes = ["FALTA_AULA", "FALTA_MEDICA_PARCIAL"];
        if (hoursRequiredTypes.includes(form.subtype)) {
          payload.hours = parseInt(form.hours);
        }
      } else {
        payload.title = form.title;
        payload.location = form.location;
        payload.startTime = form.startTime;
        payload.endTime = form.endTime;
        payload.dateTBD = form.dateTBD;
        payload.subtype = "ORIENTACAO_TECNICA";
      }

      const res = await fetch("/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setGlobalError(data.error || "Erro ao salvar");
        setSaving(false);
        return;
      }

      showToast("success", "Registro criado com sucesso");
      loadAbsences(selectedServerId);
      setShowModal(false);
      setForm(emptyForm);
    } catch (err) {
      setGlobalError("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.systemDate) newErrors.systemDate = "Data do sistema é obrigatória";

    if (form.type === "AUSENCIA") {
      if (!form.subtype) newErrors.subtype = "Tipo de ausência é obrigatório";
      const periodTypes = ["LICENCA_SAUDE", "AUXILIO_DOENCA", "LICENCA_PREMIO"];
      if (periodTypes.includes(form.subtype)) {
        if (!form.startDate) newErrors.startDate = "Data início é obrigatória";
        if (!form.endDate) newErrors.endDate = "Data fim é obrigatória";
        if (!form.days) newErrors.days = "Quantidade de dias é obrigatória";
        if (!form.doeDate) newErrors.doeDate = "Data do DOE é obrigatória";
      }
      
      // Validação para horas em Falta Aula e Falta Médica Parcial
      const hoursRequiredTypes = ["FALTA_AULA", "FALTA_MEDICA_PARCIAL"];
      if (hoursRequiredTypes.includes(form.subtype)) {
        if (!form.hours || parseInt(form.hours) <= 0) {
          newErrors.hours = "Quantidade de horas/aulas é obrigatória";
        }
      }
    } else {
      if (!form.title) newErrors.title = "Título é obrigatório";
      if (!form.location) newErrors.location = "Local é obrigatório";
      if (!form.startTime) newErrors.startTime = "Horário início é obrigatório";
      if (!form.endTime) newErrors.endTime = "Horário término é obrigatório";
      if (!form.dateTBD && !form.systemDate) newErrors.systemDate = "Data é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSubtypeLabel = (subtype: string | null): string => {
    if (!subtype) return "";
    const found = ABSENCE_ALL.find((a) => a.code === subtype);
    return found ? found.label : subtype;
  };

  const isPeriodType = (subtype: string) =>
    ["LICENCA_SAUDE", "AUXILIO_DOENCA", "LICENCA_PREMIO"].includes(subtype);

  const countAusencias = absences.filter((a) => a.type === "AUSENCIA").length;
  const countOrientacoes = absences.filter((a) => a.type === "ORIENTACAO_TECNICA").length;

  return (
    <div className="min-h-screen">
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

      <AdminHeader
        title="Ausências e Orientações Técnicas"
        subtitle="Registro de faltas, licenças e formações dos servidores"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Seletor de Servidor */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-600 to-red-700 text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Selecionar Servidor</h2>
              <p className="text-sm text-slate-500">Selecione um servidor para gerenciar registros</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
            </div>
          ) : (
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
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

        {/* Conteúdo do Servidor */}
        {selectedServer && (
          <div className="space-y-6">
            {/* Card do Servidor */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-xl font-bold text-white shadow-lg">
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
                      {selectedServer.position} • {selectedServer.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setForm(emptyForm);
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-orange-200 transition hover:from-orange-700 hover:to-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Novo Registro
                </button>
              </div>

              {/* Resumo */}
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-200 pt-5">
                <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{absences.length}</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase text-slate-500">Ausências</p>
                  <p className="mt-1 text-2xl font-bold text-orange-700">{countAusencias}</p>
                </div>
                <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase text-slate-500">Orientações</p>
                  <p className="mt-1 text-2xl font-bold text-blue-700">{countOrientacoes}</p>
                </div>
              </div>
            </div>

            {/* Lista de Registros */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">Histórico de Registros</h3>
                <p className="text-sm text-slate-500">
                  Ausências e orientações técnicas registradas
                </p>
              </div>

              {loadingList ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
                </div>
              ) : absences.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h4 className="mt-4 text-base font-semibold text-slate-900">
                    Nenhum registro cadastrado
                  </h4>
                  <p className="mt-1 max-w-sm text-sm text-slate-500">
                    Comece cadastrando uma ausência ou orientação técnica
                  </p>
                  <button
                    onClick={() => {
                      setForm(emptyForm);
                      setShowModal(true);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar Primeiro Registro
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {absences.map((absence) => (
                    <div
                      key={absence.id}
                      className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white shadow ${
                            absence.type === "AUSENCIA"
                              ? isPeriodType(absence.subtype || "")
                                ? "bg-gradient-to-br from-red-500 to-rose-600"
                                : "bg-gradient-to-br from-orange-500 to-amber-600"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600"
                          }`}
                        >
                          {absence.type === "AUSENCIA" ? (
                            <Calendar className="h-5 w-5" />
                          ) : (
                            <BookOpen className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {absence.type === "AUSENCIA"
                                ? getSubtypeLabel(absence.subtype)
                                : "Orientação Técnica"}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                absence.type === "AUSENCIA"
                                  ? isPeriodType(absence.subtype || "")
                                    ? "bg-red-100 text-red-800"
                                    : "bg-orange-100 text-orange-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {absence.type === "AUSENCIA" ? "AUSENCIA" : "FORMAÇÃO"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span>Registrado em: {formatDate(absence.systemDate)}</span>
                            {absence.type === "AUSENCIA" &&
                              isPeriodType(absence.subtype || "") && (
                                <>
                                  <span>
                                    Período: {formatDate(absence.startDate)} →{" "}
                                    {formatDate(absence.endDate)}
                                  </span>
                                  <span className="font-semibold">{absence.days} dias</span>
                                </>
                              )}
                            {absence.type === "AUSENCIA" &&
                              (absence.subtype === "FALTA_AULA" || absence.subtype === "FALTA_MEDICA_PARCIAL") &&
                              absence.hours && (
                                <span className="font-semibold text-orange-700">
                                  {absence.hours} {absence.hours === 1 ? "hora/aula" : "horas/aulas"}
                                </span>
                              )}
                            {absence.type === "ORIENTACAO_TECNICA" && (
                              <>
                                <span>{absence.title}</span>
                                <span>
                                  {absence.startTime} - {absence.endTime}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeletingId(absence.id)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              setForm(emptyForm);
            }}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Novo Registro</h2>
                  <p className="text-sm text-slate-500">Ausência ou Orientação Técnica</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
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
                {/* Tipo Principal */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">
                    Tipo de Registro *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...emptyForm, type: "AUSENCIA", systemDate: form.systemDate })
                      }
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                        form.type === "AUSENCIA"
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Calendar className="mx-auto mb-1 h-5 w-5" />
                      Ausência
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...emptyForm,
                          type: "ORIENTACAO_TECNICA",
                          systemDate: form.systemDate,
                        })
                      }
                      className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                        form.type === "ORIENTACAO_TECNICA"
                          ? "border-blue-500 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <BookOpen className="mx-auto mb-1 h-5 w-5" />
                      Orientação Técnica
                    </button>
                  </div>
                </div>

                {/* Data do Sistema */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Data do Registro *
                  </label>
                  <input
                    type="date"
                    value={form.systemDate}
                    onChange={(e) => setForm({ ...form, systemDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                {/* Campos para AUSENCIA */}
                {form.type === "AUSENCIA" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Tipo de Ausência *
                      </label>
                      <select
                        value={form.subtype}
                        onChange={(e) => setForm({ ...form, subtype: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="">Selecione...</option>
                        <optgroup label="Ausências Simples">
                          <option value="FALTA_AULA">Falta-Aula</option>
                          <option value="FALTA_MEDICA_PARCIAL">Falta Médica Parcial</option>
                          <option value="FALTA_MEDICA_TOTAL">Falta Médica Total</option>
                          <option value="JUSTIFICADA">Justificada</option>
                          <option value="DOACAO_SANGUE">Doação de Sangue</option>
                        </optgroup>
                        <optgroup label="Licenças (com período)">
                          <option value="LICENCA_SAUDE">Licença Saúde</option>
                          <option value="AUXILIO_DOENCA">Auxílio-Doença</option>
                          <option value="LICENCA_PREMIO">Licença Prêmio</option>
                        </optgroup>
                      </select>
                      {errors.subtype && (
                        <p className="mt-1 text-xs text-red-600">{errors.subtype}</p>
                      )}
                    </div>

                    {/* Campo de horas para Falta Aula e Falta Médica Parcial */}
                    {(form.subtype === "FALTA_AULA" || form.subtype === "FALTA_MEDICA_PARCIAL") && (
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Quantidade de Horas/Aulas *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={form.hours}
                          onChange={(e) => setForm({ ...form, hours: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          placeholder="Ex: 2"
                        />
                        {errors.hours && (
                          <p className="mt-1 text-xs text-red-600">{errors.hours}</p>
                        )}
                      </div>
                    )}

                    {/* Campos de período para licenças */}
                    {isPeriodType(form.subtype) && (
                      <>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                          ⚠️ Para este tipo de ausência, informe o período completo
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Data Início *
                            </label>
                            <input
                              type="date"
                              value={form.startDate}
                              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                            {errors.startDate && (
                              <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Data Fim *
                            </label>
                            <input
                              type="date"
                              value={form.endDate}
                              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                            {errors.endDate && (
                              <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Quantidade de Dias *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={form.days}
                              onChange={(e) => setForm({ ...form, days: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              placeholder="Ex: 15"
                            />
                            {errors.days && (
                              <p className="mt-1 text-xs text-red-600">{errors.days}</p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Data do DOE *
                            </label>
                            <input
                              type="date"
                              value={form.doeDate}
                              onChange={(e) => setForm({ ...form, doeDate: e.target.value })}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            />
                            {errors.doeDate && (
                              <p className="mt-1 text-xs text-red-600">{errors.doeDate}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Campos para ORIENTACAO_TECNICA */}
                {form.type === "ORIENTACAO_TECNICA" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Título da Formação *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ex: Formação Continuada em Matemática"
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Local da Formação *
                      </label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="Ex: Diretoria de Ensino"
                      />
                      {errors.location && (
                        <p className="mt-1 text-xs text-red-600">{errors.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.dateTBD}
                          onChange={(e) => setForm({ ...form, dateTBD: e.target.checked })}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Data a informar posteriormente</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Horário Início *
                        </label>
                        <input
                          type="time"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.startTime && (
                          <p className="mt-1 text-xs text-red-600">{errors.startTime}</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Horário Término *
                        </label>
                        <input
                          type="time"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                        {errors.endTime && (
                          <p className="mt-1 text-xs text-red-600">{errors.endTime}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Observações */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Observações
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-orange-700 hover:to-red-700 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Registro</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Esta ação não pode ser desfeita. Tem certeza que deseja continuar?
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
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

// Helper component for sidebar icon
function ClipboardList(props: any) {
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
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
