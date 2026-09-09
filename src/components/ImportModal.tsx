"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewRow {
  row: number;
  nome: string;
  cpf: string;
  cargo: string;
  categoria: string;
  faixa: string;
  nivel: string;
  ativo: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; message: string; data?: unknown }>;
}

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [mode, setMode] = useState<"create" | "update" | "upsert">("upsert");
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview([]);
      setStep("upload");
      setResult(null);
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleFile = async (f: File) => {
    setError(null);
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      setError("Arquivo deve ser .xlsx, .xls ou .csv");
      return;
    }

    try {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      if (rows.length === 0) {
        setError("Planilha vazia");
        return;
      }

      // Normaliza e extrai preview
      const norm = (s: string) =>
        (s || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");

      const colMap: Record<string, string> = {};
      Object.keys(rows[0]).forEach((k) => {
        colMap[k] = norm(k);
      });
      const getVal = (row: Record<string, unknown>, field: string) => {
        const orig = Object.keys(colMap).find((k) => colMap[k] === field);
        return orig ? String(row[orig] ?? "").trim() : "";
      };

      const previewData: PreviewRow[] = rows.slice(0, 10).map((row, idx) => ({
        row: idx + 2,
        nome: getVal(row, "nome"),
        cpf: getVal(row, "cpf"),
        cargo: getVal(row, "cargo"),
        categoria: getVal(row, "categoria"),
        faixa: getVal(row, "faixa"),
        nivel: getVal(row, "nivel"),
        ativo: getVal(row, "ativo"),
      }));

      setFile(f);
      setPreview(previewData);
      setStep("preview");
    } catch (err) {
      console.error(err);
      setError("Erro ao ler o arquivo. Verifique se é um Excel válido.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("/api/servers/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao importar");
        setLoading(false);
        return;
      }

      setResult(data.results);
      setStep("result");
      onSuccess();
    } catch (err) {
      setError("Erro de conexão ao importar");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Importar Planilha Excel</h2>
              <p className="text-sm text-slate-500">
                {step === "upload" && "Carregue a planilha com os dados dos servidores"}
                {step === "preview" && "Revise os dados detectados antes de importar"}
                {step === "result" && "Resultado da importação"}
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

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "upload" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <Upload className="h-8 w-8" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">
                Clique para selecionar ou arraste o arquivo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Formatos aceitos: .xlsx, .xls, .csv
              </p>
                <div className="mt-6 rounded-lg bg-white p-4 text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Colunas esperadas (obrigatórias)
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {["nome", "cpf", "cargo", "categoria"].map((col) => (
                    <span
                      key={col}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Colunas opcionais
                </p>
                <div className="flex flex-wrap gap-2">
                  {["rgcin", "dtnasc", "tel", "email", "faixa", "nivel", "dting_ctd", "dtfimctd", "ativo"].map(
                    (col) => (
                      <span
                        key={col}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                      >
                        {col}
                      </span>
                    )
                  )}
                </div>
                <p className="mt-3 text-xs italic text-slate-500">
                  Colunas vazias serão aceitas normalmente pelo sistema.
                </p>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-emerald-900">{file?.name}</p>
                  <p className="text-xs text-emerald-700">
                    Pré-visualizando os primeiros 10 registros
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">#</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nome</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">CPF</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Cargo</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Categoria</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Faixa</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Nível</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Ativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((row) => (
                      <tr key={row.row} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-500">{row.row}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.nome || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.cpf || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-slate-700">{row.cargo || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2">
                          {row.categoria ? (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {row.categoria}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{row.faixa || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2 text-slate-700">{row.nivel || <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-2">
                          {row.ativo ? (
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                              /^(sim|s|true|1|ativo|y)$/i.test(row.ativo)
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {row.ativo}
                            </span>
                          ) : <span className="text-xs text-slate-400">padrão: ativo</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Modo de importação
                </label>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-blue-500">
                    <input
                      type="radio"
                      value="upsert"
                      checked={mode === "upsert"}
                      onChange={(e) => setMode(e.target.value as "upsert")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Inteligente (recomendado)</p>
                      <p className="text-xs text-slate-600">
                        Cria novos servidores e atualiza os existentes pelo CPF
                      </p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-blue-500">
                    <input
                      type="radio"
                      value="create"
                      checked={mode === "create"}
                      onChange={(e) => setMode(e.target.value as "create")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Apenas novos</p>
                      <p className="text-xs text-slate-600">
                        Ignora CPFs já cadastrados
                      </p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200 has-[:checked]:ring-2 has-[:checked]:ring-blue-500">
                    <input
                      type="radio"
                      value="update"
                      checked={mode === "update"}
                      onChange={(e) => setMode(e.target.value as "update")}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Apenas atualizar</p>
                      <p className="text-xs text-slate-600">
                        Atualiza somente servidores já existentes
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{result.total}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-700">Importados</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">{result.imported}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-blue-700">Atualizados</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">{result.updated}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-700">Ignorados</p>
                  <p className="mt-1 text-2xl font-bold text-amber-900">{result.skipped}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-700">
                      Detalhes ({result.errors.length} linhas)
                    </p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                            Linha
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">
                            Problema
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.errors.slice(0, 20).map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-xs font-mono text-slate-500">
                              {err.row}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.errors.length > 20 && (
                      <p className="p-3 text-xs text-slate-500">
                        + {result.errors.length - 20} linhas adicionais
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
          {step === "preview" && (
            <button
              onClick={() => setStep("upload")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Voltar
            </button>
          )}
          {step === "result" ? (
            <button
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
            >
              Concluir
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Importação
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
