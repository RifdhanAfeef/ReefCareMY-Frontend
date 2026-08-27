import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PageTemplate
      title="Privacy and location protection"
      description="Explain account data, evidence handling and the protection of precise reef locations here."
    />
  );
}
