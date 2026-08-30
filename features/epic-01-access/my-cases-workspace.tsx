"use client";

import { MyCaseList } from "./case-access";
import { useMockAppState } from "@/features/shared/mock-app-state";

export function MyCasesWorkspace() {
  const { cases, currentCoordinator } = useMockAppState();
  return <MyCaseList cases={cases.filter((item) => item.owner === currentCoordinator)} />;
}
