"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, Cake, Calendar, Gift } from "lucide-react";
import type { Server } from "@/db/schema";
import { isBirthdayInMonth, formatBirthday, calculateAge, formatDate } from "@/lib/format";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function AniversariantesContent() {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");

  const [servers, setServers] = useState<Server[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(
    monthParam ? parseInt(monthParam) : new Date().getMonth() + 1
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const res = await fetch("/api/servers?limit=1000");
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtra aniversariantes do mês
  const birthdayServers = servers
    .filter((s) => isBirthdayInMonth(s.birthDate, selectedMonth))
    .map((s) => {
      const birthDate = new Date(s.birthDate!);
      const day = birthDate.getUTCDate();
      const age = calculateAge(s.birthDate) || 0;
      return { ...s, day, age };
    })
    .sort((a, b) => a.day - b.day);

  const groupedByDay = birthdayServers.reduce((acc, server) => {
    if (!acc[server.day]) acc[server.day] = [];
    acc[server.day].push(server);
    return acc;
  }, {} as Record<number, typeof birthdayServers>);

  const today = new Date();
  const currentYear = today.getFullYear();
  const formattedDate = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 print:bg-white print:border-b-2 print:border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-lg print:bg-transparent print:p-0">
                <Cake className="h-6 w-6 text-pink-600 print:text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Aniversariantes do Mês</h1>
                <p className="text-sm text-slate-600">
                  Servidores que fazem aniversário em {MONTH_NAMES[selectedMonth - 1]}
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium flex items-center gap-2 print:hidden"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>

          {/* Seletor de Mês */}
          <div className="mt-4 print:hidden">
            <div className="flex gap-2 flex-wrap">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMonth === idx + 1
                      ? "bg-pink-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : birthdayServers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <Cake className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Nenhum aniversariante em {MONTH_NAMES[selectedMonth - 1]}
            </h3>
            <p className="text-slate-600">
              Não há servidores com aniversário neste mês.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg shadow-lg p-6 mb-6 text-white print:bg-white print:text-black print:border-2 print:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="h-5 w-5" />
                    <span className="text-sm font-medium opacity-90">Total de Aniversariantes</span>
                  </div>
                  <p className="text-4xl font-bold">{birthdayServers.length}</p>
                  <p className="text-sm opacity-90 mt-1">
                    servidor{birthdayServers.length !== 1 ? "es" : ""} fazendo aniversário em{" "}
                    {MONTH_NAMES[selectedMonth - 1]}
                  </p>
                </div>
                <Cake className="h-16 w-16 opacity-20 print:hidden" />
              </div>
            </div>

            {/* List by Day */}
            <div className="space-y-4">
              {Object.entries(groupedByDay)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([day, servers]) => (
                  <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-pink-50 px-6 py-3 border-b border-pink-100 print:bg-slate-100 print:border-black">
                      <h3 className="font-semibold text-pink-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Dia {day.toString().padStart(2, "0")} de {MONTH_NAMES[selectedMonth - 1]}
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {servers.map((server) => (
                        <div key={server.id} className="p-4 hover:bg-slate-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-semibold">
                                  {server.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{server.name}</h4>
                                <p className="text-sm text-slate-600">
                                  {server.position} • {server.category}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Data completa: {formatDate(server.birthDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 rounded-full">
                                <Cake className="h-4 w-4 text-pink-600" />
                                <span className="font-bold text-pink-900">{server.age} anos</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatBirthday(server.birthDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      {/* Print Footer */}
      <div className="hidden print:block">
        <div className="max-w-7xl mx-auto px-4 py-4 border-t-2 border-black mt-8">
          <div className="text-center text-xs text-slate-600">
            <p>EE Profa. Marlene Frattini • Relatório gerado em {formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
