"use client";

import { Suspense } from "react";
import RelatorioFuncionalContent from "./content";

export default function RelatorioFuncionalPage() {
  return (
    <Suspense>
      <RelatorioFuncionalContent />
    </Suspense>
  );
}
