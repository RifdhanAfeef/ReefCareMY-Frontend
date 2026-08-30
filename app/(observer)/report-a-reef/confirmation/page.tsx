import { Suspense } from "react";
import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";
import { ReportConfirmation } from "@/features/epic-06-feedback/report-confirmation";

export const metadata: Metadata = { title: "Report received" };

export default function ReportConfirmationPage() {
  return (
    <PageTemplate
      eyebrow="Report received"
      title="Thank you for reporting what you observed"
      description="Display the report reference, initial status and a clear link to My Reports."
    >
      <Suspense>
        <ReportConfirmation />
      </Suspense>
    </PageTemplate>
  );
}
