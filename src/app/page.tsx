"use client";

import Link from "next/link";
import { Users, Shield, GraduationCap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-6 shadow-xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            EE Profa. Marlene Frattini
          </h1>
          <p className="text-lg text-slate-600">
            Sistema de Gestão de Servidores
          </p>
        </div>

        {/* Opções de Acesso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Acesso do Servidor */}
          <Link
            href="/servidor/login"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Portal do Servidor
              </h2>
              <p className="text-slate-600 mb-4">
                Acesso às suas vantagens e requerimentos pessoais
              </p>
              <div className="text-blue-600 font-semibold group-hover:text-blue-700 flex items-center gap-2">
                Acessar Portal
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Acesso da Gestão */}
          <Link
            href="/admin/login"
            className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-indigo-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Acesso da Gestão
              </h2>
              <p className="text-slate-600 mb-4">
                Acesso universal para alimentação do sistema
              </p>
              <div className="text-indigo-600 font-semibold group-hover:text-indigo-700 flex items-center gap-2">
                Acessar Sistema
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Informações */}
        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center">
          <p className="text-sm text-slate-600">
            <strong>Portal do Servidor:</strong> Consulte suas vantagens pessoais, ATS, Licença Prêmio, Evolução Funcional e faça requerimentos
          </p>
          <p className="text-sm text-slate-600 mt-2">
            <strong>Acesso da Gestão:</strong> Gerencie cadastros, vantagens, ausências e relatórios de todos os servidores
          </p>
        </div>
      </div>
    </div>
  );
}
