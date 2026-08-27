import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Role requests" };

export default function RoleRequestsPage() {
  return (
    <PageTemplate
      title="Role requests"
      description="Review requests for elevated access and record the approval decision."
    />
  );
}
