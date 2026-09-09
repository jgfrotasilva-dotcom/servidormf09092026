"use client";

import { Suspense } from "react";
import EvolucaoFuncionalContent from "./content";

export default function EvolucaoFuncionalPage() {
  return (
    <Suspense>
      <EvolucaoFuncionalContent />
    </Suspense>
  );
}
