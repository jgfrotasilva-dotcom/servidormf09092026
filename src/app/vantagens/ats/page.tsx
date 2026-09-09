"use client";

import { Suspense } from "react";
import AtsContent from "./content";

export default function AtsPage() {
  return (
    <Suspense>
      <AtsContent />
    </Suspense>
  );
}
