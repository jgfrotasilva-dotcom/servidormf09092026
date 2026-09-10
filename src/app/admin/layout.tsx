import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 lg:ml-64">{children}</div>
    </div>
  );
}
