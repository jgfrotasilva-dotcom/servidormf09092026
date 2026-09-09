"use client";

import { Suspense } from "react";
import VantagensVencidasContent from "./content";

export default function VantagensVencidasPage() {
  return (
    <Suspense>
      <VantagensVencidasContent />
    </Suspense>
  );
}
