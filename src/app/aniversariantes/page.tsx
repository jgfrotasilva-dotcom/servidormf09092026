"use client";

import { Suspense } from "react";
import AniversariantesContent from "./content";

export default function AniversariantesPage() {
  return (
    <Suspense>
      <AniversariantesContent />
    </Suspense>
  );
}
