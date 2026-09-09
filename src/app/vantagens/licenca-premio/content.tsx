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
  FileText,
  User,
  TrendingDown,
  Clock,
} from "lucide-react";
import type { Server, LicenseCertificate, LicenseUsage } from "@/db/schema";
import { formatDate } from "@/lib/format";

const FRUICAO_OPTIONS = [15, 30, 45, 75, 90];

export default function LicencaPremioContent() {
  const [eligibleServers, setEligibleServers] = useState<Server[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>("");
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [certificates, setCertificates] = useState<LicenseCertificate[]>([]);
  const [usages, setUsages] = useState<Record<string, LicenseUsage[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<LicenseCertificate | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedCertId, setSelectedCertId] = useState<string>("");
  const [viewingCert, setViewingCert] = useState<LicenseCertificate | null>(null);
  const [deletingCertId, setDeletingCertId] = useState<string | null>(null);
  const [deletingUsageId, setDeletingUsageId] = useState<string | null>(null);
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
      loadCertificates(selectedServerId);
      const server = eligibleServers.find((s) => s.id === selectedServerId);
      setSelectedServer(server || null);
    } else {
      setCertificates([]);
      setUsages({});
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
      const res = await fetch("/api/servers/eligible-license");
      const data = await res.json();
      setEligibleServers(data.servers || []);
    } catch (error) {
      showToast("error", "Erro ao carregar servidores");
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async (serverId: string) => {
    setLoadingCerts(true);
    try {
      const res = await fetch(`/api/license/certificates?serverId=${serverId}`);
      const data = await res.json();
      const certs: LicenseCertificate[] = data.certificates || [];
      setCertificates(certs);

      // Carrega usufrutos de cada certidão
      const usagesMap: Record<string, LicenseUsage[]> = {};
      await Promise.all(
        certs.map(async (cert) => {
          const uRes = await fetch(`/api/license/usages?certificateId=${cert.id}`);
          const uData = await uRes.json();
          usagesMap[cert.id] = uData.usages || [];
        })
      );
      setUsages(usagesMap);
    } catch (error) {
      showToast("error", "Erro ao carregar certidões");
    } finally {
      setLoadingCerts(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    try {
      const res = await fetch(`/api/license/certificates/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir certidão");
        return;
      }
      showToast("success", "Certidão excluída com sucesso");
      if (selectedServerId) loadCertificates(selectedServerId);
    } catch (error) {
      showToast("error", "Erro ao excluir certidão");
    } finally {
      setDeletingCertId(null);
    }
  };

  const handleDeleteUsage = async (id: string) => {
    try {
      const res = await fetch(`/api/license/usages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        showToast("error", data.error || "Erro ao excluir usufruto");
        return;
      }
      showToast("success", "Usufruto excluído - saldo devolvido");
      if (selectedServerId) loadCertificates(selectedServerId);
    } catch (error) {
      showToast("error", "Erro ao excluir usufruto");
    } finally {
      setDeletingUsageId(null);
    }
  };

  const totalAvailableBalance = certificates.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalUsedBalance = certificates.reduce(
    (sum, c) => sum + (c.totalBalance - c.currentBalance),
    0
  );

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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Selecionar Servidor</h2>
            <p className="text-sm text-slate-500">
              Apenas servidores Efetivos (Categoria A) são elegíveis
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          </div>
        ) : eligibleServers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhum servidor efetivo encontrado.
            </p>
          </div>
        ) : (
          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

      {/* Informações do Servidor e Certidões */}
      {selectedServer && (
        <div className="mt-6 space-y-6">
          {/* Card do Servidor */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-bold text-white shadow-lg">
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
                    {selectedServer.position} • Categoria A - Efetivo
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
                  setEditingCert(null);
                  setShowCertModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-700 hover:to-teal-700"
              >
                <Plus className="h-4 w-4" />
                Nova Certidão
              </button>
            </div>

            {/* Resumo de Saldo */}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5 sm:grid-cols-4">
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Certidões</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{certificates.length}</p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Saldo Total</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{totalAvailableBalance} dias</p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Utilizado</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{totalUsedBalance} dias</p>
              </div>
              <div className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase text-slate-500">Total Histórico</p>
                <p className="mt-1 text-2xl font-bold text-slate-700">
                  {certificates.reduce((sum, c) => sum + c.totalBalance, 0)} dias
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Certidões */}
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-bold text-slate-900">Certidões de Licença Prêmio</h3>
              <p className="text-sm text-slate-500">
                Períodos aquisitivos registrados (90 dias cada)
              </p>
            </div>

            {loadingCerts ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              </div>
            ) : certificates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="mt-4 text-base font-semibold text-slate-900">
                  Nenhuma certidão cadastrada
                </h4>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Comece cadastrando a primeira certidão de licença prêmio deste servidor
                </p>
                <button
                  onClick={() => {
                    setEditingCert(null);
                    setShowCertModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeira Certidão
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {certificates.map((cert) => (
                  <CertificateCard
                    key={cert.id}
                    certificate={cert}
                    usages={usages[cert.id] || []}
                    onView={() => setViewingCert(cert)}
                    onEdit={() => {
                      setEditingCert(cert);
                      setShowCertModal(true);
                    }}
                    onDelete={() => setDeletingCertId(cert.id)}
                    onNewUsage={() => {
                      setSelectedCertId(cert.id);
                      setShowUsageModal(true);
                    }}
                    onDeleteUsage={(usageId) => setDeletingUsageId(usageId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Certidão */}
      {showCertModal && selectedServer && (
        <CertificateFormModal
          open={showCertModal}
          onClose={() => {
            setShowCertModal(false);
            setEditingCert(null);
          }}
          onSuccess={() => {
            loadCertificates(selectedServerId);
            showToast("success", editingCert ? "Certidão atualizada" : "Certidão cadastrada");
          }}
          server={selectedServer}
          certificate={editingCert}
        />
      )}

      {/* Modal de Cadastro de Usufruto */}
      {showUsageModal && selectedCertId && (
        <UsageFormModal
          open={showUsageModal}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedCertId("");
          }}
          onSuccess={() => {
            loadCertificates(selectedServerId);
            showToast("success", "Usufruto cadastrado - saldo atualizado");
          }}
          certificate={certificates.find((c) => c.id === selectedCertId)!}
        />
      )}

      {/* Modal de Visualização da Certidão */}
      {viewingCert && (
        <CertificateDetailsModal
          certificate={viewingCert}
          usages={usages[viewingCert.id] || []}
          onClose={() => setViewingCert(null)}
          onEdit={() => {
            setEditingCert(viewingCert);
            setViewingCert(null);
            setShowCertModal(true);
          }}
        />
      )}

      {/* Modal de Confirmação - Excluir Certidão */}
      {deletingCertId && (
        <ConfirmModal
          title="Excluir Certidão"
          message="Esta ação excluirá também todos os usufrutos vinculados. Continuar?"
          onConfirm={() => handleDeleteCert(deletingCertId)}
          onCancel={() => setDeletingCertId(null)}
        />
      )}

      {/* Modal de Confirmação - Excluir Usufruto */}
      {deletingUsageId && (
        <ConfirmModal
          title="Excluir Usufruto"
          message="Os dias serão devolvidos ao saldo da certidão. Continuar?"
          onConfirm={() => handleDeleteUsage(deletingUsageId)}
          onCancel={() => setDeletingUsageId(null)}
        />
      )}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Sim, confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function CertificateCard({
  certificate,
  usages,
  onView,
  onEdit,
  onDelete,
  onNewUsage,
  onDeleteUsage,
}: {
  certificate: LicenseCertificate;
  usages: LicenseUsage[];
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewUsage: () => void;
  onDeleteUsage: (id: string) => void;
}) {
  const balancePct = (certificate.currentBalance / certificate.totalBalance) * 100;
  const hasBalance = certificate.currentBalance > 0;

  return (
    <div className="p-4">
      {/* Cabeçalho da certidão */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${
              hasBalance
                ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                : "bg-gradient-to-br from-slate-400 to-slate-500"
            }`}
          >
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-900">
                Certidão nº {certificate.certificateNumber}/{certificate.certificateYear}
              </p>
              {!hasBalance && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  ESGOTADA
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Aquisitivo: {formatDate(certificate.acquisitionStartDate)} →{" "}
                {formatDate(certificate.acquisitionEndDate)}
              </span>
              {certificate.doeDate && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  DOE: {formatDate(certificate.doeDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasBalance && (
            <button
              onClick={onNewUsage}
              className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:from-amber-600 hover:to-orange-700"
            >
              <TrendingDown className="h-3 w-3" />
              Registrar Usufruto
            </button>
          )}
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

      {/* Barra de Saldo */}
      <div className="mt-4 rounded-lg bg-slate-50 p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Saldo disponível</span>
          <span className="font-bold text-slate-900">
            {certificate.currentBalance} / {certificate.totalBalance} dias
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all ${
              balancePct === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                : balancePct > 50
                ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                : balancePct > 0
                ? "bg-gradient-to-r from-amber-500 to-orange-600"
                : "bg-slate-400"
            }`}
            style={{ width: `${balancePct}%` }}
          />
        </div>
      </div>

      {/* Lista de usufrutos */}
      {usages.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Usufrutos registrados ({usages.length})
          </p>
          <div className="space-y-2">
            {usages.map((usage) => (
              <UsageItem
                key={usage.id}
                usage={usage}
                onDelete={() => onDeleteUsage(usage.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageItem({ usage, onDelete }: { usage: LicenseUsage; onDelete: () => void }) {
  const isFruição = usage.type === "FRUICAO";
  return (
    <div className="flex items-center justify-between rounded-lg bg-white p-2.5 ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${
            isFruição
              ? "bg-gradient-to-br from-blue-500 to-indigo-600"
              : "bg-gradient-to-br from-violet-500 to-purple-600"
          }`}
        >
          {isFruição ? "F" : "P"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {isFruição ? "Fruição" : "Pecúnia"}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isFruição ? "bg-blue-100 text-blue-800" : "bg-violet-100 text-violet-800"
              }`}
            >
              -{usage.days} dias
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {isFruição
              ? `${formatDate(usage.startDate)} → ${formatDate(usage.endDate)}`
              : `Ano: ${usage.year}`}
            {usage.doeDate && ` • DOE: ${formatDate(usage.doeDate)}`}
          </p>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        aria-label="Excluir usufruto"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function CertificateFormModal({
  open,
  onClose,
  onSuccess,
  server,
  certificate,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  server: Server;
  certificate: LicenseCertificate | null;
}) {
  const [form, setForm] = useState({
    certificateNumber: "",
    certificateYear: "",
    acquisitionStartDate: "",
    acquisitionEndDate: "",
    doeDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (certificate) {
      setForm({
        certificateNumber: certificate.certificateNumber,
        certificateYear: certificate.certificateYear,
        acquisitionStartDate: certificate.acquisitionStartDate,
        acquisitionEndDate: certificate.acquisitionEndDate,
        doeDate: certificate.doeDate || "",
      });
    } else {
      setForm({
        certificateNumber: "",
        certificateYear: new Date().getFullYear().toString(),
        acquisitionStartDate: "",
        acquisitionEndDate: "",
        doeDate: "",
      });
    }
    setErrors({});
    setGlobalError(null);
  }, [open, certificate]);

  if (!open) return null;
  const isEditing = Boolean(certificate);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.certificateNumber) newErrors.certificateNumber = "Número obrigatório";
    if (!form.certificateYear) newErrors.certificateYear = "Ano obrigatório";
    if (!form.acquisitionStartDate) newErrors.acquisitionStartDate = "Data início obrigatória";
    if (!form.acquisitionEndDate) newErrors.acquisitionEndDate = "Data fim obrigatória";
    if (
      form.acquisitionStartDate &&
      form.acquisitionEndDate &&
      new Date(form.acquisitionStartDate) >= new Date(form.acquisitionEndDate)
    ) {
      newErrors.acquisitionEndDate = "Data fim deve ser posterior à data início";
    }
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

      const url = isEditing
        ? `/api/license/certificates/${certificate!.id}`
        : "/api/license/certificates";
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
                {isEditing ? "Editar Certidão" : "Nova Certidão de Licença Prêmio"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing ? "Atualize os dados" : `Certidão para ${server.name}`}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Número da Certidão *
                </label>
                <input
                  type="text"
                  value={form.certificateNumber}
                  onChange={(e) => setForm({ ...form, certificateNumber: e.target.value })}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.certificateNumber
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                  }`}
                  placeholder="Ex: 001"
                />
                {errors.certificateNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.certificateNumber}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Ano *</label>
                <input
                  type="text"
                  value={form.certificateYear}
                  onChange={(e) => setForm({ ...form, certificateYear: e.target.value })}
                  maxLength={4}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                    errors.certificateYear
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                  }`}
                  placeholder="Ex: 2024"
                />
                {errors.certificateYear && (
                  <p className="mt-1 text-xs text-red-600">{errors.certificateYear}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Período Aquisitivo - Data Início *
              </label>
              <input
                type="date"
                value={form.acquisitionStartDate}
                onChange={(e) => setForm({ ...form, acquisitionStartDate: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                  errors.acquisitionStartDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                }`}
              />
              {errors.acquisitionStartDate && (
                <p className="mt-1 text-xs text-red-600">{errors.acquisitionStartDate}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Período Aquisitivo - Data Fim *
              </label>
              <input
                type="date"
                value={form.acquisitionEndDate}
                onChange={(e) => setForm({ ...form, acquisitionEndDate: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                  errors.acquisitionEndDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-100"
                }`}
              />
              {errors.acquisitionEndDate && (
                <p className="mt-1 text-xs text-red-600">{errors.acquisitionEndDate}</p>
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Saldo Inicial</p>
                  <p className="mt-1 text-xs text-emerald-700">
                    Esta certidão terá <strong>90 dias</strong> de saldo disponível para usufruto
                  </p>
                </div>
              </div>
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
              className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar Certidão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsageFormModal({
  open,
  onClose,
  onSuccess,
  certificate,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  certificate: LicenseCertificate;
}) {
  const [form, setForm] = useState({
    type: "FRUICAO" as "FRUICAO" | "PECUNIA",
    days: 30,
    startDate: "",
    endDate: "",
    doeDate: "",
    year: new Date().getFullYear().toString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      type: "FRUICAO",
      days: 30,
      startDate: "",
      endDate: "",
      doeDate: "",
      year: new Date().getFullYear().toString(),
    });
    setErrors({});
    setGlobalError(null);
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (certificate.currentBalance <= 0) {
      newErrors.general = "Saldo da certidão é zero";
      setErrors(newErrors);
      return false;
    }

    if (form.type === "FRUICAO") {
      if (!form.startDate) newErrors.startDate = "Data início obrigatória";
      if (!form.endDate) newErrors.endDate = "Data fim obrigatória";
      if (!FRUICAO_OPTIONS.includes(form.days))
        newErrors.days = "Quantidade inválida";
    } else {
      if (!form.year) newErrors.year = "Ano obrigatório";
      if (form.days !== 30) newErrors.days = "Pecúnia sempre consome 30 dias";
    }

    if (form.days > certificate.currentBalance) {
      newErrors.days = `Dias (${form.days}) excedem saldo (${certificate.currentBalance})`;
    }

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
        certificateId: certificate.id,
        type: form.type,
        days: form.type === "PECUNIA" ? 30 : form.days,
        startDate: form.type === "FRUICAO" ? form.startDate : null,
        endDate: form.type === "FRUICAO" ? form.endDate : null,
        doeDate: form.doeDate || null,
        year: form.type === "PECUNIA" ? form.year : null,
      };

      const res = await fetch("/api/license/usages", {
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

      onSuccess();
      onClose();
    } catch (err) {
      setGlobalError("Erro de conexão ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const newBalance = certificate.currentBalance - form.days;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Registrar Usufruto</h2>
              <p className="text-sm text-slate-500">
                Certidão {certificate.certificateNumber}/{certificate.certificateYear}
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

          {certificate.currentBalance <= 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-2 font-semibold text-amber-900">Saldo esgotado</p>
              <p className="mt-1 text-sm text-amber-700">
                Esta certidão não possui saldo disponível para usufruto.
              </p>
            </div>
          ) : (
            <>
              {/* Tipo de Usufruto */}
              <div className="mb-4">
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Tipo de Usufruto *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "FRUICAO", days: 30 })}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                      form.type === "FRUICAO"
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold">Fruição</p>
                    <p className="mt-0.5 text-xs opacity-75">Gozo do período</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: "PECUNIA", days: 30 })}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                      form.type === "PECUNIA"
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-bold">Pecúnia</p>
                    <p className="mt-0.5 text-xs opacity-75">Indenização (30 dias)</p>
                  </button>
                </div>
              </div>

              {form.type === "FRUICAO" ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Quantidade de Dias *
                    </label>
                    <select
                      value={form.days}
                      onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) })}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                        errors.days
                          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    >
                      {FRUICAO_OPTIONS.map((d) => (
                        <option key={d} value={d} disabled={d > certificate.currentBalance}>
                          {d} dias {d > certificate.currentBalance ? "(saldo insuficiente)" : ""}
                        </option>
                      ))}
                    </select>
                    {errors.days && (
                      <p className="mt-1 text-xs text-red-600">{errors.days}</p>
                    )}
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
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                          errors.startDate
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
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
                        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                          errors.endDate
                            ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                      />
                      {errors.endDate && (
                        <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Data do DOE
                    </label>
                    <input
                      type="date"
                      value={form.doeDate}
                      onChange={(e) => setForm({ ...form, doeDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Ano de Referência *
                  </label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    maxLength={4}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                      errors.year
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-300 focus:border-violet-500 focus:ring-violet-100"
                    }`}
                    placeholder="Ex: 2024"
                  />
                  {errors.year && (
                    <p className="mt-1 text-xs text-red-600">{errors.year}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    Pecúnia sempre consome 30 dias do saldo
                  </p>
                </div>
              )}

              {/* Preview do saldo */}
              <div
                className={`rounded-lg border p-4 ${
                  newBalance > 0
                    ? "border-emerald-200 bg-emerald-50"
                    : newBalance === 0
                    ? "border-amber-200 bg-amber-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Clock
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                      newBalance > 0
                        ? "text-emerald-600"
                        : newBalance === 0
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        newBalance > 0
                          ? "text-emerald-900"
                          : newBalance === 0
                          ? "text-amber-900"
                          : "text-red-900"
                      }`}
                    >
                      Saldo após este usufruto
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          newBalance > 0
                            ? "text-emerald-800"
                            : newBalance === 0
                            ? "text-amber-800"
                            : "text-red-800"
                        }`}
                      >
                        {newBalance} dias
                      </span>
                      <span className="text-xs opacity-75">
                        ({certificate.currentBalance} - {form.days} dias)
                      </span>
                    </div>
                    {newBalance === 0 && (
                      <p className="mt-1 text-xs font-medium text-amber-700">
                        Certidão ficará com saldo esgotado
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

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
              disabled={saving || certificate.currentBalance <= 0}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Registrar Usufruto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CertificateDetailsModal({
  certificate,
  usages,
  onClose,
  onEdit,
}: {
  certificate: LicenseCertificate;
  usages: LicenseUsage[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const balancePct = (certificate.currentBalance / certificate.totalBalance) * 100;
  const used = certificate.totalBalance - certificate.currentBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                Detalhes da Certidão
              </p>
              <h2 className="mt-1 text-xl font-bold">
                nº {certificate.certificateNumber}/{certificate.certificateYear}
              </h2>
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
              Período Aquisitivo
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
              <Calendar className="h-4 w-4 text-emerald-600" />
              {formatDate(certificate.acquisitionStartDate)} →{" "}
              {formatDate(certificate.acquisitionEndDate)}
            </p>
          </div>

          {certificate.doeDate && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Data do DOE
              </p>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                <FileText className="h-4 w-4 text-emerald-600" />
                {formatDate(certificate.doeDate)}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Saldo
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-900">
                {certificate.currentBalance}
              </span>
              <span className="text-sm text-emerald-700">
                / {certificate.totalBalance} dias
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-200">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: `${balancePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-emerald-700">
              {used} dias utilizados • {certificate.currentBalance} disponíveis
            </p>
          </div>

          {usages.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold text-slate-900">
                Usufrutos ({usages.length})
              </p>
              <div className="space-y-2">
                {usages.map((u) => (
                  <UsageItem key={u.id} usage={u} onDelete={() => {}} />
                ))}
              </div>
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
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-emerald-700 hover:to-teal-700"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
