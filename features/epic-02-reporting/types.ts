export type ThreatCategoryCode =
  | "ghost_gear"
  | "coral_bleaching"
  | "marine_debris"
  | "physical_reef_damage"
  | "unsure";

export type ReportPhotoMetadata = {
  id: string;
  name: string;
  type: string;
  size: number;
};

export type ReportDraft = {
  threatCategoryCode: ThreatCategoryCode | "";
  observationDate: string;
  observationTime: string;
  estimatedDepthMetres: string;
  description: string;
  photos: ReportPhotoMetadata[];
  lastSavedAt: string | null;
};

export type SubmissionSummary = {
  reportReference: string;
  threatLabel: string;
  generalLocation: string;
  submittedAt: string;
  statusCode: "received";
  statusLabel: "Received";
};
