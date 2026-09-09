"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  TrendingUp,
  User,
  AlertCircle,
  Calendar,
} from "lucide-react";
import type { Server, FunctionalEvolution } from "@/db/schema";
import { formatDate } from "@/lib/format";

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

interface EvolutionFormData {
  evolutionNumber: number;
  startDate: string;
  doeDate: string;
  fromLevel: string;
  toLevel: string;
  isLast: boolean;
}

export default function EvolucaoFuncionalContent() {
  const searchParams = useSearchParams();
  const serverParam = searchParams.get("server");

  const [eligibleServers, setEligibleServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [evolutions, setEvolutions] = useState<FunctionalEvolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvolutions, setLoadingEvolutions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvolution, setEditingEvolution] = useState<FunctionalEvolution | null>(null);
  const [viewingEvolution, setViewingEvolution] = useState<FunctionalEvolution | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    loadEligibleServers();
  }, []);

  useEffect(() => {
    if (serverParam && eligibleServers.length > 0 && !selectedServerId) {
      const found = eligibleServers.find((s) => s.id === serverParam);
      if (found) setSelectedServerId(found.id);
    }
  }, [serverParam, eligibleServers, selectedServerId]);

  useEffect(() => {
    if (selectedServerId) {
      loadEvolutions(selectedServerId);
      const server = eligibleServers.find((s) => s.id === selectedServerId);
      setSelectedServer(server || null);
    } else {
      setEvolutions([]);
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
      const res = await fetch("/api/servers/eligible-evolution");
      const data = await res.json();
      setEligibleServers(data.servers || []);
    } catch (error) {
      showToast("error", "Erro ao carregar servidores");
    } finally {
      setLoading(false);
    }
  };

  const loadEvolutions = async (serverId: string) => {
    setLoadingEvolutions(true);
    try {
      const res = await fetch(`/api/evolutions?serverId=${serverId}`);
      const data = await res.json();
      setEvolutions(data.evolutions || []);
    } catch (error) {
      showToast("error", "Erro ao carregar evoluções");
    } finally {
      setLoadingEvolutions(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/evolutions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir");
        return;
      }
      showToast("success", "Evolução excluída com sucesso");
      if (selectedServerId) loadEvolutions(selectedServerId);
    } catch (error) {
      showToast("error", "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  };

  const getNextEvolutionNumber = (): number => {
    if (evolutions.length === 0) return 1;
    const maxNumber = Math.max(...evolutions.map((e) => e.evolutionNumber));
    return maxNumber >= 10 ? 0 : maxNumber + 1;
  };

  const getCurrentLevel = (): string => {
    if (evolutions.length === 0) return "I";
    const sorted = [...evolutions].sort((a, b) => b.evolutionNumber - a.evolutionNumber);
    return sorted[0].toLevel;
  };

  const currentLevel = getCurrentLevel();
  const currentLevelIndex = ROMAN_NUMERALS.indexOf(currentLevel);
  const maxLevelReached = currentLevelIndex >= ROMAN_NUMERALS.length - 2; // XI é o último possível como destino

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-600 to-pink-700 text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Selecionar Servidor</h2>
            <p className="text-sm text-slate-500">
              Apenas servidores PEB II e Diretor de Escola são elegíveis
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
          </div>
        ) : eligibleServers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhum servidor PEB II ou Diretor de Escola encontrado.
            </p>
          </div>
        ) : (
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          >
            <option value="">Selecione um servidor...</option>
            {eligibleServers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name} - {server.position}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Conteúdo do Servidor */}
      {selectedServer && (
        <div className="mt-6 space-y-6">
          {/* Card do Servidor */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50 via-white to-pink-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-xl font-bold text-white shadow-lg">
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
                    {selectedServer.position} • Categoria {selectedServer.category}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">
                      <TrendingUp className="h-3 w-3" />
                      Nível Atual: {currentLevel}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800">
                      {evolutions.length} evolução{evolutions.length !== 1 ? "ões" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingEvolution(null);
                  setShowModal(true);
                }}
                disabled={maxLevelReached}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-200 transition hover:from-rose-700 hover:to-pink-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Nova Evolução
              </button>
            </div>

            {maxLevelReached && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Servidor já atingiu o nível máximo (XI). Novas evoluções não podem ser cadastradas.
                </p>
              </div>
            )}
          </div>

          {/* Lista de Evoluções */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Histórico de Evoluções</h3>
              <p className="text-sm text-slate-500">
                Progressões funcionais pela via não acadêmica
              </p>
            </div>

            {loadingEvolutions ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-200 border-t-rose-600" />
              </div>
            ) : evolutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <TrendingUp className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="mt-4 text-base font-semibold text-slate-900">
                  Nenhuma evolução cadastrada
                </h4>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Comece cadastrando a primeira evolução funcional deste servidor
                </p>
                {!maxLevelReached && (
                  <button
                    onClick={() => {
                      setEditingEvolution(null);
                      setShowModal(true);
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    <Plus className="h-4 w-4" />
                    Cadastrar Primeira Evolução
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...evolutions]
                  .sort((a, b) => a.evolutionNumber - b.evolutionNumber)
                  .map((evolution) => (
                    <div
                      key={evolution.id}
                      className="flex items-center justify-between p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-sm font-bold text-white shadow">
                          {evolution.evolutionNumber}ª
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {evolution.evolutionNumber}ª Evolução
                            </p>
                            <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                              {evolution.fromLevel} → {evolution.toLevel}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              Vigência: {formatDate(evolution.startDate)}
                            </span>
                            {evolution.doeDate && (
                              <span className="flex items-center gap-1">
                                DOE: {formatDate(evolution.doeDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewingEvolution(evolution)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEvolution(evolution);
                            setShowModal(true);
                          }}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(evolution.id)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && selectedServer && (
        <EvolutionFormModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingEvolution(null);
          }}
          onSuccess={() => {
            loadEvolutions(selectedServerId);
            showToast(
              "success",
              editingEvolution ? "Evolução atualizada" : "Evolução cadastrada"
            );
          }}
          server={selectedServer}
          evolution={editingEvolution}
          existingEvolutions={evolutions}
        />
      )}

      {/* Modal de Visualização */}
      {viewingEvolution && (
        <EvolutionDetailsModal
          evolution={viewingEvolution}
          onClose={() => setViewingEvolution(null)}
          onEdit={() => {
            setEditingEvolution(viewingEvolution);
            setViewingEvolution(null);
            setShowModal(true);
          }}
        />
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
                <h3 className="text-base font-bold text-slate-900">Excluir Evolução</h3>
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

function EvolutionFormModal({
  open,
  onClose,
  onSuccess,
  server,
  evolution,
  existingEvolutions,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  server: Server;
  evolution: FunctionalEvolution | null;
  existingEvolutions: FunctionalEvolution[];
}) {
  const [form, setForm] = useState<EvolutionFormData>({
    evolutionNumber: 1,
    startDate: "",
    doeDate: "",
    fromLevel: "I",
    toLevel: "II",
    isLast: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EvolutionFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (evolution) {
      setForm({
        evolutionNumber: evolution.evolutionNumber,
        startDate: evolution.startDate,
        doeDate: evolution.doeDate || "",
        fromLevel: evolution.fromLevel,
        toLevel: evolution.toLevel,
        isLast: evolution.isLast,
      });
    } else {
      // Calcular próxima evolução e níveis sugeridos
      const nextNumber =
        existingEvolutions.length === 0
          ? 1
          : Math.max(...existingEvolutions.map((e) => e.evolutionNumber)) + 1;

      let fromLevel = "I";
      let toLevel = "II";

      if (existingEvolutions.length > 0) {
        const sorted = [...existingEvolutions].sort(
          (a, b) => b.evolutionNumber - a.evolutionNumber
        );
        const lastTo = sorted[0].toLevel;
        const lastIndex = ROMAN_NUMERALS.indexOf(lastTo);
        if (lastIndex >= 0 && lastIndex < ROMAN_NUMERALS.length - 1) {
          fromLevel = lastTo;
          toLevel = ROMAN_NUMERALS[lastIndex + 1];
        }
      }

      setForm({
        evolutionNumber: nextNumber <= 10 ? nextNumber : 10,
        startDate: "",
        doeDate: "",
        fromLevel,
        toLevel,
        isLast: false,
      });
    }

    setErrors({});
    setGlobalError(null);
  }, [open, evolution, existingEvolutions, server]);

  if (!open) return null;
  const isEditing = Boolean(evolution);

  const handleFromLevelChange = (fromLevel: string) => {
    const fromIndex = ROMAN_NUMERALS.indexOf(fromLevel);
    let newToLevel = form.toLevel;
    if (fromIndex >= 0 && fromIndex < ROMAN_NUMERALS.length - 1) {
      newToLevel = ROMAN_NUMERALS[fromIndex + 1];
    }
    setForm({ ...form, fromLevel, toLevel: newToLevel });
  };

  // Calcula próxima evolução baseada no cargo do servidor e nível destino
  const calculatePreview = () => {
    if (!form.isLast || !form.startDate || !form.toLevel) return null;
    
    // Interstícios por cargo (baseado nas tabelas SEE-SP)
    const PEB_INTERSTICIOS: Record<string, number> = {
      "I-II": 4, "II-III": 4, "III-IV": 5, "IV-V": 5,
      "V-VI": 4, "VI-VII": 4, "VII-VIII": 4,
    };
    const DIRETOR_INTERSTICIOS: Record<string, number> = {
      "I-II": 4, "II-III": 5, "III-IV": 6, "IV-V": 6,
      "V-VI": 5, "VI-VII": 5, "VII-VIII": 4,
    };
    
    // PEB I e PEB II usam a mesma tabela
    const intersticios = (server.position === "PEB I" || server.position === "PEB II")
      ? PEB_INTERSTICIOS 
      : DIRETOR_INTERSTICIOS;
    
    const nextLevelIndex = ROMAN_NUMERALS.indexOf(form.toLevel);
    if (nextLevelIndex < 0 || nextLevelIndex >= ROMAN_NUMERALS.length - 1) return null;
    
    const nextFromLevel = form.toLevel;
    const nextToLevel = ROMAN_NUMERALS[nextLevelIndex + 1];
    const key = `${nextFromLevel}-${nextToLevel}`;
    const intersticio = intersticios[key];
    if (!intersticio) return null;
    
    const startDate = new Date(form.startDate);
    const nextDate = new Date(startDate);
    nextDate.setFullYear(nextDate.getFullYear() + intersticio);
    
    return {
      nextDate: nextDate.toISOString().split("T")[0],
      nextFromLevel,
      nextToLevel,
      intersticio,
    };
  };

  const availableEvolutionNumbers = Array.from({ length: 10 }, (_, i) => i + 1).filter(
    (num) => {
      if (isEditing && evolution) return true;
      return !existingEvolutions.some((e) => e.evolutionNumber === num);
    }
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EvolutionFormData, string>> = {};
    if (!form.startDate) newErrors.startDate = "Data de vigência é obrigatória";
    if (!form.fromLevel) newErrors.fromLevel = "Nível de origem é obrigatório";
    if (!form.toLevel) newErrors.toLevel = "Nível de destino é obrigatório";
    if (form.fromLevel === form.toLevel)
      newErrors.toLevel = "Nível de destino deve ser diferente da origem";
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
        ...form,
        doeDate: form.doeDate || null,
      };

      const url = isEditing ? `/api/evolutions/${evolution!.id}` : "/api/evolutions";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Evolução" : "Nova Evolução Funcional"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing ? "Atualize os dados" : `Evolução para ${server.name}`}
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
                Número da Evolução *
              </label>
              <select
                value={form.evolutionNumber}
                onChange={(e) =>
                  setForm({ ...form, evolutionNumber: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              >
                {availableEvolutionNumbers.map((num) => (
                  <option key={num} value={num}>
                    {num}ª Evolução
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
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                  errors.startDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-rose-500 focus:ring-rose-100"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nível de Origem *
                </label>
                <select
                  value={form.fromLevel}
                  onChange={(e) => handleFromLevelChange(e.target.value)}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.fromLevel
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-rose-500 focus:ring-rose-100"
                  }`}
                >
                  <option value="">Selecione...</option>
                  {ROMAN_NUMERALS.slice(0, 10).map((level) => (
                    <option key={level} value={level}>
                      Nível {level}
                    </option>
                  ))}
                </select>
                {errors.fromLevel && (
                  <p className="mt-1 text-xs text-red-600">{errors.fromLevel}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nível de Destino *
                </label>
                <select
                  value={form.toLevel}
                  onChange={(e) => setForm({ ...form, toLevel: e.target.value })}
                  className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.toLevel
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-rose-500 focus:ring-rose-100"
                  }`}
                >
                  <option value="">Selecione...</option>
                  {ROMAN_NUMERALS.slice(1).map((level) => (
                    <option key={level} value={level}>
                      Nível {level}
                    </option>
                  ))}
                </select>
                {errors.toLevel && (
                  <p className="mt-1 text-xs text-red-600">{errors.toLevel}</p>
                )}
              </div>
            </div>

            {form.fromLevel && form.toLevel && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-rose-600" />
                  <div>
                    <p className="text-sm font-semibold text-rose-900">Progressão</p>
                    <p className="mt-0.5 text-sm text-rose-700">
                      O servidor progredirá do{" "}
                      <strong>Nível {form.fromLevel}</strong> para o{" "}
                      <strong>Nível {form.toLevel}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox: Última Evolução? */}
            <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.isLast}
                  onChange={(e) => setForm({ ...form, isLast: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-900">
                    Esta é a última evolução cadastrada?
                  </p>
                  <p className="mt-1 text-xs text-indigo-700">
                    Se marcado, o sistema calculará automaticamente a data da próxima evolução
                    baseada no cargo ({server.position}) e interstício legal
                  </p>
                </div>
              </label>

              {/* Preview da próxima evolução */}
              {form.isLast && (
                <div className="mt-3 border-t border-indigo-200 pt-3">
                  {calculatePreview() ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-emerald-900">
                            Próxima Evolução Prevista
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                            <div className="rounded bg-white p-2">
                              <p className="text-[10px] font-bold uppercase text-slate-500">
                                Data
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-slate-900">
                                {(() => {
                                  const p = calculatePreview();
                                  return p
                                    ? new Date(p.nextDate).toLocaleDateString("pt-BR")
                                    : "-";
                                })()}
                              </p>
                            </div>
                            <div className="rounded bg-white p-2">
                              <p className="text-[10px] font-bold uppercase text-slate-500">
                                Progressão
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-slate-900">
                                {calculatePreview()?.nextFromLevel} →{" "}
                                {calculatePreview()?.nextToLevel}
                              </p>
                            </div>
                            <div className="rounded bg-white p-2">
                              <p className="text-[10px] font-bold uppercase text-slate-500">
                                Interstício
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-slate-900">
                                {calculatePreview()?.intersticio}{" "}
                                {calculatePreview()?.intersticio === 1 ? "ano" : "anos"}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-emerald-700">
                            💡 Baseado na tabela de interstícios do cargo{" "}
                            <strong>{server.position}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      ⚠️ Não é possível calcular próxima evolução (nível máximo atingido ou dados
                      insuficientes)
                    </div>
                  )}
                </div>
              )}
            </div>
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
              className="rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-rose-700 hover:to-pink-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Evolução"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EvolutionDetailsModal({
  evolution,
  onClose,
  onEdit,
}: {
  evolution: FunctionalEvolution;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-rose-600 to-pink-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-rose-100">
                Detalhes da Evolução
              </p>
              <h2 className="mt-1 text-xl font-bold">{evolution.evolutionNumber}ª Evolução</h2>
              <p className="mt-1 text-sm text-rose-100">
                Nível {evolution.fromLevel} → {evolution.toLevel}
              </p>
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
            <p className="mt-1 text-sm font-medium text-slate-900">
              {formatDate(evolution.startDate)}
            </p>
          </div>

          {evolution.doeDate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Data do DOE
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatDate(evolution.doeDate)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                Nível de Origem
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-900">{evolution.fromLevel}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Nível de Destino
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{evolution.toLevel}</p>
            </div>
          </div>
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
            className="rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-rose-700 hover:to-pink-700"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
