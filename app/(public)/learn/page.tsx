import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Responsible reporting" };

export default function LearnPage() {
  return (
    <PageTemplate
      eyebrow="Responsible reporting"
      title="What can I safely report?"
      description="Help visitors understand supported reef threats, useful evidence and safe reporting behaviour."
    />
  );
}
