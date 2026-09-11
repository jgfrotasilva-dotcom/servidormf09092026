"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Gift,
  FileBarChart,
  Settings,
  GraduationCap,
  ClipboardList,
  Cake,
  LogOut,
  FileText,
} from "lucide-react";
import Link from "next/link";

const MENU_ITEMS = [
  {
    id: "cadastros",
    title: "Cadastros",
    description: "Gerenciar servidores da escola",
    icon: Users,
    href: "/cadastros",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "aniversariantes",
    title: "Aniversariantes",
    description: "Aniversariantes do mês",
    icon: Cake,
    href: "/aniversariantes",
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  {
    id: "ausencias",
    title: "Ausências",
    description: "Faltas e orientações técnicas",
    icon: ClipboardList,
    href: "/ausencias",
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  {
    id: "vantagens",
    title: "Vantagens Pessoais",
    description: "ATS, Licença Prêmio, Evolução",
    icon: Gift,
    href: "/vantagens",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  {
    id: "requerimentos",
    title: "Requerimentos",
    description: "Aprovar ou rejeitar solicitações",
    icon: FileText,
    href: "/admin/requerimentos",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Relatórios do sistema",
    icon: FileBarChart,
    href: "/relatorios",
    color: "from-indigo-500 to-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    description: "Backup e restauração",
    icon: Settings,
    href: "/configuracoes",
    color: "from-slate-500 to-slate-600",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
];

interface DashboardStats {
  totalServidores: number;
  totalAusencias: number;
  totalRequerimentos: number;
  aniversariantesMes: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalServidores: 0,
    totalAusencias: 0,
    totalRequerimentos: 0,
    aniversariantesMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se está logado como admin
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
      router.push("/admin/login");
      return;
    }

    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Carrega servidores
      const serversRes = await fetch("/api/servers?limit=1");
      const serversData = await serversRes.json();
      
      // Carrega ausências
      const absencesRes = await fetch("/api/absences?limit=1");
      const absencesData = await absencesRes.json();

      // Carrega requerimentos
      const requestsRes = await fetch("/api/requests/all");
      const requestsData = await requestsRes.json();

      // Calcula aniversariantes do mês
      const currentMonth = new Date().getMonth() + 1;
      const allServers = serversData.servers || [];
      const aniversariantes = allServers.filter((s: any) => {
        if (!s.birthDate) return false;
        const birthDate = new Date(s.birthDate);
        return birthDate.getMonth() + 1 === currentMonth;
      });

      setStats({
        totalServidores: serversData.count || 0,
        totalAusencias: absencesData.count || 0,
        totalRequerimentos: requestsData.count || 0,
        aniversariantesMes: aniversariantes.length,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Portal da Gestão</h1>
                <p className="text-sm text-slate-500">EE Profa. Marlene Frattini</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-slate-600">
            Selecione uma opção abaixo para gerenciar o sistema
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Servidores</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalServidores}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ausências</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalAusencias}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Requerimentos</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : stats.totalRequerimentos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Cake className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Aniversariantes</p>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : stats.aniversariantesMes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${item.bgColor} ${item.borderColor} border-2 rounded-2xl p-6 text-left hover:shadow-lg transition-all duration-300 hover:scale-105 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                  <span>Acessar</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Info Footer */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
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
      </main>
    </div>
  );
}
