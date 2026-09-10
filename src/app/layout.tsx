import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { ContentWrapper } from "@/components/ContentWrapper";

export const metadata: Metadata = {
  title: "EE Profa. Marlene Frattini • Sistema de Gestão",
  description:
    "Sistema de gerenciamento de cadastro e vantagens pessoais dos servidores da EE Profa. Marlene Frattini.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <ContentWrapper>{children}</ContentWrapper>
        </div>
      </body>
    </html>
  );
}
