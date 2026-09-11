"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Gift,
  FileBarChart,
  Settings,
  GraduationCap,
  ClipboardList,
  Cake,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Verifica se está logado como admin
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
      router.push("/admin/login");
    }
  }, []);

  const menuItems = [
    {
      title: "Painel Principal",
      description: "Visão geral do sistema",
      icon: LayoutDashboard,
      href: "/",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Cadastros",
      description: "Gerenciar servidores",
      icon: Users,
      href: "/cadastros",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Aniversariantes",
      description: "Aniversariantes do mês",
      icon: Cake,
      href: "/aniversariantes",
      color: "from-pink-500 to-pink-600",
    },
    {
      title: "Ausências",
      description: "Faltas e orientações",
      icon: ClipboardList,
      href: "/ausencias",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Vantagens Pessoais",
      description: "ATS, Licença Prêmio, Evolução",
      icon: Gift,
      href: "/vantagens",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Requerimentos",
      description: "Aprovar ou rejeitar solicitações",
      icon: FileText,
      href: "/admin/requerimentos",
      color: "from-amber-500 to-amber-600",
    },
    {
      title: "Relatórios",
      description: "Relatórios do sistema",
      icon: FileBarChart,
      href: "/relatorios",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Configurações",
      description: "Configurações do sistema",
      icon: Settings,
      href: "/configuracoes",
      color: "from-slate-500 to-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Acesso Universal do Sistema
          </h2>
          <p className="text-slate-600">
            Gerencie cadastros, vantagens, ausências e relatórios de todos os servidores
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${item.color}`}></div>
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 text-indigo-600 font-semibold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                    Acessar
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Informações do Sistema</h3>
              <p className="text-sm text-slate-600">
                Você tem acesso completo ao sistema, incluindo todos os cadastros, vantagens, ausências e relatórios.
                Para acessar suas informações pessoais como servidor, utilize o Portal do Servidor.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
