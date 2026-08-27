import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "My cases" };

export default function MyCasesPage() {
  return (
    <PageTemplate
      title="My cases"
      description="List the reports currently owned by the signed-in Case Coordinator."
    />
  );
}
