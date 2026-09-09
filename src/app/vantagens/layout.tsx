"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Award,
  Calendar,
  ArrowLeft,
  GraduationCap,
  FileText,
  BarChart3,
  TrendingUp,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

const SUBMODULES = [
  {
    href: "/vantagens",
    label: "Visão Geral",
    icon: Award,
  },
  {
    href: "/vantagens/vencidas",
    label: "Vencidas e a Vencer",
    icon: AlertTriangle,
  },
  {
    href: "/vantagens/analise",
    label: "Análise",
    icon: BarChart3,
  },
  {
    href: "/vantagens/relatorio-funcional",
    label: "Relatório Funcional",
    icon: ClipboardList,
  },
  {
    href: "/vantagens/ats",
    label: "ATS",
    icon: Calendar,
  },
  {
    href: "/vantagens/licenca-premio",
    label: "Licença Prêmio",
    icon: FileText,
  },
  {
    href: "/vantagens/evolucao-funcional",
    label: "Evolução Funcional",
    icon: TrendingUp,
  },
];

export default function VantagensLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Top bar de navegação do módulo */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <Link href="/" className="flex items-center gap-1 hover:text-blue-600">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">EE Profa. Marlene Frattini</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700">Vantagens Pessoais</span>
          </div>

          <div className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-3 py-1 text-xs font-semibold text-violet-800">
                <Award className="h-3.5 w-3.5" />
                Módulo Vantagens Pessoais
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">
                Vantagens Pessoais dos Servidores
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Gerenciamento de vantagens adquiridas ao longo da carreira
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel
            </Link>
          </div>

          {/* Tabs de submódulos */}
          <div className="flex gap-1 overflow-x-auto border-t border-slate-100 pt-2">
            {SUBMODULES.map((sub) => {
              const Icon = sub.icon;
              const isActive =
                sub.href === "/vantagens"
                  ? pathname === "/vantagens"
                  : pathname.startsWith(sub.href);
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border-violet-600 bg-violet-50 text-violet-700"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
