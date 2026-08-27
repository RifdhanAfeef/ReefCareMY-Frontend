import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Report queue" };

export default function ReportQueuePage() {
  return (
    <PageTemplate
      title="Submitted reports"
      description="Show unclaimed reports that a Case Coordinator is permitted to review and claim."
    />
  );
}
