"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function ContentWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Verifica se o Sidebar está visível
  const hasSidebar = !(
    pathname === "/" ||
    pathname.startsWith("/servidor") ||
    pathname === "/admin/login"
  );

  return (
    <div className={hasSidebar ? "flex-1 lg:ml-64" : "flex-1"}>
      {children}
    </div>
  );
}
