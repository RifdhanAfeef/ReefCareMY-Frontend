import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { SubmissionConfirmation } from "@/features/epic-02-reporting/submission-confirmation";
import { ReportConfirmation } from "@/features/epic-06-feedback/report-confirmation";

export const metadata: Metadata = {
  title: "Report received",
};

export default async function ReportConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
}) {
  const params = await searchParams;

  const hasApiConfirmation = [
    "reportReference",
    "status",
    "submittedAt",
    "generalLocation",
    "threatCategory",
  ].every((key) => typeof params[key] === "string");

  return (
    <PageTemplate
      eyebrow="Report received"
      title="Thank you for reporting what you observed"
      description="Your observation is now recorded and available to the Case Coordinator intake queue."
      showBackButton={false}
    >
      {hasApiConfirmation ? (
        <Suspense>
          <ReportConfirmation />
        </Suspense>
      ) : (
        <SubmissionConfirmation />
      )}
    </PageTemplate>
  );
}