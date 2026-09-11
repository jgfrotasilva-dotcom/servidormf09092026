"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminNavigation() {
  const router = useRouter();

  // Verifica se está logado como admin
  useEffect(() => {
    const isAdmin = localStorage.getItem("admin");
    if (!isAdmin) {
      router.push("/admin/login");
    }
  }, [router]);

  // Função para voltar ao dashboard
  const goBack = () => {
    router.push("/admin/dashboard");
  };

  // Função para sair do sistema
  const logout = () => {
    localStorage.removeItem("admin");
    router.push("/");
  };

  return { goBack, logout };
}
