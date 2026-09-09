"use client";

import { Suspense } from "react";
import LicencaPremioContent from "./content";

export default function LicencaPremioPage() {
  return (
    <Suspense>
      <LicencaPremioContent />
    </Suspense>
  );
}
