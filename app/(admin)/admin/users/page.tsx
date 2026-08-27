import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "User access" };

export default function UsersPage() {
  return (
    <PageTemplate
      title="User access"
      description="View accounts and maintain approved role access without exposing sensitive case content."
    />
  );
}
