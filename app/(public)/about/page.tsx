import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PageTemplate
      title="About ReefCare MY"
      description="Explain the platform's purpose, scope and responsible-reporting approach here."
    />
  );
}
