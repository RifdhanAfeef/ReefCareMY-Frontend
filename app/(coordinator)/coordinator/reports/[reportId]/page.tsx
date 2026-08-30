import type { Metadata } from "next";
import { CoordinatorCaseRoute } from "@/features/epic-05-triage/case-workflow";

export const metadata: Metadata = { title: "Review report" };

export default async function CoordinatorReportDetailsPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <CoordinatorCaseRoute reportReference={reportId} />;
}
