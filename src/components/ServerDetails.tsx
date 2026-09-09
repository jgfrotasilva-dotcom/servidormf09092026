import type { Server } from "@/db/schema";
import { DESIGNATED_FUNCTIONS } from "@/db/schema";
import { formatCPF, formatPhone, formatDate, calculateAge } from "@/lib/format";

interface ServerDetailsProps {
  server: Server;
  onClose: () => void;
  onEdit: () => void;
}

export function ServerDetails({ server, onClose, onEdit }: ServerDetailsProps) {
  const age = calculateAge(server.birthDate);

  const personalFields = [
    { label: "Nome Completo", value: server.name, fullWidth: true },
    { label: "CPF", value: formatCPF(server.cpf) },
    { label: "RG / CIN", value: server.rgCin || "-" },
    {
      label: "Data de Nascimento",
      value: formatDate(server.birthDate) + (age ? ` (${age} anos)` : ""),
    },
    { label: "Telefone", value: server.phone ? formatPhone(server.phone) : "-" },
    { label: "Email", value: server.email || "-", fullWidth: true },
  ];

  const functionalFields = [
    { label: "Cargo", value: server.position },
    { label: "Categoria", value: server.category },
    { label: "Faixa", value: server.faixa || "-" },
    { label: "Nível", value: server.nivel || "-" },
    {
      label: "Função Designada",
      value: server.designatedFunction
        ? DESIGNATED_FUNCTIONS.find((f) => f.code === server.designatedFunction)?.label || server.designatedFunction
        : "-",
    },
    {
      label: "Início CTD",
      value: formatDate(server.ctdStartDate),
    },
    {
      label: "Fim CTD",
      value: formatDate(server.ctdEndDate),
    },
    {
      label: "Situação",
      value: server.active ? "✓ Ativo" : "✗ Inativo",
    },
    { label: "Observações", value: server.notes || "-", fullWidth: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-100">
                Ficha do Servidor
              </p>
              <h2 className="mt-1 truncate text-xl font-bold">{server.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-blue-100">
                <span>{server.position}</span>
                <span>•</span>
                <span>Categoria {server.category}</span>
                {server.faixa && (
                  <>
                    <span>•</span>
                    <span>Faixa {server.faixa}</span>
                  </>
                )}
                {server.nivel && (
                  <>
                    <span>•</span>
                    <span>Nível {server.nivel}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
              aria-label="Fechar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1 w-1 rounded-full bg-blue-600" />
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {personalFields.map((field, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${
                    field.fullWidth ? "sm:col-span-2" : ""
                  }`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900 break-words">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <span className="h-1 w-1 rounded-full bg-indigo-600" />
              Dados Funcionais
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {functionalFields.map((field, idx) => {
                const isStatus = field.label === "Situação";
                const statusActive = server.active;
                return (
                  <div
                    key={idx}
                    className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${
                      field.fullWidth ? "sm:col-span-2" : ""
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      {field.label}
                    </p>
                    <p
                      className={`mt-1 text-sm font-medium break-words ${
                        isStatus
                          ? statusActive
                            ? "text-emerald-700"
                            : "text-red-700"
                          : "text-slate-900"
                      }`}
                    >
                      {field.value}
                    </p>
                  </div>
                );
              })}
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
            className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:from-blue-700 hover:to-indigo-700"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}
