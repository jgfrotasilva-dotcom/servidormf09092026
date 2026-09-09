"use client";

import { Suspense } from "react";
import RelatorioAusenciasContent from "./content";

export default function RelatorioAusenciasPage() {
  return (
    <Suspense>
      <RelatorioAusenciasContent />
    </Suspense>
  );
}
