"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gift,
  FileBarChart,
  Settings,
  GraduationCap,
  ClipboardList,
  Cake,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard, soon: false },
  { href: "/cadastros", label: "Cadastros", icon: Users, soon: false },
  { href: "/aniversariantes", label: "Aniversariantes", icon: Cake, soon: false },
  { href: "/ausencias", label: "Ausências", icon: ClipboardList, soon: false },
  { href: "/vantagens", label: "Vantagens Pessoais", icon: Gift, soon: false },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart, soon: false },
  { href: "/configuracoes", label: "Configurações", icon: Settings, soon: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-200">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">EE Profa. Marlene</p>
          <p className="truncate text-xs text-slate-500">Frattini • Gestão de Servidores</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu Principal
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${item.soon ? "opacity-60" : ""}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.soon && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  EM BREVE
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
          <p className="text-xs font-semibold text-blue-900">Módulo Cadastro</p>
          <p className="mt-1 text-[11px] leading-relaxed text-blue-700">
            Gerenciamento inteligente dos servidores da escola.
          </p>
        </div>
      </div>
    </aside>
  );
}


