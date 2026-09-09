"use client";

import { useEffect, useRef, useState } from "react";
import type { Server } from "@/db/schema";
import { POSITIONS, CATEGORIES, DESIGNATED_FUNCTIONS } from "@/db/schema";
import { formatCPF, formatPhone, cleanCPF, cleanPhone } from "@/lib/format";
import { validateCPF, validateEmail, validatePhone, validateBirthDate } from "@/lib/validators";

interface ServerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  server?: Server | null;
}

interface FormData {
  name: string;
  cpf: string;
  rgCin: string;
  birthDate: string;
  phone: string;
  email: string;
  position: string;
  category: string;
  faixa: string;
  nivel: string;
  designatedFunction: string;
  ctdStartDate: string;
  ctdEndDate: string;
  active: boolean;
  notes: string;
}

const emptyForm: FormData = {
  name: "",
  cpf: "",
  rgCin: "",
  birthDate: "",
  phone: "",
  email: "",
  position: "",
  category: "",
  faixa: "",
  nivel: "",
  designatedFunction: "",
  ctdStartDate: "",
  ctdEndDate: "",
  active: true,
  notes: "",
};

export function ServerFormModal({ open, onClose, onSuccess, server }: ServerFormModalProps) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (server) {
      setForm({
        name: server.name,
        cpf: formatCPF(server.cpf),
        rgCin: server.rgCin || "",
        birthDate: server.birthDate || "",
        phone: server.phone ? formatPhone(server.phone) : "",
        email: server.email || "",
        position: server.position,
        category: server.category,
        faixa: server.faixa || "",
        nivel: server.nivel || "",
        designatedFunction: server.designatedFunction || "",
        ctdStartDate: server.ctdStartDate || "",
        ctdEndDate: server.ctdEndDate || "",
        active: server.active,
        notes: server.notes || "",
      });
    } else {
      setForm(emptyForm);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
    setErrors({});
    setGlobalError(null);
  }, [open, server]);

  if (!open) return null;

  const isEditing = Boolean(server);

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    let processed: string | boolean = value;
    if (typeof value === "string") {
      if (field === "cpf") processed = formatCPF(value);
      else if (field === "phone") processed = formatPhone(value);
      else if (field === "faixa" || field === "nivel") processed = value.toUpperCase();
    }
    setForm((prev) => ({ ...prev, [field]: processed }));
    if (errors[field as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlurDate = (field: "birthDate" | "ctdStartDate" | "ctdEndDate", value: string) => {
    if (!value) return;
    const match = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = `20${year}`;
      setForm((prev) => ({
        ...prev,
        [field]: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!form.name.trim()) newErrors.name = "Nome é obrigatório";
    const cpfDigits = cleanCPF(form.cpf);
    if (!cpfDigits) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!validateCPF(cpfDigits)) {
      newErrors.cpf = "CPF inválido";
    }
    if (form.email && !validateEmail(form.email)) {
      newErrors.email = "Email inválido";
    }
    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone = "Telefone inválido";
    }
    if (form.birthDate && !validateBirthDate(form.birthDate)) {
      newErrors.birthDate = "Data inválida";
    }
    if (!form.position) newErrors.position = "Cargo obrigatório";
    if (!form.category) newErrors.category = "Categoria obrigatória";

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
        name: form.name.trim(),
        cpf: cleanCPF(form.cpf),
        rgCin: form.rgCin.trim() || null,
        birthDate: form.birthDate || null,
        phone: form.phone ? cleanPhone(form.phone) : null,
        email: form.email.trim().toLowerCase() || null,
        position: form.position,
        category: form.category,
        faixa: form.faixa.trim() || null,
        nivel: form.nivel.trim() || null,
        ctdStartDate: form.ctdStartDate || null,
        ctdEndDate: form.ctdEndDate || null,
        active: form.active,
        notes: form.notes.trim() || null,
      };

      const url = isEditing ? `/api/servers/${server!.id}` : "/api/servers";
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

  const inputClass = (error?: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
      error
        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Editar Servidor" : "Novo Servidor"}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditing
                  ? "Atualize os dados cadastrais e funcionais"
                  : "Preencha os dados do novo servidor"}
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

          <div className="mb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1 w-1 rounded-full bg-blue-600" />
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nome Completo *</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={inputClass(errors.name)}
                  placeholder="Ex: Maria da Silva Santos"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">CPF *</label>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  maxLength={14}
                  className={inputClass(errors.cpf)}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">RG / CIN</label>
                <input
                  type="text"
                  value={form.rgCin}
                  onChange={(e) => handleChange("rgCin", e.target.value)}
                  className={inputClass()}
                  placeholder="00.000.000-0"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Data de Nascimento</label>
                <input
                  type="text"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  onBlur={(e) => handleBlurDate("birthDate", e.target.value)}
                  className={inputClass(errors.birthDate)}
                  placeholder="dd/mm/aaaa"
                />
                {errors.birthDate && <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Telefone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  maxLength={15}
                  className={inputClass(errors.phone)}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass(errors.email)}
                  placeholder="servidor@educacao.sp.gov.br"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1 w-1 rounded-full bg-indigo-600" />
              Dados Funcionais
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Cargo *</label>
                <select
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  className={inputClass(errors.position)}
                >
                  <option value="">Selecione...</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Categoria *</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={inputClass(errors.category)}
                >
                  <option value="">Selecione...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Faixa</label>
                <input
                  type="text"
                  value={form.faixa}
                  onChange={(e) => handleChange("faixa", e.target.value)}
                  maxLength={10}
                  className={inputClass()}
                  placeholder="Ex: A, B, C..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nível</label>
                <input
                  type="text"
                  value={form.nivel}
                  onChange={(e) => handleChange("nivel", e.target.value)}
                  maxLength={10}
                  className={inputClass()}
                  placeholder="Ex: I, II, III..."
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Função Designada
                  <span className="ml-1 text-xs font-normal text-slate-500">(opcional)</span>
                </label>
                <select
                  value={form.designatedFunction}
                  onChange={(e) => handleChange("designatedFunction", e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Nenhuma (exercendo cargo base)</option>
                  {DESIGNATED_FUNCTIONS.map((func) => (
                    <option key={func.code} value={func.code}>
                      {func.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Use apenas se o servidor estiver exercendo função diferente do cargo base
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Início CTD</label>
                <input
                  type="text"
                  value={form.ctdStartDate}
                  onChange={(e) => handleChange("ctdStartDate", e.target.value)}
                  onBlur={(e) => handleBlurDate("ctdStartDate", e.target.value)}
                  className={inputClass()}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Fim CTD</label>
                <input
                  type="text"
                  value={form.ctdEndDate}
                  onChange={(e) => handleChange("ctdEndDate", e.target.value)}
                  onBlur={(e) => handleBlurDate("ctdEndDate", e.target.value)}
                  className={inputClass()}
                  placeholder="dd/mm/aaaa"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 flex items-center gap-3 text-xs font-semibold text-slate-700">
                  <span>Situação do servidor</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange("active", true)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      form.active
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    ✓ Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("active", false)}
                    className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      !form.active
                        ? "border-red-300 bg-red-50 text-red-800"
                        : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    ✗ Inativo
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className={inputClass()}
                  placeholder="Informações adicionais sobre o servidor..."
                />
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
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
