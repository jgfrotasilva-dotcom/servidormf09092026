"use client";

import { Suspense } from "react";
import AusenciasContent from "./content";

export default function AusenciasPage() {
  return (
    <Suspense>
      <AusenciasContent />
    </Suspense>
  );
}
