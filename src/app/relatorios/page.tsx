"use client";

import { Suspense } from "react";
import RelatoriosContent from "./content";

export default function RelatoriosPage() {
  return (
    <Suspense>
      <RelatoriosContent />
    </Suspense>
  );
}
