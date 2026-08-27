import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PageTemplate
      title="Contact ReefCare MY"
      description="Add the approved project contact information and support channel here."
    />
  );
}
