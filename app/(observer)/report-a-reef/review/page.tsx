import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Review report" };

export default function ReviewReportPage() {
  return (
    <PageTemplate
      eyebrow="Before submission"
      title="Review your report"
      description="Show the complete observation and allow the observer to return to any section before submitting."
    />
  );
}
