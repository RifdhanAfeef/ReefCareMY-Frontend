import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <PageTemplate
      title="Create your ReefCare MY account"
      description="Create an observer account so reports can be submitted and tracked securely."
    />
  );
}
