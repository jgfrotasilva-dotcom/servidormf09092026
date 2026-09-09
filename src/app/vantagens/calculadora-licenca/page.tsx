"use client";

import { Suspense } from "react";
import CalculatorContent from "./content";

export default function CalculadoraLicencaPage() {
  return (
    <Suspense>
      <CalculatorContent />
    </Suspense>
  );
}
