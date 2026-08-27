import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <PageTemplate
      title="How can we help?"
      description="Add reporting guidance, account support and frequently asked questions here."
    />
  );
}
