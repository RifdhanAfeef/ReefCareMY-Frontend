/**
 * Frontend-facing shapes from the latest FastAPI documentation.
 * These types are intentionally unused until the agreed backend-integration phase.
 */
export type ThreatCategoryResponse = {
  threatCategoryId: number;
  code: string;
  label: string;
  shortExplanation: string;
  usefulEvidence: string;
  safetyReminder: string;
  iconReference: string | null;
};

export type MapPinInput = {
  latitude: number;
  longitude: number;
};

export type ObservationLocationInput = {
  namedDiveSiteId: number;
  locationConfidence: "exact" | "within_100m" | "within_1km" | "dive_site_only" | "unsure";
  mapPin: MapPinInput | null;
  relocationNotes?: string;
};

export type ReportSubmissionPayload = {
  threatCategoryId: number;
  observedAt: string;
  estimatedDepthMetres?: number;
  description: string;
  diveSessionId: number;
  location: ObservationLocationInput;
};

export type ReportSubmittedResponse = {
  reportReference: string;
  status: "received";
  submittedAt: string;
  generalLocation: string;
};

export type DiveSiteResponse = {
  diveSiteId: number;
  name: string;
  publicAreaLabel: string;
  region: string;
};

export type DiveSessionResponse = {
  diveSessionId: number;
  label: string;
  diveDate: string;
  namedDiveSite: Omit<DiveSiteResponse, "region">;
  approximateStartTime: string | null;
  approximateEndTime: string | null;
};
