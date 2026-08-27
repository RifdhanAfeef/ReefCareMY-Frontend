import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Review report" };

export default async function CoordinatorReportDetailsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <PageTemplate
      eyebrow={`Case ${reportId}`}
      title="Review report"
      description="Present protected evidence and location details, ownership, evidence assessment, response choice and closure controls."
    />
  );
}
