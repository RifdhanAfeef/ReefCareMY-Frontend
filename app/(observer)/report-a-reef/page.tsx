import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Report a reef" };

export default function ReportAReefPage() {
  return (
    <PageTemplate
      eyebrow="New observation"
      title="Tell us what you observed"
      description="Capture the reef threat, date, evidence and a short description without requiring scientific training."
    />
  );
}
