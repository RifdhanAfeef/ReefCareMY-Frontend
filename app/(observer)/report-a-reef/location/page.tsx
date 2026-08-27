import type { Metadata } from "next";
import { PageTemplate } from "@/components/templates/page-template";

export const metadata: Metadata = { title: "Observation location" };

export default function ObservationLocationPage() {
  return (
    <PageTemplate
      eyebrow="Observation location"
      title="Where did you make this observation?"
      description="Collect the dive session, general dive-site name and an optional map pin while explaining how precise locations are protected."
    />
  );
}
